"""Andarilho encapuzado estilizado (pose T), modelado por varreduras suaves.

Referência: imagem do usuário (capuz e capa escuros com debrum dourado, casaco
de couro, barba, alforje e pergaminho). Só o modelo; ainda sem rig e animações.

Blender (na raiz):  blender --background --python blender/scripts/hooded_wanderer.py -- --save
No Blender aberto: exec do arquivo; remove só os objetos gerados antes (tag).
"""
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
TAG = 'hooded_wanderer'
OUT = ROOT / 'models' / 'hooded_wanderer.blend'
TAU = math.tau
REG = []  # objetos criados, em ordem

# ---------------------------------------------------------------- cena

def collection():
    for o in list(bpy.data.objects):
        if o.get(TAG):
            bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.users == 0 and me.name.startswith('hw.'):
            bpy.data.meshes.remove(me)
    col = bpy.data.collections.get('HoodedWanderer')
    if col is None:
        col = bpy.data.collections.new('HoodedWanderer')
        bpy.context.scene.collection.children.link(col)
    return col


COL = collection()

# ---------------------------------------------------------------- materiais

def srgb(h):
    h = h.lstrip('#')
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


# nome: (cor, rugosidade, metal, relevo)
PALETTE = {
    'skin': ('#e8b08a', .6, 0, 0), 'skin_shade': ('#d4936f', .6, 0, 0),
    'lip': ('#8a4c3c', .5, 0, 0),
    'beard': ('#3a2219', .9, 0, .25), 'hair': ('#2c1a13', .9, 0, .2),
    'eye': ('#f3eee4', .3, 0, 0), 'iris': ('#4a2c1a', .3, 0, 0), 'pupil': ('#120c09', .2, 0, 0),
    'cloak': ('#2d1d29', .85, 0, .08), 'cloak_in': ('#1b1118', .9, 0, .05),
    'vest': ('#3d2635', .8, 0, .08), 'pants': ('#3e2628', .85, 0, .08),
    'coat': ('#62392a', .7, 0, .12), 'leather': ('#74442a', .65, 0, .12),
    'leather_dk': ('#4a2b1c', .7, 0, .1), 'boot': ('#633a23', .55, 0, .1),
    'sole': ('#24160e', .8, 0, 0), 'cream': ('#ebe1c8', .85, 0, .08),
    'paper': ('#f3ebd8', .8, 0, .05), 'red': ('#a8262b', .45, 0, 0),
    'gold': ('#d29a3f', .35, .8, 0), 'gold_dk': ('#94622a', .4, .7, 0),
}
M = {}
for key, (hexc, rough, metal, bump) in PALETTE.items():
    m = bpy.data.materials.get('hw_' + key) or bpy.data.materials.new('hw_' + key)
    try:
        m.use_nodes = True
    except (AttributeError, TypeError):
        pass
    nt = m.node_tree
    for n in [n for n in nt.nodes if n.type in ('TEX_NOISE', 'BUMP')]:
        nt.nodes.remove(n)
    p = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    c = srgb(hexc)
    p.inputs['Base Color'].default_value = (*c, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if bump:
        tex = nt.nodes.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = 140 if key in ('beard', 'hair') else 70
        tex.inputs['Detail'].default_value = 6
        bn = nt.nodes.new('ShaderNodeBump')
        bn.inputs['Strength'].default_value = bump
        bn.inputs['Distance'].default_value = .002
        nt.links.new(tex.outputs['Fac'], bn.inputs['Height'])
        nt.links.new(bn.outputs['Normal'], p.inputs['Normal'])
    m.diffuse_color = (*c, 1)
    M[key] = m

# ---------------------------------------------------------------- utilitários

def finish(name, bm, mat, subd=2, solidify=0.0, inner=None, recalc=True):
    if recalc:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('hw.' + name)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    me.materials.append(M[mat])
    o = bpy.data.objects.new(name, me)
    COL.objects.link(o)
    o[TAG] = True
    if solidify:
        s = o.modifiers.new('Espessura', 'SOLIDIFY')
        s.thickness = solidify
        s.offset = -1
        if inner:
            me.materials.append(M[inner])
            s.material_offset = 1
    if subd:
        s = o.modifiers.new('Suavizar', 'SUBSURF')
        s.levels = subd
        s.render_levels = subd
    REG.append(o)
    return o


def xform(bm, loc=(0, 0, 0), sc=(1, 1, 1), rot=(0, 0, 0)):
    mtx = Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*sc, 1))
    bmesh.ops.transform(bm, matrix=mtx, verts=bm.verts)


