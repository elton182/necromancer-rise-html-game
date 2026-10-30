# Kit modular da Vila de Eldrin (v2): peças de casa em enxaimel, telhado em fiadas, poste com lanterna,
# cerca, poço, barril e caixote. Cada peça é um objeto `kit_<nome>` com origem no ponto de encaixe;
# o jogo monta as casas a partir dos colisores (v2/scripts/village-scene.mjs), sem alterar a colisão.
#
# Convenção (Blender, Z para cima): paredes correm ao longo de X, face externa em -Y (vira +Z no Three.js),
# interior em +Y. Módulo de parede: 1 u de largura por 3 u de altura (o jogo escala para a casa).
# Materiais `plaster` e `roof` são brancos: o jogo tinge cada casa pela cor da instância.
# A cor por vértice faz o papel de oclusão (pé das paredes e base das fiadas mais escuros).
#
# Uso (raiz do projeto):
#   blender --background --python blender/scripts/v2_village_kit.py
# ou, no Blender aberto: exec(open('blender/scripts/v2_village_kit.py').read())
import bpy, bmesh, math, random
from pathlib import Path
from mathutils import Vector, Matrix

BASE = Path(__file__).resolve().parents[1]
OUT_BLEND = BASE / 'models' / 'v2_village_kit.blend'
OUT_GLB = BASE / 'exports' / 'v2_village_kit.glb'

def srgb(h):
    h = h.lstrip('#'); return tuple((int(h[i:i+2], 16) / 255) ** 2.2 for i in (0, 2, 4))

PALETTE = {
    'plaster': ('#ffffff', .95, None), 'roof': ('#ffffff', .8, None), 'timber': ('#5b3a25', .85, None),
    'stone': ('#8f897d', .95, None), 'door': ('#70482a', .8, None), 'iron': ('#2f2c2a', .5, None),
    'shutter': ('#4f6247', .8, None), 'glow': ('#ffd27e', .5, ('#ffc66a', 2.2)), 'water': ('#1d3a46', .15, None),
    'rope': ('#a08456', .9, None),
}

def material(name):
    m = bpy.data.materials.get('kit_' + name)
    if m: return m
    hexcol, rough, emit = PALETTE[name]
    m = bpy.data.materials.new('kit_' + name); m.use_nodes = True
    m.use_backface_culling = True  # malhas fechadas: sem dupla face no glTF
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = (*srgb(hexcol), 1); b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = (*srgb(emit[0]), 1); b.inputs['Emission Strength'].default_value = emit[1]
    # Cor por vértice multiplica a cor base (vira COLOR_0 no glTF).
    attr = m.node_tree.nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'Col'
    mul = m.node_tree.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
    mul.inputs['Factor'].default_value = 1
    mul.inputs[6].default_value = (*srgb(hexcol), 1)
    m.node_tree.links.new(attr.outputs['Color'], mul.inputs[7])
    m.node_tree.links.new(mul.outputs[2], b.inputs['Base Color'])
    return m

