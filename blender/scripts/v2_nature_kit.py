# Kit de vegetação da v2: carvalho, pinheiro, arbusto, tufo de grama, flores e pedra.
# Reaproveita Piece/material de v2_village_kit.py. Cada peça é `kit_<nome>` com origem na base;
# folhagem, grama e pétalas são brancas (o jogo tinge por instância: estação e variação de tom).
# A cor por vértice faz a oclusão falsa: copa mais escura embaixo e por dentro, grama escura na raiz.
#
# Uso (raiz do projeto):
#   blender --background --python blender/scripts/v2_nature_kit.py
import bpy, bmesh, math, random, sys, importlib
from pathlib import Path
from mathutils import Vector, Matrix

HERE = Path(__file__).resolve().parent
BASE = HERE.parents[0]
sys.path.insert(0, str(HERE))
vk = importlib.reload(sys.modules['v2_village_kit']) if 'v2_village_kit' in sys.modules else importlib.import_module('v2_village_kit')
OUT_BLEND = BASE / 'models' / 'v2_nature_kit.blend'
OUT_GLB = BASE / 'exports' / 'v2_nature_kit.glb'

vk.PALETTE.update({
    'leaf': ('#ffffff', .9, None), 'needle': ('#ffffff', .9, None), 'grass': ('#ffffff', .9, None),
    'petal': ('#ffffff', .8, None), 'bark': ('#5d4030', .95, None), 'stem': ('#4f7a36', .9, None),
})
DOUBLE_SIDED = {'grass', 'petal', 'stem'}

def blob(p, m, center, r, squash=.85, rough=.1):
    """Icosfera irregular (subdivisão 1): massa de folhagem ou pedra."""
    res = bmesh.ops.create_icosphere(p.bm, subdivisions=1, radius=r)
    verts = res['verts']; c = Vector(center)
    for v in verts:
        v.co *= 1 + p.rng.uniform(-rough, rough); v.co.z *= squash; v.co += c
    p._faces({f for v in verts for f in v.link_faces}, m); return verts

def tilt(verts, base, angle_x=0, angle_y=0, yaw=0):
    mat = Matrix.Rotation(yaw, 4, 'Z') @ Matrix.Rotation(angle_y, 4, 'Y') @ Matrix.Rotation(angle_x, 4, 'X'); b = Vector(base)
    for v in verts: v.co = mat @ (v.co - b) + b

def shade_nature(o, rng):
    """Copa: escura embaixo/dentro, clara no topo; grama: raiz escura; casca e pedra: base escura."""
    me = o.data; col = me.color_attributes.get('Col')
    zs = {}
    for poly in me.polygons:
        name = me.materials[poly.material_index].name
        z = [me.vertices[me.loops[li].vertex_index].co.z for li in poly.loop_indices]
        lo, hi = zs.get(name, (1e9, -1e9)); zs[name] = (min(lo, *z), max(hi, *z))
    for poly in me.polygons:
        name = me.materials[poly.material_index].name; lo, hi = zs[name]; span = max(.001, hi - lo)
        jitter = 1 - rng.random() * .1
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co; t = (co.z - lo) / span
            if 'leaf' in name or 'needle' in name:
                k = (.5 + .5 * t) * (.8 if poly.normal.z < -.3 else 1) * jitter
            elif 'grass' in name or 'stem' in name: k = .4 + .6 * t
            elif 'petal' in name: k = .85 + .15 * t
            else: k = (1 - .4 * max(0, 1 - co.z / .6)) * jitter
            k = max(.2, min(1, k)); col.data[li].color = (k, k, k, 1)

def finish(p, bevel=0):
    o = p.finish(bevel=bevel); shade_nature(o, p.rng)
    for m in o.data.materials:
        if m.name.replace('kit_', '') in DOUBLE_SIDED: m.use_backface_culling = False
    return o

def oak():
    # Altura de referência 5,5 u (o jogo escala pela altura do sólido).
    p = vk.Piece('oak')
    p.cylinder('bark', (0, 0, 0), .34, 2.7, seg=8, r2=.2)
    for i in range(5):  # raízes
        a = i / 5 * math.tau + .3; v = p.cylinder('bark', (0, 0, 0), .12, .7, seg=5, r2=.03)
        tilt(v, (0, 0, 0), angle_y=1.15, yaw=a)
    for a, lean, z in ((.6, .75, 2.0), (2.7, .8, 2.3), (4.4, .7, 2.5)):  # galhos
        v = p.cylinder('bark', (0, 0, z), .12, 1.3, seg=6, r2=.05); tilt(v, (0, 0, z), angle_y=lean, yaw=a)
    blob(p, 'leaf', (0, 0, 4.0), 1.55, .8)
    for i in range(7):
        a = i / 7 * math.tau + p.rng.uniform(-.3, .3); d = p.rng.uniform(.9, 1.35); z = p.rng.uniform(3.2, 4.7)
        blob(p, 'leaf', (math.cos(a) * d, math.sin(a) * d, z), p.rng.uniform(.8, 1.15), .78)
    blob(p, 'leaf', (.2, -.1, 4.95), 1.0, .75)
    return finish(p)