def ell(name, loc, sc, mat, rot=(0, 0, 0), seg=32, subd=1, deform=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(8, seg // 2 + 2), radius=1)
    if deform:
        for v in bm.verts:
            deform(v.co)
    xform(bm, loc, sc, rot)
    return finish(name, bm, mat, subd)


def box(name, loc, size, mat, rot=(0, 0, 0), bevel=.006, seg=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    xform(bm, loc, size, rot)
    o = finish(name, bm, mat, subd=0)
    if bevel:
        b = o.modifiers.new('Cantos', 'BEVEL')
        b.width = bevel
        b.segments = seg
        b.harden_normals = False
    return o


def catmull(ctrl, per=8):
    """Curva suave que passa pelos pontos de controle."""
    P = [Vector(p) for p in ctrl]
    if len(P) < 3:
        return [P[0].lerp(P[-1], i / per) for i in range(per + 1)]
    P = [2 * P[0] - P[1]] + P + [2 * P[-1] - P[-2]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(per):
            t = k / per
            out.append(.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                             + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return out


def resample(vals, count):
    if isinstance(vals, (int, float)):
        return [vals] * count
    out = []
    for i in range(count):
        f = i / max(count - 1, 1) * (len(vals) - 1)
        j = min(int(f), len(vals) - 2)
        out.append(vals[j] + (vals[j + 1] - vals[j]) * (f - j))
    return out


def sweep(name, pts, radii, mat, n=24, up=(0, 0, 1), normals=None, flat=1.0, caps=True,
          subd=2, wobble=None, solidify=0.0):
    """Tubo ao longo de pts; flat < 1 achata na direção da normal (faixas, tiras)."""
    pts = [Vector(p) for p in pts]
    L = len(pts)
    radii = resample(radii, L)
    bm = bmesh.new()
    rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, L - 1)] - pts[max(i - 1, 0)]).normalized()
        nrm = Vector(normals[i]) if normals else Vector(up)
        u = nrm.cross(t)
        if u.length < 1e-6:
            u = Vector((1, 0, 0)).cross(t)
        u.normalize()
        v = t.cross(u).normalized()
        ring = []
        for k in range(n):
            th = TAU * k / n
            r = radii[i] * (1 + (wobble(i / (L - 1), th) if wobble else 0))
            ring.append(bm.verts.new(p + u * math.cos(th) * r + v * math.sin(th) * r * flat))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(n):
            bm.faces.new((r0[k], r0[(k + 1) % n], r1[(k + 1) % n], r1[k]))
    if caps:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    return finish(name, bm, mat, subd, solidify=solidify)


class Shape:
    """Anéis (z, meia-largura, frente, trás, cy[, cx]) + dobras radiais opcionais."""

    def __init__(self, secs, fold=None):
        self.secs = sorted((tuple(s) + (0,) * (6 - len(s)) for s in secs), key=lambda s: s[0])
        self.fold = fold

    def sec(self, z):
        s = self.secs
        z = min(max(z, s[0][0]), s[-1][0])
        for lo, hi in zip(s, s[1:]):
            if lo[0] <= z <= hi[0]:
                t = (z - lo[0]) / ((hi[0] - lo[0]) or 1)
                t = t * t * (3 - 2 * t) * .35 + t * .65  # transição suave entre anéis
                return [lo[i] + (hi[i] - lo[i]) * t for i in range(1, 6)]

    def point(self, a, z, off=0.0):
        w, f, b, cy, cx = self.sec(z)
        if self.fold:
            off += self.fold(a, z)
        co = math.cos(a)
        d = (f if co >= 0 else b)
        return Vector((cx + (w + off) * math.sin(a), cy - (d + off) * co, z))

    def normal(self, a, z):
        return (self.point(a, z, .01) - self.point(a, z)).normalized()


def lin(a, b, n):
    return [a + (b - a) * i / (n - 1) for i in range(n)]


def loft(name, shape, zs, mat, n=48, arc=None, caps=True, solidify=0.0, inner=None, subd=2):
    bm = bmesh.new()
    angles = lin(arc[0], arc[1], n) if arc else [TAU * i / n for i in range(n)]
    rows = [[bm.verts.new(shape.point(a, z)) for a in angles] for z in zs]
    m = len(angles)
    for r0, r1 in zip(rows, rows[1:]):
        for i in range(m - 1 if arc else m):
            j = (i + 1) % m
            bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
    if caps and not arc:
        bm.faces.new(list(reversed(rows[0])))
        bm.faces.new(rows[-1])
    return finish(name, bm, mat, subd, solidify=solidify, inner=inner, recalc=not arc)


def band_h(name, shape, a0, a1, z, width, mat, off=.004, n=60):
    """Faixa plana horizontal sobre a superfície."""
    angs = lin(a0, a1, n)
    pts = [shape.point(a, z, off) for a in angs]
    nrm = [shape.normal(a, z) for a in angs]
    return sweep(name, pts, width, mat, n=12, normals=nrm, flat=.22, subd=1)


def band_v(name, shape, a, z0, z1, width, mat, off=.004, n=24):
    """Faixa plana vertical sobre a superfície (bordas frontais)."""
    zs = lin(z0, z1, n)
    pts = [shape.point(a, z, off) for z in zs]
    nrm = [shape.normal(a, z) for z in zs]
    return sweep(name, pts, width, mat, n=12, normals=nrm, flat=.22, subd=1)


def stud(name, shape, a, z, r, mat, off=.004):
    p = shape.point(a, z, off)
    nrm = shape.normal(a, z)
    return sweep(name, [p - nrm * .003, p + nrm * r * .5], [r, r * .7], mat, n=16, subd=1)


# ---------------------------------------------------------------- cabeça

head_start = len(REG)
HC = Vector((0, -.005, 1.665))
ell('Cabeça', HC, (.104, .114, .13), 'skin', seg=48)
ell('Mandíbula', (0, -.03, 1.60), (.09, .09, .07), 'skin', seg=32)
ell('Testa', (0, -.055, 1.70), (.085, .06, .05), 'skin', seg=32)
ell('Cabelo', (0, .014, 1.738), (.108, .116, .10), 'hair', seg=40,
    deform=lambda c: setattr(c, 'z', c.z + .05 * math.sin(math.atan2(c.x, -c.y) * 9) * max(0, -c.z)))
for s in (-1, 1):
    ell('Maçã do rosto', (s * .056, -.082, 1.646), (.03, .022, .02), 'skin', seg=24)
    ell('Olho', (s * .043, -.1, 1.676), (.025, .013, .018), 'eye', seg=24)
    ell('Íris', (s * .041, -.111, 1.675), (.0125, .005, .0135), 'iris', seg=20)
    ell('Pupila', (s * .041, -.1145, 1.675), (.0062, .003, .0068), 'pupil', seg=16)
    ell('Brilho', (s * .037, -.117, 1.681), (.0032, .0015, .0032), 'eye', seg=10)
    ell('Pálpebra', (s * .043, -.1, 1.688), (.029, .0165, .011), 'skin_shade', rot=(0, -s * .32, 0), seg=24)
    ell('Pálpebra inferior', (s * .044, -.101, 1.662), (.026, .012, .006), 'skin', rot=(0, s * .1, 0), seg=20)
    brow = catmull([(s * .012, -.116, 1.698), (s * .045, -.113, 1.707), (s * .08, -.096, 1.716)], 6)
    sweep('Sobrancelha', brow, [.0095, .0105, .006], 'hair', n=12, up=(0, -1, 0), flat=.6)
    ell('Asa do nariz', (s * .015, -.114, 1.634), (.0095, .01, .009), 'skin_shade', seg=20)
    ell('Costeleta', (s * .092, -.032, 1.635), (.026, .055, .07), 'beard', seg=24)
    mus = catmull([(s * .004, -.127, 1.613), (s * .03, -.125, 1.607), (s * .058, -.11, 1.588)], 6)
    sweep('Bigode', mus, [.012, .014, .007], 'beard', n=14, up=(0, -1, 0), flat=.7)
ell('Dorso do nariz', (0, -.11, 1.663), (.0115, .018, .033), 'skin', rot=(.25, 0, 0), seg=24)
ell('Ponta do nariz', (0, -.124, 1.637), (.0165, .017, .016), 'skin', seg=24)


def beard_shape(c):
    # Queixo pontudo e tufos verticais.
    az = math.atan2(c.x, -c.y)
    c.x *= 1 + .05 * math.sin(az * 13)
    if c.z < 0:
        c.z -= .38 * max(0, 1 - (c.x / .55) ** 2) * (-c.z) * max(0, -c.y)


ell('Barba', (0, -.046, 1.585), (.104, .09, .085), 'beard', seg=48, deform=beard_shape)
ell('Lábio', (0, -.128, 1.593), (.02, .007, .006), 'lip', seg=16)
sweep('Pescoço', [(0, .005, 1.45), (0, .005, 1.56)], .052, 'skin_shade', n=24)

# Capuz: casca com abertura do rosto, dobras laterais e ponta caída para trás.
HOOD_C, HOOD_S = Vector((0, .028, 1.688)), Vector((.152, .165, .18))
OPEN_W, OPEN_Z, OPEN_H = .114, 1.645, .142
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=56, v_segments=36, radius=1)
for v in bm.verts:
    az = math.atan2(v.co.x, -v.co.y)
    back = max(0, math.cos(az - math.pi))
    v.co *= 1 + .04 * math.sin(az * 6 + .4) * (1 - abs(v.co.z)) * (.3 + back)
xform(bm, HOOD_C, HOOD_S)
for v in bm.verts:
    if v.co.z > 1.79:
        v.co.y += (v.co.z - 1.79) * 1.15
        v.co.z += (v.co.z - 1.79) * .3
cut = [f for f in bm.faces
       if f.calc_center_median().y < -.02
       and (f.calc_center_median().x / OPEN_W) ** 2 + ((f.calc_center_median().z - OPEN_Z) / OPEN_H) ** 2 < 1]
bmesh.ops.delete(bm, geom=cut, context='FACES')
finish('Capuz', bm, 'cloak', subd=2, solidify=.016, inner='cloak_in', recalc=False)


def hood_y(x, z):
    d = 1 - (x / HOOD_S.x) ** 2 - ((z - HOOD_C.z) / HOOD_S.z) ** 2
    return HOOD_C.y - HOOD_S.y * math.sqrt(max(d, 0))


rim, rim_n = [], []
for i in range(61):
    t = -2.6 + 5.2 * i / 60
    x, z = OPEN_W * 1.02 * math.sin(t), OPEN_Z + OPEN_H * 1.02 * math.cos(t)
    p = Vector((x, hood_y(x, z) - .002, z))
    rim.append(p)
    rim_n.append((p - HOOD_C).normalized())
sweep('Debrum do capuz', rim, .012, 'gold', n=16, normals=rim_n, flat=.4, subd=1)

# Cabeça e capuz um pouco maiores, como na referência estilizada.
PIV = Matrix.Translation((0, 0, 1.47))
HS = PIV @ Matrix.Scale(1.12, 4) @ PIV.inverted()
for o in REG[head_start:]:
    o.data.transform(HS)

# ---------------------------------------------------------------- tronco

VEST = Shape([(.90, .155, .11, .095, 0), (.98, .165, .12, .10, 0), (1.15, .172, .122, .10, 0),
              (1.32, .19, .128, .11, 0), (1.44, .175, .112, .10, 0), (1.50, .11, .08, .08, 0),
              (1.53, .07, .065, .065, 0)])
loft('Colete', VEST, lin(.90, 1.53, 18), 'vest', n=48)
band_v('Abotoamento', VEST, 0, 1.03, 1.47, .012, 'leather_dk', off=.002)
for z in (1.38, 1.29, 1.20, 1.11):
    for s in (-1, 1):
        stud('Botão', VEST, s * .33, z, .011, 'gold')
for s in (-1, 1):
    band_v('Lapela', VEST, s * .62, 1.05, 1.46, .016, 'coat', off=.003)

A0 = .24
COAT = Shape([(.62, .25, .16, .145, 0), (.72, .236, .154, .138, 0), (.86, .205, .142, .124, 0),
              (1.00, .177, .128, .106, 0)],
             fold=lambda a, z: .011 * max(0, (1.0 - z) / .38) * math.sin(9 * a + .5))
loft('Aba do casaco', COAT, lin(.62, 1.0, 12), 'coat', n=56, arc=(A0, TAU - A0),
     solidify=.012, inner='leather_dk')
band_h('Debrum da aba', COAT, A0, TAU - A0, .632, .014, 'gold')
for a in (A0, TAU - A0):
    band_v('Debrum frontal', COAT, a + (.03 if a < 1 else -.03), .625, .985, .013, 'gold')
for s in (-1, 1):
    for z in (.70, .80, .90):
        stud('Rebite', COAT, s * .5, z, .009, 'gold', off=.006)

BELT = Shape([(.955, .179, .131, .109, 0), (1.04, .181, .133, .111, 0)])
loft('Cinto', BELT, lin(.955, 1.04, 4), 'leather_dk', n=48, subd=1)
box('Fivela', (0, -.143, .997), (.07, .014, .06), 'gold', bevel=.006)
box('Fivela vazada', (0, -.151, .997), (.04, .006, .034), 'leather_dk', bevel=.003)
sweep('Pino da fivela', [(-.012, -.153, .997), (.016, -.153, .997)], .003, 'gold_dk', n=8, subd=0)

# Bandoleira plana do ombro esquerdo ao quadril direito.
strap, strap_n = [], []
for i in range(25):
    t = i / 24
    x, z = .14 - .30 * t, 1.47 - .45 * t
    w, f, b, cy, cx = VEST.sec(z)
    a = math.asin(max(-.98, min(.98, x / w)))
    strap.append(VEST.point(a, z, .012))
    strap_n.append(VEST.normal(a, z))
sweep('Bandoleira', strap, .02, 'leather', n=12, normals=strap_n, flat=.22, subd=1)
mid = strap[10]
box('Fivela da bandoleira', mid + Vector((0, -.008, 0)), (.048, .01, .042), 'gold',
    rot=(0, -.6, 0), bevel=.005)
box('Furo da fivela', mid + Vector((0, -.014, 0)), (.026, .004, .022), 'leather_dk',
    rot=(0, -.6, 0), bevel=.002)

# ---------------------------------------------------------------- capa

C0 = .5


def cape_fold(a, z):
    t = max(0, min(1, (1.40 - z) / 1.0)) ** 1.1
    side = .4 + .6 * min(1, abs(math.sin(a)) + max(0, -math.cos(a)))
    return .05 * t * side * (.65 * math.sin(8 * a + .6) + .35 * math.sin(13 * a + 1.7))


CAPE = Shape([(.34, .52, .22, .28, .07), (.60, .48, .21, .26, .06), (.90, .44, .19, .23, .05),
              (1.15, .42, .17, .2, .04), (1.32, .425, .155, .175, .03), (1.40, .41, .14, .16, .025),
              (1.45, .35, .13, .15, .02), (1.495, .26, .12, .135, .015), (1.535, .17, .105, .115, .01),
              (1.565, .11, .09, .10, .01)],
             fold=cape_fold)
loft('Capa', CAPE, lin(.34, 1.565, 30), 'cloak', n=72, arc=(C0, TAU - C0),
     solidify=.016, inner='cloak_in')
loft('Barra dourada da capa',
     Shape([(z, *CAPE.sec(z)[:4]) for z in (.37, .40, .43)],
           fold=lambda a, z: cape_fold(a, z) + .006),
     (.37, .40, .43), 'gold', n=72, arc=(C0, TAU - C0), solidify=.006, subd=1)
for a in (C0 + .02, TAU - C0 - .02):
    band_v('Borda da capa', CAPE, a, .35, 1.50, .013, 'gold', off=.006)

# Estrela de quatro pontas bordada na capa.
sa, sz = C0 + .32, .56
sp, sn = CAPE.point(sa, sz, .008), CAPE.normal(sa, sz)
bm = bmesh.new()
ring = []
for i in range(8):
    ang = i * TAU / 8
    r = .04 if i % 2 == 0 else .011
    ring.append(bm.verts.new((r * math.sin(ang), 0, r * math.cos(ang))))
bm.faces.new(ring)
bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=.004)
rot = Vector((0, -1, 0)).rotation_difference(sn).to_matrix().to_4x4()
bmesh.ops.transform(bm, matrix=Matrix.Translation(sp) @ rot, verts=bm.verts)
finish('Estrela bordada', bm, 'gold', subd=0)

