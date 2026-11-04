# Kit de construção de mapas da v2: água, relevo, acampamento, ruínas, natureza e povoado.
# Reaproveita Piece/material de v2_village_kit.py. Cada peça é `kit_<nome>` com origem na base e medidas iguais às de
# `PROPS` em v2/scripts/map-model.mjs (o editor escala em relação a elas). O eixo X da peça é o comprimento (largura no jogo).
# As pontes seguem o arco de `groundAt` em v2/scripts/map-terrain.mjs: altura .55 * (1 - |2u - 1|^3) ao longo do comprimento.
#
# Uso (raiz do projeto):
#   blender --background --python blender/scripts/v2_map_kit.py
import bpy, bmesh, math, sys, importlib
from pathlib import Path
from mathutils import Vector, Matrix

HERE = Path(__file__).resolve().parent
BASE = HERE.parents[0]
sys.path.insert(0, str(HERE))
vk = importlib.reload(sys.modules['v2_village_kit']) if 'v2_village_kit' in sys.modules else importlib.import_module('v2_village_kit')
OUT_BLEND = BASE / 'models' / 'v2_map_kit.blend'
OUT_GLB = BASE / 'exports' / 'v2_map_kit.glb'
DECK = .55

# Prismas e cascas de lados diferentes: normais refeitas para fora em todas as peças antes de fechar a malha.
_finish = vk.Piece.finish
def finish_outward(self, *args, **kwargs):
    bmesh.ops.recalc_face_normals(self.bm, faces=list(self.bm.faces))
    return _finish(self, *args, **kwargs)
vk.Piece.finish = finish_outward

vk.PALETTE.update({
    'plank': ('#8a6a45', .9, None), 'beam': ('#5d4530', .92, None), 'rock': ('#77776f', .98, None), 'rock_dark': ('#55544f', .98, None),
    'moss': ('#55703d', .95, None), 'canvas': ('#b7a57f', .95, None), 'cloth_red': ('#8f3a30', .9, None), 'reed': ('#7a9148', .9, None),
    'reed_tip': ('#5c432a', .9, None), 'lily': ('#3f8a4f', .7, None), 'petal_pink': ('#e9b7c8', .8, None), 'ash': ('#2e2a27', 1, None),
    'hay': ('#c4a44e', 1, None), 'marble': ('#a9a595', .9, None), 'obsidian': ('#3f3b4d', .55, None), 'rune': ('#9ad8ff', .4, ('#7ac8ff', 2.4)),
    'bark_dead': ('#54463a', .98, None), 'fern': ('#4f8a3f', .9, None), 'cap': ('#b8574a', .8, None), 'stalk': ('#d8cfb4', .9, None),
    'ember': ('#ff9a3a', .5, ('#ff8a2a', 3)),
})

def arc(u): return DECK * (1 - abs(2 * u - 1) ** 3)

def blob(p, m, center, r, squash=.85, rough=.12):
    """Icosfera irregular: pedra ou folhagem."""
    res = bmesh.ops.create_icosphere(p.bm, subdivisions=1, radius=r)
    verts = res['verts']; c = Vector(center)
    for v in verts:
        v.co *= 1 + p.rng.uniform(-rough, rough); v.co.z *= squash; v.co += c
    p._faces({f for v in verts for f in v.link_faces}, m); return verts

def lean(verts, base, ax=0, ay=0, yaw=0):
    mat = Matrix.Rotation(yaw, 4, 'Z') @ Matrix.Rotation(ay, 4, 'Y') @ Matrix.Rotation(ax, 4, 'X'); b = Vector(base)
    for v in verts: v.co = mat @ (v.co - b) + b

