"""Lote 1 da regeneração low-poly: zumbi aliado, arqueiro inimigo e Bram.

Execute na raiz do projeto:
  blender -b -t 8 --python blender/scripts/lowpoly_cast.py -- --only=zombie,earcher,bram --preview
  blender -b -t 8 --python blender/scripts/lowpoly_cast.py -- --only=zombie,earcher,bram
  python3 blender/scripts/pack_lowpoly_cast.py --only=zombie,earcher,bram
  # Só cena, ações e GLB, sem render:
  blender -b --python blender/scripts/lowpoly_cast.py -- --only=zombie --no-render

Cada personagem gera cena editável (models/), GLB (exports/), quadros (frames/lowpoly_<id>/)
e metadados de render. Os contratos finais preservam célula, ppu e âncora dos sprites que substituem.
"""
import bpy, math, sys, json
from pathlib import Path
from mathutils import Vector
HERE = Path(__file__).resolve().parent; BLENDER = HERE.parent
for p in (str(BLENDER), str(HERE)):
 if p in sys.path: sys.path.remove(p)
 sys.path.insert(0, p)
import common as c
import character_sculpt as s
import toon

# Contrato final do atlas (cell/ppu/âncora) e escala do modelo, calibrada pela altura aparente
# dos sprites substituídos: zumbi 90 px e arqueiro 103 px a 56 ppu; Bram 2,65 u (286 px a 108 ppu).
CAST = {
 'zombie': {'cell': 224, 'ppu': 56, 'anchor': 165, 'master': 256, 'style': 'toon', 'scale': .727},
 'earcher': {'cell': 224, 'ppu': 56, 'anchor': 165, 'master': 256, 'style': 'toon', 'scale': .791},
 'bram': {'cell': 296, 'ppu': 96, 'anchor': 262, 'master': 340, 'style': 'studio', 'scale': 1.063},
}
TAU = math.tau

# ── pose aditiva e bake (rotação, posição e escala de cada osso) ──
POSE = {}; LOC = {}; SCL = {}
def P(b, x=0, y=0, z=0):
 r = POSE.setdefault(b, [0, 0, 0]); r[0] += x; r[1] += y; r[2] += z
def L(b, x=0, y=0, z=0):
 r = LOC.setdefault(b, [0, 0, 0]); r[0] += x; r[1] += y; r[2] += z
def apply_pose():
 for b in c.PB:
  b.rotation_euler = (0, 0, 0); b.location = (0, 0, 0); b.scale = (1, 1, 1)
 for b, r in POSE.items(): c.PB[b].rotation_euler = r
 for b, l in LOC.items(): c.PB[b].location = l
 for b, k in SCL.items(): c.PB[b].scale = (k, k, k)
def bake(name, n, fn, loop, base):
 action = bpy.data.actions.new(name); action.use_fake_user = True
 c.ARM.animation_data_create(); c.ARM.animation_data.action = action
 for f in range(n):
  t = f / n if loop else f / max(1, n - 1)
  POSE.clear(); LOC.clear(); SCL.clear(); base(); fn(t); apply_pose()
  for b in c.PB:
   b.keyframe_insert('rotation_euler', frame=f + 1); b.keyframe_insert('location', frame=f + 1); b.keyframe_insert('scale', frame=f + 1)
def smooth(x): x = min(1, max(0, x)); return x * x * (3 - 2 * x)
def pulse(t, a, b): return math.sin(math.pi * smooth((t - a) / (b - a))) if a < t < b else 0

# Bones pointing up (root, hips, chest, head) have local X = -world X: negative x leans forward.
# Bones hanging down (arms, legs) have local X = +world X: negative x swings the limb forward.
def lean(b, forward): P(b, x=-forward)
def fall(t, lift, arms=(-.7, -.6)):
 # Knees buckle, then the body falls face down with straight legs and arms thrown ahead.
 k = smooth(t / .4); f = smooth((t - .3) / .7); bend = k * (1 - f)
 crouch(.55 * bend); lean('chest', .35 * bend + .08 * f); lean('head', -.25 * f)
 lean('root', 1.45 * f); L('root', y=lift * f)
 P('arm.L', x=.6 * bend + arms[0] * f, z=.3 * f); P('arm.R', x=.5 * bend + arms[1] * f, z=-.3 * f)
def crouch(amount, side=None):
 a = 1.05 * amount
 L('hips', y=-.80 * (1 - math.cos(a)))
 for sd in ([side] if side else ['L', 'R']):
  P('leg.' + sd, x=-a); P('shin.' + sd, x=2 * a); P('foot.' + sd, x=a)

def rig(shoulder=.31, jaw=False, bow=False, wide=1.0, legx=.16):
 c.bone('root', (0, 0, 0), (0, 0, .15)); c.bone('hips', (0, 0, .92), (0, 0, 1.13), 'root')
 c.bone('chest', (0, 0, 1.13), (0, 0, 1.65), 'hips'); c.bone('head', (0, 0, 1.65), (0, 0, 2.1), 'chest')
 if jaw: c.bone('jaw', (0, -.02, 1.86), (0, -.20, 1.80), 'head')
 for side, x in [('L', 1), ('R', -1)]:
  sh = shoulder * wide
  c.bone('arm.' + side, (x * sh, 0, 1.58), (x * (sh + .08), -.015, 1.26), 'chest')
  c.bone('forearm.' + side, (x * (sh + .08), -.015, 1.26), (x * (sh + .11), -.12, 1.00), 'arm.' + side)
  c.bone('hand.' + side, (x * (sh + .11), -.12, 1.00), (x * (sh + .11), -.17, .89), 'forearm.' + side)
  c.bone('leg.' + side, (x * legx, 0, .94), (x * (legx + .01), 0, .52), 'hips')
  c.bone('shin.' + side, (x * (legx + .01), 0, .52), (x * (legx + .02), 0, .13), 'leg.' + side)
  c.bone('foot.' + side, (x * (legx + .02), 0, .13), (x * (legx + .02), -.19, .07), 'shin.' + side)
 if bow:
  g = (shoulder + .11, -.17, .95)
  c.bone('bow', g, (g[0], g[1], g[2] - .2), 'hand.L')
  c.bone('nock', (g[0], g[1] + .17, g[2]), (g[0], g[1] + .17, g[2] - .2), 'bow')
 c.build_rig()