# Broche redondo no fecho da capa.
BP = Vector((.035, -.142, 1.43))
sweep('Broche', [BP + Vector((0, .012, 0)), BP], [.036, .034], 'gold', n=32, up=(0, 0, 1), subd=1)
ringp = [BP + Vector((.031 * math.cos(t), -.002, .031 * math.sin(t))) for t in lin(0, TAU, 41)]
sweep('Aro do broche', ringp, .0045, 'gold_dk', n=10, subd=1)
ell('Relevo do broche', BP + Vector((0, -.004, 0)), (.019, .008, .019), 'gold', seg=24)
ell('Gema do broche', BP + Vector((0, -.011, 0)), (.008, .004, .008), 'gold_dk', seg=16)

# ---------------------------------------------------------------- pernas e botas

for s in (-1, 1):
    cx = s * .115
    leg = catmull([(s * .085, .0, .98), (s * .10, -.004, .80), (s * .112, -.004, .60),
                   (cx, -.002, .50), (cx, 0, .41)], 6)
    sweep('Calça', leg, [.10, .104, .108, .112, .098, .074], 'pants', n=28, up=(0, -1, 0),
          wobble=lambda t, th: .05 * math.sin(th * 5 + t * 9) * max(0, t - .4))
    shaft = catmull([(cx, -.005, .06), (cx, 0, .14), (cx, .004, .27), (cx, 0, .37)], 5)
    sweep('Cano da bota', shaft, [.064, .06, .074, .072], 'boot', n=28, up=(0, -1, 0))
    sweep('Dobra da bota', [(cx, 0, .34), (cx, 0, .40), (cx, -.002, .455)], [.081, .088, .1],
          'leather', n=32, up=(0, -1, 0), wobble=lambda t, th: .03 * math.sin(th * 4) * t)
    foot = catmull([(cx, .055, .075), (cx, -.02, .07), (cx, -.11, .055), (cx, -.165, .048)], 6)
    sweep('Pé', foot, [.058, .068, .064, .05], 'boot', n=28, up=(0, 0, 1), flat=.88)
    sole = catmull([(cx, .06, .02), (cx, -.03, .018), (cx, -.13, .018), (cx, -.18, .02)], 6)
    sweep('Sola', sole, [.06, .071, .068, .05], 'sole', n=24, up=(0, 0, 1), flat=.3)
    sweep('Salto', [(cx, .065, .012), (cx, .065, .05)], .05, 'sole', n=20, up=(0, -1, 0), subd=1)
    arch = [Vector((cx + .072 * math.cos(t), -.105, .055 + .052 * math.sin(t))) for t in lin(.25, math.pi - .25, 16)]
    arch_n = [(p - Vector((cx, -.105, .03))).normalized() for p in arch]
    sweep('Tira do peito do pé', arch, .016, 'leather_dk', n=12, normals=arch_n, flat=.3, subd=1)
    box('Fivela da bota', (cx, -.146, .1), (.05, .012, .036), 'gold', rot=(-.45, 0, 0), bevel=.005)
    box('Furo da fivela da bota', (cx, -.152, .103), (.03, .005, .02), 'leather_dk',
        rot=(-.45, 0, 0), bevel=.002)