class Piece:
    """Acumula caixas, prismas e cilindros numa malha com índices de material."""
    def __init__(self, name):
        self.name = name; self.bm = bmesh.new(); self.mats = []; self.rng = random.Random(name)
    def _mat(self, m):
        if m not in self.mats: self.mats.append(m)
        return self.mats.index(m)
    def _faces(self, faces, m):
        i = self._mat(m)
        for f in faces: f.material_index = i
    def box(self, m, lo, hi, rot=None, pivot=None):
        lo, hi = Vector(lo), Vector(hi)
        r = bmesh.ops.create_cube(self.bm, size=1)
        verts = r['verts']; size = hi - lo; center = (lo + hi) / 2
        for v in verts: v.co = Vector((v.co.x * size.x, v.co.y * size.y, v.co.z * size.z)) + center
        if rot:
            p = Vector(pivot) if pivot else center
            mat = Matrix.Rotation(rot[0], 4, 'X') @ Matrix.Rotation(rot[1], 4, 'Y') @ Matrix.Rotation(rot[2], 4, 'Z')
            for v in verts: v.co = mat @ (v.co - p) + p
        self._faces({f for v in verts for f in v.link_faces}, m); return verts
    def beam(self, m, a, b, t):
        """Viga de seção quadrada t entre dois pontos no plano XZ (a e b com y fixo)."""
        a, b = Vector(a), Vector(b); d = b - a; length = d.length
        verts = self.box(m, (-length / 2, -t[1] / 2, -t[0] / 2), (length / 2, t[1] / 2, t[0] / 2))
        ang = math.atan2(d.z, d.x); mat = Matrix.Rotation(-ang, 4, 'Y'); c = (a + b) / 2
        for v in verts: v.co = mat @ v.co + c
        return verts
    def prism(self, m, poly, y0, y1):
        """Prisma: polígono em (x, z) extrudado de y0 a y1."""
        front = [self.bm.verts.new((x, y0, z)) for x, z in poly]
        back = [self.bm.verts.new((x, y1, z)) for x, z in poly]
        faces = [self.bm.faces.new(front[::-1]), self.bm.faces.new(back)]
        n = len(poly)
        for i in range(n):
            j = (i + 1) % n; faces.append(self.bm.faces.new((front[i], front[j], back[j], back[i])))
        self._faces(faces, m); return front + back
    def cylinder(self, m, center, r, h, seg=10, r2=None, bulge=0):
        cx, cy, cz = center; rings = 5 if bulge else 2; rows = []
        for k in range(rings):
            t = k / (rings - 1); rr = r + ((r2 if r2 is not None else r) - r) * t
            rr *= 1 + bulge * math.sin(math.pi * t)
            rows.append([self.bm.verts.new((cx + rr * math.cos(a), cy + rr * math.sin(a), cz + h * t)) for a in (2 * math.pi * i / seg for i in range(seg))])
        faces = [self.bm.faces.new(rows[0][::-1]), self.bm.faces.new(rows[-1])]
        for k in range(rings - 1):
            for i in range(seg):
                j = (i + 1) % seg; faces.append(self.bm.faces.new((rows[k][i], rows[k][j], rows[k + 1][j], rows[k + 1][i])))
        self._faces(faces, m); return [v for row in rows for v in row]
    def finish(self, bevel=.014, at=(0, 0, 0)):
        me = bpy.data.meshes.new('kit_' + self.name); self.bm.normal_update(); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(material(m))
        o = bpy.data.objects.new('kit_' + self.name, me); bpy.context.scene.collection.objects.link(o)
        if bevel:
            mod = o.modifiers.new('Bevel', 'BEVEL'); mod.width = bevel; mod.segments = 1; mod.limit_method = 'ANGLE'
            bpy.context.view_layer.objects.active = o; o.select_set(True)
            bpy.ops.object.modifier_apply(modifier=mod.name); o.select_set(False)
        for p in me.polygons: p.use_smooth = False
        shade(o, self.rng)
        o.location = at; return o

def shade(o, rng):
    """Oclusão falsa por vértice: base escura, variação por face e fiadas do telhado com borda inferior escura."""
    me = o.data
    col = me.color_attributes.get('Col') or me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
    zmin = min(v.co.z for v in me.vertices) if me.vertices else 0
    for poly in me.polygons:
        name = me.materials[poly.material_index].name if me.materials else ''
        jitter = 1 - rng.random() * (.12 if 'stone' in name or 'roof' in name else .06)
        for li in poly.loop_indices:
            z = me.vertices[me.loops[li].vertex_index].co.z - zmin
            ao = 1 - .38 * max(0, 1 - z / .55) if 'roof' not in name and 'glow' not in name else 1
            if 'roof' in name and poly.normal.z < .2: ao *= .55  # borda e face de baixo das fiadas
            k = max(.25, min(1, ao * jitter)); col.data[li].color = (k, k, k, 1)

# ── peças ──
WALL_H, PLINTH, T = 3.0, .45, .3  # altura do módulo, base de pedra e espessura da parede

def wall_core(p, door=False, hole=None):
    """Base de pedra, reboco (com vão `hole`=(x0,x1,z0,z1), se houver) e as vigas comuns a todo módulo."""
    if door:
        for x0, x1 in ((-.5, -.5 + .08), (.5 - .08, .5)): p.box('stone', (x0, -.04, 0), (x1, T, PLINTH))
    else:
        # Base em blocos irregulares de pedra.
        for row, (z0, z1) in enumerate(((0, .24), (.24, PLINTH))):
            cuts = [-.5, p.rng.uniform(-.25, .25), .5]
            for a, b in zip(cuts, cuts[1:]):
                p.box('stone', (a + .01, -.04 - p.rng.random() * .03, z0 + .005), (b - .01, T, z1 - .005))
    if hole:
        x0, x1, z0, z1 = hole; base = 0 if door else PLINTH
        p.box('plaster', (-.5, 0, base), (x0, T, WALL_H)); p.box('plaster', (x1, 0, base), (.5, T, WALL_H))
        if z0 > base: p.box('plaster', (x0, 0, base), (x1, T, z0))
        p.box('plaster', (x0, 0, z1), (x1, T, WALL_H))
        p.box('timber', (x0, .2, z0), (x1, T, z1))  # fundo escuro do vão (interior)
    else:
        p.box('plaster', (-.5, 0, PLINTH), (.5, T, WALL_H))
    p.box('timber', (-.5, -.05, PLINTH), (.5, .06, PLINTH + .14))       # soleira
    p.box('timber', (-.5, -.06, WALL_H - .2), (.5, .08, WALL_H))        # frechal
    p.box('timber', (-.5, -.05, PLINTH), (-.4, .06, WALL_H - .2))       # esteio esquerdo