def pine():
    # Altura de referência 6 u: tronco e cinco andares de galhos caídos, serrilhados na borda.
    p = vk.Piece('pine')
    p.cylinder('bark', (0, 0, 0), .24, 5.6, seg=7, r2=.07)
    tiers = 5
    for i in range(tiers):
        t = i / (tiers - 1); z = 1.0 + i * .95; R = 1.75 - t * 1.15; h = 1.55 - t * .35; n = 11
        apex = p.bm.verts.new((0, 0, z + h)); inner = p.bm.verts.new((0, 0, z + .3)); rim = []
        for k in range(n):
            a = k / n * math.tau + i * .4; drop = .28 if k % 2 else 0; rr = R * (1.08 if k % 2 else .92) * p.rng.uniform(.95, 1.05)
            rim.append(p.bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, z - drop)))
        faces = []
        for k in range(n):
            j = (k + 1) % n; faces.append(p.bm.faces.new((rim[k], rim[j], apex))); faces.append(p.bm.faces.new((rim[j], rim[k], inner)))
        p._faces(faces, 'needle')
    return finish(p)

def bush():
    # Raio ~1, altura ~0,9.
    p = vk.Piece('bush')
    blob(p, 'leaf', (0, 0, .42), .62, .8)
    for i in range(4):
        a = i / 4 * math.tau + .4; blob(p, 'leaf', (math.cos(a) * .42, math.sin(a) * .42, .32), p.rng.uniform(.4, .52), .8)
    return finish(p)

def grass():
    # Tufo de lâminas curvas: altura 1 (o jogo escala pela altura da grama), base com raio ~0,12.
    p = vk.Piece('grass'); faces = []
    for i in range(11):
        a = i / 11 * math.tau + p.rng.uniform(-.25, .25); h = p.rng.uniform(.65, 1.0); lean = p.rng.uniform(.18, .38)
        d = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-d.y, d.x, 0)); start = d * p.rng.uniform(.0, .1)
        pts = []
        for s in range(4):
            t = s / 3; c = start + d * (lean * t * t) + Vector((0, 0, h * t)); w = .05 * (1 - t) + .004
            pts.append((p.bm.verts.new(c - side * w), p.bm.verts.new(c + side * w)))
        for s in range(3): faces.append(p.bm.faces.new((pts[s][0], pts[s][1], pts[s + 1][1], pts[s + 1][0])))
    p._faces(faces, 'grass')
    return finish(p)

def flowers():
    # Três a quatro hastes com corola achatada; pétalas tingidas por instância.
    p = vk.Piece('flowers')
    for i in range(4):
        a = i / 4 * math.tau + p.rng.uniform(-.4, .4); d = p.rng.uniform(.03, .12); h = p.rng.uniform(.22, .34)
        x, y = math.cos(a) * d, math.sin(a) * d
        p.box('stem', (x - .012, y - .012, 0), (x + .012, y + .012, h))
        blob(p, 'petal', (x, y, h + .02), .055, .55, .05)
    return finish(p)

def rock():
    # Pedra facetada: base plana em z=0, raio ~1, altura ~1.
    p = vk.Piece('rock')
    v = blob(p, 'stone', (0, 0, 0), 1.0, .85, .2)
    for x in v:
        x.co.y *= .85
        if x.co.z < -.35: x.co.z = -.35
    for x in v: x.co.z += .35
    for x in v: x.co.z *= 1 / 1.2
    return finish(p)

BUILDERS = [oak, pine, bush, grass, flowers, rock]
NAMES = {'kit_' + fn.__name__ for fn in BUILDERS}

def clear():
    for o in list(bpy.data.objects):
        if o.name in NAMES or o.name.startswith('natest_'): bpy.data.objects.remove(o, do_unlink=True)
    for d in list(bpy.data.meshes):
        if d.name in NAMES and d.users == 0: bpy.data.meshes.remove(d)

def build():
    clear(); objs = []
    for i, fn in enumerate(BUILDERS):
        o = fn(); o.location = (i * 4.0, -12, 0); objs.append(o)
    return objs

def export(objs):
    bpy.ops.object.select_all(action='DESELECT')
    saved = [(o, o.location.copy()) for o in objs]
    for o in objs: o.location = (0, 0, 0); o.select_set(True)
    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(OUT_GLB), export_format='GLB', use_selection=True, export_yup=True,
                              export_apply=True, export_animations=False, export_vertex_color='ACTIVE')
    for o, loc in saved: o.location = loc
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND), copy=True)

if __name__ == '__main__':
    objs = build()
    if '--export' in sys.argv or bpy.app.background: export(objs)
    print('V2_NATURE_KIT_OK', len(objs), sum(len(o.data.polygons) for o in objs))