# ---------------------------------------------------------------- braços (pose T)

for s in (-1, 1):
    z = 1.41
    X = lambda x: s * x
    sweep('Manga', [(X(.14), 0, 1.425), (X(.27), 0, 1.415), (X(.40), 0, z)], [.064, .062, .056],
          'vest', n=28, up=(0, -1, 0))
    sweep('Manga dobrada', catmull([(X(.375), 0, z), (X(.42), 0, z), (X(.47), 0, z), (X(.505), 0, z)], 5),
          [.056, .07, .072, .058], 'cream', n=32, up=(0, -1, 0),
          wobble=lambda t, th: .07 * math.sin(th * 7 + t * 3) * math.sin(t * math.pi))
    sweep('Luva de couro', [(X(.49), 0, z), (X(.54), 0, z), (X(.585), 0, z)], [.05, .053, .06],
          'leather', n=28, up=(0, -1, 0))
    sweep('Punho da luva', [(X(.565), 0, z), (X(.605), 0, z)], [.064, .076], 'leather', n=32,
          up=(0, -1, 0), wobble=lambda t, th: .05 * math.sin(th * 3) * t)
    for x in (.515, .55):
        lace = [Vector((X(x), -.053 * math.sin(t), z + .053 * math.cos(t))) for t in lin(-1.2, 1.2, 12)]
        sweep('Cordão da luva', lace, .0035, 'leather_dk', n=8, subd=1)
    sweep('Palma', [(X(.6), -.002, z - .002), (X(.645), -.004, z - .002), (X(.685), -.006, z - .004)],
          [.04, .047, .045], 'leather_dk', n=24, up=(0, -1, 0), flat=.5)
    for k, dz in enumerate((.027, .009, -.009, -.026)):
        L = (.07, .08, .076, .062)[k]
        x0 = .675
        f = catmull([(X(x0), -.006, z + dz), (X(x0 + L * .5), -.01, z + dz * 1.12),
                     (X(x0 + L), -.022, z + dz * 1.25)], 5)
        sweep('Dedo', f, [.0115, .0105, .0085], 'skin', n=14, up=(0, -1, 0), flat=.9)
        sweep('Anel da luva', [(X(x0 - .004), -.006, z + dz), (X(x0 + .012), -.007, z + dz)],
              .0135, 'leather_dk', n=14, up=(0, -1, 0), flat=.9, subd=1)
    th = catmull([(X(.615), -.02, z + .022), (X(.645), -.045, z + .04), (X(.675), -.058, z + .048)], 5)
    sweep('Polegar', th, [.0145, .013, .0105], 'skin', n=14, up=(1, 0, 0))

