# Kit do forte e da gruta da Várzea de Itaúna: muralhas, torres, portaria, grade, torre de menagem, boca de caverna e ninhos.
# Reaproveita Piece e materiais de v2_village_kit.py/v2_map_kit.py. Cada peça é `kit_<nome>` com origem na base e medidas iguais
# às de `PROPS` em v2/scripts/map-model.mjs. O eixo X é a largura; a frente fica em -Y do Blender, que é +Z no jogo (voltada à câmera).
#
# Uso (raiz do projeto):
#   blender --background --python blender/scripts/v2_fort_kit.py
import bpy, bmesh, math, sys, importlib
from pathlib import Path
from mathutils import Vector, Matrix

HERE = Path(__file__).resolve().parent
BASE = HERE.parents[0]
sys.path.insert(0, str(HERE))
mk = importlib.reload(sys.modules['v2_map_kit']) if 'v2_map_kit' in sys.modules else importlib.import_module('v2_map_kit')
vk = mk.vk
OUT_BLEND = BASE / 'models' / 'v2_fort_kit.blend'
OUT_GLB = BASE / 'exports' / 'v2_fort_kit.glb'

vk.PALETTE.update({
    'fort_stone': ('#85827a', .96, None), 'fort_stone_b': ('#6f6d66', .97, None), 'fort_trim': ('#a09c90', .94, None), 'fort_dark': ('#2b2a28', 1, None),
    'fort_iron': ('#3a3c40', .55, None), 'fort_slate': ('#4c5560', .85, None), 'fort_wood': ('#5a4029', .9, None), 'fort_banner': ('#7d2a26', .9, None),
    'fort_moss': ('#4f6638', .98, None), 'fort_straw': ('#b89c54', 1, None), 'fort_steel': ('#9aa0a6', .4, None),
    'cave_void': ('#050506', 1, None), 'cave_rock': ('#6c6a62', .98, None), 'cave_rock_b': ('#55534d', .98, None), 'cave_moss': ('#4c6236', .98, None),
    'web_silk': ('#e2dfd4', .85, None), 'sac_silk': ('#d8d0ac', .8, None), 'sac_glow': ('#b8d68a', .5, ('#a6d46a', 1.1)), 'bone_old': ('#d8ceb0', .9, None),
})

def wall_courses(p, x0, x1, y0, y1, z0, z1, rows, jitter=.05):
    """Fiadas de pedra desencontradas, com um pouco de relevo para não parecer um bloco liso."""
    h = (z1 - z0) / rows
    for r in range(rows):
        x = x0 - (r % 2) * .55
        while x < x1:
            w = p.rng.uniform(1.1, 1.8); a = max(x, x0); b = min(x + w, x1)
            if b - a > .05:
                j = p.rng.uniform(0, jitter)
                p.box('fort_stone' if p.rng.random() < .68 else 'fort_stone_b', (a + .015, y0 - j, z0 + r * h), (b - .015, y1 + j, z0 + (r + 1) * h - .012))
            x += w

def merlons(p, x0, x1, y, z, thick=.42, h=.72, m='fort_stone', step=1.5):
    n = max(1, round((x1 - x0) / step)); s = (x1 - x0) / n
    for i in range(n):
        c = x0 + (i + .5) * s
        p.box(m, (c - s * .3, y - thick / 2, z), (c + s * .3, y + thick / 2, z + h))