def reweight(obj, near, radius, bone):
 # Vertices at the nocking point follow the string bone so the string bends with the draw.
 old = obj.vertex_groups[0]; new = obj.vertex_groups.new(name=bone); ids = []
 for v in obj.data.vertices:
  if (v.co - Vector(near)).length <= radius: ids.append(v.index)
 old.remove(ids); new.add(ids, 1.0, 'REPLACE')

def palette(colors, emit=()):
 for name, hexcol in colors.items():
  c.mat(name, hexcol, rough=.9, emit=hexcol if name in emit else None, es=.8 if name in emit else 0)

# ═════════════════════════ ZUMBI (aliado, corpo a corpo) ═════════════════════════
def zombie():
 palette({'z_skin': '#86a35c', 'z_skin_dark': '#647f45', 'z_socket': '#28301f', 'z_soul': '#8ff2df',
          'z_shirt': '#8a8172', 'z_vest': '#6e4b30', 'z_vest_dark': '#513724', 'z_rope': '#8a6f45',
          'z_trousers': '#5c5d58', 'z_wrap': '#3d342b', 'z_bone': '#e9dcb0', 'z_wound': '#5a2f2e', 'z_hair': '#46503a'}, emit=('z_soul',))
 rig(jaw=True)
 # Head: gaunt angular skull with sunken cheeks and a slack separate jaw.
 s.rings('Gaunt zombie cranium', [(1.83, .14, .15, .14, -.005), (1.93, .20, .20, .18, -.005), (2.08, .215, .195, .19, 0), (2.21, .19, .16, .17, .01), (2.30, .10, .09, .10, .015)], 'z_skin', 'head', 10)
 s.box('Heavy brow ridge', (0, -.185, 2.10), (.36, .07, .055), 'z_skin_dark', 'head', .015)
 for x in (-.08, .08):
  s.box('Sunken eye socket', (x, -.19, 2.035), (.095, .03, .07), 'z_socket', 'head', .01)
  s.box('Faint soul eye', (x, -.205, 2.035), (.04, .012, .032), 'z_soul', 'head', .004)
  s.mesh('Hollow cheek', [(x * 1.7, -.17, 2.0), (x * 2.5, -.12, 1.97), (x * 1.6, -.165, 1.90)], [(0, 1, 2)], 'z_skin_dark', 'head')
 s.mesh('Rotten nose', [(-.035, -.2, 2.03), (.035, -.2, 2.03), (0, -.245, 1.97), (0, -.2, 1.95)], [(0, 1, 2), (0, 2, 3), (1, 3, 2)], 'z_skin_dark', 'head')
 s.box('Dark mouth recess', (0, -.19, 1.88), (.18, .03, .05), 'z_socket', 'head', .005)
 for i in range(4): s.box('Crooked upper tooth', ((i - 1.5) * .04, -.2, 1.895 - .01 * (i % 2)), (.026, .02, .035), 'z_bone', 'head', .004)
 s.box('Slack lower jaw', (0, -.11, 1.82), (.25, .2, .07), 'z_skin', 'jaw', .02)
 for i in range(3): s.box('Lower tooth', ((i - 1) * .05, -.195, 1.86), (.024, .018, .03), 'z_bone', 'jaw', .004)
 s.ell('Intact ear', (.21, 0, 2.06), (.04, .055, .075), 'z_skin_dark', 'head', 6)
 s.ell('Torn ear stub', (-.21, 0, 2.03), (.035, .04, .04), 'z_skin_dark', 'head', 6)
 for x, y, z, r in [(-.06, .04, 2.29, .075), (.11, .07, 2.25, .06)]:
  s.ell('Patchy hair tuft', (x, y, z), (r, r, r * .6), 'z_hair', 'head', 6)
 s.link('Thin neck', (0, .02, 1.62), (0, -.01, 1.82), .075, .065, 'z_skin_dark', 'head')
 # Torso: torn shirt under an open vest, with ribs showing through a wound.
 s.rings('Sagging shirt belly', [(.90, .21, .15, .14, 0), (1.05, .23, .16, .15, 0), (1.17, .25, .17, .16, 0)], 'z_shirt', 'hips', 10)
 s.rings('Bony shirt chest', [(1.12, .25, .17, .16, 0), (1.36, .29, .18, .17, 0), (1.56, .31, .17, .17, 0), (1.66, .20, .13, .13, 0)], 'z_shirt', 'chest', 10)
 s.rings('Open ragged vest back', [(1.0, .25, .10, .19, .02), (1.35, .315, .12, .2, .02), (1.60, .325, .12, .19, .01)], 'z_vest', 'chest', 10)
 for sign in (-1, 1):
  s.mesh('Vest front panel', [(sign * .13, -.19, 1.62), (sign * .32, -.12, 1.60), (sign * .30, -.16, 1.0), (sign * .12, -.2, 1.04)], [(0, 1, 2, 3) if sign < 0 else (3, 2, 1, 0)], 'z_vest', 'chest')
  s.mesh('Vest tatter', [(sign * .14, -.205, 1.05), (sign * .29, -.165, 1.0), (sign * .22, -.19, .88)], [(0, 1, 2) if sign < 0 else (2, 1, 0)], 'z_vest_dark', 'hips')
 s.mesh('Rib wound', [(-.03, -.181, 1.47), (.11, -.177, 1.46), (.12, -.172, 1.24), (-.02, -.18, 1.26)], [(3, 2, 1, 0)], 'z_wound', 'chest')
 for z in (1.42, 1.36, 1.30): s.link('Exposed rib', (-.015, -.188, z), (.10, -.183, z - .015), .014, .013, 'z_bone', 'chest')
 s.rings('Knotted rope belt', [(.98, .245, .17, .17, 0), (1.03, .245, .17, .17, 0)], 'z_rope', 'hips', 10)
 s.mesh('Hanging shirt rag', [(-.12, -.165, .95), (.03, -.17, .95), (-.03, -.18, .76)], [(2, 1, 0)], 'z_shirt', 'hips')
 for side, sign in (('L', 1), ('R', -1)):
  sh = (sign * .31, 0, 1.58); el = (sign * .39, -.015, 1.26); wr = (sign * .42, -.12, 1.0)
  s.ell('Torn sleeve cap', (sign * .33, 0, 1.55), (.105, .1, .1), 'z_shirt', 'arm.' + side, 8)
  s.link('Ragged sleeve', sh, el, .085, .07, 'z_shirt', 'arm.' + side)
  s.link('Withered forearm', el, wr, .058, .048, 'z_skin', 'forearm.' + side)
  s.box('Bony hand', (sign * .42, -.135, .955), (.1, .085, .1), 'z_skin_dark', 'hand.' + side, .015)
  for i in (-1, 0, 1):
   s.link('Hooked finger', (sign * .42 + i * .03, -.16, .925), (sign * .42 + i * .032, -.215, .85), .017, .012, 'z_skin_dark', 'hand.' + side)
   s.link('Yellowed claw', (sign * .42 + i * .032, -.215, .85), (sign * .42 + i * .033, -.245, .82), .011, .004, 'z_bone', 'hand.' + side)
  s.link('Trouser thigh', (sign * .16, 0, .95), (sign * .17, 0, .52), .105, .085, 'z_trousers', 'leg.' + side)
  s.link('Torn trouser shin', (sign * .17, 0, .53), (sign * .175, 0, .34), .085, .075, 'z_trousers', 'shin.' + side)
  s.mesh('Ragged trouser hem', [(sign * .17 - .08, -.08, .36), (sign * .17 + .08, -.08, .36), (sign * .17, -.085, .27)], [(0, 1, 2) if sign > 0 else (2, 1, 0)], 'z_trousers', 'shin.' + side)
  s.link('Bare grey shin', (sign * .175, 0, .36), (sign * .18, 0, .14), .052, .045, 'z_skin_dark', 'shin.' + side)
  s.box('Rag-wrapped foot', (sign * .18, -.075, .07), (.14, .27, .1), 'z_wrap', 'foot.' + side, .025)
 s.link('Exposed ulna', (-.395, -.05, 1.24), (-.425, -.13, 1.03), .016, .014, 'z_bone', 'forearm.R')
 body = c.finish('Lowpoly_zombie')

 def base():
  # Hunched shamble: chest folded forward, head lifted to the front, arms reaching.
  lean('chest', .46); lean('head', -.34); P('jaw', x=-.08)
  P('arm.L', x=-.95, z=.05); P('arm.R', x=-1.1, z=-.05); P('forearm.L', x=-.2); P('forearm.R', x=-.32)
  P('hand.L', x=.25); P('hand.R', x=.2); crouch(.12)
 def idle(t):
  p = TAU * t; lean('chest', .03 * math.sin(p)); P('chest', y=.03 * math.sin(p))
  P('head', z=.07 * math.sin(p + 1)); P('jaw', x=-.06 * (1 + math.sin(p * 2)) / 2)
  P('arm.L', x=.07 * math.sin(p + .6)); P('arm.R', x=-.07 * math.sin(p + .6))
 def idle_variation(t):
  v = math.sin(math.pi * t); twitch = math.sin(TAU * 2 * t) * v
  P('head', z=.42 * v, y=.22 * twitch); P('chest', y=.16 * v); lean('chest', .08 * v)
  P('arm.R', x=.55 * v); P('arm.L', x=-.22 * v); P('jaw', x=-.25 * v)
 def walk(t):
  # Arrasto: a perna esquerda dá o passo, a direita arrasta com o pé em ponta.
  # O quadril joga para o lado do apoio e o tronco gira ao contrário; braços pendem atrasados.
  p = TAU * t; w = math.sin(p)
  P('leg.L', x=-.48 * w); P('shin.L', x=.75 * max(0, math.sin(p + .9))); P('foot.L', x=.18 * w)
  P('leg.R', x=.24 * w); P('shin.R', x=.22 + .18 * max(0, -w)); P('foot.R', x=.45)
  P('hips', z=.10 * w, y=.10 * w); L('hips', y=-.035 + .035 * abs(math.cos(p)))
  P('chest', z=-.12 * w, y=-.13 * w); lean('chest', .04 * abs(math.cos(p)))
  P('head', z=.10 * math.sin(p + .8), y=.14 * math.sin(p + 1.2)); P('jaw', x=-.08 * (1 + math.sin(2 * p)) / 2)
  P('arm.L', x=.20 * math.sin(p + .5), z=.06 * w); P('arm.R', x=-.16 * math.sin(p + .5), z=.06 * w)
  P('forearm.L', x=-.14 * math.sin(p + 1.4)); P('forearm.R', x=.14 * math.sin(p + 1.4))
 def strike(t):
  # O dano cai quando o golpe começa: o quadro 0 já é o impacto da garra direita
  # cruzando o corpo; ela segue até o lado oposto e o corpo volta à postura base.
  hold = 1 - smooth((t - .35) / .65); swipe = smooth(t / .35)
  lean('chest', (.30 + .10 * swipe) * hold); lean('head', -.24 * hold)
  P('chest', y=(.18 - .52 * swipe) * hold); P('hips', y=(.06 - .16 * swipe) * hold)
  P('arm.R', x=(-.85 + .30 * swipe) * hold, z=(.30 + .55 * swipe) * hold); P('forearm.R', x=-.45 * hold)
  P('hand.R', x=-.35 * hold)
  P('arm.L', x=.35 * hold, z=-.20 * hold); P('forearm.L', x=-.25 * hold)
  P('leg.R', x=-.42 * hold); P('shin.R', x=.30 * hold); P('foot.R', x=.12 * hold)
  P('leg.L', x=.30 * hold); crouch(.10 * hold); P('jaw', x=-.38 * hold)
 def bite(t):
  v = 1 - smooth((t - .15) / .85)
  lean('chest', .42 * v); lean('head', .05 * v); P('jaw', x=-.55 * v)
  P('arm.L', x=-.35 * v, z=-.38 * v); P('arm.R', x=-.25 * v, z=.38 * v); P('forearm.L', x=-.55 * v); P('forearm.R', x=-.55 * v)
  P('leg.R', x=-.38 * v); P('shin.R', x=.25 * v)
 def spawn(t):
  v = 1 - smooth(t); crouch(.85 * v); lean('chest', .55 * v); lean('head', -.35 * v)
  P('arm.L', x=-1.1 * v); P('arm.R', x=-.6 * v); P('jaw', x=-.3 * v)
 def hurt(t):
  v = math.sin(math.pi * t); lean('chest', -.32 * v); lean('head', -.25 * v); P('arm.L', x=.35 * v); P('arm.R', x=.4 * v); P('jaw', x=-.25 * v)
 def death(t):
  # Base hunch is undone while falling so the corpse lies flat.
  f = smooth((t - .3) / .7); lean('chest', -.46 * f); lean('head', .34 * f); crouch(-.12 * f)
  P('arm.L', x=.95 * f); P('arm.R', x=1.1 * f); fall(t, .2); P('jaw', x=-.4 * smooth(t / .4))
 anims = [('idle', 6, 6, True, idle), ('idle_variation', 6, 5, False, idle_variation), ('walk', 8, 13, True, walk),
          ('attack', 6, 12, False, strike), ('attack_secondary', 6, 12, False, bite), ('spawn', 6, 10, False, spawn),
          ('hurt', 3, 12, False, hurt), ('death', 6, 10, False, death)]
 return body, base, anims