# ---------------------------------------------------------------- acessórios

PZ = (-.215, -.078, .9)
box('Alforje', PZ, (.08, .055, .095), 'leather', rot=(0, 0, .25), bevel=.018, seg=4)
box('Tampa do alforje', (-.215, -.108, .935), (.086, .014, .05), 'leather_dk', rot=(0, 0, .25),
    bevel=.007, seg=3)
ell('Botão do alforje', (-.208, -.118, .917), (.011, .006, .011), 'gold', seg=16)
sweep('Alça do alforje', [(-.205, -.075, .95), (-.2, -.09, .985), (-.19, -.13, 1.0)], .012,
      'leather_dk', n=10, up=(0, -1, 0), flat=.3, subd=1)

SA, SB = Vector((.208, -.088, .755)), Vector((.245, -.068, .995))
ax = (SB - SA).normalized()
sweep('Pergaminho', [SA, SB], .037, 'paper', n=32, up=(0, -1, 0), subd=0)
for p0 in (SA, SB):
    sweep('Ponta do pergaminho', [p0 - ax * .006, p0 + ax * .006], .04, 'cream', n=32, up=(0, -1, 0), subd=1)
    ell('Miolo do pergaminho', p0 + ax * (.007 if p0 is SB else -.007), (.012, .012, .012), 'cream', seg=16)
RC = SA.lerp(SB, .5)
sweep('Fita do pergaminho', [RC - ax * .01, RC + ax * .01], .0395, 'red', n=32, up=(0, -1, 0), subd=1)
ell('Lacre', RC + Vector((0, -.04, 0)), (.019, .008, .019), 'red', seg=24)
ell('Selo do lacre', RC + Vector((0, -.047, 0)), (.009, .003, .009), 'red', seg=16)
for k in (-1, 1):
    tail = catmull([RC + Vector((0, -.042, 0)), RC + Vector((k * .012, -.05, -.04)),
                    RC + Vector((k * .02, -.048, -.08))], 5)
    sweep('Ponta da fita', tail, [.008, .007, .006], 'red', n=10, up=(0, -1, 0), flat=.3, subd=1)

# ---------------------------------------------------------------- saída

polys = sum(len(o.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.polygons)
            for o in REG if o.type == 'MESH')
print('objetos', len(REG), 'faces avaliadas', polys)
if '--save' in sys.argv:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT))
    print('salvo', OUT)