def bay_plain():
    p = Piece('bay_plain'); wall_core(p)
    p.box('timber', (-.4, -.04, 1.62), (.5, .05, 1.74)); return p.finish()

def bay_brace():
    p = Piece('bay_brace'); wall_core(p)
    p.box('timber', (-.4, -.04, 1.62), (.5, .05, 1.74))
    p.beam('timber', (-.36, 0, PLINTH + .14), (.5, 0, 1.62), (.1, .09))
    p.beam('timber', (-.36, 0, 2.8), (.5, 0, 1.74), (.1, .09))
    return p.finish()

def bay_window():
    x0, x1, z0, z1 = -.24, .3, 1.25, 2.2
    p = Piece('bay_window'); wall_core(p, hole=(x0, x1, z0, z1))
    p.box('glow', (x0, .1, z0), (x1, .13, z1))
    p.box('timber', (x0 - .07, -.06, z0 - .12), (x1 + .07, .07, z0))      # peitoril
    p.box('timber', (x0 - .05, -.05, z1), (x1 + .05, .07, z1 + .1))         # verga
    for xa, xb in ((x0 - .05, x0), (x1, x1 + .05)): p.box('timber', (xa, -.05, z0), (xb, .07, z1))
    xm, zm = (x0 + x1) / 2, (z0 + z1) / 2
    p.box('timber', (xm - .025, .01, z0), (xm + .025, .06, z1)); p.box('timber', (x0, .01, zm - .025), (x1, .06, zm + .025))
    # Venezianas abertas, presas à parede, com tábuas e travessa.
    for a, b in ((x0 - .26, x0 - .06), (x1 + .06, x1 + .26)):
        p.box('shutter', (a, -.07, z0 + .02), (b, -.035, z1 - .02))
        p.box('timber', (a, -.085, z0 + .2), (b, -.06, z0 + .26)); p.box('timber', (a, -.085, z1 - .26), (b, -.06, z1 - .2))
    p.box('stone', (x0 - .1, -.16, z0 - .16), (x1 + .1, .02, z0 - .1))  # floreira/beiral de pedra
    return p.finish()

def bay_door():
    x0, x1, top = -.4, .4, 2.15
    p = Piece('bay_door'); wall_core(p, door=True, hole=(x0, x1, 0, top))
    for i in range(5):  # tábuas da porta, recuadas no vão e levemente desalinhadas
        a = x0 + (x1 - x0) * i / 5; p.box('door', (a + .005, .1 + p.rng.random() * .015, .02), (a + (x1 - x0) / 5 - .005, .17, top))
    for z in (.45, 1.65): p.box('iron', (x0 + .04, .08, z), (x1 - .2, .1, z + .07))
    p.box('iron', (x1 - .16, .05, 1.0), (x1 - .1, .1, 1.14))
    for xa, xb in ((x0 - .1, x0), (x1, x1 + .1)): p.box('timber', (xa, -.07, 0), (xb, .07, top + .02))
    p.box('timber', (x0 - .16, -.08, top), (x1 + .16, .08, top + .16))
    p.box('stone', (x0 - .08, -.38, 0), (x1 + .08, 0, .1))  # degrau
    return p.finish()

def corner():
    p = Piece('corner')
    p.box('stone', (-.2, -.2, 0), (.2, .2, PLINTH + .06))
    p.box('timber', (-.13, -.13, PLINTH), (.13, .13, WALL_H + .02)); return p.finish()

def gable():
    # Empena triangular: base 1 (escala = profundidade da casa) e altura 1 (escala = subida do telhado).
    p = Piece('gable')
    p.prism('plaster', [(-.5, 0), (.5, 0), (0, 1)], 0, T)
    p.box('timber', (-.5, -.05, 0), (.5, .06, .07))
    p.box('timber', (-.035, -.05, .07), (.035, .06, .95))
    p.box('glow', (-.08, .04, .38), (.08, .08, .56)); p.box('timber', (-.11, -.04, .34), (.11, .06, .38))
    return p.finish(bevel=.006)