# ═════════════════════════ ARQUEIRO INIMIGO (humano, distância) ═════════════════════════
def earcher():
 palette({'a_hood': '#a0702e', 'a_hood_dark': '#74501f', 'a_lining': '#2a201b', 'a_skin': '#c39c70', 'a_eye': '#221c18',
          'a_mask': '#3a2f28', 'a_leather': '#5d4430', 'a_leather_dark': '#3d2c20', 'a_trousers': '#4b4034', 'a_boot': '#2f2722',
          'a_wood': '#70522f', 'a_wood_light': '#93703f', 'a_string': '#ddd4b6', 'a_iron': '#7f8487', 'a_fletch': '#b9473a', 'a_buckle': '#b0954c'})
 rig(bow=True, legx=.15)
 # Hood shell with a recessed face, scarf and a pointed tail falling behind.
 s.rings('Shadowed face', [(1.82, .13, .14, .13, 0), (1.98, .165, .18, .15, 0), (2.10, .16, .16, .15, 0), (2.17, .11, .12, .11, 0)], 'a_skin', 'head', 8)
 for x in (-.065, .065):
  s.box('Narrow hostile eye', (x, -.181, 2.02), (.045, .016, .026), 'a_eye', 'head', .004)
  s.box('Hard brow', (x, -.18, 2.06), (.075, .022, .022), 'a_hood_dark', 'head', .004, rot=(0, -x * 2.2, 0))
 s.box('Leather face mask', (0, -.165, 1.90), (.28, .09, .14), 'a_mask', 'head', .02)
 outer = [(-.25, -.19, 1.78), (-.29, -.13, 2.07), (-.12, -.08, 2.28), (.12, -.08, 2.28), (.29, -.13, 2.07), (.25, -.19, 1.78)]
 inner = [(-.16, -.215, 1.82), (-.19, -.215, 2.05), (-.08, -.19, 2.17), (.08, -.19, 2.17), (.19, -.215, 2.05), (.16, -.215, 1.82)]
 back = [(x * .88, .22, z - .04) for x, y, z in outer]; n = len(outer)
 s.mesh('Ochre hood shell', outer + back, [(i, i + 1, i + 1 + n, i + n) for i in range(n - 1)] + [tuple(n + i for i in range(n))], 'a_hood', 'head')
 s.mesh('Rolled hood rim', outer + inner, [(i, i + 1, i + 1 + n, i + n) for i in range(n - 1)], 'a_hood_dark', 'head')
 s.mesh('Hood lining', [(x * .92, -.10, z) for x, y, z in inner] + inner, [(i, i + 1, i + 1 + n, i + n) for i in range(n - 1)], 'a_lining', 'head')
 s.mesh('Hood point', [(-.12, .16, 2.22), (.12, .16, 2.22), (0, .34, 2.02), (0, .12, 2.3)], [(0, 1, 3), (0, 2, 1), (0, 3, 2), (1, 2, 3)], 'a_hood', 'head')
 s.rings('Ochre capelet', [(1.42, .37, .22, .22, 0), (1.62, .31, .2, .2, 0), (1.78, .2, .17, .17, 0)], 'a_hood', 'chest', 10)
 s.mesh('Short back cape', [(-.30, .16, 1.62), (.30, .16, 1.62), (.27, .25, .78), (0, .27, .70), (-.27, .25, .78)], [(0, 1, 2, 3, 4)], 'a_hood_dark', 'chest')
 # Leather jerkin, belt and hostile red-fletched quiver.
 s.rings('Leather jerkin', [(.92, .22, .15, .15, 0), (1.15, .25, .17, .16, 0), (1.40, .30, .19, .18, 0), (1.60, .30, .18, .18, 0)], 'a_leather', 'chest', 10)
 s.rings('Jerkin skirt', [(.70, .25, .17, .17, 0), (.95, .23, .16, .16, 0)], 'a_leather_dark', 'hips', 10)
 s.rings('Belt', [(.93, .245, .175, .175, 0), (1.0, .245, .175, .175, 0)], 'a_leather_dark', 'hips', 10)
 s.box('Belt buckle', (0, -.18, .965), (.1, .03, .08), 'a_buckle', 'hips', .01)
 s.link('Chest strap', (-.26, -.12, 1.62), (.22, -.17, 1.0), .025, .025, 'a_leather_dark', 'chest')
 s.link('Quiver', (-.18, .2, 1.0), (-.27, .24, 1.62), .085, .1, 'a_leather_dark', 'chest')
 for i in range(3):
  x = -.30 + i * .055; s.link('Quivered arrow', (x, .24, 1.5), (x, .24, 1.86 + i * .03), .009, .009, 'a_wood_light', 'chest')
  s.mesh('Red fletching', [(x - .04, .24, 1.8 + i * .03), (x, .24, 1.93 + i * .03), (x + .04, .24, 1.83 + i * .03), (x, .24, 1.76 + i * .03)], [(0, 1, 2, 3)], 'a_fletch', 'chest')
 for side, sign in (('L', 1), ('R', -1)):
  s.ell('Shoulder pad', (sign * .32, 0, 1.56), (.12, .12, .1), 'a_leather', 'arm.' + side, 8)
  s.link('Leather sleeve', (sign * .31, 0, 1.58), (sign * .39, -.015, 1.26), .085, .07, 'a_leather', 'arm.' + side)
  s.link('Forearm', (sign * .39, -.015, 1.26), (sign * .42, -.12, 1.0), .066, .056, 'a_skin' if sign < 0 else 'a_leather_dark', 'forearm.' + side)
  s.box('Glove', (sign * .42, -.13, .95), (.1, .1, .12), 'a_leather_dark', 'hand.' + side, .02)
  s.link('Trouser leg', (sign * .15, 0, .95), (sign * .16, 0, .52), .1, .085, 'a_trousers', 'leg.' + side)
  s.link('Lower trouser', (sign * .16, 0, .52), (sign * .17, 0, .30), .08, .07, 'a_trousers', 'shin.' + side)
  s.link('Tall boot', (sign * .17, 0, .36), (sign * .17, 0, .12), .085, .08, 'a_boot', 'shin.' + side)
  s.box('Boot cuff', (sign * .17, 0, .37), (.2, .19, .07), 'a_leather_dark', 'shin.' + side, .015)
  s.box('Boot foot', (sign * .17, -.08, .065), (.15, .29, .11), 'a_boot', 'foot.' + side, .03)
 s.box('Archer bracer', (.405, -.07, 1.13), (.13, .13, .16), 'a_leather', 'forearm.L', .02)
 # Recurve bow held in the left hand; the string meets at the nocking bone.
 gx, gy, gz = .42, -.17, .95
 pts = [(gx, gy + .17 * (abs(u) ** 1.6) - .05 * math.sin(math.pi * abs(u)), gz + .58 * u) for u in (-1, -.66, -.33, 0, .33, .66, 1)]
 for a, b in zip(pts, pts[1:]): s.link('Bow limb', a, b, .03, .024, 'a_wood', 'bow')
 for u in (-1, 1): s.ell('Bow tip', pts[0] if u < 0 else pts[-1], (.03, .03, .04), 'a_wood_light', 'bow', 6)
 s.link('Bow grip wrap', (gx, gy - .05, gz - .08), (gx, gy - .05, gz + .08), .04, .04, 'a_leather_dark', 'bow')
 nock = (gx, gy + .17, gz)
 for tip in (pts[0], pts[-1]):
  reweight(s.link('Bowstring', tip, nock, .007, .007, 'a_string', 'bow'), nock, .02, 'nock')
 s.link('Nocked arrow shaft', (gx - .03, gy + .17, gz), (gx - .03, gy - .72, gz), .011, .01, 'a_wood_light', 'nock')
 s.mesh('Arrowhead', [(gx - .03, gy - .72, gz + .035), (gx - .03, gy - .84, gz), (gx - .03, gy - .72, gz - .035), (gx - .06, gy - .72, gz)], [(0, 1, 2), (0, 3, 1), (2, 1, 3)], 'a_iron', 'nock')
 s.mesh('Arrow fletch', [(gx - .03, gy + .14, gz + .05), (gx - .03, gy + .02, gz), (gx - .03, gy + .14, gz - .05)], [(0, 1, 2)], 'a_fletch', 'nock')
 body = c.finish('Lowpoly_earcher')

 def base():
  P('arm.L', x=-.18, z=-.06); P('forearm.L', x=-.3); P('bow', x=.42, y=.2); P('arm.R', x=-.1); P('forearm.R', x=-.2)
  P('chest', y=-.05); crouch(.06)
 def aim(raise_, draw):
  # Bow arm forward at shoulder height with the bow kept upright; string pulled to the cheek.
  P('arm.L', x=-1.40 * raise_, z=-.18 * raise_); P('forearm.L', x=.28 * raise_); P('bow', x=1.18 * raise_, y=-.2 * raise_)
  P('chest', y=-.22 * raise_); P('head', y=-.15 * raise_)
  P('arm.R', x=-1.35 * raise_, z=-.75 * raise_); P('forearm.R', x=-1.35 * draw - .25 * raise_); P('hand.R', x=.3 * draw)
  L('nock', z=.38 * draw)
 def idle(t):
  p = TAU * t; lean('chest', .02 * math.sin(p)); P('head', y=.06 * math.sin(p)); P('arm.R', x=.04 * math.sin(p + .5))
 def idle_variation(t):
  v = math.sin(math.pi * t); P('head', y=.5 * math.sin(TAU * t) * v); P('chest', y=.18 * math.sin(TAU * t) * v)
  P('arm.R', x=.5 * v, z=-.2 * v); P('forearm.R', x=-.9 * v)
 def walk(t):
  p = TAU * t
  for sd, ph in (('L', 0), ('R', math.pi)):
   w = math.sin(p + ph); P('leg.' + sd, x=.45 * w); P('shin.' + sd, x=.6 * max(0, -w)); P('foot.' + sd, x=-.12 * w)
  P('arm.R', x=-.25 * math.sin(p)); P('arm.L', x=.1 * math.sin(p)); P('chest', z=.04 * math.sin(p)); L('hips', y=.02 * abs(math.sin(p)))
 def windup(t):
  # Tiro forte (0,65 s efetivos): raise (0-45%) then full draw held until the real release.
  aim(smooth(t / .45), smooth((t - .25) / .65)); crouch(.12 * smooth(t))
 def release(t):
  # The arrow leaves on the first frame (damage/projectile spawn); the bow then lowers.
  r = 1 - smooth((t - .3) / .7); aim(r, 0); P('arm.R', x=.25 * (1 - t) * r, z=.35 * r); P('forearm.R', x=.5 * r)
  SCL['nock'] = 1 if t > .75 else .001
 def hurt(t):
  v = math.sin(math.pi * t); lean('chest', -.28 * v); lean('head', -.22 * v); P('arm.R', x=.35 * v); P('arm.L', x=.25 * v)
 def death(t):
  # Kneels and topples sideways: a full-length fall toward the camera would leave the 224 px cell.
  k = smooth(t / .45); f = smooth((t - .35) / .65)
  crouch(.85 * k); lean('chest', .5 * k - .25 * f); lean('head', .3 * k); P('root', z=1.2 * f); L('root', y=.12 * f)
  P('arm.L', x=.4 * k, z=.45 * f); P('arm.R', x=.3 * k - .4 * f); P('bow', x=-.5 * f)
 anims = [('idle', 6, 6, True, idle), ('idle_variation', 6, 5, False, idle_variation), ('walk', 6, 10, True, walk),
          ('attack', 6, 20, False, release), ('windup', 6, 9.23, False, windup), ('hurt', 3, 12, False, hurt), ('death', 6, 10, False, death)]
 return body, base, anims

