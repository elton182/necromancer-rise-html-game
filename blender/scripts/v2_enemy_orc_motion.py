"""Refaz os clipes do Orc (v2) sobre o modelo já montado em models/v2_enemy_orc.blend.

Uso na raiz do projeto (ou cole/execute na sessão Blender via MCP com o .blend aberto):
  blender --background blender/models/v2_enemy_orc.blend --python blender/scripts/v2_enemy_orc_motion.py
Na sessão MCP defina `ORC_EXPORT = False` antes para só pré-visualizar; com True (padrão) salva o .blend e o .glb.
Clipes: idle, walk, attack, smash_windup, smash, recover, hit, death (mesmos nomes e comprimentos do registro em v2/assets/models.json).
"""
from pathlib import Path
import bpy, math
import numpy as np
from mathutils import Vector, Quaternion, Matrix

BASE = Path(__file__).resolve().parents[1] if '__file__' in globals() else Path(bpy.data.filepath).resolve().parents[1]
EXPORT = globals().get('ORC_EXPORT', True)
sc = bpy.context.scene
arm = bpy.data.objects['Armature']
body = bpy.data.objects['OrcBody']
mace = bpy.data.objects['OrcMace']
H = .58  # altura do corpo em unidades do modelo; deslocamentos são frações dela
TAU = math.tau

def bone(n): return arm.pose.bones['mixamorig:' + n]
def pose_matrix(b):
    rest = b.bone.matrix_local
    local = b.rotation_quaternion.to_matrix().to_4x4()
    return pose_matrix(b.parent) @ b.parent.bone.matrix_local.inverted() @ rest @ local if b.parent else rest @ local
def aim(n, direction):
    # Aponta o osso para `direction` (mundo) levando em conta a pose do pai; chame do pai para o filho.
    b = bone(n); rest = b.bone.matrix_local.to_3x3()
    parent = pose_matrix(b.parent).to_3x3() @ b.parent.bone.matrix_local.to_3x3().inverted() if b.parent else Matrix.Identity(3)
    target = parent.inverted() @ Vector(direction).normalized()
    delta = (b.bone.tail_local - b.bone.head_local).normalized().rotation_difference(target)
    b.rotation_quaternion = (rest.inverted() @ delta.to_matrix() @ rest).to_quaternion()
def rotate(n, axis, angle):
    b = bone(n); local = b.bone.matrix_local.to_3x3().inverted() @ Vector(axis)
    b.rotation_quaternion = Quaternion(local.normalized(), angle) @ b.rotation_quaternion
def euler(n, e):
    # Rotação em torno dos eixos X, Y e Z do armature (radianos), na ordem Z·Y·X.
    for axis, a in zip(((0, 0, 1), (0, 1, 0), (1, 0, 0)), (e[2], e[1], e[0])):
        if a: rotate(n, axis, a)
def orient_mace(target):
    # Gira a mão até o eixo da maça (cabeça para +Z do objeto) apontar para `target`.
    bpy.context.view_layer.update()
    b = bone('RightHand')
    current = (mace.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized()
    dq = current.rotation_difference(Vector(target).normalized()).to_matrix()
    Bw = arm.matrix_world.to_3x3() @ b.matrix.to_3x3()
    b.rotation_quaternion = (b.rotation_quaternion.to_matrix() @ Bw.inverted() @ dq @ Bw).to_quaternion()

HIPS_R = bone('Hips').bone.matrix_local.to_3x3()
def set_hips(v):
    # Deslocamento de mundo → espaço local do osso (a localização da pose usa os eixos de repouso).
    bone('Hips').location = HIPS_R.inverted() @ Vector(v)
def lowest_point():
    bpy.context.view_layer.update()
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co)
    ev.to_mesh_clear()
    return float(co[2::3].min())

