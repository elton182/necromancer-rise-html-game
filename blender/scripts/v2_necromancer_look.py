"""Material e repintura do necromante da v2 (corpo e cajado).

A malha do Tripo trazia a textura inteira no canal de emissão (toon caseiro de emissão), então o personagem saía sem luz no
jogo e destoava do guerreiro. Este script:
  - troca os dois materiais por Principled: textura na cor base e um mapa de brilho próprio na emissão;
  - repinta a textura a partir da original: robe violeta saturado -> violeta dessaturado (família "Sombras" do guia visual),
    ouro da fivela -> marfim de osso, couro e madeira um pouco menos saturados;
  - olhos, gema da fivela e cristal do cajado passam ao verde-água da energia dos ossos (`#8bd4bd`) e são os únicos emissivos.
Olhos, gema e cristal são localizados pela geometria (o atlas é fragmentado demais para separar só pela cor).

A textura original fica guardada no .blend (fake user) e o script sempre parte dela, então pode ser executado de novo.
`v2_necromancer_motion.py` o aplica antes de exportar. Uso isolado, na raiz do projeto:
  blender --background blender/models/v2_necromancer.blend --python blender/scripts/v2_necromancer_look.py
Grava models/v2_necromancer.blend e exports/v2_necromancer.glb. Para só aplicar na sessão MCP, defina `LOOK_EXPORT = False` antes.
Depois regenere a queda do prólogo (`arandu_necromancer_fall.py`) e rode `node v2/tools/build.cjs`.
"""
from pathlib import Path
import bpy
import numpy as np

BASE = Path(__file__).resolve().parents[1] if '__file__' in globals() else Path(bpy.data.filepath).resolve().parents[1]

# Paleta (sRGB). O toon do jogo multiplica a saturação do mapa por 1,8 e o brilho por 1,18; os valores já contam com isso.
ROBE_HUE = .74            # violeta frio
BONE_GLOW = np.array([.545, .831, .741])   # #8bd4bd, energia aliada dos ossos
EYE_BASE = np.array([.80, 1.0, .93])
CRYSTAL_DARK = np.array([.16, .42, .40])
CRYSTAL_LIGHT = np.array([.72, .97, .90])
GLOW_EYES, GLOW_GEM, GLOW_CRYSTAL = 1.0, .45, .6


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    dd = np.maximum(d, 1e-6)
    h = np.where(mx == r, (g - b) / dd % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) / 6
    h = np.where(d > 0, h, 0) % 1
    return np.stack([h, s, mx], -1)


def hsv_to_rgb(hsv):
    h, s, v = hsv[..., 0] % 1, np.clip(hsv[..., 1], 0, 1), np.clip(hsv[..., 2], 0, 1)
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    choices = [np.stack(c, -1) for c in ((v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q))]
    out = np.zeros(hsv.shape)
    for k, c in enumerate(choices):
        out = np.where((i == k)[..., None], c, out)
    return out


def hue_weight(h, center, full, fade):
    d = np.abs((h - center + .5) % 1 - .5)
    return smooth(full + fade, full, d)


def uv_mask(obj, pick, w, h, grow=2):
    """Pixels do atlas cobertos pelas faces cujo centro (coordenadas locais da malha) satisfaz `pick`."""
    me = obj.data
    uv = me.uv_layers.active.data
    mask = np.zeros((h, w), bool)
    for poly in me.polygons:
        if not pick(np.array(poly.center)):
            continue
        pts = np.array([uv[i].uv for i in poly.loop_indices]) * (w, h)
        for k in range(1, len(pts) - 1):
            a, b, c = pts[0], pts[k], pts[k + 1]
            x0, y0 = np.floor(np.minimum(np.minimum(a, b), c)).astype(int)
            x1, y1 = np.ceil(np.maximum(np.maximum(a, b), c)).astype(int)
            x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, w - 1), min(y1, h - 1)
            if x1 < x0 or y1 < y0:
                continue
            xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
            den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
            if abs(den) < 1e-9:
                continue
            l1 = ((b[1] - c[1]) * (xs - c[0]) + (c[0] - b[0]) * (ys - c[1])) / den
            l2 = ((c[1] - a[1]) * (xs - c[0]) + (a[0] - c[0]) * (ys - c[1])) / den
            inside = (l1 >= -.02) & (l2 >= -.02) & (1 - l1 - l2 >= -.02)
            mask[y0:y1 + 1, x0:x1 + 1] |= inside
    for _ in range(grow):  # cobre a borda das ilhas (filtragem da textura)
        m = mask.copy()
        m[1:] |= mask[:-1]; m[:-1] |= mask[1:]; m[:, 1:] |= mask[:, :-1]; m[:, :-1] |= mask[:, 1:]
        mask = m
    return mask


def recolor(rgb, staff=False):
    """Repintura por famílias de cor, com transições suaves para não criar serrilhado entre ilhas."""
    hsv = rgb_to_hsv(rgb)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    w_violet = hue_weight(h, .77, .11, .06) * smooth(.12, .25, s)
    w_gold = 0 if staff else hue_weight(h, .11, .05, .03) * smooth(.4, .55, s) * smooth(.5, .62, v)
    w_rest = np.clip(1 - w_violet - w_gold, 0, 1)
    if staff:   # madeira e suporte escuro do cristal
        violet = np.stack([np.full_like(h, ROBE_HUE), .05 + .12 * s, .06 + .45 * v], -1)
    else:       # robe, forro e luvas
        violet = np.stack([np.full_like(h, ROBE_HUE), .06 + .17 * s, .06 + .44 * v], -1)
    gold = np.stack([np.full_like(h, .12), np.full_like(h, .12), .55 + .38 * v], -1)   # marfim de osso
    rest = np.stack([h, s * .85, v], -1)                                              # couro, madeira
    out = hsv_to_rgb(rest) * w_rest[..., None] + hsv_to_rgb(violet) * w_violet[..., None]
    if not staff:
        out = out + hsv_to_rgb(gold) * w_gold[..., None]
    return out, hsv, w_violet