# ═════════════════════════ BRAM (ferreiro da vila) ═════════════════════════
def bram():
 palette({'b_skin': '#dcae84', 'b_skin_shade': '#c08e66', 'b_linen': '#d8c9a0', 'b_linen_shade': '#bfb088', 'b_apron': '#6b4a2e',
          'b_apron_light': '#7b5737', 'b_strap': '#4a3322', 'b_brass': '#c9a24e', 'b_hair': '#4a3528', 'b_hair_light': '#5e4532',
          'b_beard': '#77716a', 'b_beard_dark': '#5c5751', 'b_eye': '#231a14', 'b_band': '#4b3424', 'b_trousers': '#3f3227',
          'b_boot': '#382a20', 'b_wood': '#704c2c', 'b_iron': '#5d6064', 'b_iron_light': '#7f8388'})
 # Broad smith proportions: big head, wide shoulders and heavy forearms, short sturdy legs.
 c.bone('root', (0, 0, 0), (0, 0, .15)); c.bone('hips', (0, 0, .84), (0, 0, 1.04), 'root')
 c.bone('chest', (0, 0, 1.04), (0, 0, 1.60), 'hips'); c.bone('head', (0, 0, 1.60), (0, 0, 2.08), 'chest')
 for side, x in (('L', 1), ('R', -1)):
  c.bone('arm.' + side, (x * .47, 0, 1.55), (x * .56, -.02, 1.21), 'chest')
  c.bone('forearm.' + side, (x * .56, -.02, 1.21), (x * .60, -.12, .93), 'arm.' + side)
  c.bone('hand.' + side, (x * .60, -.12, .93), (x * .60, -.17, .80), 'forearm.' + side)
  c.bone('leg.' + side, (x * .21, 0, .86), (x * .22, 0, .47), 'hips')
  c.bone('shin.' + side, (x * .22, 0, .47), (x * .23, 0, .12), 'leg.' + side)
  c.bone('foot.' + side, (x * .23, 0, .12), (x * .23, -.2, .06), 'shin.' + side)
 c.build_rig()
 # Head ~ a quarter of the height, faceted jaw under a full grey beard.
 s.rings('Broad smith face', [(1.70, .19, .17, .17, .0), (1.82, .265, .25, .22, 0), (2.02, .285, .26, .23, 0), (2.22, .27, .235, .22, .01), (2.33, .19, .17, .16, .02)], 'b_skin', 'head', 10)
 for sx in (-1, 1):
  s.ell('Ear', (sx * .285, -.005, 2.03), (.05, .06, .085), 'b_skin_shade', 'head', 6)
  s.box('Determined eye', (sx * .1, -.262, 2.075), (.055, .02, .045), 'b_eye', 'head', .004)
  s.box('Heavy dark brow', (sx * .105, -.255, 2.135), (.13, .04, .04), 'b_hair', 'head', .008, rot=(0, sx * -.18, 0))
  s.mesh('Cheek plane', [(sx * .15, -.25, 2.03), (sx * .25, -.2, 2.02), (sx * .16, -.25, 1.95)], [(0, 1, 2) if sx < 0 else (2, 1, 0)], 'b_skin_shade', 'head')
 s.mesh('Broad nose', [(-.045, -.255, 2.09), (.045, -.255, 2.09), (-.06, -.33, 1.98), (.06, -.33, 1.98), (0, -.35, 2.0), (0, -.29, 1.95)], [(0, 1, 4), (0, 4, 2), (1, 3, 4), (2, 4, 5), (4, 3, 5)], 'b_skin_shade', 'head')
 s.ell('Full grey beard', (0, -.18, 1.81), (.24, .16, .19), 'b_beard', 'head', 9)
 s.ell('Beard point', (0, -.22, 1.70), (.16, .11, .11), 'b_beard_dark', 'head', 7)
 for sx in (-1, 1):
  s.link('Sideburn', (sx * .262, -.03, 2.15), (sx * .235, -.12, 1.88), .05, .065, 'b_hair', 'head')
  s.mesh('Moustache', [(sx * .02, -.335, 1.95), (sx * .15, -.29, 1.93), (sx * .14, -.32, 1.87), (sx * .03, -.345, 1.9)], [(0, 1, 2, 3) if sx < 0 else (3, 2, 1, 0)], 'b_beard_dark', 'head')
 s.box('Mouth', (0, -.33, 1.885), (.09, .015, .02), 'b_eye', 'head', .003)
 s.rings('Swept dark hair', [(2.12, .29, .2, .25, .04), (2.30, .31, .23, .26, .04), (2.44, .2, .16, .17, .05)], 'b_hair', 'head', 10)
 for x, y, z, rx, ry in [(-.18, -.16, 2.34, .14, .11), (-.03, -.2, 2.38, .15, .12), (.13, -.13, 2.40, .14, .12), (.24, .0, 2.32, .1, .14), (-.25, .03, 2.28, .1, .14), (0, .12, 2.42, .17, .14)]:
  s.ell('Swept hair lock', (x, y, z), (rx, ry, .09), 'b_hair_light' if x < 0 else 'b_hair', 'head', 5)
 for x, z, w in [(-.17, 2.24, .12), (-.03, 2.26, .13), (.13, 2.25, .12)]:
  s.mesh('Forehead lock', [(x - w * .5, -.235, z + .1), (x + w * .5, -.25, z + .09), (x + w * .2, -.285, z - .04), (x - w * .55, -.255, z)], [(0, 1, 2), (0, 2, 3)], 'b_hair', 'head')
 s.link('Thick neck', (0, 0, 1.55), (0, -.02, 1.76), .16, .15, 'b_skin_shade', 'head')
 # Linen shirt torso, rolled sleeves and the leather apron with brass rivets.
 s.rings('Linen shirt belly', [(.86, .37, .27, .25, 0), (1.06, .45, .34, .27, 0)], 'b_linen', 'hips', 12)
 s.rings('Linen shirt chest', [(1.02, .45, .34, .27, 0), (1.30, .50, .33, .27, 0), (1.52, .52, .29, .26, 0), (1.66, .38, .22, .21, 0)], 'b_linen', 'chest', 12)
 for sx in (-1, 1):
  s.mesh('Open collar', [(sx * .04, -.2, 1.68), (sx * .2, -.18, 1.66), (sx * .14, -.27, 1.52), (sx * .03, -.26, 1.58)], [(0, 1, 2, 3) if sx < 0 else (3, 2, 1, 0)], 'b_linen_shade', 'chest')
 s.rings('Leather apron bib', [(1.08, .40, .37, .0, -.01), (1.30, .41, .36, .0, -.01), (1.50, .33, .31, .0, -.01)], 'b_apron', 'chest', 10)
 s.rings('Leather apron skirt', [(.42, .44, .33, .0, -.02), (.70, .43, .33, .0, -.02), (.98, .42, .36, .0, -.02)], 'b_apron', 'hips', 10)
 s.box('Apron pocket', (0, -.37, .78), (.3, .03, .18), 'b_apron_light', 'hips', .01)
 s.mesh('Apron wear patch', [(-.24, -.355, 1.36), (-.08, -.37, 1.38), (-.12, -.37, 1.24), (-.25, -.35, 1.22)], [(3, 2, 1, 0)], 'b_apron_light', 'chest')
 for sx in (-1, 1):
  s.link('Apron strap', (sx * .30, .02, 1.67), (sx * .25, -.30, 1.47), .05, .05, 'b_strap', 'chest')
  s.ell('Brass rivet', (sx * .25, -.33, 1.46), (.032, .02, .032), 'b_brass', 'chest', 6)
 s.rings('Apron waist tie', [(.98, .46, .36, .28, 0), (1.05, .46, .36, .28, 0)], 'b_strap', 'hips', 12)
 for side, sx in (('L', 1), ('R', -1)):
  s.ell('Puffed sleeve', (sx * .53, -.01, 1.42), (.2, .19, .22), 'b_linen', 'arm.' + side, 8)
  s.link('Rolled cuff', (sx * .56, -.03, 1.27), (sx * .565, -.04, 1.19), .17, .165, 'b_linen_shade', 'arm.' + side)
  s.link('Heavy forearm', (sx * .56, -.02, 1.21), (sx * .60, -.12, .95), .14, .12, 'b_skin', 'forearm.' + side)
  s.link('Leather wrist band', (sx * .595, -.10, 1.02), (sx * .60, -.12, .93), .13, .125, 'b_band', 'forearm.' + side)
  s.ell('Big fist', (sx * .60, -.15, .84), (.13, .12, .13), 'b_skin', 'hand.' + side, 7)
  s.ell('Thumb', (sx * .53, -.22, .87), (.055, .055, .07), 'b_skin_shade', 'hand.' + side, 6)
  s.link('Sturdy trouser leg', (sx * .21, 0, .86), (sx * .22, 0, .30), .16, .14, 'b_trousers', 'leg.' + side)
  s.link('Boot shaft', (sx * .225, 0, .34), (sx * .23, 0, .1), .15, .14, 'b_boot', 'shin.' + side)
  s.box('Wide boot', (sx * .23, -.09, .07), (.26, .4, .14), 'b_boot', 'foot.' + side, .04)
 # Smith's hammer in the right fist, head resting low by the knee.
 s.link('Hammer handle', (-.60, -.17, .98), (-.62, -.24, .42), .04, .036, 'b_wood', 'hand.R')
 s.box('Hammer head', (-.62, -.25, .40), (.34, .2, .2), 'b_iron', 'hand.R', .03)
 s.box('Hammer striking face', (-.80, -.25, .40), (.03, .18, .17), 'b_iron_light', 'hand.R', .008)
 body = c.finish('Lowpoly_bram')

 def base():
  P('arm.R', x=-.08, z=-.06); P('arm.L', x=-.05, z=.08); P('forearm.L', x=-.25); P('hand.L', x=.1)
 def idle(t):
  p = TAU * t; b = math.sin(p)
  lean('chest', -.025 * b); L('hips', y=.008 * (1 + b)); lean('head', .02 * b); P('arm.L', z=.03 * b); P('arm.R', z=-.025 * b)
 def idle_variation(t):
  # Lifts the hammer, glances at the head and lets it hang again.
  v = math.sin(math.pi * t)
  P('arm.R', x=-.75 * v, z=.12 * v); P('forearm.R', x=-.95 * v); P('hand.R', y=-.5 * v)
  P('head', y=-.32 * v); lean('head', .12 * v); P('chest', y=-.1 * v)
 def talk(t):
  p = TAU * t
  P('arm.L', x=-.55 - .18 * math.sin(p), z=.12); P('forearm.L', x=-.85 - .25 * math.sin(p + .8)); P('hand.L', y=.3 * math.sin(p))
  lean('head', .07 * math.sin(2 * p)); P('head', y=.08 * math.sin(p)); lean('chest', .04 + .02 * math.sin(p)); P('chest', y=.05 * math.sin(p))
 anims = [('idle', 8, 6, True, idle), ('idle_variation', 8, 5, False, idle_variation), ('talk', 8, 8, True, talk)]
 return body, base, anims