def bridge():
    # 10 x 3,2: tábuas em arco, guardas e estacas até o leito.
    p = vk.Piece('bridge'); W, D = 10, 3.2; n = 22
    for i in range(n):
        u0, u1 = i / n, (i + 1) / n; x0, x1 = -W / 2 + u0 * W, -W / 2 + u1 * W; z = arc((u0 + u1) / 2)
        slope = math.atan2(arc(u1) - arc(u0), x1 - x0); j = p.rng.uniform(-.06, .06)
        p.box('plank', (x0 + .02, -D / 2 + j, z - .09), (x1 - .02, D / 2 + j, z), rot=(0, -slope, 0))
    for side in (-1, 1):
        for i in range(n // 2):
            u0, u1 = i / (n // 2), (i + 1) / (n // 2); a = (-W / 2 + u0 * W, side * (D / 2 - .12), arc(u0) + .78); b = (-W / 2 + u1 * W, side * (D / 2 - .12), arc(u1) + .78)
            p.beam('beam', a, b, (.09, .09))
        for k in range(7):
            u = k / 6; x = -W / 2 + u * W * .98 + .1; p.box('beam', (x - .06, side * (D / 2 - .12) - .06, arc(u) - .1), (x + .06, side * (D / 2 - .12) + .06, arc(u) + .82))
        for u in (.22, .5, .78):
            x = -W / 2 + u * W; p.cylinder('beam', (x, side * (D / 2 - .3), -1.6), .13, 1.6 + arc(u), seg=7)
    return p.finish(bevel=.008)

def stone_bridge():
    # 12 x 4: arco de alvenaria com mureta; o tabuleiro segue o mesmo arco.
    p = vk.Piece('stone_bridge'); W, D = 12, 4; n = 24
    top = [(-W / 2 + i / n * W, arc(i / n)) for i in range(n + 1)]
    under = [(-W / 2 + i / n * W, -1.7 + 1.5 * math.sin(math.pi * i / n)) for i in range(n, -1, -1)]
    p.prism('stone', top + under, -D / 2 + .3, D / 2 - .3)
    for i in range(n):
        u0, u1 = i / n, (i + 1) / n; x0, x1 = -W / 2 + u0 * W, -W / 2 + u1 * W
        for side in (-1, 1):
            poly = [(x0 + .03, arc(u0) - .05), (x1 - .03, arc(u1) - .05), (x1 - .03, arc(u1) + .7), (x0 + .03, arc(u0) + .7)]
            y = side * (D / 2 - .15); p.prism('marble' if i % 4 == 0 else 'stone', poly, y - .15, y + .15)
    return p.finish(bevel=.01)

def dock():
    # 7 x 2,6: píer plano apoiado em estacas, na mesma cota do alto das pontes.
    p = vk.Piece('dock'); W, D = 7, 2.6; n = 16
    for i in range(n):
        x0 = -W / 2 + i / n * W; x1 = x0 + W / n; j = p.rng.uniform(-.05, .05)
        p.box('plank', (x0 + .02, -D / 2 + j, DECK - .09), (x1 - .02, D / 2 + j, DECK))
    for x in (-3.3, -1.1, 1.1, 3.3):
        for y in (-1.15, 1.15): p.cylinder('beam', (x, y, -1.6), .13, 2.5, seg=7)
    return p.finish(bevel=.008)

def reeds():
    p = vk.Piece('reeds')
    for i in range(16):
        a = p.rng.uniform(0, math.tau); d = p.rng.uniform(0, .6); x, y = math.cos(a) * d, math.sin(a) * d; h = p.rng.uniform(.8, 1.4)
        v = p.cylinder('reed', (x, y, -.4), .025, h + .4, seg=4, r2=.012); lean(v, (x, y, 0), ay=p.rng.uniform(-.14, .14), yaw=a)
        if i % 3 == 0:
            c = p.cylinder('reed_tip', (x, y, h - .05), .045, .22, seg=5); lean(c, (x, y, 0), ay=p.rng.uniform(-.14, .14), yaw=a)
    return p.finish(bevel=0)

def lily():
    p = vk.Piece('lily')
    for i in range(6):
        a = i / 6 * math.tau + p.rng.uniform(-.3, .3); d = p.rng.uniform(.25, .85); r = p.rng.uniform(.16, .3)
        p.cylinder('lily', (math.cos(a) * d, math.sin(a) * d, .0), r, .02, seg=9)
        if i % 2 == 0: blob(p, 'petal_pink', (math.cos(a) * d, math.sin(a) * d, .06), .08, .8)
    return p.finish(bevel=0)

def stepping():
    p = vk.Piece('stepping')
    for i, (x, y) in enumerate(((-.9, -.2), (-.25, .28), (.4, -.1), (1, .25))):
        v = blob(p, 'rock', (x, y, 0), .34, .35); [setattr(q.co, 'z', max(q.co.z, -.6)) for q in v]
    return p.finish(bevel=0)

def shore_rock():
    p = vk.Piece('shore_rock')
    blob(p, 'rock', (0, 0, .25), .78, .6); blob(p, 'rock_dark', (.35, .2, .1), .4, .55); blob(p, 'moss', (-.1, -.1, .62), .34, .25)
    return p.finish(bevel=0)

def cliff():
    # Raio 2, altura 3,6: paredão de faces largas.
    p = vk.Piece('cliff')
    for i, (x, y, r, z) in enumerate(((0, 0, 1.75, 1.3), (.9, .6, 1.1, .7), (-1, .4, 1.15, .75), (.2, -1, 1.05, .7), (-.2, .1, 1.05, 2.5))):
        v = blob(p, 'rock' if i % 2 == 0 else 'rock_dark', (x, y, z), r, 1.05, .16)
    blob(p, 'moss', (-.3, 0, 3.25), .7, .28)
    return p.finish(bevel=0)

def boulder():
    p = vk.Piece('boulder')
    blob(p, 'rock', (0, 0, .62), 1.02, .72, .18); blob(p, 'rock_dark', (.6, -.3, .25), .45, .7); blob(p, 'moss', (-.2, .2, 1.18), .42, .25)
    return p.finish(bevel=0)

def cairn():
    p = vk.Piece('cairn')
    for r, z in ((.46, .12), (.36, .34), (.26, .52), (.17, .68), (.1, .82)): blob(p, 'rock', (p.rng.uniform(-.04, .04), p.rng.uniform(-.04, .04), z), r, .5)
    return p.finish(bevel=0)

def tent():
    # Raio 1,6, altura 2,2: lona em dois panos com abertura voltada para a câmera.
    p = vk.Piece('tent')
    p.prism('canvas', [(-1.5, 0), (1.5, 0), (0, 2.1)], -1.5, 1.5)
    p.prism('cloth_red', [(-.45, 0), (.45, 0), (0, 1.15)], 1.5, 1.52)
    p.cylinder('beam', (0, 1.45, 0), .05, 2.2, seg=6); p.cylinder('beam', (0, -1.45, 0), .05, 2.2, seg=6)
    return p.finish(bevel=.006)

def campfire():
    p = vk.Piece('campfire')
    for i in range(9):
        a = i / 9 * math.tau; blob(p, 'rock', (math.cos(a) * .46, math.sin(a) * .46, .06), .11, .7)
    p.cylinder('ash', (0, 0, 0), .38, .03, seg=10)
    for i in range(3):
        v = p.cylinder('beam', (0, 0, .03), .05, .62, seg=5, r2=.03); lean(v, (0, 0, .03), ay=.75, yaw=i * 2.1)
    for r, h, x in ((.17, .5, 0), (.1, .32, .1), (.09, .28, -.11)):
        p.cylinder('ember', (x, 0, .04), r, h, seg=6, r2=.005)
    return p.finish(bevel=0)

def palisade():
    # 4 x 0,5 x 2,4: troncos apontados e travessa interna.
    p = vk.Piece('palisade'); n = 11
    for i in range(n):
        x = -2 + (i + .5) * 4 / n; h = p.rng.uniform(2.1, 2.35); r = p.rng.uniform(.15, .19)
        p.cylinder('beam', (x, 0, 0), r, h, seg=6); p.cylinder('plank', (x, 0, h), r, .22, seg=6, r2=.015)
    p.box('plank', (-2, -.26, 1.5), (2, -.17, 1.68))
    return p.finish(bevel=0)

def watchtower():
    # Raio 1,4, altura 6: quatro pernas, plataforma e guarda-corpo com teto.
    p = vk.Piece('watchtower'); R = 1.1
    for sx in (-1, 1):
        for sy in (-1, 1):
            a = (sx * R, sy * R, 0); b = (sx * .8, sy * .8, 3.8)
            v = p.cylinder('beam', a, .12, math.dist(a, b), seg=6); d = Vector(b) - Vector(a); lean(v, a, ax=math.atan2(-d.y, d.z), ay=math.atan2(d.x, d.z))
    for z in (1.4, 2.7):
        k = R - (R - .8) * z / 3.8
        for s in (-1, 1):
            p.box('plank', (-k, s * k - .05, z), (k, s * k + .05, z + .14)); p.box('plank', (s * k - .05, -k, z), (s * k + .05, k, z + .14))
    p.box('plank', (-1.25, -1.25, 3.75), (1.25, 1.25, 3.9))
    for s in (-1, 1):
        p.box('plank', (-1.25, s * 1.2 - .05, 4.3), (1.25, s * 1.2 + .05, 4.48)); p.box('plank', (s * 1.2 - .05, -1.25, 4.3), (s * 1.2 + .05, 1.25, 4.48))
    for sx in (-1, 1):
        for sy in (-1, 1): p.box('beam', (sx * 1.15 - .05, sy * 1.15 - .05, 3.85), (sx * 1.15 + .05, sy * 1.15 + .05, 5.2))
    r = bmesh.ops.create_cone(p.bm, cap_ends=True, segments=4, radius1=1.95, radius2=.05, depth=.9, matrix=Matrix.Translation((0, 0, 5.55)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
    p._faces({f for v in r['verts'] for f in v.link_faces}, 'canvas')
    return p.finish(bevel=0)

def hay():
    p = vk.Piece('hay')
    v = p.cylinder('hay', (0, -.55, .5), .5, 1.1, seg=10); lean(v, (0, -.55, .5), ax=-math.pi / 2)
    for y in (-.25, .25):
        c = p.cylinder('rope', (0, y - .02, .5), .515, .04, seg=10); lean(c, (0, y, .5), ax=-math.pi / 2)
    return p.finish(bevel=0)

def log_pile():
    # 3 x 1,4 x 1,2: toras empilhadas, alinhadas ao comprimento.
    p = vk.Piece('log_pile')
    for row, (count, z) in enumerate(((3, .22), (2, .6), (1, .98))):
        for i in range(count):
            y = (i - (count - 1) / 2) * .46; v = p.cylinder('beam', (-1.5, y, z), .23, 3, seg=7); lean(v, (-1.5, y, z), ay=math.pi / 2)
            e = p.cylinder('plank', (1.5, y, z), .17, .02, seg=7); lean(e, (1.5, y, z), ay=math.pi / 2)
    return p.finish(bevel=0)

def fence():
    # 3 x 0,2 x 1: dois postes e duas travessas, para fileiras contínuas.
    p = vk.Piece('fence')
    for x in (-1.4, 1.4): p.box('beam', (x - .08, -.08, 0), (x + .08, .08, 1))
    for z in (.42, .78): p.box('plank', (-1.5, -.04, z), (1.5, .04, z + .1))
    return p.finish(bevel=.006)

def stone_wall():
    # 4 x 0,8 x 1,6: fiadas de pedra, topo gasto.
    p = vk.Piece('stone_wall'); rows = 5; h = 1.6 / rows
    for r in range(rows):
        x = -2 + (r % 2) * .35
        while x < 2:
            w = min(p.rng.uniform(.55, .95), 2 - x); top = (r + 1) * h - (p.rng.uniform(0, .18) if r == rows - 1 else 0)
            p.box('stone' if p.rng.random() < .7 else 'rock_dark', (x + .015, -.4 + p.rng.uniform(0, .04), r * h), (x + w - .015, .4 - p.rng.uniform(0, .04), top)); x += w
        if r % 2: p.box('stone', (-2, -.38, r * h), (-1.65, .38, (r + 1) * h))
    return p.finish(bevel=.01)

def arch():
    # Arco de passagem, sem colisão no vão: pilares de 2,2 de vão e 3,6 de altura.
    p = vk.Piece('arch'); W = 1.5; n = 10
    for s in (-1, 1): p.box('marble', (s * W - .35, -.4, 0), (s * W + .35, .4, 2.4))
    for i in range(n):
        a0, a1 = math.pi * i / n, math.pi * (i + 1) / n; ri, ro = W - .3, W + .35
        poly = [(math.cos(a0) * ri, 2.4 + math.sin(a0) * ri), (math.cos(a0) * ro, 2.4 + math.sin(a0) * ro), (math.cos(a1) * ro, 2.4 + math.sin(a1) * ro), (math.cos(a1) * ri, 2.4 + math.sin(a1) * ri)]
        p.prism('marble' if i % 2 else 'stone', poly[::-1], -.38, .38)
    return p.finish(bevel=.012)

def broken_column():
    p = vk.Piece('broken_column')
    p.cylinder('marble', (0, 0, 0), .68, .26, seg=10); p.cylinder('marble', (0, 0, .26), .46, 1.5, seg=10, r2=.42)
    v = p.cylinder('marble', (0, 0, 1.76), .42, .1, seg=10); [setattr(q.co, 'z', q.co.z + p.rng.uniform(-.1, .1)) for q in v]
    blob(p, 'marble', (.9, .3, .16), .24, .7); blob(p, 'moss', (-.3, .2, .36), .3, .3)
    return p.finish(bevel=.01)

def statue():
    # Figura velada em pedestal: silhueta simples, altura 3,4.
    p = vk.Piece('statue')
    p.box('stone', (-.75, -.75, 0), (.75, .75, .5)); p.box('marble', (-.6, -.6, .5), (.6, .6, .7))
    p.cylinder('marble', (0, 0, .7), .52, 1.75, seg=10, r2=.3); blob(p, 'marble', (0, 0, 2.62), .3, 1.1); p.cylinder('marble', (0, 0, 2.3), .36, .85, seg=10, r2=.08)
    for s in (-1, 1):
        v = p.cylinder('marble', (s * .28, 0, 1.95), .1, .75, seg=6, r2=.07); lean(v, (s * .28, 0, 1.95), ay=s * 2.5)
    return p.finish(bevel=.008)

def obelisk():
    # Altura 4,4: agulha escura com runas acesas, marco legível à distância.
    p = vk.Piece('obelisk')
    p.box('stone', (-.7, -.7, 0), (.7, .7, .35))
    r = bmesh.ops.create_cone(p.bm, cap_ends=True, segments=4, radius1=.62, radius2=.3, depth=3.5, matrix=Matrix.Translation((0, 0, 2.1)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
    p._faces({f for v in r['verts'] for f in v.link_faces}, 'obsidian')
    t = bmesh.ops.create_cone(p.bm, cap_ends=True, segments=4, radius1=.3, radius2=.01, depth=.55, matrix=Matrix.Translation((0, 0, 4.12)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
    p._faces({f for v in t['verts'] for f in v.link_faces}, 'obsidian')
    for z in (1, 1.55, 2.1, 2.65, 3.2):
        k = .44 - (z - .35) * .05; j = p.rng.uniform(-.06, .06)
        for s in (-1, 1): p.box('rune', (-.09 + j, s * k - .01, z), (.09 + j, s * k + .01, z + .24)); p.box('rune', (s * k - .01, -.09 - j, z + .1), (s * k + .01, .09 - j, z + .32))
    return p.finish(bevel=0)

def grave_cross():
    p = vk.Piece('grave_cross')
    p.box('stone', (-.28, -.2, 0), (.28, .2, .14)); p.box('marble', (-.08, -.07, .14), (.08, .07, 1.1)); p.box('marble', (-.34, -.07, .68), (.34, .07, .84))
    return p.finish(bevel=.006)

def dead_tree():
    # Altura 4,5: tronco nu com galhos partidos.
    p = vk.Piece('dead_tree')
    p.cylinder('bark_dead', (0, 0, 0), .34, 3, seg=7, r2=.13)
    for i in range(4):
        a = i * 1.7 + .3; v = p.cylinder('bark_dead', (0, 0, 0), .1, .7, seg=5, r2=.02); lean(v, (0, 0, 0), ay=1.2, yaw=a)
    for a, ay, z, l in ((.5, .7, 1.9, 1.6), (2.5, .85, 2.3, 1.4), (4.2, .6, 2.7, 1.5), (5.4, .4, 2.9, 1.5)):
        v = p.cylinder('bark_dead', (0, 0, z), .09, l, seg=5, r2=.015); lean(v, (0, 0, z), ay=ay, yaw=a)
    return p.finish(bevel=0)

def fern():
    p = vk.Piece('fern'); faces = []
    for i in range(9):
        a = i / 9 * math.tau + p.rng.uniform(-.2, .2); L = p.rng.uniform(.55, .85); d = Vector((math.cos(a), math.sin(a), 0)); side = Vector((-d.y, d.x, 0)); pts = []
        for s in range(5):
            t = s / 4; c = d * L * t + Vector((0, 0, .5 * math.sin(t * 2.2))); w = .09 * math.sin(math.pi * min(.96, t + .12))
            pts.append((p.bm.verts.new(c - side * w), p.bm.verts.new(c + side * w)))
        for s in range(4): faces.append(p.bm.faces.new((pts[s][0], pts[s][1], pts[s + 1][1], pts[s + 1][0])))
    p._faces(faces, 'fern')
    o = p.finish(bevel=0)
    for m in o.data.materials: m.use_backface_culling = False
    return o

def mushrooms():
    p = vk.Piece('mushrooms')
    for x, y, h, r in ((0, 0, .3, .16), (.2, .1, .2, .11), (-.16, .12, .17, .09), (.05, -.2, .24, .13)):
        p.cylinder('stalk', (x, y, 0), .04, h, seg=6)
        v = blob(p, 'cap', (x, y, h), r, .6); [setattr(q.co, 'z', max(q.co.z, h - .01)) for q in v]
    return p.finish(bevel=0)

def signpost():
    p = vk.Piece('signpost')
    p.cylinder('beam', (0, 0, 0), .08, 2, seg=6, r2=.065)
    p.prism('plank', [(-.5, 1.42), (.55, 1.42), (.72, 1.57), (.55, 1.72), (-.5, 1.72)], -.04, .04)
    p.prism('plank', [(.5, 1), (-.45, 1), (-.62, 1.13), (-.45, 1.27), (.5, 1.27)], -.04, .04)
    return p.finish(bevel=.005)

def market_stall():
    # 3 x 2 x 2,4: balcão, quatro postes e toldo listrado.
    p = vk.Piece('market_stall')
    for sx in (-1, 1):
        for sy in (-1, 1): p.box('beam', (sx * 1.4 - .06, sy * .9 - .06, 0), (sx * 1.4 + .06, sy * .9 + .06, 2.1))
    p.box('plank', (-1.45, .2, .75), (1.45, 1, .85)); p.box('beam', (-1.4, .3, 0), (1.4, .9, .75))
    n = 8
    for i in range(n):
        x0 = -1.6 + i * 3.2 / n; x1 = x0 + 3.2 / n
        verts = p.box('cloth_red' if i % 2 else 'canvas', (x0, -1.15, 2.05), (x1, 1.15, 2.1)); lean(verts, (0, 0, 2.2), ax=.18)
    for x in (-1, -.4, .3, .95): blob(p, 'cap' if x < 0 else 'hay', (x, .6, .95), .12, .9)
    return p.finish(bevel=.005)

def bench():
    p = vk.Piece('bench')
    p.box('plank', (-.7, -.17, .36), (.7, .17, .43))
    for x in (-.55, .55): p.box('beam', (x - .05, -.15, 0), (x + .05, .15, .36))
    return p.finish(bevel=.006)

BUILDERS = [bridge, stone_bridge, dock, reeds, lily, stepping, shore_rock, cliff, boulder, cairn, tent, campfire, palisade, watchtower, hay, log_pile, fence, stone_wall, arch, broken_column, statue, obelisk, grave_cross, dead_tree, fern, mushrooms, signpost, market_stall, bench]
NAMES = {'kit_' + fn.__name__ for fn in BUILDERS}

def clear():
    for o in list(bpy.data.objects):
        if o.name in NAMES: bpy.data.objects.remove(o, do_unlink=True)
    for d in list(bpy.data.meshes):
        if d.name in NAMES and d.users == 0: bpy.data.meshes.remove(d)

def build():
    clear(); objs = []
    for i, fn in enumerate(BUILDERS):
        o = fn(); o.location = ((i % 6) * 14.0, 30 + (i // 6) * 12.0, 0); objs.append(o)
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
    print('V2_MAP_KIT_OK', len(objs), sum(len(o.data.polygons) for o in objs))