def crystal(v):
    t = smooth(.1, .9, v)[..., None]
    return CRYSTAL_DARK * (1 - t) + CRYSTAL_LIGHT * t


def paint_body(obj, src):
    w, h = src.size
    px = np.array(src.pixels[:], dtype=np.float64).reshape(h, w, 4)[..., :3]
    base, hsv, w_violet = recolor(px)
    v = hsv[..., 2]
    glow = np.zeros_like(base)
    # Olhos em y≈-0,14; a borda do capuz, mais à frente (y≈-0,19), também tem pixels claros e fica de fora.
    eyes = uv_mask(obj, lambda c: abs(c[0]) < .06 and -.16 < c[1] < -.12 and .69 < c[2] < .78, w, h)
    we = (eyes * smooth(.45, .8, v))[..., None]
    base = base * (1 - we) + EYE_BASE * we
    glow += BONE_GLOW * GLOW_EYES * we
    gem = uv_mask(obj, lambda c: abs(c[0]) < .035 and c[1] < -.153 and .37 < c[2] < .455, w, h)
    wg = (gem * w_violet)[..., None]
    base = base * (1 - wg) + crystal(v) * wg
    glow += BONE_GLOW * GLOW_GEM * wg
    return base, glow, {'olhos': int(eyes.sum()), 'gema': int(gem.sum())}


def paint_staff(obj, src):
    w, h = src.size
    px = np.array(src.pixels[:], dtype=np.float64).reshape(h, w, 4)[..., :3]
    base, hsv, w_violet = recolor(px, staff=True)
    v = hsv[..., 2]
    tip = uv_mask(obj, lambda c: c[2] > .37, w, h)
    wc = (tip * w_violet)[..., None]
    base = base * (1 - wc) + crystal(v) * wc
    glow = BONE_GLOW * GLOW_CRYSTAL * wc * smooth(.15, .6, v)[..., None]
    return base, glow, {'cristal': int(tip.sum())}


def store_image(name, rgb):
    h, w = rgb.shape[:2]
    img = bpy.data.images.get(name)
    if img and tuple(img.size) != (w, h):
        bpy.data.images.remove(img); img = None
    if img is None:
        img = bpy.data.images.new(name, w, h, alpha=False)
    rgba = np.concatenate([np.clip(rgb, 0, 1), np.ones((h, w, 1))], -1)
    img.pixels.foreach_set(rgba.astype(np.float32).ravel())
    img.file_format = 'PNG'
    img.pack()
    return img


def source_image(mat):
    """Textura original do Tripo; na primeira execução é guardada com fake user e o nome fica no material."""
    name = mat.get('necro_look_source')
    if name and name in bpy.data.images:
        return bpy.data.images[name]
    img = next(n.image for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE')
    img.use_fake_user = True
    mat['necro_look_source'] = img.name
    return img


def build_material(mat, base_img, glow_img):
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); out.location = (500, 0)
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled'); bsdf.location = (200, 0)
    tb = nt.nodes.new('ShaderNodeTexImage'); tb.image = base_img; tb.location = (-200, 120)
    tg = nt.nodes.new('ShaderNodeTexImage'); tg.image = glow_img; tg.location = (-200, -200)
    nt.links.new(tb.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(tg.outputs['Color'], bsdf.inputs['Emission Color'])
    bsdf.inputs['Emission Strength'].default_value = 1.0
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = .85
    nt.links.new(bsdf.outputs[0], out.inputs['Surface'])


def apply():
    staff = bpy.data.objects['ImportedStaff']
    body = next(o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('tripo')
                and any(m.type == 'ARMATURE' for m in o.modifiers))
    report = {}
    for obj, paint, tag in ((body, paint_body, 'body'), (staff, paint_staff, 'staff')):
        mat = obj.material_slots[0].material
        src = source_image(mat)
        base, glow, info = paint(obj, src)
        build_material(mat, store_image('necro_%s_paint' % tag, base), store_image('necro_%s_glow' % tag, glow))
        report[tag] = info
    print('NECRO_LOOK', report)
    return report


def export():
    sc = bpy.context.scene
    arm = bpy.data.objects['Armature']
    bpy.ops.object.select_all(action='DESELECT')
    for obj in sc.objects:
        # Mesmo critério de v2_necromancer_motion.py: a esfera auxiliar fica fora.
        if obj.type in ('MESH', 'ARMATURE', 'EMPTY') and not obj.hide_render and obj.name != 'Icosphere':
            obj.hide_set(False); obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=str(BASE / 'exports' / 'v2_necromancer.glb'), export_format='GLB', use_selection=True,
                              export_animation_mode='ACTIONS', export_skins=True, export_yup=True, export_force_sampling=True,
                              export_image_format='JPEG', export_jpeg_quality=88)  # como as texturas originais do Tripo; PNG dobrava o GLB
    bpy.ops.wm.save_as_mainfile(filepath=str(BASE / 'models' / 'v2_necromancer.blend'))
    print('NECRO_LOOK_EXPORTED')


if __name__ == '__main__' or globals().get('LOOK_RUN', False):
    apply()
    if globals().get('LOOK_EXPORT', True):
        export()