def fit_mace():
    # Encaixe da maça: eixo real da malha (cabeça no lado grosso) vira o +Z do objeto, o ponto de empunhadura (25% do cabo, a partir da base)
    # vira a origem e é colocado no centro do punho fechado, com o cabo atravessando o punho no sentido dos nós dos dedos (±Y no repouso).
    if mace.get('grip_fit'): return
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = Quaternion(); b.location = (0, 0, 0)
    for digit in ('Index', 'Middle', 'Ring', 'Pinky'):
        for joint in (1, 2, 3): rotate('RightHand' + digit + str(joint), (0, 1, 0), -.9)
    bpy.context.view_layer.update()
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    groups = {g.index: g.name for g in body.vertex_groups}; pts = []
    for v in me.vertices:
        if v.groups:
            g = max(v.groups, key=lambda x: x.weight)
            if groups[g.group].startswith('mixamorig:RightHand'): pts.append(ev.matrix_world @ v.co)
    ev.to_mesh_clear(); fist = sum(pts, Vector()) / len(pts)
    co = np.array([v.co[:] for v in mace.data.vertices]); mean = co.mean(axis=0)
    axis = np.linalg.eigh(np.cov((co - mean).T))[1][:, -1]; t = (co - mean) @ axis
    if np.linalg.norm((co - mean)[t > t.mean()] - np.outer(t[t > t.mean()], axis), axis=1).mean() < np.linalg.norm((co - mean)[t < t.mean()] - np.outer(t[t < t.mean()], axis), axis=1).mean(): axis = -axis; t = -t
    grip = mean + axis * (t.min() + .25 * (t.max() - t.min()))
    to_z = Vector(axis).rotation_difference(Vector((0, 0, 1))).to_matrix().to_4x4()
    mace.data.transform(to_z @ Matrix.Translation(-Vector(grip)))
    bpy.context.view_layer.update()
    head = Vector((0, -1, .1)).normalized()  # cabeça para a frente (lado do polegar) e um pouco para cima
    mace.matrix_world = Matrix.Translation(fist) @ Vector((0, 0, 1)).rotation_difference(head).to_matrix().to_4x4()
    mace['grip_fit'] = 1

# --- poses ---------------------------------------------------------------------------------------------------
# Direções de mundo: frente = -Y, trás = +Y, esquerda do orc = +X, direita (mão da maça) = -X, cima = +Z.
GUARD = dict(
    hips=(0, 0, 0), hips_rot=(0, 0, 0),
    spine=(.14, 0, 0), spine1=(0, 0, 0), spine2=(.08, 0, 0), neck=(0, 0, 0), head=(-.1, 0, 0),
    LA=(.3, -.15, -1), LF=(-.1, -.8, -.45), RA=(-.25, -.1, -1), RF=(-.15, -.85, .1), mace=(-.3, -.45, .85),
    LU=(0, 0, 0), LL=(0, 0, 0), LFt=(0, 0, 0), RU=(0, 0, 0), RL=(0, 0, 0), RFt=(0, 0, 0))
def P(**kw):
    p = dict(GUARD); p.update(kw); return p
def add(p, **kw):
    # Soma deslocamentos componente a componente a uma pose.
    q = dict(p)
    for k, v in kw.items(): q[k] = tuple(a + b for a, b in zip(q[k], v))
    return q
def mix(a, b, u):
    return {k: tuple(x + (y - x) * u for x, y in zip(a[k], b[k])) for k in a}
def ease(u, mode):
    if mode == 'in': return u ** 2.2
    if mode == 'out': return 1 - (1 - u) ** 2.2
    if mode == 'lin': return u
    return u * u * (3 - 2 * u)
def sample(keys, t):
    # keys: [(t, pose, modo de easing do trecho que termina nesta chave)]
    if t <= keys[0][0]: return keys[0][1]
    for (t0, p0, _), (t1, p1, m) in zip(keys, keys[1:]):
        if t <= t1: return mix(p0, p1, ease((t - t0) / (t1 - t0), m))
    return keys[-1][1]

GRIP_MIN, GRIP_MAX = math.radians(55), math.radians(125)
def clamp_forearm(fore, shaft):
    # O cabo atravessa o punho: o antebraço não pode ficar paralelo a ele. Gira o antebraço, no plano dos dois, até o ângulo ficar no intervalo.
    f = Vector(fore).normalized(); m = Vector(shaft).normalized(); ang = f.angle(m); target = min(GRIP_MAX, max(GRIP_MIN, ang))
    if target == ang: return f
    n = m.cross(f)
    if n.length < 1e-4: n = m.cross(Vector((0, -1, 0)))
    if n.length < 1e-4: n = m.cross(Vector((1, 0, 0)))
    return Quaternion(n.normalized(), target) @ m

