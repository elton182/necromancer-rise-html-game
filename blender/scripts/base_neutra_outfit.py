"""Teste: corpo base único + peças trocáveis por slot (roupa, cabelo, equipamento).

blender --background --python blender/scripts/base_neutra_outfit.py
No Blender aberto: exec com {'__file__': caminho, '__name__': 'live'} e chame build().

Fonte: exports/tripo-out/base-neutra-ae9a693f/model.glb (gerado a partir de
examples/base_neutra_reference.webp). Não altera o GLB original.

Roupas: tubos construídos por fatias do contorno do corpo, com folga, pregas,
blusê sobre o cinto e bainha reta; a mesma topologia serve a qualquer variante do
slot. Detalhes de acabamento (trama, costura, desgaste de borda, sombra de
contato) vêm do shader e de atributos por vértice:
  sombra  (cor)   oclusão por raios contra a própria peça e o corpo
  borda   (float) distância até a borda aberta mais próxima (costura, desgaste)
  volta   (float) comprimento ao redor do anel (tracejado da costura)
  fio     (float) 0 na raiz e 1 na ponta da mecha de cabelo
Os atributos e a sombra já servem para assar texturas antes do GLB.

Peças ficam em coleções `Slot_<nome>`, com `slot` e `variante`; `equip(look)`
mostra uma variante por slot (o teste do loot visual).
"""
import math
import random
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector, kdtree
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'exports/tripo-out/base-neutra-ae9a693f/model.glb'
OUT_BLEND = ROOT / 'models/base_neutra_outfit.blend'
HEIGHT = 2.4          # mesma altura dos NPCs Tripo preparados
BODY_TRIS = 24000

# Marcos medidos na base escalada (frente em -Y, mão direita em -X).
CROTCH, WAIST, NECK = 1.12, 1.40, 1.98
ARM_START, ELBOW, WRIST = 0.42, 0.78, 1.06
ARM_Z = 1.60          # acima disso e com |x| > ARM_START é braço
HEAD = Vector((0, .01, 2.24))
BELT_Z = CROTCH + .05  # base do cinto
RING = 48             # vértices por anel

LOOKS = {
    'aventureiro': {'torso': 'tunica', 'pernas': 'calca', 'pes': 'botas_curtas', 'bracos': 'bracadeiras',
                    'cabelo': 'repicado', 'ombro': 'ombreira', 'cintura': 'cinto', 'arma': 'espada'},
    'necromante': {'torso': 'manto', 'pernas': 'calca', 'pes': 'botas_altas', 'bracos': None,
                   'cabelo': 'repicado', 'ombro': None, 'cintura': 'faixa', 'arma': None},
}


# ---------------------------------------------------------------- utilidades

def hexc(h, alpha=True):
    h = h.lstrip('#')
    c = tuple((int(h[i:i+2], 16)/255)**2.2 for i in (0, 2, 4))
    return c + (1,) if alpha else c


def collection(name, parent=None):
    col = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    parent = parent or bpy.context.scene.collection
    if col.name not in parent.children:
        parent.children.link(col)
    return col


def reset():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.curves,
                  bpy.data.lights, bpy.data.worlds):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def apply_mods(obj):
    bpy.context.view_layer.objects.active = obj
    for m in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def smoothstep(a, b, x):
    t = max(0., min(1., (x-a)/(b-a)))
    return t*t*(3-2*t)


def gauss(x, mu, w):
    return math.exp(-((x-mu)/w)**2)


def layer(bm, name):
    return bm.verts.layers.float.get(name) or bm.verts.layers.float.new(name)


def fill_borda(bm):
    """Distância de cada vértice até a borda aberta mais próxima."""
    lay = layer(bm, 'borda')
    edge = [v for v in bm.verts if v.is_boundary]
    if not edge:
        for v in bm.verts:
            v[lay] = 1.
        return
    kd = kdtree.KDTree(len(edge))
    for i, v in enumerate(edge):
        kd.insert(v.co, i)
    kd.balance()
    for v in bm.verts:
        v[lay] = kd.find(v.co)[2]


def new_object(name, bm, mat, col, slot, variant, smooth=True, borda=True):
    if borda and not bm.verts.layers.float.get('borda'):
        fill_borda(bm)
    for n in ('borda', 'volta', 'fio'):
        layer(bm, n)
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    col.objects.link(obj)
    for m in (mat if isinstance(mat, (list, tuple)) else [mat]):
        me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = smooth
    obj['slot'], obj['variante'] = slot, variant
    return obj


def merge(bms):
    out = bmesh.new()
    for b in bms:
        me = bpy.data.meshes.new('tmp')
        b.to_mesh(me)
        b.free()
        out.from_mesh(me)
        bpy.data.meshes.remove(me)
    return out


def solidify(obj, thickness, offset=-1):
    s = obj.modifiers.new('espessura', 'SOLIDIFY')
    s.thickness, s.offset = thickness, offset
    s.use_quality_normals = True
    s.use_rim = True
    return s


# ---------------------------------------------------------------- corpo

def import_body():
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    body = next(o for o in bpy.data.objects if o not in before and o.type == 'MESH')
    body.name = body.data.name = 'BaseNeutra_Corpo'
    body.data.transform(body.matrix_world)
    body.matrix_world.identity()
    body.data.transform(Matrix.Rotation(-math.pi/2, 4, 'Z'))
    vs = body.data.vertices
    lo = Vector([min(v.co[i] for v in vs) for i in range(3)])
    hi = Vector([max(v.co[i] for v in vs) for i in range(3)])
    center = Vector(((lo.x+hi.x)/2, (lo.y+hi.y)/2, lo.z))
    body.data.transform(Matrix.Scale(HEIGHT/(hi.z-lo.z), 4) @ Matrix.Translation(-center))
    tris = sum(len(p.vertices)-2 for p in body.data.polygons)
    dec = body.modifiers.new('decimate', 'DECIMATE')
    dec.ratio = min(1, BODY_TRIS/tris)
    apply_mods(body)
    for p in body.data.polygons:
        p.use_smooth = True
    for o in [o for o in bpy.data.objects if o not in before and o != body]:
        bpy.data.objects.remove(o)
    body['slot'], body['variante'] = 'corpo', 'base_neutra'
    return body


def is_arm(co):
    return co.z > ARM_Z and abs(co.x) > ARM_START


def trunk_keep(p):
    return not is_arm(p) and p.z < NECK+.04


# ---------------------------------------------------------------- tubos por fatias