BUILDERS = {'zombie': zombie, 'earcher': earcher, 'bram': bram}

def studio(scene):
 # Soft warm key, low fill and rim: broad readable facets for the village NPC.
 scene.cycles.samples = 96; scene.cycles.use_denoising = False
 scene.world = bpy.data.worlds.new('Lowpoly studio'); scene.world.use_nodes = True
 bg = scene.world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (.66, .63, .58, 1); bg.inputs['Strength'].default_value = .38
 for name, location, energy, size in (('Key', (-3, -4, 6), 560, 3), ('Fill', (4, -2, 4), 150, 4), ('Rim', (1, 3, 5), 260, 3)):
  bpy.ops.object.light_add(type='AREA', location=location); lamp = bpy.context.object; lamp.name = name
  lamp.data.energy = energy; lamp.data.shape = 'DISK'; lamp.data.size = size
  lamp.rotation_euler = (Vector((0, 0, 1.2)) - lamp.location).to_track_quat('-Z', 'Y').to_euler()

def produce(ident, preview=False):
 spec = CAST[ident]; c.reset_scene(); POSE.clear(); LOC.clear(); SCL.clear()
 body, base, anims = BUILDERS[ident]()
 arm = c.ARM; sc = bpy.context.scene; c.init_anim(sc)
 for name, n, fps, loop, fn in anims: bake(name, n, fn, loop, base)
 arm.animation_data.action = bpy.data.actions['idle']; sc.frame_set(1)
 arm.scale = (spec['scale'],) * 3
 bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
 bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.025); bpy.ops.object.mode_set(mode='OBJECT')
 for folder in ('models', 'exports'): (BLENDER / folder).mkdir(exist_ok=True)
 arm.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(BLENDER / 'exports' / f'lowpoly_{ident}.glb'), export_format='GLB', use_selection=True, export_animation_mode='ACTIONS', export_skins=True, export_yup=True)
 cell = spec['master']; ppu = spec['ppu'] * cell / spec['cell']; anchor = spec['anchor'] * cell / spec['cell']
 sc.render.engine = 'CYCLES'; sc.cycles.samples = 6; sc.cycles.use_denoising = False; sc.render.film_transparent = True
 sc.view_settings.view_transform = 'Standard'; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
 bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam; cam.data.type = 'ORTHO'; cam.data.ortho_scale = cell / ppu
 p = math.radians(32); forward = Vector((0, math.cos(p), -math.sin(p))); target = Vector((0, math.sin(p), math.cos(p))) * (anchor - cell / 2) / ppu
 cam.location = target - forward * 12; cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
 sc.render.resolution_x = sc.render.resolution_y = cell; sc.render.resolution_percentage = 100
 if spec['style'] == 'studio': studio(sc)
 bpy.ops.wm.save_as_mainfile(filepath=str(BLENDER / 'models' / f'lowpoly_{ident}.blend'))
 if NO_RENDER: print('LOWPOLY_SAVED', ident, flush=True); return  # só modelo, ações e GLB
 if spec['style'] == 'toon': toon.toonify(sc, light=(-.5, -.65, .9), bands=(.65, .84, 1), thick=.5)
 sc.render.use_freestyle = False
 out = BLENDER / 'frames' / (f'lowpoly_{ident}_preview' if preview else f'lowpoly_{ident}'); out.mkdir(parents=True, exist_ok=True)
 meta = {'id': ident, 'cell': cell, 'ppu': ppu, 'anchorX': cell / 2, 'anchorY': anchor, 'dirs': 8, 'contract': {k: spec[k] for k in ('cell', 'ppu', 'anchor')}, 'anims': {}}
 for ai, (name, n, fps, loop, fn) in enumerate(anims):
  arm.animation_data.action = bpy.data.actions[name]; meta['anims'][name] = {'n': n, 'fps': fps, 'loop': loop, 'row': ai * 8}
  for di in range(8):
   if preview and di not in ((1, 2, 3, 4, 6) if name == 'idle' else (1, 4)): continue
   arm.rotation_euler.z = math.radians(90 - di * 45)
   for fi in range(n):
    if preview and name != 'idle' and fi not in (0, n // 2, n - 1): continue
    if preview and name == 'idle' and fi: continue
    sc.frame_set(fi + 1); sc.render.filepath = str(out / f'{ai * 8 + di:02}_{fi:02}.png'); bpy.ops.render.render(write_still=True)
  print('LOWPOLY_ACTION', ident, name, flush=True)
 manifest = {'vertices': len(body.data.vertices), 'triangles': sum(len(q.vertices) - 2 for q in body.data.polygons), 'bones': len(arm.data.bones), 'actions': [a[0] for a in anims]}
 meta['model'] = manifest
 (out / 'render.json').write_text(json.dumps(meta, indent=1))
 print('LOWPOLY_DONE', ident, json.dumps(manifest), flush=True)

NO_RENDER = False
if __name__ == '__main__':
 argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
 NO_RENDER = '--no-render' in argv
 selected = next((a.split('=', 1)[1].split(',') for a in argv if a.startswith('--only=')), list(CAST))
 for ident in selected:
  if ident not in CAST: raise ValueError(ident)
  produce(ident, '--preview' in argv)