def apply(p):
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = Quaternion(); b.location = (0, 0, 0)
    euler('Hips', p['hips_rot'])
    for n in ('spine', 'spine1', 'spine2', 'neck', 'head'): euler(n.capitalize(), p[n])
    for side, key in (('Left', 'L'), ('Right', 'R')):
        euler(side + 'UpLeg', p[key + 'U']); euler(side + 'Leg', p[key + 'L']); euler(side + 'Foot', p[key + 'Ft'])
        for digit in ('Index', 'Middle', 'Ring', 'Pinky'):
            for joint in (1, 2, 3): rotate(side + 'Hand' + digit + str(joint), (0, 1, 0), .9 if side == 'Left' else -.9)
    aim('LeftArm', p['LA']); aim('LeftForeArm', p['LF']); aim('RightArm', p['RA']); aim('RightForeArm', clamp_forearm(p['RF'], p['mace']))
    orient_mace(p['mace'])

CLIPS = {}
def clip(name, length, loop, ground):
    def wrap(fn): CLIPS[name] = (length, loop, ground, fn); return fn
    return wrap

# --- idle: respiração, peso trocando de pé, maça balançando de leve ---------------------------------------------
@clip('idle', 48, True, 'both')
def idle(u):
    s = math.sin(TAU * u); c = math.cos(TAU * u)
    p = add(GUARD, spine1=(.03 * s, 0, .02 * c), spine2=(.05 * s, 0, -.03 * c), neck=(-.03 * s, 0, 0), head=(-.04 * s, 0, .05 * c),
            hips_rot=(0, 0, .03 * c), LA=(.04 * s, .05 * s, 0), LF=(0, .05 * c, .04 * s), RF=(0, .04 * c, 0), mace=(.04 * s, .05 * c, .02 * s),
            LU=(.04 * c, 0, 0), RU=(-.04 * c, 0, 0))
    p['hips'] = (.012 * H * c, 0, -.008 * H * (1 - s * s))
    return p

# --- walk: passada pesada, tronco contra-girando, braço da maça quase preso ------------------------------------------
@clip('walk', 24, True, 'both')
def walk(u):
    s = math.sin(TAU * u); c = math.cos(TAU * u)
    def leg(sn, cn):
        thigh = .62 * sn                       # + = para trás
        knee = .85 * max(0, -cn) + .12         # dobra quando a coxa vai à frente
        foot = -(thigh + knee) * .85 + .25 * max(0, cn)
        return (thigh, 0, 0), (knee, 0, 0), (foot, 0, 0)
    LU, LL, LFt = leg(s, c); RU, RL, RFt = leg(-s, -c)
    p = add(GUARD, LU=LU, LL=LL, LFt=LFt, RU=RU, RL=RL, RFt=RFt,
            hips_rot=(0, .04 * s, .11 * s), spine=(.05 + .03 * math.cos(2 * TAU * u), 0, -.12 * s), spine1=(0, 0, -.05 * s),
            spine2=(0, 0, -.04 * s), head=(.03 * math.cos(2 * TAU * u), 0, .12 * s),
            LA=(0, -.55 * s, 0), LF=(0, -.2 * s, 0), RA=(0, .22 * s, 0), RF=(0, .1 * s, 0), mace=(0, .14 * s, .05 * c))
    p['hips'] = (.035 * H * s, 0, .02 * H * math.cos(2 * TAU * u))
    return p

# --- attack: golpe diagonal de maça, da direita para a esquerda --------------------------------------------------------
ATK_WIND = P( spine=(-.12, 0, -.28), spine1=(0, 0, -.12), spine2=(-.06, 0, -.2), head=(0, 0, .25), hips_rot=(0, 0, -.1),
               LA=(.75, -.25, -.45), LF=(.35, -.55, .1), RA=(-.75, .3, .55), RF=(-.35, .35, .95), mace=(-.35, .55, .8),
               LU=(.15, 0, 0), RU=(-.25, 0, 0), RL=(.25, 0, 0))
ATK_HIT = P( spine=(.32, 0, .3), spine1=(0, 0, .15), spine2=(.2, 0, .3), head=(-.15, 0, -.25), hips_rot=(0, 0, .12), hips=(0, -.03 * H, -.04 * H),
              LA=(.85, .2, -.5), LF=(.55, -.2, -.35), RA=(.1, -.8, -.1), RF=(.35, -1, -.2), mace=(.8, -.45, -.3),
              LU=(-.5, 0, 0), LL=(.55, 0, 0), RU=(.4, 0, 0), RL=(.35, 0, 0))