class Loft:
    """Anéis convexos ao redor do corpo ao longo de um eixo ('z' tronco/pernas, 'x' braço)."""

    def __init__(self, verts, axis):
        self.axis = axis
        self.pts = verts

    def plane(self, co):
        return (co.x, co.y) if self.axis == 'z' else (co.y, co.z)

    def along(self, co):
        return co.z if self.axis == 'z' else abs(co.x)

    def direction(self, k):
        a = math.tau*k/RING
        if self.axis == 'z':
            return math.sin(a), -math.cos(a)       # k=0 na frente (-Y)
        return math.cos(a), math.sin(a)

    def rings(self, levels, keep, offset, window=.025, side=1, smooth=6, slack=.008, drape_below=None):
        slices, centers = [], []
        for t in levels:
            sl = [self.plane(p) for p in self.pts if abs(self.along(p)-t) < window and keep(p)]
            if len(sl) < 3:
                sl = slices[-1] if slices else [(0, 0)]
            slices.append(sl)
            centers.append((sum(p[0] for p in sl)/len(sl), sum(p[1] for p in sl)/len(sl)))
        # Eixo do tubo suave; na saia o eixo fica fixo para ela cair reta.
        for _ in range(3):
            centers = [centers[0]] + [((a[0]+2*b[0]+c[0])/4, (a[1]+2*b[1]+c[1])/4)
                                      for a, b, c in zip(centers, centers[1:], centers[2:])] + [centers[-1]]
        if drape_below is not None:
            j = next((i for i, t in enumerate(levels) if t >= drape_below), len(levels)-1)
            centers = [centers[j] if i < j else c for i, c in enumerate(centers)]
        H = []
        for sl, (cx, cy) in zip(slices, centers):
            row = []
            for k in range(RING):
                d = self.direction(k)
                row.append(max((p[0]-cx)*d[0]+(p[1]-cy)*d[1] for p in sl))
            H.append(row)
        # Tecido não marca músculo: média ao longo do eixo e leve ao redor do anel.
        raw = H
        for _ in range(smooth):
            S = []
            for i, row in enumerate(H):
                up, dn = H[max(0, i-1)], H[min(len(H)-1, i+1)]
                S.append([(row[k-1]+row[(k+1) % RING]+2*up[k]+2*dn[k]+2*row[k])/8 for k in range(RING)])
            H = S
        H = [[max(h, r-slack) for h, r in zip(hr, rr)] for hr, rr in zip(H, raw)]
        if drape_below is not None:
            # Saia cai como cone: abaixo da altura dada o raio só cresce para baixo.
            for i in range(len(levels)-2, -1, -1):
                if levels[i] < drape_below:
                    H[i] = [max(a, b) for a, b in zip(H[i], H[i+1])]
        out = []
        for t, (cx, cy), row in zip(levels, centers, H):
            ring = []
            for k in range(RING):
                d = self.direction(k)
                r = row[k] + offset(t, k)
                u, v = cx + d[0]*r, cy + d[1]*r
                ring.append(Vector((u, v, t)) if self.axis == 'z' else Vector((side*t, u, v)))
            out.append(ring)
        return out


def tube(rings, cap_start=False, cap_end=False, skip=None):
    """Liga os anéis em quads, com UV, `volta` e sem as faces (nível, k) em `skip`."""
    bm = bmesh.new()
    volta = layer(bm, 'volta')
    uv = bm.loops.layers.uv.new('UVMap')
    vr, along = [], [0.]
    for i, ring in enumerate(rings):
        if i:
            along.append(along[-1] + sum((a-b).length for a, b in zip(ring, rings[i-1]))/RING)
        row, acc = [], 0.
        for k, p in enumerate(ring):
            v = bm.verts.new(p)
            v[volta] = acc
            acc += (ring[(k+1) % RING]-p).length
            row.append(v)
        vr.append(row)
    for i, (a, b) in enumerate(zip(vr, vr[1:])):
        for k in range(RING):
            if skip and skip(i, k):
                continue
            f = bm.faces.new((a[k], a[(k+1) % RING], b[(k+1) % RING], b[k]))
            for loop, (kk, ii) in zip(f.loops, ((k, i), (k+1, i), (k+1, i+1), (k, i+1))):
                loop[uv].uv = (kk/RING, along[ii])
    if cap_start:
        bm.faces.new(vr[0][::-1])
    if cap_end:
        bm.faces.new(vr[-1])
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def push(ring, amount):
    c = sum(ring, Vector())/len(ring)
    return [p + Vector(((p-c).x, (p-c).y, 0)).normalized()*amount for p in ring]


def push_axis(ring, amount, axis):
    c = sum(ring, Vector())/len(ring)
    out = []
    for p in ring:
        d = p - c
        if axis == 'x':
            d.x = 0
        else:
            d.z = 0
        out.append(p + d.normalized()*amount)
    return out


def span(a, b, step):
    n = max(2, round(abs(b-a)/step)+1)
    return [a+(b-a)*i/(n-1) for i in range(n)]


# ---------------------------------------------------------------- varredura (peças rígidas, cabelo)