def fort_wall():
    # 6 x 1,4 x 5: emenda limpa em X para fileiras contínuas. Ameias nas duas faces e caminho de ronda.
    p = vk.Piece('fort_wall'); W, D, H = 6, 1.4, 5
    p.box('fort_stone_b', (-W / 2, -D / 2 + .06, 0), (W / 2, D / 2 - .06, H - .72))
    wall_courses(p, -W / 2, W / 2, -D / 2, -D / 2 + .1, 0, H - .72, 6)
    wall_courses(p, -W / 2, W / 2, D / 2 - .1, D / 2, 0, H - .72, 4)
    p.box('fort_trim', (-W / 2, -D / 2 - .1, H - 1.0), (W / 2, -D / 2 + .1, H - .78))
    merlons(p, -W / 2, W / 2, -D / 2 + .2, H - .78)
    merlons(p, -W / 2, W / 2, D / 2 - .2, H - .78, h=.5)
    for x in (-2.3, .6, 2.4):
        v = mk.blob(p, 'fort_moss', (x, -D / 2 - .03, p.rng.uniform(.1, .32)), p.rng.uniform(.3, .46), squash=.55, rough=.2)
    return p.finish(bevel=0)

def fort_tower():
    # Raio 3, altura 9: base em talude, seteiras, cinta e ameias em volta.
    p = vk.Piece('fort_tower'); R = 3.0; H = 8.1; seg = 14
    p.cylinder('fort_stone_b', (0, 0, 0), R * 1.1, 1.3, seg=seg, r2=R * .96)
    p.cylinder('fort_stone', (0, 0, 1.3), R * .96, H - 2.1, seg=seg, r2=R * .92)
    for z in (2.6, 4.1, 5.6):
        p.cylinder('fort_stone_b', (0, 0, z), R * .955 - (z - 1.3) * .006, .11, seg=seg)
    p.cylinder('fort_trim', (0, 0, H - .8), R * .94, .5, seg=seg, r2=R * 1.08)
    p.cylinder('fort_stone', (0, 0, H - .3), R * 1.08, .32, seg=seg)
    for i in range(10):
        a = 2 * math.pi * (i + .5) / 10; c, s = math.cos(a), math.sin(a); r = R * 1.0
        v = p.box('fort_stone', (-.42, -.2, 0), (.42, .2, .9))
        mat = Matrix.Translation((c * r, s * r, H)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z')
        for q in v: q.co = mat @ q.co
    for a, z in ((-.6, 3.3), (-1.57, 4.9), (-2.5, 3.3), (-1.0, 6.2), (-2.1, 6.2)):
        c, s = math.cos(a), math.sin(a); r = R * .94
        v = p.box('fort_dark', (-.11, -.08, -.55), (.11, .08, .55))
        mat = Matrix.Translation((c * r, s * r, z)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z')
        for q in v: q.co = mat @ q.co
    p.cylinder('fort_slate', (0, 0, H - .1), R * .7, 2.2, seg=8, r2=.06)
    return p.finish(bevel=0)

def fort_gatehouse():
    # 12 x 4 x 8: duas torres quadradas e o arco do vão de 4,8 x 4,4. O vão fica livre; muralhas encostam nas torres.
    p = vk.Piece('fort_gatehouse'); W = 12; D = 4; H = 7.2; G = 2.4; A = 4.4
    for s in (-1, 1):
        x0, x1 = sorted((s * G, s * W / 2))
        p.box('fort_stone_b', (x0 + .05, -D / 2 + .06, 0), (x1 - .05, D / 2 - .06, H))
        wall_courses(p, x0, x1, -D / 2, -D / 2 + .1, 0, H, 9)
        wall_courses(p, x0, x1, D / 2 - .1, D / 2, 0, H, 7)
        for y in (-1, 1):
            p.box('fort_stone_b', (x0 - .02, y * D / 2 - .12, 0), (x1 + .02, y * D / 2 + .12, .55))
        merlons(p, x0, x1, -D / 2 + .2, H, thick=.5, h=.85, step=1.2)
        merlons(p, x0, x1, D / 2 - .2, H, thick=.5, h=.85, step=1.2)
        p.box('fort_trim', (x0, -D / 2 - .12, H - .35), (x1, -D / 2 + .12, H - .1))
        for x in ((x0 + x1) / 2,):
            p.box('fort_dark', (x - .14, -D / 2 - .11, 3.4), (x + .14, -D / 2 + .02, 4.7))
        # Estandarte pendurado na frente de cada torre.
        c = (x0 + x1) / 2
        p.box('fort_iron', (c - .75, -D / 2 - .22, 5.72), (c + .75, -D / 2 - .14, 5.8))
        p.prism('fort_banner', [(c - .68, 3.6), (c, 3.15), (c + .68, 3.6), (c + .68, 5.72), (c - .68, 5.72)], -D / 2 - .19, -D / 2 - .15)
        # Faces internas do vão, em pedra.
        p.box('fort_stone', (s * G - .04 if s > 0 else s * G - .1, -D / 2, 0), (s * G + .1 if s > 0 else s * G + .04, D / 2, A))
    # Arco em aduelas sobre o vão e parede do alto.
    n = 11
    for i in range(n):
        a0, a1 = math.pi * i / n, math.pi * (i + 1) / n; ri = G; ro = G + .55; zc = A - G * .55
        poly = [(math.cos(a0) * ri, zc + math.sin(a0) * ri * .55 + .0), (math.cos(a0) * ro, zc + math.sin(a0) * ro * .62), (math.cos(a1) * ro, zc + math.sin(a1) * ro * .62), (math.cos(a1) * ri, zc + math.sin(a1) * ri * .55)]
        p.prism('fort_trim' if i % 2 else 'fort_stone', poly[::-1], -D / 2 - .05, D / 2 + .05)
    p.box('fort_stone_b', (-G, -D / 2 + .08, A + .15), (G, D / 2 - .08, H))
    wall_courses(p, -G, G, -D / 2, -D / 2 + .1, A + .15, H, 3)
    wall_courses(p, -G, G, D / 2 - .1, D / 2, A + .15, H, 3)
    merlons(p, -G, G, -D / 2 + .2, H, thick=.5, h=.75, step=1.2)
    # Grade recolhida no alto do vão e duas folhas de madeira abertas contra as paredes.
    for x in range(-2, 3):
        p.box('fort_iron', (x * .85 - .05, -.06, A - .95), (x * .85 + .05, .06, A + .1))
    p.box('fort_iron', (-G + .05, -.07, A - .98), (G - .05, .07, A - .86))
    for s in (-1, 1):
        p.box('fort_wood', (s * G - s * .14 - .07, -D / 2 + .1, .02), (s * G - s * .14 + .07, -.45, 3.1))
    return p.finish(bevel=0)

def fort_portcullis():
    # 4,8 x 0,3 x 4,4: grade de ferro que encaixa no vão da portaria. O jogo a ergue quando o pátio é vencido.
    p = vk.Piece('fort_portcullis'); W = 4.8; H = 4.4
    for i in range(7):
        x = -W / 2 + (i + .5) * W / 7
        p.box('fort_iron', (x - .06, -.06, 0), (x + .06, .06, H))
        p.cylinder('fort_steel', (x, 0, -.0), .07, .22, seg=4, r2=.01)
    for z in (.7, 1.6, 2.5, 3.4, 4.2):
        p.box('fort_iron', (-W / 2, -.1, z - .055), (W / 2, .1, z + .055))
    return p.finish(bevel=0)

def fort_keep():
    # 30 x 18 x 12: torre de menagem com portão fechado, quatro torreões, janelas e telhado de ardósia.
    p = vk.Piece('fort_keep'); W, D, H = 30, 18, 9.5
    p.box('fort_stone_b', (-W / 2 + .1, -D / 2 + .1, 0), (W / 2 - .1, D / 2 - .1, H))
    wall_courses(p, -W / 2, W / 2, -D / 2, -D / 2 + .12, 0, H, 11, jitter=.07)
    wall_courses(p, W / 2 - .12, W / 2, -D / 2, -D / 2 + .1, 0, 0.01, 1)
    # Lateral direita (a que a câmera vê) em fiadas giradas.
    for r in range(11):
        z0 = r * H / 11; y = -D / 2 + (r % 2) * .6
        while y < D / 2:
            w = p.rng.uniform(1.2, 1.9); a = max(y, -D / 2); b = min(y + w, D / 2)
            if b - a > .05: p.box('fort_stone' if p.rng.random() < .68 else 'fort_stone_b', (W / 2 - .12, a + .015, z0), (W / 2 + p.rng.uniform(0, .05), b - .015, z0 + H / 11 - .012))
            y += w
    merlons(p, -W / 2, W / 2, -D / 2 + .25, H, thick=.5, h=.8, step=1.7)
    p.box('fort_trim', (-W / 2, -D / 2 - .12, H - .38), (W / 2, -D / 2 + .1, H - .12))
    for x0, y0, w in ((W / 2 - .3, -D / 2, .5),):
        for i in range(10):
            y = -D / 2 + (i + .5) * D / 10; p.box('fort_stone', (W / 2 - .45, y - .55, H), (W / 2 - .02, y + .55, H + .8))
    # Telhado em duas águas.
    ridge = H + 3.0
    p.prism('fort_slate', [(-W / 2 + 2.4, H - .05), (W / 2 - 2.4, H - .05), (W / 2 - 6, ridge), (-W / 2 + 6, ridge)][::-1], -D / 2 + 1.2, -.0)
    p.prism('fort_slate', [(-W / 2 + 2.4, H - .05), (W / 2 - 2.4, H - .05), (W / 2 - 6, ridge), (-W / 2 + 6, ridge)][::-1], .0, D / 2 - 1.2)
    # Torreões nos cantos.
    for sx in (-1, 1):
        for sy in (-1, 1):
            c = (sx * (W / 2 - .4), sy * (D / 2 - .4), 0)
            p.cylinder('fort_stone', c, 2.2, H + 2.0, seg=10, r2=2.0)
            p.cylinder('fort_trim', (c[0], c[1], H + 2.0), 2.0, .35, seg=10, r2=2.35)
            p.cylinder('fort_slate', (c[0], c[1], H + 2.35), 2.35, 3.0, seg=8, r2=.05)
    # Portão principal e escadaria.
    p.box('fort_trim', (-3.3, -D / 2 - .22, 0), (3.3, -D / 2 + .05, 5.2))
    p.box('fort_wood', (-2.5, -D / 2 - .3, 0), (2.5, -D / 2 - .18, 4.2))
    for x in (-1.25, 0, 1.25): p.box('fort_iron', (x - .05, -D / 2 - .34, 0), (x + .05, -D / 2 - .28, 4.2))
    for z in (1.0, 2.4, 3.6): p.box('fort_iron', (-2.5, -D / 2 - .34, z), (2.5, -D / 2 - .28, z + .12))
    for i in range(3):
        p.box('fort_stone', (-4.4 - i * .3, -D / 2 - .5 - i * .55, i and 0), (4.4 + i * .3, -D / 2 - i * .55, .42 - i * .13))
    for x in (-10.5, -6.5, 6.5, 10.5):
        p.box('fort_trim', (x - .55, -D / 2 - .1, 4.0), (x + .55, -D / 2 + .05, 6.6))
        p.box('fort_dark', (x - .38, -D / 2 - .14, 4.15), (x + .38, -D / 2 - .05, 6.4))
    for s in (-1, 1):
        c = s * 4.6
        p.box('fort_iron', (c - .85, -D / 2 - .24, 7.9), (c + .85, -D / 2 - .16, 7.98))
        p.prism('fort_banner', [(c - .78, 5.2), (c, 4.7), (c + .78, 5.2), (c + .78, 7.9), (c - .78, 7.9)], -D / 2 - .21, -D / 2 - .17)
    return p.finish(bevel=0)

def fort_rack():
    # 2,4 x ,6 x 1,8: armeiro com lanças e escudos.
    p = vk.Piece('fort_rack')
    for x in (-1.1, 1.1): p.box('fort_wood', (x - .07, -.07, 0), (x + .07, .07, 1.5))
    p.box('fort_wood', (-1.2, -.06, 1.25), (1.2, .06, 1.37)); p.box('fort_wood', (-1.2, -.06, .55), (1.2, .06, .65))
    for i in range(5):
        x = -.85 + i * .42; v = p.box('fort_wood', (x - .025, -.1, .02), (x + .025, -.05, 1.75))
        p.cylinder('fort_steel', (x, -.075, 1.75), .05, .24, seg=4, r2=.005)
    p.cylinder('fort_iron', (-.5, -.14, .95), .001, .001, seg=3)
    return p.finish(bevel=0)

def fort_dummy():
    # Boneco de treino: poste, travessa e corpo de palha.
    p = vk.Piece('fort_dummy')
    p.box('fort_wood', (-.06, -.06, 0), (.06, .06, 1.75)); p.box('fort_wood', (-.62, -.05, 1.25), (.62, .05, 1.35))
    p.cylinder('fort_straw', (0, 0, .75), .25, .78, seg=8, r2=.29); mk.blob(p, 'fort_straw', (0, 0, 1.72), .2, squash=1)
    for z in (.95, 1.3): p.cylinder('fort_wood', (0, 0, z), .3, .05, seg=8)
    return p.finish(bevel=0)

def cave_mouth():
    # 13 x 6 x 7: boca de caverna em rochedo. O escuro fica atrás do vão de 5,4 x 3,8, voltado para a câmera.
    p = vk.Piece('cave_mouth')
    p.box('cave_void', (-3.1, -.3, 0), (3.1, 3.2, 4.3))
    for x, z, r in ((-4.1, 1.1, 1.75), (-4.5, 3.0, 1.9), (-3.3, 4.7, 1.8), (-1.3, 5.5, 1.75), (1.0, 5.65, 1.85), (3.2, 4.9, 1.9), (4.4, 3.1, 1.95), (4.2, 1.1, 1.7),
                    (-6.0, .9, 1.5), (-6.2, 3.1, 1.6), (6.1, 1.0, 1.55), (6.0, 3.1, 1.5), (-5.1, 5.2, 1.6), (5.2, 5.2, 1.5)):
        mk.blob(p, 'cave_rock' if p.rng.random() < .6 else 'cave_rock_b', (x, p.rng.uniform(-.7, .1), z), r, squash=.92, rough=.2)
    for x, y, z, r in ((-3, 1.8, 6.0, 2.5), (0, 2.1, 7.0, 2.8), (3, 1.8, 6.2, 2.6), (-5.5, 2.2, 3.4, 2.4), (5.6, 2.2, 3.4, 2.4), (0, 3.4, 4.8, 3.2)):
        mk.blob(p, 'cave_rock_b', (x, y, z), r, squash=.9, rough=.16)
    for x, z in ((-2.8, 3.9), (-.8, 4.6), (1.1, 4.7), (2.9, 4.0)):
        v = p.cylinder('cave_rock_b', (x, -.75, z - .6), .05, .85, seg=5, r2=.26)
    for x, z, r in ((-2.5, 6.1, 1.1), (1.8, 6.7, 1.2), (5.2, 5.6, .9), (-5.6, 5.0, .9)):
        mk.blob(p, 'cave_moss', (x, -.7, z), r, squash=.5, rough=.2)
    for s in (-1, 1):
        for x, r in ((3.6, .75), (5.2, .95), (6.9, .6)):
            mk.blob(p, 'cave_rock', (s * x, -1.5, r * .3), r, squash=.55, rough=.2)
    return p.finish(bevel=0)

def strand(p, a, b, t=.028):
    a, b = Vector(a), Vector(b); d = b - a; L = d.length; v = p.box('web_silk', (-t / 2, -t / 2, 0), (t / 2, t / 2, L))
    mat = Matrix.Translation(a) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    for q in v: q.co = mat @ q.co

def spider_web():
    # Teia de canto, raio 2,2: raios e anéis inclinados, presos ao chão por fios.
    p = vk.Piece('spider_web'); R = 2.2; c = Vector((0, 0, 1.45)); n = 9; tilt = Matrix.Rotation(-.5, 3, 'X')
    pt = lambda a, r: c + tilt @ Vector((math.cos(a) * r, 0, math.sin(a) * r * .85))
    angles = [2 * math.pi * i / n + p.rng.uniform(-.1, .1) for i in range(n)]
    for a in angles: strand(p, c, pt(a, R * p.rng.uniform(.9, 1.08)), .035)
    for k, r in enumerate((.5, .95, 1.4, 1.85)):
        for i in range(n):
            strand(p, pt(angles[i], r), pt(angles[(i + 1) % n], r * p.rng.uniform(.96, 1.03)))
    for a in (.5, 2.6, 3.9, 5.4):
        q = pt(a, R); strand(p, q, (q.x * 1.05, q.y, 0), .03)
    return p.finish(bevel=0)

def egg_sac():
    # Ninho de ovos, raio ,9: casulos claros com brilho fraco, leitura de "perto do ninho".
    p = vk.Piece('egg_sac')
    for x, y, r, m in ((0, 0, .5, 'sac_silk'), (.55, .2, .34, 'sac_glow'), (-.45, .3, .38, 'sac_silk'), (.1, -.5, .32, 'sac_glow'), (-.5, -.35, .26, 'sac_silk'), (.5, -.35, .22, 'sac_silk')):
        mk.blob(p, m, (x, y, r * .8), r, squash=1.15, rough=.08)
    for a in (.4, 1.9, 3.1, 4.6):
        strand(p, (0, 0, .55), (math.cos(a) * 1.1, math.sin(a) * 1.1, 0), .03)
    return p.finish(bevel=0)

def bone_pile():
    # Restos de presa, raio ,9: costelas, ossos longos e crânios.
    p = vk.Piece('bone_pile')
    for i in range(7):
        a = p.rng.uniform(0, 6.28); L = p.rng.uniform(.55, 1.05); x, y = math.cos(a) * p.rng.uniform(.1, .55), math.sin(a) * p.rng.uniform(.1, .55)
        strand_mat = p.box('bone_old', (-L / 2, -.05, .03), (L / 2, .05, .12), rot=(0, p.rng.uniform(-.2, .2), a), pivot=(0, 0, .07))
        for q in strand_mat: q.co += Vector((x, y, 0))
    for i in range(4):
        z = -.25 + i * .17
        for s in (-1, 1):
            p.cylinder('bone_old', (s * .22, z - .45, .05), .03, .34, seg=4, r2=.02)
    for x, y in ((.45, .32), (-.42, -.1)):
        mk.blob(p, 'bone_old', (x, y, .15), .16, squash=.95, rough=.05); p.box('fort_dark', (x - .09, y - .155, .13), (x + .09, y - .135, .19))
    return p.finish(bevel=0)

BUILDERS = [fort_wall, fort_tower, fort_gatehouse, fort_portcullis, fort_keep, fort_rack, fort_dummy, cave_mouth, spider_web, egg_sac, bone_pile]
NAMES = {'kit_' + fn.__name__ for fn in BUILDERS}

def build():
    for o in list(bpy.data.objects):
        if o.name in NAMES: bpy.data.objects.remove(o, do_unlink=True)
    objs = []
    for i, fn in enumerate(BUILDERS):
        o = fn(); o.location = ((i % 4) * 36.0, (i // 4) * 26.0, 0); objs.append(o)
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
    print('V2_FORT_KIT_OK', len(objs), {o.name: len(o.data.polygons) for o in objs})