ATK_FOLLOW = P( spine=(.38, 0, .38), spine2=(.22, 0, .36), head=(-.1, 0, -.3), hips_rot=(0, 0, .16), hips=(0, -.04 * H, -.05 * H),
                 LA=(.7, .35, -.3), LF=(.5, -.1, -.1), RA=(.55, -.55, -.35), RF=(.85, -.7, -.3), mace=(1, -.1, -.35),
                 LU=(-.5, 0, 0), LL=(.55, 0, 0), RU=(.4, 0, 0), RL=(.35, 0, 0))
@clip('attack', 18, False, 'both')
def attack(u):
    return sample([(0, GUARD, 's'), (.4, ATK_WIND, 's'), (.58, ATK_HIT, 'in'), (.78, ATK_FOLLOW, 'out'), (1, mix(GUARD, ATK_FOLLOW, .25), 's')], u)

# --- smash_windup / smash / recover: pancada vertical com a maça acima da cabeça ---------------------------------------------
SM_LOAD = P( spine=(-.1, 0, 0), spine2=(-.08, 0, 0), head=(.05, 0, 0), hips=(0, .02 * H, -.05 * H),
              LA=(.4, -.35, -.7), LF=(.3, -.7, -.2), RA=(-.3, .1, -.8), RF=(-.2, -.2, .5), mace=(-.3, .1, .9),
              LU=(-.45, 0, 0), LL=(.7, 0, 0), RU=(-.35, 0, 0), RL=(.6, 0, 0))
SM_UP = P( spine=(-.28, 0, 0), spine1=(-.1, 0, 0), spine2=(-.2, 0, 0), neck=(-.1, 0, 0), head=(-.15, 0, 0), hips=(0, .03 * H, .02 * H),
            LA=(.65, -.1, .5), LF=(.1, -.7, .7), RA=(-.28, .1, .95), RF=(-.1, -.55, .8), mace=(-.05, .75, .65),
            LU=(-.08, 0, 0), LL=(.1, 0, 0), RU=(-.08, 0, 0), RL=(.1, 0, 0))
SM_HIT = P( spine=(.5, 0, 0), spine1=(.15, 0, 0), spine2=(.3, 0, 0), head=(-.35, 0, 0), hips=(0, -.06 * H, -.05 * H),
             LA=(.3, -.6, -.75), LF=(.1, -.9, -.45), RA=(-.15, -.55, -.8), RF=(-.1, -.7, -.7), mace=(-.1, -.85, -.4),
             LU=(-.5, 0, 0), LL=(.7, 0, 0), RU=(.25, 0, 0), RL=(.35, 0, 0))
@clip('smash_windup', 24, False, 'up')
def smash_windup(u):
    return sample([(0, GUARD, 's'), (.35, SM_LOAD, 's'), (1, SM_UP, 'out')], u)
@clip('smash', 10, False, 'up')
def smash(u):
    return sample([(0, SM_UP, 's'), (.6, SM_HIT, 'in'), (1, add(SM_HIT, spine=(-.03, 0, 0), hips=(0, 0, .01 * H)), 'out')], u)
@clip('recover', 12, False, 'both')
def recover(u):
    return sample([(0, SM_HIT, 's'), (.45, mix(GUARD, SM_HIT, .3), 'out'), (1, GUARD, 's')], u)

# --- hit: o orc recua o tronco e sacode a cabeça ----------------------------------------------------------------------
HIT_BACK = P( spine=(-.3, 0, .1), spine1=(-.08, 0, 0), spine2=(-.2, 0, .12), neck=(-.12, 0, 0), head=(-.22, 0, .3), hips=(0, .045 * H, -.025 * H),
               LA=(.7, .35, -.55), LF=(.35, -.35, -.5), RA=(-.55, .25, -.6), RF=(-.3, -.3, .2), mace=(-.55, .15, .8),
               LU=(.1, 0, 0), RU=(-.18, 0, 0), RL=(.3, 0, 0))
@clip('hit', 8, False, 'both')
def hit(u):
    return sample([(0, GUARD, 's'), (.3, HIT_BACK, 'out'), (1, GUARD, 's')], u)