def sweep(path, profile, cap_start=True, cap_end=True, closed_path=False, ref=Vector((0, 0, 1)), fio=False,
          side_vec=None, ref_fn=None, closed_profile=True):
    """Perfil 2D (lista de (lado, normal)) varrido ao longo de `path`."""
    bm = bmesh.new()
    fl = layer(bm, 'fio')
    n = len(path)
    rings = []
    for i, p in enumerate(path):
        t = i/(n-1)
        a = path[(i+1) % n] if closed_path else path[min(i+1, n-1)]
        b = path[(i-1) % n] if closed_path else path[max(i-1, 0)]
        tan = (a-b).normalized()
        if side_vec is not None:
            # Largura sempre na direção pedida (tiras e abas não giram no caminho).
            side = (side_vec - tan*side_vec.dot(tan)).normalized()
        else:
            r = ref_fn(p) if ref_fn else ref
            r = r if abs(tan.dot(r)) < .95 else Vector((1, 0, 0))
            side = tan.cross(r).normalized()
        nrm = side.cross(tan).normalized()
        ring = []
        for s, q in profile(t):
            v = bm.verts.new(p + side*s + nrm*q)
            v[fl] = t if fio else 0.
            ring.append(v)
        rings.append(ring)
    m = len(rings[0])
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if closed_path else [])
    for a, b in pairs:
        for k in range(m if closed_profile else m-1):
            bm.faces.new((a[k], a[(k+1) % m], b[(k+1) % m], b[k]))
    if not closed_path and closed_profile:
        if cap_start:
            bm.faces.new(rings[0][::-1])
        if cap_end:
            bm.faces.new(rings[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def ellipse(rx, ry, seg=10, power=1.):
    def f(t, rx=rx, ry=ry):
        out = []
        for k in range(seg):
            a = math.tau*k/seg
            c, s = math.cos(a), math.sin(a)
            out.append((rx*math.copysign(abs(c)**power, c), ry*math.copysign(abs(s)**power, s)))
        return out
    return f


def scaled(profile, scale):
    return lambda t: [(x*scale(t), y*scale(t)) for x, y in profile(t)]


def set_material(bm, index):
    for f in bm.faces:
        f.material_index = index
    return bm


# ---------------------------------------------------------------- roupas

def make_torso(pts, variant, M, col):
    loft = Loft(pts, 'z')
    tunic = variant == 'tunica'
    if tunic:
        bottom, mat, ease, flare, pleats = CROTCH-.20, M['tunica'], .03, .26, 8
        sleeve_end, sleeve_flare = ELBOW-.02, .025
    else:
        bottom, mat, ease, flare, pleats = .10, M['manto'], .036, .15, 12
        sleeve_end, sleeve_flare = WRIST-.04, .11

    def off(t, k):
        a = math.tau*k/RING
        skirt = max(0., CROTCH+.04-t)
        o = ease + skirt*flare
        # Pregas: crescem para baixo, ficam mais fundas nas laterais e atrás.
        depth = smoothstep(CROTCH+.04, bottom, t)*(.022 if tunic else .03)
        o += depth*(.5+.5*math.cos(a*pleats))*(.7+.3*abs(math.sin(a)))
        # Blusê: o tecido sobra por cima do cinto e é preso por ele.
        o += .010*gauss(t, BELT_Z+.11, .05) - .006*gauss(t, BELT_Z+.04, .03)
        o += -.012*smoothstep(NECK-.10, NECK-.02, t)
        # Folga extra no alto do ombro, onde o trapézio encosta no pano.
        o += .022*gauss(t, NECK-.06, .05)*abs(math.sin(a))
        return o
    levels = span(bottom, NECK-.05, .03)
    rings = loft.rings(levels, trunk_keep, off, drape_below=CROTCH+.02, smooth=30, slack=.022)
    rings += loft.rings([NECK+.01], lambda p: abs(p.x) < .12 and not is_arm(p), lambda t, k: ease-.006)
    parts = []
    # Abertura frontal com cordão na túnica; manto fecha com faixa sobreposta.
    slit_from = next(i for i, r in enumerate(rings) if r[0].z > 1.80)
    skip = (lambda i, k: i >= slit_from and k in (RING-1, 0)) if tunic else None
    body = new_object(f'Torso_{variant}', tube(rings, skip=skip), mat, col, 'torso', variant)
    solidify(body, .014)
    parts.append(body)

    trim_mat = M['couro'] if tunic else M['manto_escuro']
    hem = tube([push(rings[0], .010), push(rings[1], .010)])
    parts.append(new_object(f'Torso_{variant}_barra', hem, trim_mat, col, 'torso', variant))
    solidify(parts[-1], .016)

    if tunic:
        # Cordão em X atravessando a abertura do peito.
        bm = bmesh.new()
        for i in range(slit_from, len(rings)-2):
            a0, b0 = rings[i][RING-1], rings[i][1]
            a1, b1 = rings[i+1][RING-1], rings[i+1][1]
            for p, q in ((a0, b1), (b0, a1)):
                out = (p+q)/2 - Vector((0, .006, 0))
                piece = sweep([p - Vector((0, .004, 0)), out, q - Vector((0, .004, 0))], ellipse(.0045, .0045, 6))
                bm = merge([bm, piece])
        parts.append(new_object('Torso_tunica_cordao', bm, M['couro_escuro'], col, 'torso', variant))
        # Gola: rolo de couro justo ao pescoço.
        gola = loft.rings(span(NECK-.06, NECK+.015, .025), lambda p: abs(p.x) < .14 and not is_arm(p),
                          lambda t, k: ease+.004)
        parts.append(new_object('Torso_tunica_gola', tube(gola, skip=lambda i, k: k in (RING-1, 0)),
                                M['couro'], col, 'torso', variant))
        solidify(parts[-1], .014)
    else:
        # Faixa frontal sobreposta (fechamento do manto), do pescoço à barra.
        strip = []
        for ring in rings:
            c = sum(ring, Vector())/RING
            row = [ring[k % RING] for k in range(-3, 4)]
            strip.append([p + Vector(((p-c).x, (p-c).y, 0)).normalized()*.008 for p in row])
        bm = bmesh.new()
        vr = [[bm.verts.new(p) for p in row] for row in strip]
        for a, b in zip(vr, vr[1:]):
            for k in range(6):
                bm.faces.new((a[k], a[k+1], b[k+1], b[k]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        parts.append(new_object('Torso_manto_faixa_frontal', bm, M['manto_escuro'], col, 'torso', variant))
        solidify(parts[-1], .012, 1)
        # Capuz caído nas costas.
        def hood(t, k):
            back = max(0., -math.cos(math.tau*k/RING))
            return .05 + .11*back**1.5*smoothstep(NECK-.14, NECK-.02, t)
        hr = loft.rings(span(NECK-.14, NECK+.03, .025), trunk_keep, hood)
        parts.append(new_object('Torso_manto_capuz', tube(hr), M['manto_escuro'], col, 'torso', variant))
        solidify(parts[-1], .02)

    for side in (1, -1):
        sl = Loft([p for p in pts if p.x*side > 0], 'x')
        levels = span(ARM_START-.06, sleeve_end, .025)

        def soff(t, k, end=sleeve_end):
            a = math.tau*k/RING
            o = ease + .006 + smoothstep(end-.22, end, t)*sleeve_flare
            # Início da manga afunila dentro do tronco para não furar o ombro.
            o -= .035*smoothstep(ARM_START, ARM_START-.06, t)
            # Rugas de compressão na dobra do cotovelo (lado de baixo do braço).
            o += .006*math.sin(t*90)*max(0., -math.sin(a))*smoothstep(ELBOW-.25, ELBOW-.05, t)
            return o
        sr = sl.rings(levels, lambda p: p.z > ARM_Z-.02, soff, window=.02, side=side)
        tag = 'E' if side > 0 else 'D'
        parts.append(new_object(f'Torso_{variant}_manga_{tag}', tube(sr), mat, col, 'torso', variant))
        solidify(parts[-1], .012)
        cuff = tube([push_axis(sr[-2], .009, 'x'), push_axis(sr[-1], .009, 'x')])
        parts.append(new_object(f'Torso_{variant}_punho_{tag}', cuff, trim_mat, col, 'torso', variant))
        solidify(parts[-1], .014)
    return parts


def make_legs(pts, variant, M, col):
    parts = []
    for side in (1, -1):
        loft = Loft(pts, 'z')

        def off(t, k):
            a = math.tau*k/RING
            o = .016
            # Sobra de pano acima do cano da bota e atrás do joelho.
            o += .010*smoothstep(.62, .40, t)*(.5+.5*math.sin(t*120+a*2))
            o += .006*gauss(t, .62, .05)*max(0., math.cos(a-math.pi))*(.5+.5*math.sin(t*140))
            return o
        rings = loft.rings(span(.38, CROTCH+.02, .03), lambda p: p.x*side > .015 and not is_arm(p), off)
        parts.append(new_object(f'Pernas_{variant}_{"E" if side > 0 else "D"}', tube(rings), M['calca'], col, 'pernas', variant))
        solidify(parts[-1], .01)
    loft = Loft(pts, 'z')
    rings = loft.rings(span(CROTCH-.06, BELT_Z+.05, .03), trunk_keep, lambda t, k: .012)
    parts.append(new_object(f'Pernas_{variant}_quadril', tube(rings), M['calca'], col, 'pernas', variant))
    solidify(parts[-1], .01)
    return parts


def make_feet(pts, variant, M, col):
    top = .50 if variant == 'botas_curtas' else .80
    parts = []
    for side in (1, -1):
        loft = Loft(pts, 'z')
        tag = 'E' if side > 0 else 'D'

        def off(t, k):
            a = math.tau*k/RING
            o = .026 + smoothstep(top-.16, top, t)*.012
            # Vinco no peito do pé.
            o += .006*gauss(t, .17, .03)*max(0., math.cos(a))
            return o
        keep = lambda p: p.x*side > .015
        rings = loft.rings([.045] + span(.08, top, .035), keep, off, window=.045)
        parts.append(new_object(f'Pes_{variant}_{tag}', tube(rings), M['bota'], col, 'pes', variant))
        solidify(parts[-1], .014)
        # Dobra do cano em couro mais claro.
        fold = loft.rings(span(top-.09, top+.015, .025), keep, lambda t, k: .052 + .01*smoothstep(top-.09, top, t), window=.03)
        parts.append(new_object(f'Pes_{variant}_dobra_{tag}', tube(fold), M['couro'], col, 'pes', variant))
        solidify(parts[-1], .012)
        # Sola com vira saliente.
        base = push(rings[0], .010)
        sole = tube([[Vector((p.x, p.y, 0.)) for p in base], [Vector((p.x, p.y, .05)) for p in base]],
                    cap_start=True, cap_end=True)
        parts.append(new_object(f'Pes_{variant}_sola_{tag}', sole, M['sola'], col, 'pes', variant))
        if variant == 'botas_altas':
            # Tira com fivela na canela.
            strap = loft.rings(span(.40, .45, .025), keep, lambda t, k: .045, window=.03)
            parts.append(new_object(f'Pes_{variant}_tira_{tag}', tube(strap), M['couro_escuro'], col, 'pes', variant))
            solidify(parts[-1], .01)
            front = strap[1][int(RING*(.25 if side > 0 else .75))]
            bm = sweep(rect_path(front + Vector((side*.008, 0, 0)), .035, .045, axis='x'),
                       ellipse(.004, .004, 6), closed_path=True)
            parts.append(new_object(f'Pes_{variant}_fivela_{tag}', bm, M['latao'], col, 'pes', variant))
    return parts


def make_bracers(pts, variant, M, col):
    parts = []
    for side in (1, -1):
        loft = Loft([p for p in pts if p.x*side > 0], 'x')

        def off(t, k):
            return .022 + smoothstep(WRIST-.10, ELBOW+.08, t)*.014
        rings = loft.rings(span(ELBOW+.08, WRIST-.02, .02), lambda p: p.z > ARM_Z, off, window=.02, side=side)
        tag = 'E' if side > 0 else 'D'
        # Abertura com cordão no lado de baixo do antebraço.
        bm = tube(rings, skip=lambda i, k: k in (int(RING*.75)-1, int(RING*.75)))
        parts.append(new_object(f'Bracos_{variant}_{tag}', bm, M['couro'], col, 'bracos', variant))
        solidify(parts[-1], .012)
        lace = bmesh.new()
        ka, kb = int(RING*.75)-1, int(RING*.75)+1
        for i in range(1, len(rings)-1, 2):
            p, q = rings[i][ka], rings[min(i+1, len(rings)-1)][kb % RING]
            lace = merge([lace, sweep([p, (p+q)/2 - Vector((0, 0, .006)), q], ellipse(.004, .004, 6))])
        parts.append(new_object(f'Bracos_{variant}_cordao_{tag}', lace, M['couro_escuro'], col, 'bracos', variant))
    return parts


def rect_path(center, w, h, axis='y', r=.008, seg=4):
    """Retângulo arredondado fechado no plano perpendicular a `axis`."""
    pts = []
    corners = [(w/2-r, h/2-r, 0), (-(w/2-r), h/2-r, 90), (-(w/2-r), -(h/2-r), 180), (w/2-r, -(h/2-r), 270)]
    for cx, cy, a0 in corners:
        for s in range(seg+1):
            a = math.radians(a0 + 90*s/seg)
            u, v = cx + r*math.cos(a), cy + r*math.sin(a)
            pts.append(center + (Vector((u, 0, v)) if axis == 'y' else Vector((0, u, v))))
    return pts


def belt_point(pts, deg, z, ease=.052):
    """Ponto na face externa do cinto no ângulo `deg` (0 = frente, 90 = lado esquerdo) e sua normal."""
    ring = Loft(pts, 'z').rings([z], trunk_keep, lambda t, k: ease, smooth=0)[0]
    c = sum(ring, Vector())/RING
    k = round(deg/360*RING) % RING
    p = ring[k]
    n = Vector((p.x-c.x, p.y-c.y, 0)).normalized()
    return p, n


def frame_matrix(origin, x, y, z):
    m = Matrix((x, y, z)).transposed().to_4x4()
    m.translation = origin
    return m


def make_pouch(pts, M, col, variant):
    """Bolsa pendurada no cinto por alça própria; modelada com frente em -Y local."""
    p, n = belt_point(pts, 300, BELT_Z+.0375)
    Y = -n
    Z = Vector((0, 0, 1))
    X = Y.cross(Z).normalized()
    place = frame_matrix(p + n*.03 + Vector((0, 0, BELT_Z+.045-p.z)), X, Y, Z)
    body_prof = ellipse(1, 1, 20, .35)
    body = sweep([Vector((0, 0, -.125 + .125*i/8)) for i in range(9)],
                 lambda t: [(x*.058*(.92+.08*min(1, t*4)), y*.026*(1+.35*math.sin(math.pi*t))*(.85+.15*min(1, t*4)))
                            for x, y in body_prof(t)], side_vec=Vector((1, 0, 0)))
    # Aba curva: passa por cima e desce na frente terminando em "U".
    flap_path = [Vector((0, .022, .004)), Vector((0, .004, .014)), Vector((0, -.024, .010)), Vector((0, -.037, -.008)),
                 Vector((0, -.040, -.035)), Vector((0, -.039, -.062))]

    def flap_w(t):
        return .063 if t < .62 else .063*(.42 + .58*math.sqrt(max(0., 1-((t-.62)/.38)**2)))
    flap = sweep(flap_path, lambda t: [(x*flap_w(t), y*.0045) for x, y in ellipse(1, 1, 14, .25)(t)],
                 side_vec=Vector((1, 0, 0)))
    # Lingueta de fecho e botão de latão.
    tab = sweep([Vector((0, -.032, -.10)), Vector((0, -.036, -.075)), Vector((0, -.041, -.052))],
                ellipse(.011, .003, 8, .3), side_vec=Vector((1, 0, 0)))
    stud = sweep([Vector((0, -.042, -.058)), Vector((0, -.050, -.058))], ellipse(.009, .009, 10))
    # Alça traseira que abraça o cinto.
    loop = sweep([Vector((0, .024, -.04)), Vector((0, .026, .028)), Vector((0, .033, .041)),
                  Vector((0, .042, .030)), Vector((0, .042, -.03))],
                 ellipse(.019, .0035, 8, .3), side_vec=Vector((1, 0, 0)))
    bm = merge([set_material(body, 0), set_material(flap, 1), set_material(tab, 1), set_material(stud, 2),
                set_material(loop, 1)])
    bmesh.ops.transform(bm, verts=bm.verts, matrix=place)
    return new_object('Cintura_cinto_bolsa', bm, [M['couro_escuro'], M['couro'], M['latao']], col, 'cintura', variant)


def make_waist(pts, variant, M, col, torso_variant):
    loft = Loft(pts, 'z')
    if variant == 'cinto':
        rings = loft.rings(span(BELT_Z, BELT_Z+.075, .025), trunk_keep, lambda t, k: .052)
        belt = new_object('Cintura_cinto_tira', tube(rings), M['couro'], col, 'cintura', variant)
        solidify(belt, .009)
        front = rings[1][0]
        center = Vector((0, front.y-.018, BELT_Z+.038))
        frame = sweep(rect_path(center, .085, .075), ellipse(.0055, .0055, 6), closed_path=True)
        prong = sweep([center + Vector((-.035, -.004, 0)), center + Vector((.006, -.009, 0))], ellipse(.003, .003, 6))
        buckle = new_object('Cintura_cinto_fivela', merge([frame, prong]), M['latao'], col, 'cintura', variant)
        # Ponta do cinto passando pela fivela e caindo à direita do personagem.
        tail_path = [center + Vector((.02, -.006, 0)), center + Vector((-.03, -.010, -.004)),
                     center + Vector((-.055, -.008, -.035)), center + Vector((-.06, -.004, -.085))]
        tail = sweep(tail_path, ellipse(.028, .0045, 8, .35), ref=Vector((0, 1, 0)))
        tail_obj = new_object('Cintura_cinto_ponta', tail, M['couro'], col, 'cintura', variant)
        parts = [belt, buckle, tail_obj]
        parts.append(make_pouch(pts, M, col, variant))
        return parts
    # Faixa de pano amarrada com nó e pontas caídas.
    rings = loft.rings(span(BELT_Z-.03, BELT_Z+.09, .02), trunk_keep, lambda t, k: .066 + .004*math.sin(t*160))
    sash = new_object('Cintura_faixa', tube(rings), M['faixa'], col, 'cintura', variant)
    solidify(sash, .012)
    knot_c = rings[3][int(RING*.88)]
    knot_c = knot_c + (knot_c - Vector((0, 0, knot_c.z))).normalized()*.02
    knot = sweep([knot_c + Vector((0, 0, -.03)), knot_c + Vector((0, 0, .03))], ellipse(.035, .03, 10))
    ends = []
    for dx, length in ((-.02, .30), (.025, .24)):
        p0 = knot_c + Vector((dx, -.01, -.02))
        ends.append(sweep([p0, p0 + Vector((dx*.6, -.03, -length*.5)), p0 + Vector((dx*1.4, -.02, -length))],
                          scaled(ellipse(.03, .004, 8, .4), lambda t: 1-.25*t), ref=Vector((0, 1, 0))))
    tie = new_object('Cintura_faixa_no', merge([knot] + ends), M['faixa'], col, 'cintura', variant)
    return [sash, tie]


def make_pauldron(pts, variant, M, col):
    """Espaldar de lâminas sobrepostas no braço esquerdo, rebitadas em tiras de couro."""
    sl = [p for p in pts if abs(p.x-.56) < .02 and p.z > ARM_Z]
    yc = sum(p.y for p in sl)/len(sl)
    zc = sum(p.z for p in sl)/len(sl)
    r_arm = max(math.hypot(p.y-yc, p.z-zc) for p in sl)

    def arc_point(x, r, deg):
        a = math.radians(deg)
        return Vector((x, yc - r*math.sin(a), zc + r*math.cos(a)))

    def lame(xa, xb, r, span_deg, dome):
        def prof(t):
            rr = r*(1 + dome*math.sin(math.pi*t) + .05*t)
            return [(rr*math.sin(math.radians(a)), rr*math.cos(math.radians(a)))
                    for a in [-span_deg + 2*span_deg*j/21 for j in range(22)]]
        path = [Vector((x, yc, zc)) for x in span(xa, xb, .015)]
        return sweep(path, prof, closed_profile=False, ref=Vector((0, 0, 1)))

    # Lâmina de cima por fora, as de baixo por dentro (sobreposição de escamas).
    plates = [(.40, .545, r_arm+.080, 100, .06), (.505, .615, r_arm+.069, 88, .03), (.575, .675, r_arm+.060, 80, .02)]
    parts = []
    for i, (xa, xb, r, sp, dome) in enumerate(plates):
        o = new_object(f'Ombro_{variant}_lamina_{i}', lame(xa, xb, r, sp, dome), M['metal'], col, 'ombro', variant)
        solidify(o, .011, 0)
        parts.append(o)
    # Bordas enroladas: gola da lâmina de cima e barra da última.
    rims = []
    xa, xb, r, sp, dome = plates[0]
    rims.append(sweep([arc_point(xa, r, a) for a in span(-sp, sp, 6)], ellipse(.009, .009, 8)))
    xa, xb, r, sp, dome = plates[-1]
    rims.append(sweep([arc_point(xb, r*1.05, a) for a in span(-sp, sp, 6)], ellipse(.006, .006, 8)))
    parts.append(new_object(f'Ombro_{variant}_frisos', merge(rims), M['metal'], col, 'ombro', variant))
    # Tiras de couro por baixo, presas por rebites nas pontas de cada lâmina.
    straps, rivets = [], []
    for sgn in (1, -1):
        def strip(t, sgn=sgn):
            c = sgn*(plates[-1][3]-14)
            return [((r_arm+.055)*math.sin(math.radians(a)), (r_arm+.055)*math.cos(math.radians(a))) for a in span(c-7, c+7, 3)]
        straps.append(sweep([Vector((x, yc, zc)) for x in span(.42, .695, .03)], strip, closed_profile=False))
        for xa, xb, r, sp, dome in plates:
            a = sgn*(sp-14)
            mid = Vector(((xa+xb)/2, yc, zc))
            c = arc_point((xa+xb)/2, r*(1+dome)+.006, a)
            out = (c - mid).normalized()
            rivets.append(sweep([c - out*.004, c + out*.006],
                                lambda t: [(x*(.014 if t < .5 else .009), y*(.014 if t < .5 else .009))
                                           for x, y in ellipse(1, 1, 10)(t)]))
    so = new_object(f'Ombro_{variant}_tiras', merge(straps), M['couro_escuro'], col, 'ombro', variant)
    solidify(so, .006, 0)
    parts += [so, new_object(f'Ombro_{variant}_rebites', merge(rivets), M['latao'], col, 'ombro', variant)]
    # Braçal de couro que prende o espaldar acima do cotovelo.
    ring = [arc_point(.655, r_arm+.050, a) for a in range(0, 360, 15)]
    band = sweep(ring, ellipse(.016, .0045, 8, .3), closed_path=True, side_vec=Vector((1, 0, 0)))
    parts.append(new_object(f'Ombro_{variant}_bracal', band, M['couro'], col, 'ombro', variant))
    return parts


def make_sword(pts, variant, M, col):
    """Espada curta embainhada; modelada no eixo local (lâmina em -Z, largura em Y)."""
    pieces = []
    # Bainha afunilada, seção lenticular, ponta arredondada.
    def width(t):
        return (.040 - .012*t) * (1 if t < .9 else max(.15, 1-(t-.9)/.1*.85))

    lens = ellipse(1, 1, 14, .55)

    def scab(t, grow=0.):
        return [(x*(width(t)+grow), y*(.017+grow*.8)*(1 if t < .9 else max(.3, 1-(t-.9)/.1*.7))) for x, y in lens(t)]
    path = [Vector((0, 0, -.66*t)) for t in [i/20 for i in range(21)]]
    frame_ref = Vector((1, 0, 0))   # lado = Y (largura), normal = X (espessura)
    pieces.append(set_material(sweep(path, scab, ref=frame_ref), 0))
    # Boquilha e ponteira de latão, anel central.
    throat = [Vector((0, 0, .006 - .062*i/4)) for i in range(5)]
    pieces.append(set_material(sweep(throat, lambda t: [(x*(1+.10*(1-t)), y*(1+.10*(1-t))) for x, y in scab(.0, .004)],
                                     ref=frame_ref), 3))
    tip_path = [Vector((0, 0, -.66*t)) for t in [.82 + .18*i/8 for i in range(9)]]
    pieces.append(set_material(sweep(tip_path, lambda t: scab(.82+.18*t, .005), ref=frame_ref), 3))
    pieces.append(set_material(sweep([Vector((0, 0, -.30)), Vector((0, 0, -.325))], lambda t: scab(.45, .005), ref=frame_ref), 3))
    # Guarda curva com pontas engrossadas.
    guard = [Vector((0, y, .018 - .028*(y/.105)**2)) for y in [-.105 + .21*i/16 for i in range(17)]]
    pieces.append(set_material(sweep(guard, lambda t: [(x*(.010+.006*math.sin(math.pi*t)+.006*(abs(t-.5)>.44)),
                                                         y*(.012+.004*math.sin(math.pi*t))) for x, y in ellipse(1, 1, 10)(t)],
                                     ref=Vector((1, 0, 0))), 1))
    # Escudete central.
    pieces.append(set_material(sweep([Vector((0, 0, .0)), Vector((0, 0, .045))], ellipse(.028, .024, 12, .5), ref=frame_ref), 1))
    # Punho com tiras enroladas.
    grip = [Vector((0, 0, .045 + .125*i/40)) for i in range(41)]
    pieces.append(set_material(sweep(grip, lambda t: [(x*(1+.12*max(0., math.sin(t*math.pi*18))), y*(1+.12*max(0., math.sin(t*math.pi*18))))
                                                      for x, y in ellipse(.016, .019, 12)(t)], ref=frame_ref), 2))
    # Pomo em disco com borda chanfrada e botão.
    disc = [Vector((x, 0, .205)) for x in (-.016, -.012, .012, .016)]
    pieces.append(set_material(sweep(disc, lambda t: [(x*(.026 if t in (0, 1) else .034), y*(.026 if t in (0, 1) else .034))
                                                      for x, y in ellipse(1, 1, 16)(t)], ref=Vector((0, 0, 1))), 1))
    pieces.append(set_material(sweep([Vector((0, 0, .235)), Vector((0, 0, .252))], ellipse(.012, .012, 10)), 3))
    bm = merge(pieces)
    # Pendurada no lado esquerdo, um pouco atrás do quadril: punho à frente, ponta
    # para trás e afastada da saia (mede a barra da túnica para não atravessá-la).
    deg = 100
    p_belt, n = belt_point(pts, deg, BELT_Z)
    back = Vector((0, 0, 1)).cross(n).normalized()
    top = p_belt + n*.05 + Vector((0, 0, -.035))
    d2 = Vector((math.sin(math.radians(deg)), -math.cos(math.radians(deg))))
    hem = bpy.data.objects.get('Torso_tunica_barra')
    r_hem, z_hem = 0., top.z - .25
    if hem:
        near = [v.co for v in hem.data.vertices if Vector((v.co.x, v.co.y)).normalized().dot(d2) > .97]
        r_hem = max(Vector((v.x, v.y)).dot(d2) for v in near)
        z_hem = sum(v.z for v in near)/len(near)
    beta = .38
    gain = max(.03, (r_hem + .04 - Vector((top.x, top.y)).dot(d2))/max(.05, top.z - z_hem))
    blade = (Vector((0, 0, -1))*math.cos(beta) + back*math.sin(beta) + n*gain*math.cos(beta)).normalized()
    Zl = -blade
    Xl = (n - Zl*n.dot(Zl)).normalized()
    Yl = Zl.cross(Xl)
    place = frame_matrix(top, Xl, Yl, Zl)
    bmesh.ops.transform(bm, verts=bm.verts, matrix=place)
    sword = new_object('Arma_espada_bainhada', bm, [M['bainha'], M['aco'], M['couro_escuro'], M['latao']],
                       col, 'arma', variant)
    # Presilha de duas tiras: da frente do cinto à boquilha e de trás ao meio da bainha.
    loops = merge([sweep([Vector((0, 0, z0)), Vector((0, 0, z0-.022))],
                         lambda t, z0=z0: scab(-z0/.66, .007), ref=frame_ref) for z0 in (-.075, -.262)])
    bmesh.ops.transform(loops, verts=loops.verts, matrix=place)
    straps = [loops]
    for dd, local in ((-16, Vector((0, -.040, -.086))), (14, Vector((0, .036, -.273)))):
        a, na = belt_point(pts, deg+dd, BELT_Z+.006)
        b = place @ local
        mid = (a+b)/2 + na*.012
        straps.append(sweep([a - na*.002, mid, b], ellipse(.011, .003, 8, .35), ref_fn=lambda q, na=na: na))
    frog = new_object('Arma_espada_presilha', merge(straps), M['couro_escuro'], col, 'arma', variant)
    return [sword, frog]


# ---------------------------------------------------------------- cabelo

def make_hair(body, variant, M, col):
    bvh = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
    rnd = random.Random(11)

    def surface(direction):
        d = direction.normalized()
        hit = bvh.ray_cast(HEAD + d*.6, -d, .7)[0]
        # Abaixo da orelha o raio pode achar ombro/gola: limita ao raio do crânio.
        return min((hit - HEAD).length, .215) if hit else .2

    def sph(az, el):
        az, el = math.radians(az), math.radians(el)
        return Vector((math.sin(az)*math.cos(el), -math.cos(az)*math.cos(el), math.sin(el)))

    # Calota: casca justa ao crânio; nuca baixa para não aparecer a "cuia".
    bm = bmesh.new()
    U, V = 36, 14
    grid = []
    for j in range(V+1):
        el = 90 - j*(90+40)/V
        row = []
        for i in range(U):
            az = 360*i/U
            back = (1-math.cos(math.radians(az)))/2
            limit = 38 - 80*back**1.3
            d = sph(az, max(el, limit) if j < V else limit)
            row.append(bm.verts.new(HEAD + d*(surface(d)+.018)))
        grid.append(row)
    for j in range(V):
        for i in range(U):
            bm.faces.new((grid[j][i], grid[j][(i+1) % U], grid[j+1][(i+1) % U], grid[j+1][i])[::-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=.004)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    cap = new_object(f'Cabelo_{variant}_calota', bm, M['cabelo'], col, 'cabelo', variant, borda=False)
    cap.modifiers.new('suave', 'SUBSURF').levels = 1

    def lock(a0, e0, a1, e1, width, lift, curl, thick=.42, sway=0., twist=0.):
        """Mecha achatada: segue o crânio, ganha volume no meio e solta a ponta."""
        n = 12
        path = []
        for s in range(n):
            t = s/(n-1)
            az = a0 + (a1-a0)*t + sway*math.sin(math.pi*t)
            d = sph(az, e0 + (e1-e0)*t)
            r = surface(d) + .024 + lift*math.sin(math.pi*min(1, t*1.3)) + curl*t**2.5
            path.append(HEAD + d*r)

        def prof(t):
            w = width*(1-t)**.65*(.75+.25*math.sin(math.pi*min(1, t*2))) + .003
            h = w*thick
            c, s = math.cos(twist*t), math.sin(twist*t)
            out = []
            for k in range(8):
                a = math.tau*k/8
                # Seção em gota: costas arredondadas, frente mais plana.
                x, y = math.cos(a)*w, math.sin(a)*h*(1.15 if math.sin(a) > 0 else .7)
                out.append((x*c - y*s, x*s + y*c))
            return out
        bm = sweep(path, prof, fio=True, ref_fn=lambda p: (p - HEAD).normalized())
        return bm

    specs = []
    # Camada de baixo: nuca e laterais longas, cobrindo a borda da calota.
    for a in range(110, 251, 20):
        specs.append((a, 40, a + (a-180)*.15, -48 + abs(a-180)*.12, .085, .012, .02, .38, 0, .3))
    for s in (1, -1):
        for a in (70, 88):
            specs.append((s*a, 50, s*(a+4), -12, .07, .01, .018, .4, 0, .2*s))
    # Camada de cima: do redemoinho da coroa para todos os lados.
    for a in range(120, 241, 24):
        specs.append((a*.95, 82, a + (a-180)*.2, -22 + abs(a-180)*.1, .095, .03, .03, .42, 6*rnd.uniform(-1, 1), .4))
    for s in (1, -1):
        for a in (55, 78, 100):
            specs.append((s*a*.6, 80, s*(a+8), 8 - (a-55)*.25, .085, .028, .03, .42, 0, .35*s))
    # Franja em camadas, jogada para a direita do personagem (-X).
    for a in (-42, -26, -10, 6, 22, 38):
        specs.append((a*.5 + 10, 84, a - 16, 14 - abs(a)*.1, .09, .03, .028, .42, -6, -.3))
    # Mechas de destaque soltas no topo.
    specs += [(-12, 86, -48, 46, .07, .045, .05, .45, 0, -.6), (18, 88, 58, 44, .07, .045, .05, .45, 0, .6),
              (175, 88, 160, 55, .07, .05, .05, .45, 0, .4)]
    bms = []
    for a0, e0, a1, e1, w, lift, curl, thick, sway, twist in specs:
        j = rnd.uniform(.9, 1.12)
        bms.append(lock(a0 + rnd.uniform(-3, 3), e0, a1 + rnd.uniform(-4, 4), e1 + rnd.uniform(-3, 3),
                        w*j, lift, curl, thick, sway, twist))
    locks = new_object(f'Cabelo_{variant}_mechas', merge(bms), M['cabelo'], col, 'cabelo', variant, borda=False)
    locks.modifiers.new('suave', 'SUBSURF').levels = 1
    return [cap, locks]


# ---------------------------------------------------------------- materiais

class Nodes:
    def __init__(self, mat):
        mat.use_nodes = True
        self.nt = mat.node_tree
        self.nt.nodes.clear()
        self.x = -1200

    def new(self, kind, **props):
        n = self.nt.nodes.new(kind)
        n.location = (self.x, 0)
        self.x += 160
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def link(self, a, b):
        self.nt.links.new(a, b)

    def attr(self, name, kind='GEOMETRY'):
        n = self.new('ShaderNodeAttribute', attribute_name=name, attribute_type=kind)
        return n

    def math(self, op, a, b=None, c=None, clamp=False):
        n = self.new('ShaderNodeMath', operation=op, use_clamp=clamp)
        for i, v in enumerate((a, b, c)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                self.link(v, n.inputs[i])
        return n.outputs[0]

    def mix(self, fac, a, b, blend='MIX'):
        n = self.new('ShaderNodeMix', data_type='RGBA', blend_type=blend)
        sock = {s.identifier: s for s in n.inputs}
        for key, v in (('Factor_Float', fac), ('A_Color', a), ('B_Color', b)):
            if isinstance(v, (int, float)):
                sock[key].default_value = v
            elif isinstance(v, tuple):
                sock[key].default_value = v
            else:
                self.link(v, sock[key])
        return next(s for s in n.outputs if s.identifier == 'Result_Color')


def shader(name, base, rough, metal=0., kind='tecido', stitch=None, dark=.78, wear=0.):
    """Tecido, couro, metal ou cabelo, com sombra por vértice, costura e desgaste de borda."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = hexc(base)
    N = Nodes(mat)
    out = N.new('ShaderNodeOutputMaterial')
    bsdf = N.new('ShaderNodeBsdfPrincipled')
    coord = N.new('ShaderNodeTexCoord')
    obj = coord.outputs['Object']
    # Variação de tom em manchas largas (pano tingido à mão, couro curtido).
    noise = N.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 7.
    noise.inputs['Detail'].default_value = 3.
    N.link(obj, noise.inputs['Vector'])
    color = N.mix(noise.outputs['Fac'], hexc(base), tuple(c*dark for c in hexc(base)[:3]) + (1,))
    height = None
    if kind == 'tecido':
        # Trama: fios verticais e horizontais.
        waves = []
        for direction in ('X', 'Z'):
            w = N.new('ShaderNodeTexWave', wave_type='BANDS', bands_direction=direction)
            w.inputs['Scale'].default_value = 260.
            w.inputs['Distortion'].default_value = 1.5
            N.link(obj, w.inputs['Vector'])
            waves.append(w.outputs['Fac'])
        height = N.math('MULTIPLY', waves[0], waves[1])
        color = N.mix(.25, color, N.mix(height, color, (0, 0, 0, 1), 'MULTIPLY'))
    elif kind in ('couro', 'metal'):
        grain = N.new('ShaderNodeTexNoise')
        grain.inputs['Scale'].default_value = 140. if kind == 'couro' else 60.
        grain.inputs['Detail'].default_value = 8.
        N.link(obj, grain.inputs['Vector'])
        height = grain.outputs['Fac']
        if kind == 'metal':
            # Arranhões: ruído esticado.
            mapping = N.new('ShaderNodeMapping')
            mapping.inputs['Scale'].default_value = (1, 1, 18)
            N.link(obj, mapping.inputs['Vector'])
            scr = N.new('ShaderNodeTexNoise')
            scr.inputs['Scale'].default_value = 45.
            N.link(mapping.outputs['Vector'], scr.inputs['Vector'])
            rough_mod = N.math('MULTIPLY_ADD', scr.outputs['Fac'], .14, rough-.06)
            N.link(rough_mod, bsdf.inputs['Roughness'])
    elif kind == 'cabelo':
        fio = N.attr('fio').outputs['Fac']
        root = tuple(c*.45 for c in hexc(base)[:3]) + (1,)
        tip = tuple(min(1, c*1.6) for c in hexc(base)[:3]) + (1,)
        color = N.mix(N.math('POWER', fio, .7), root, tip)
        # Faixa de brilho estilizada no alto da cabeça.
        z = N.new('ShaderNodeSeparateXYZ')
        N.link(obj, z.inputs[0])
        band = N.math('SUBTRACT', 1., N.math('ABSOLUTE', N.math('SUBTRACT', z.outputs['Z'], 2.37)))
        band = N.math('POWER', N.math('MAXIMUM', band, 0.), 120.)
        color = N.mix(N.math('MULTIPLY', band, .55), color, tuple(min(1, c*2.6) for c in hexc(base)[:3]) + (1,), 'SCREEN')
    # Borda gasta: couro e metal clareiam/escurecem perto das bordas e quinas.
    borda = N.attr('borda').outputs['Fac']
    if wear:
        edge = N.math('SUBTRACT', 1., N.math('DIVIDE', borda, .012), clamp=True)
        color = N.mix(N.math('MULTIPLY', edge, wear), color, (1, .92, .8, 1), 'OVERLAY')
    if stitch:
        # Costura tracejada a ~1,5 cm da borda.
        volta = N.attr('volta').outputs['Fac']
        dash = N.math('GREATER_THAN', N.math('FRACT', N.math('DIVIDE', volta, .016)), .45)
        near = N.math('MULTIPLY', N.math('GREATER_THAN', borda, .011), N.math('LESS_THAN', borda, .017))
        mask = N.math('MULTIPLY', dash, near)
        color = N.mix(mask, color, hexc(stitch))
        height = N.math('ADD', height, N.math('MULTIPLY', mask, .6)) if height else mask
    # Sombra de contato por vértice.
    ao = N.new('ShaderNodeVertexColor', layer_name='sombra')
    color = N.mix(1., color, ao.outputs['Color'], 'MULTIPLY')
    N.link(color, bsdf.inputs['Base Color'])
    if kind != 'metal':
        bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if height is not None:
        bump = N.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = {'cabelo': .1, 'metal': .04}.get(kind, .25)
        bump.inputs['Distance'].default_value = .002
        N.link(height, bump.inputs['Height'])
        N.link(bump.outputs['Normal'], bsdf.inputs['Normal'])
    N.link(bsdf.outputs[0], out.inputs['Surface'])
    return mat


def materials():
    return {
        'tunica': shader('Tunica_Azul', '#3d5675', .9, stitch='#c9b48a'),
        'manto': shader('Manto_Roxo', '#3e2d4f', .92, stitch='#8a7aa0'),
        'manto_escuro': shader('Manto_Roxo_Escuro', '#271d33', .9, stitch='#a89a7a'),
        'faixa': shader('Faixa_Osso', '#cfc4a6', .85),
        'couro': shader('Couro', '#7a4c2a', .55, kind='couro', stitch='#d8c39a', wear=.6),
        'couro_escuro': shader('Couro_Escuro', '#4a2f1c', .6, kind='couro', stitch='#b59a6e', wear=.5),
        'calca': shader('Calca_Lona', '#55473a', .95, dark=.82),
        'bota': shader('Bota_Couro', '#3d2b22', .5, kind='couro', stitch='#a88a62', wear=.6),
        'sola': shader('Sola', '#1d1612', .8, kind='couro'),
        'metal': shader('Metal_Gasto', '#8a949e', .4, .9, kind='metal', wear=.8),
        'aco': shader('Aco_Escurecido', '#7a838d', .32, .95, kind='metal', wear=1.),
        'latao': shader('Latao', '#c0913e', .35, .9, kind='metal', wear=.7),
        'cabelo': shader('Cabelo_Castanho', '#4a2c1a', .62, kind='cabelo'),
        'bainha': shader('Bainha', '#3e2618', .5, kind='couro', stitch='#a88a62', wear=.5),
    }


# ---------------------------------------------------------------- sombra por vértice

def bake_contact_shadow(objs, body):
    """Oclusão aproximada por raios (6 direções) contra a própria peça e o corpo."""
    dg = bpy.context.evaluated_depsgraph_get()
    body_bvh = BVHTree.FromObject(body, dg)
    dirs = [Vector(d).normalized() for d in ((0, 0, 1), (1, 0, .5), (-1, 0, .5), (0, 1, .5), (0, -1, .5),
                                              (.7, .7, -.2), (-.7, .7, -.2), (.7, -.7, -.2), (-.7, -.7, -.2))]
    for o in objs:
        me = o.data
        own = BVHTree.FromPolygons([v.co for v in me.vertices], [p.vertices[:] for p in me.polygons])
        attr = me.color_attributes.get('sombra') or me.color_attributes.new('sombra', 'FLOAT_COLOR', 'POINT')
        for v in me.vertices:
            n = v.normal
            hits, total = 0., 0.
            for d in dirs:
                # Hemisfério em torno da normal.
                w = n.dot(d)
                if w <= .05:
                    d = (d - n*2*n.dot(d)).normalized()
                    w = n.dot(d)
                origin = v.co + n*.004
                for bvh in (own, body_bvh):
                    hit = bvh.ray_cast(origin, d, .09)
                    if hit[0] is not None:
                        hits += w*(1 - hit[3]/.09)
                        break
                total += w
            occ = min(1., hits/max(total, 1e-6))
            s = 1 - .65*occ
            attr.data[v.index].color = (s, s, s, 1)
        me.color_attributes.active_color = attr


# ---------------------------------------------------------------- montagem

def review_lighting():
    col = collection('Revisao_Luz')
    world = bpy.data.worlds.new('Revisao')
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (.18, .19, .22, 1)
    bg.inputs['Strength'].default_value = .9
    bpy.context.scene.world = world
    for name, energy, rot, color in (('Chave', 3.5, (50, 0, -35), (1, .95, .88)),
                                     ('Recorte', 2.5, (60, 0, 150), (.75, .85, 1.)),
                                     ('Preenchimento', 1.0, (75, 0, 60), (1, 1, 1))):
        light = bpy.data.lights.new(name, 'SUN')
        light.energy = energy
        light.color = color
        o = bpy.data.objects.new(name, light)
        o.rotation_euler = [math.radians(a) for a in rot]
        col.objects.link(o)


def equip(look):
    """Mostra uma variante por slot, como faria a troca de visual ao equipar loot."""
    chosen = LOOKS[look]
    for o in bpy.data.objects:
        slot = o.get('slot')
        if slot is None or slot == 'corpo':
            continue
        visible = chosen.get(slot) == o.get('variante')
        o.hide_viewport = o.hide_render = not visible


def build(look='aventureiro'):
    reset()
    body = import_body()
    corpo = collection('Corpo')
    for c in body.users_collection:
        c.objects.unlink(body)
    corpo.objects.link(body)
    pts = [v.co.copy() for v in body.data.vertices]
    M = materials()

    def slot(name):
        return collection(f'Slot_{name}')

    for v in ('tunica', 'manto'):
        make_torso(pts, v, M, slot('torso'))
    make_legs(pts, 'calca', M, slot('pernas'))
    for v in ('botas_curtas', 'botas_altas'):
        make_feet(pts, v, M, slot('pes'))
    make_bracers(pts, 'bracadeiras', M, slot('bracos'))
    make_waist(pts, 'cinto', M, slot('cintura'), 'tunica')
    make_waist(pts, 'faixa', M, slot('cintura'), 'manto')
    make_pauldron(pts, 'ombreira', M, slot('ombro'))
    make_sword(pts, 'espada', M, slot('arma'))
    make_hair(body, 'repicado', M, slot('cabelo'))

    parts = [o for o in bpy.data.objects if o != body and o.get('slot')]
    bake_contact_shadow(parts, body)
    for o in parts:
        o.parent = body
    review_lighting()
    equip(look)
    return body


if __name__ == '__main__':
    build()
    OUT_BLEND.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND), copy=bpy.app.background)
    print('Salvo', OUT_BLEND)