COURSES, SHINGLES = 6, 9
def roof():
    # Telhado de duas águas: comprimento 1 em X, beirais em y=±.5, cumeeira em z=1 (o jogo escala os três eixos).
    p = Piece('roof')
    for side in (-1, 1):
        for i in range(COURSES):
            t0, t1 = i / COURSES, min(1, (i + 1.35) / COURSES)
            y0, z0, y1, z1 = side * .5 * (1 - t0), t0, side * .5 * (1 - t1), t1
            # cada fiada: telhas desencontradas, cada uma uma placa inclinada com a borda de baixo saliente
            cuts = [-.5] + [-.5 + (k + (.5 if i % 2 else 0)) / SHINGLES for k in range(1, SHINGLES + 1)]
            cuts = sorted({min(.5, c) for c in cuts})
            for xa, xb in zip(cuts, cuts[1:]):
                lift = .03 + p.rng.random() * .035; drop = p.rng.random() * .02
                quad = [(y0, z0 - .01 - drop), (y1, z1), (y1, z1 + .05), (y0, z0 + .05 + lift - drop)]
                verts = [p.bm.verts.new((x, y, z)) for x in (xa + .004, xb - .004) for y, z in quad]
                a, b = verts[:4], verts[4:]
                faces = [p.bm.faces.new(a[::-1] if side > 0 else a), p.bm.faces.new(b if side > 0 else b[::-1])]
                for k in range(4):
                    j = (k + 1) % 4; q = (a[k], a[j], b[j], b[k]); faces.append(p.bm.faces.new(q if side > 0 else q[::-1]))
                p._faces(faces, 'roof')
    # Forro escuro por baixo (fecha a vista inferior) e cumeeira.
    p.prism('timber', [(-.48, .0), (.48, .0), (0, .96)], -.44, .44)  # recuado: não cobre a empena
    for v in p.bm.verts[-6:]: v.co.x, v.co.y = v.co.y, v.co.x
    p.box('timber', (-.5, -.05, .97), (.5, .05, 1.08)); bm = p.bm
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return p.finish(bevel=0)

def roof_end():
    # Testeiras (tábuas da borda) das duas pontas do telhado: o jogo não escala em X.
    p = Piece('roof_end')
    for side in (-1, 1):
        a, b = Vector((0, side * .52, -.02)), Vector((0, 0, 1.06)); d = b - a
        verts = p.box('timber', (-.035, -d.length / 2, -.06), (.035, d.length / 2, .06))
        ang = math.atan2(d.z, d.y); mat = Matrix.Rotation(ang, 4, 'X'); c = (a + b) / 2
        for v in verts: v.co = mat @ v.co + c
    return p.finish(bevel=.006)

def chimney():
    p = Piece('chimney')
    for i in range(7):
        z = i * .3; o = (p.rng.random() - .5) * .03
        p.box('stone', (-.3 + o, -.3, z), (.3 + o, .3, z + .3 - .012))
    p.box('stone', (-.36, -.36, 2.1), (.36, .36, 2.2)); p.box('iron', (-.2, -.2, 2.2), (.2, .2, 2.22))
    return p.finish()

def lamp():
    p = Piece('lamp')
    p.box('stone', (-.24, -.24, 0), (.24, .24, .2)); p.box('stone', (-.16, -.16, .2), (.16, .16, .32))
    p.box('timber', (-.07, -.07, .32), (.07, .07, 2.1))
    p.box('iron', (-.15, -.15, 2.1), (.15, .15, 2.15))
    p.box('glow', (-.11, -.11, 2.15), (.11, .11, 2.42))
    for sx in (-1, 1):
        for sy in (-1, 1): p.box('iron', (sx * .13 - .02, sy * .13 - .02, 2.15), (sx * .13 + .02, sy * .13 + .02, 2.42))
    p.prism('iron', [(-.19, 0), (.19, 0), (0, .2)], -.19, .19)
    for v in p.bm.verts[-6:]: v.co.z += 2.42
    p.box('iron', (-.03, -.03, 2.6), (.03, .03, 2.68)); return p.finish(bevel=.008)

def fence_post():
    p = Piece('fence_post')
    p.box('timber', (-.06, -.06, 0), (.06, .06, .72))
    p.prism('timber', [(-.06, .72), (.06, .72), (0, .8)], -.06, .06); return p.finish(bevel=.006)

def fence_rails():
    p = Piece('fence_rails')
    for z, tilt in ((.28, .02), (.52, -.015)):
        p.box('timber', (-.5, -.025, z - .04), (.5, .025, z + .04), rot=(tilt, 0, tilt * .5))
    return p.finish(bevel=.006)