# --- death: cambaleia, os joelhos cedem e tomba de costas ----------------------------------------------------------------
DEATH_STAGGER = HIT_BACK
DEATH_KNEES = P( spine=(-.05, 0, 0), spine2=(.1, 0, 0), head=(.35, 0, .1), hips=(0, .05 * H, -.3 * H),
                  LA=(.45, -.2, -.9), LF=(.25, -.4, -.8), RA=(-.35, -.25, -.9), RF=(-.2, -.5, -.6), mace=(-.7, -.4, .35),
                  LU=(-1.35, 0, 0), LL=(2.0, 0, 0), RU=(-1.3, 0, 0), RL=(2.0, 0, 0), LFt=(-.5, 0, 0), RFt=(-.5, 0, 0))
DEATH_FLAT = P( spine=(-.45, 0, 0), spine1=(-.2, 0, 0), spine2=(-.3, 0, 0), neck=(-.1, 0, 0), head=(-.25, 0, .25), hips=(0, .24 * H, -.12 * H), hips_rot=(-1.5, 0, 0),
                 LA=(.95, -.1, -.1), LF=(1, .1, -.05), RA=(-.95, .2, .25), RF=(-1, .25, .2), mace=(-1, .3, .4),
                 LU=(-.2, 0, 0), LL=(.35, 0, 0), RU=(-.4, 0, .1), RL=(.4, 0, 0))
@clip('death', 24, False, 'down')
def death(u):
    return sample([(0, GUARD, 's'), (.2, DEATH_STAGGER, 'out'), (.55, DEATH_KNEES, 's'), (1, DEATH_FLAT, 'in')], u)

# --- gravação ---------------------------------------------------------------------------------------------------------
def bake():
    arm.animation_data_create()
    report = {}
    for name, (length, loop, ground, fn) in CLIPS.items():
        old = bpy.data.actions.get(name)
        if old: old.use_fake_user = False; bpy.data.actions.remove(old)
        action = bpy.data.actions.new(name); action.use_fake_user = True
        arm.animation_data.action = action
        floor = []; grip = []
        for f in range(length + 1):
            p = fn(f / length)
            apply(p); hip = Vector(p['hips']); set_hips(hip)
            low = lowest_point(); floor.append(low)
            # Ângulo entre o cabo e o antebraço: abaixo de ~50° o cabo corre dentro do braço em vez de cruzar o punho.
            fore = bone('RightForeArm'); shaft = mace.matrix_world.to_3x3() @ Vector((0, 0, 1))
            ang = math.degrees((fore.tail - fore.head).angle(shaft)); grip.append((min(ang, 180 - ang), f + 1))
            # Pés no chão: 'both' acompanha o chão em ambos os sentidos, 'up' só impede de atravessá-lo, 'down' também (queda no solo).
            if (ground == 'both') or (ground in ('up', 'down') and low < 0):
                hip.z -= low; set_hips(hip)
            for b in arm.pose.bones:
                b.keyframe_insert('rotation_quaternion', frame=f + 1)
                if b.name.endswith('Hips'): b.keyframe_insert('location', frame=f + 1)
        action['loop'] = loop
        # Piso do corpo antes da correção e piso da maça no último quadro (a pancada precisa tocar o chão).
        sc.frame_set(length + 1); bpy.context.view_layer.update()
        ev = mace.evaluated_get(bpy.context.evaluated_depsgraph_get())
        report[name] = (length, round(min(floor), 3), round(max(floor), 3), 'maça z', round(min((ev.matrix_world @ Vector(c)).z for c in ev.bound_box), 3), 'cabo×antebraço mín', tuple(round(x) for x in min(grip)))
    return report

fit_mace()
report = bake()
arm.animation_data.action = bpy.data.actions['idle']
arm.animation_data.action_slot = bpy.data.actions['idle'].slots[0]
sc.frame_start = 1; sc.frame_end = 49; sc.frame_set(1)
print('ORC_MOTION', report)
if EXPORT:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in (arm, *arm.children_recursive): obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=str(BASE / 'exports' / 'v2_enemy_orc.glb'), export_format='GLB', use_selection=True, export_animation_mode='ACTIONS',
                              export_skins=True, export_yup=True, export_force_sampling=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BASE / 'models' / 'v2_enemy_orc.blend'))
    print('ORC_EXPORTED')