def well():
    p = Piece('well')
    seg = 14
    for row in range(3):
        for i in range(seg):
            a0 = 2 * math.pi * (i + row * .5) / seg; a1 = a0 + 2 * math.pi / seg * .92; z0 = row * .36
            pts = [(math.cos(a0), math.sin(a0)), (math.cos(a1), math.sin(a1))]
            outer = [Vector((x * 1.0, y * 1.0, 0)) for x, y in pts]; inner = [v * .74 for v in outer]
            quad = [outer[0], outer[1], inner[1], inner[0]]
            lo = [p.bm.verts.new((v.x, v.y, z0 + .01)) for v in quad]
            hi = [p.bm.verts.new((v.x, v.y, z0 + .35)) for v in quad]
            faces = [p.bm.faces.new(lo[::-1]), p.bm.faces.new(hi)]
            for k in range(4):
                j = (k + 1) % 4; faces.append(p.bm.faces.new((lo[k], lo[j], hi[j], hi[k])))
            p._faces(faces, 'stone')
    p.cylinder('water', (0, 0, .7), .76, .02, seg=16)
    for sx in (-1, 1): p.box('timber', (sx * .86 - .07, -.07, .2), (sx * .86 + .07, .07, 2.15))
    p.cylinder('timber', (0, 0, 0), .08, 1.6, seg=8)
    for v in p.bm.verts[-16:]: v.co = Vector((v.co.z - .8, v.co.y, v.co.x + 1.65))
    p.box('rope', (-.04, -.04, 1.05), (.04, .04, 1.62)); p.cylinder('timber', (0, 0, .82), .13, .2, seg=8, r2=.15)
    # Telhadinho de duas águas sobre os postes, com cumeeira.
    for side in (-1, 1):
        verts = p.box('roof', (-1.08, -.42, -.035), (1.08, .42, .035))
        mat = Matrix.Rotation(-side * .62, 4, 'X')
        for v in verts: v.co = mat @ v.co + Vector((0, side * .34, 2.42))
    p.box('timber', (-1.12, -.05, 2.62), (1.12, .05, 2.72))
    return p.finish()

def barrel():
    p = Piece('barrel')
    p.cylinder('door', (0, 0, 0), .82, 1, seg=12, bulge=.12)
    for z in (.12, .82): p.cylinder('iron', (0, 0, z), .87, .06, seg=12)
    p.cylinder('timber', (0, 0, .99), .8, .02, seg=12); return p.finish(bevel=.0)

def crate():
    p = Piece('crate')
    p.box('door', (-.47, -.47, .02), (.47, .47, .98))
    e = .07
    for x in (-.5, .5 - e):
        for y in (-.5, .5 - e): p.box('timber', (x, y, 0), (x + e, y + e, 1))
    for z in (0, 1 - e):
        for y in (-.5, .5 - e): p.box('timber', (-.5, y, z), (.5, y + e, z + e))
        for x in (-.5, .5 - e): p.box('timber', (x, -.5, z), (x + e, .5, z + e))
    p.beam('timber', (-.43, -.5, .07), (.43, -.5, .93), (.07, .04))
    return p.finish(bevel=.008)

BUILDERS = [bay_plain, bay_brace, bay_window, bay_door, corner, gable, roof, roof_end, chimney, lamp, fence_post, fence_rails, well, barrel, crate]

def clear():
    for o in list(bpy.data.objects):
        if o.name.startswith('kit_') or o.name in ('Cube',): bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials):
        for d in list(coll):
            if d.name.startswith('kit_') and d.users == 0: coll.remove(d)

def build():
    clear(); objs = []
    for i, fn in enumerate(BUILDERS):
        o = fn(); o.location = ((i % 5) * 3.2, (i // 5) * 4.0, 0); objs.append(o)
    return objs

def export(objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    # Cada peça na origem durante a exportação: o jogo usa só a geometria de cada nó.
    saved = [(o, o.location.copy()) for o in objs]
    for o in objs: o.location = (0, 0, 0)
    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(OUT_GLB), export_format='GLB', use_selection=True, export_yup=True,
                              export_apply=True, export_animations=False, export_vertex_color='ACTIVE')
    for o, loc in saved: o.location = loc
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND), copy=True)

if __name__ == '__main__':
    import sys
    objs = build()
    if '--export' in sys.argv or bpy.app.background: export(objs)
    print('V2_VILLAGE_KIT_OK', len(objs), sum(len(o.data.polygons) for o in objs))
