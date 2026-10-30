"""Refaz os clipes do Guerreiro (cavaleiro, v2) sobre models/v2_enemy_knight.blend.

Uso na raiz do projeto (ou na sessão Blender via MCP com o .blend aberto):
  blender --background blender/models/v2_enemy_knight.blend --python blender/scripts/v2_enemy_knight_motion.py
Na sessão MCP defina `KNIGHT_EXPORT = False` antes para só pré-visualizar; com True (padrão) salva o .blend e o .glb.
Clipes (nomes e comprimentos do registro `warrior` em v2/assets/models.json): idle, walk, attack, heavy_windup, heavy_attack, recover, hit, death.
O motor usa `attack` a partir do contato (dano imediato), `heavy_windup` durante os 2 s do corte em arco (o contato é o último quadro),
`heavy_attack` como continuação do corte e `recover` na volta à guarda.
"""
from pathlib import Path
import bpy, math
import numpy as np
from mathutils import Vector, Quaternion, Matrix

BASE = Path(__file__).resolve().parents[1] if '__file__' in globals() else Path(bpy.data.filepath).resolve().parents[1]
EXPORT = globals().get('KNIGHT_EXPORT', True)
arm = bpy.data.objects['V2Enemy_knight']
sc = next(s for s in bpy.data.scenes if arm.name in s.objects)
body = bpy.data.objects['KnightBody']
sword = bpy.data.objects['KnightSword']
shield = bpy.data.objects['KnightShield']
H = .94  # altura do corpo em unidades do modelo; deslocamentos são frações dela
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
def world_rotate(n, dq):
    # Aplica uma rotação de mundo `dq` (3x3) ao osso, mantendo o pai como está.
    b = bone(n); Bw = arm.matrix_world.to_3x3() @ b.matrix.to_3x3()
    b.rotation_quaternion = (b.rotation_quaternion.to_matrix() @ Bw.inverted() @ dq @ Bw).to_quaternion()
def orient_sword(target):
    # Gira a mão até o eixo da lâmina (ponta para +Z do objeto) apontar para `target`.
    bpy.context.view_layer.update()
    current = (sword.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized()
    world_rotate('RightHand', current.rotation_difference(Vector(target).normalized()).to_matrix())
def twist_shield(target):
    # O escudo está preso ao antebraço: só pode girar em torno dele. Leva a face externa o mais perto possível de `target`.
    bpy.context.view_layer.update()
    b = bone('LeftForeArm'); d = (arm.matrix_world.to_3x3() @ (b.tail - b.head)).normalized()
    n = (shield.matrix_world.to_3x3() @ Vector(shield['outer_normal'])).normalized(); t = Vector(target).normalized()
    n -= d * n.dot(d); t -= d * t.dot(d)
    if n.length < 1e-4 or t.length < 1e-4: return
    n.normalize(); t.normalize()
    world_rotate('LeftForeArm', Quaternion(d, math.atan2(d.dot(n.cross(t)), n.dot(t))).to_matrix())

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

def reset_pose():
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = Quaternion(); b.location = (0, 0, 0)
def curl_fingers(side):
    for digit in ('Index', 'Middle', 'Ring', 'Pinky'):
        for joint in (1, 2, 3): rotate(side + 'Hand' + digit + str(joint), (0, 1, 0), .9 if side == 'Left' else -.9)
def fist_center(side):
    bpy.context.view_layer.update()
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    groups = {g.index: g.name for g in body.vertex_groups}; pts = []
    for v in me.vertices:
        if v.groups:
            g = max(v.groups, key=lambda x: x.weight)
            if groups[g.group].startswith('mixamorig:' + side + 'Hand'): pts.append(ev.matrix_world @ v.co)
    ev.to_mesh_clear()
    return sum(pts, Vector()) / len(pts)

BLADE_REST = Vector((-.35, -.93, .1)).normalized()  # lâmina no repouso: para a frente e um pouco para os dedos
def fit_equipment():
    # Espada: eixo real da malha (ponta no +Z do objeto), empunhadura a 16% do cabo (entre pomo e guarda) no centro do punho fechado.
    # Escudo: só registra a normal externa (lado do umbo) em `outer_normal`; a posição atual no antebraço é mantida.
    if not sword.get('grip_fit'):
        reset_pose(); curl_fingers('Right'); fist = fist_center('Right')
        co = np.array([v.co[:] for v in sword.data.vertices]); mean = co.mean(axis=0)
        axis = np.linalg.eigh(np.cov((co - mean).T))[1][:, -1]; t = (co - mean) @ axis
        width = np.linalg.norm((co - mean) - np.outer(t, axis), axis=1); span = t.max() - t.min()
        guard_end = t[width > .8 * width.max()].mean()  # a guarda (parte mais larga) fica perto do pomo; a ponta é o lado oposto
        if guard_end > t.mean(): axis = -axis; t = -t
        grip = mean + axis * (t.min() + .16 * span)
        sword.data.transform(Vector(axis).rotation_difference(Vector((0, 0, 1))).to_matrix().to_4x4() @ Matrix.Translation(-Vector(grip)))
        bpy.context.view_layer.update()
        sword.matrix_world = Matrix.Translation(fist) @ Vector((0, 0, 1)).rotation_difference(BLADE_REST).to_matrix().to_4x4()
        sword['grip_fit'] = 1
    if not shield.get('outer_normal'):
        co = np.array([v.co[:] for v in shield.data.vertices]); mean = co.mean(axis=0)
        vals, axes = np.linalg.eigh(np.cov((co - mean).T)); normal = axes[:, 0]
        along = (co - mean) @ normal; inplane = np.linalg.norm((co - mean) - np.outer(along, normal), axis=1)
        centre = along[inplane < .3 * inplane.max()].mean(); rim = along[inplane > .8 * inplane.max()].mean()
        shield['outer_normal'] = tuple(float(x) for x in (normal if centre > rim else -normal))
    if not shield.get('grip_fit'):
        # O punho esquerdo precisa ficar atrás do escudo: centraliza o disco no punho fechado e o afasta ao longo da normal externa até a
        # face interna passar da parte mais avançada da mão.
        reset_pose(); curl_fingers('Left'); bpy.context.view_layer.update()
        ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
        groups = {g.index: g.name for g in body.vertex_groups}; hand = []
        for v in me.vertices:
            if v.groups:
                g = max(v.groups, key=lambda x: x.weight)
                if groups[g.group].startswith('mixamorig:LeftHand'): hand.append(ev.matrix_world @ v.co)
        ev.to_mesh_clear(); fist = sum(hand, Vector()) / len(hand)
        n = (shield.matrix_world.to_3x3() @ Vector(shield['outer_normal'])).normalized()
        pts = [shield.matrix_world @ v.co for v in shield.data.vertices]; centre = sum(pts, Vector()) / len(pts)
        radius = max(((p - centre) - n * (p - centre).dot(n)).length for p in pts)
        inner = min((p - centre).dot(n) for p in pts if ((p - centre) - n * (p - centre).dot(n)).length < .35 * radius)
        reach = float(np.percentile([(p - fist).dot(n) for p in hand], 75))  # dedos soltos à frente não decidem a distância
        distance = reach + .01 - inner
        shield.matrix_world = Matrix.Translation(fist + n * distance - centre) @ shield.matrix_world
        shield['grip_fit'] = 1

# --- poses ---------------------------------------------------------------------------------------------------
# Direções de mundo: frente = -Y, trás = +Y, esquerda do cavaleiro = +X (escudo), direita = -X (espada), cima = +Z.
GUARD = dict(
    hips=(0, 0, 0), hips_rot=(0, 0, 0),
    spine=(.04, 0, 0), spine1=(0, 0, 0), spine2=(.03, 0, 0), neck=(0, 0, 0), head=(-.03, 0, 0),
    LA=(.35, -.25, -.9), LF=(.15, -.85, .3), shield=(.45, -.9, .1),
    RA=(-.3, -.2, -1), RF=(-.15, -.6, .45), blade=(-.1, -.35, .93),
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

GRIP_MIN, GRIP_MAX = math.radians(35), math.radians(115)
def clamp_forearm(fore, blade):
    # O punho segura o cabo com a lâmina saindo para a frente: o antebraço não pode ficar alinhado nem oposto à lâmina.
    f = Vector(fore).normalized(); m = Vector(blade).normalized(); ang = f.angle(m); target = min(GRIP_MAX, max(GRIP_MIN, ang))
    if target == ang: return f
    n = m.cross(f)
    if n.length < 1e-4: n = m.cross(Vector((0, -1, 0)))
    if n.length < 1e-4: n = m.cross(Vector((1, 0, 0)))
    return Quaternion(n.normalized(), target) @ m

def apply(p):
    reset_pose()
    euler('Hips', p['hips_rot'])
    for n in ('spine', 'spine1', 'spine2', 'neck', 'head'): euler(n.capitalize(), p[n])
    for side, key in (('Left', 'L'), ('Right', 'R')):
        euler(side + 'UpLeg', p[key + 'U']); euler(side + 'Leg', p[key + 'L']); euler(side + 'Foot', p[key + 'Ft'])
        curl_fingers(side)
    aim('LeftArm', p['LA']); aim('LeftForeArm', p['LF']); twist_shield(p['shield'])
    aim('RightArm', p['RA']); aim('RightForeArm', clamp_forearm(p['RF'], p['blade']))
    orient_sword(p['blade'])

CLIPS = {}
def clip(name, length, loop, ground):
    def wrap(fn): CLIPS[name] = (length, loop, ground, fn); return fn
    return wrap

# --- idle: respiração, peso trocando de pé, escudo e espada oscilando de leve ----------------------------------------------
@clip('idle', 48, True, 'both')
def idle(u):
    s = math.sin(TAU * u); c = math.cos(TAU * u)
    p = add(GUARD, spine1=(.02 * s, 0, .015 * c), spine2=(.035 * s, 0, -.02 * c), neck=(-.02 * s, 0, 0), head=(-.03 * s, 0, .04 * c),
            hips_rot=(0, 0, .025 * c), LA=(0, .03 * s, .02 * s), LF=(0, .03 * c, .03 * s), RF=(0, .03 * c, 0), blade=(.03 * s, .04 * c, .01 * s),
            LU=(.035 * c, 0, 0), RU=(-.035 * c, 0, 0))
    p['hips'] = (.01 * H * c, 0, -.007 * H * (1 - s * s))
    return p

# --- walk: marcha firme, escudo e espada estáveis na guarda -----------------------------------------------------------------
@clip('walk', 24, True, 'both')
def walk(u):
    s = math.sin(TAU * u); c = math.cos(TAU * u)
    def leg(sn, cn):
        thigh = .5 * sn                        # + = para trás
        knee = .75 * max(0, -cn) + .1          # dobra quando a coxa vai à frente
        foot = -(thigh + knee) * .85 + .2 * max(0, cn)
        return (thigh, 0, 0), (knee, 0, 0), (foot, 0, 0)
    LU, LL, LFt = leg(s, c); RU, RL, RFt = leg(-s, -c)
    p = add(GUARD, LU=LU, LL=LL, LFt=LFt, RU=RU, RL=RL, RFt=RFt,
            hips_rot=(0, .03 * s, .09 * s), spine=(.03 * math.cos(2 * TAU * u), 0, -.1 * s), spine1=(0, 0, -.04 * s), spine2=(0, 0, -.03 * s),
            head=(.02 * math.cos(2 * TAU * u), 0, .1 * s),
            LA=(0, -.18 * s, .03 * math.cos(2 * TAU * u)), LF=(0, -.08 * s, 0), RA=(0, .22 * s, 0), RF=(0, .08 * s, 0), blade=(0, .1 * s, .04 * c))
    p['hips'] = (.03 * H * s, 0, .018 * H * math.cos(2 * TAU * u))
    return p

# --- attack: golpe curto de contato (começa no contato e volta à guarda) ---------------------------------------------------
ATK_CONTACT = P(spine=(.2, 0, .2), spine1=(.05, 0, .1), spine2=(.1, 0, .18), head=(-.08, 0, -.15), hips_rot=(0, 0, .1), hips=(0, -.03 * H, -.025 * H),
                LA=(.5, -.2, -.8), LF=(.3, -.5, .7), shield=(.9, -.4, .1),
                RA=(-.15, -.85, -.35), RF=(-.1, -1, .15), blade=(.15, -.9, -.4),
                LU=(-.35, 0, 0), LL=(.4, 0, 0), RU=(.3, 0, 0), RL=(.3, 0, 0))
ATK_THROUGH = P(spine=(.24, 0, .3), spine1=(.05, 0, .12), spine2=(.12, 0, .26), head=(-.08, 0, -.2), hips_rot=(0, 0, .14), hips=(0, -.035 * H, -.03 * H),
                LA=(.55, -.1, -.75), LF=(.35, -.4, .7), shield=(1, -.2, .1),
                RA=(.05, -.7, -.6), RF=(.3, -.9, -.2), blade=(.8, -.55, -.35),
                LU=(-.35, 0, 0), LL=(.4, 0, 0), RU=(.3, 0, 0), RL=(.3, 0, 0))
@clip('attack', 18, False, 'both')
def attack(u):
    return sample([(0, ATK_CONTACT, 's'), (.3, ATK_THROUGH, 'out'), (1, GUARD, 's')], u)

# --- heavy_windup / heavy_attack / recover: corte em arco de 135° ---------------------------------------------------------
HW_RAISE = P(spine=(-.12, 0, -.22), spine1=(-.04, 0, -.08), spine2=(-.06, 0, -.15), head=(.02, 0, .15), hips=(0, .015 * H, 0), hips_rot=(0, 0, -.08),
             LA=(.5, -.3, -.7), LF=(.3, -.55, .75), shield=(.8, -.7, .1),
             RA=(-.55, .1, .85), RF=(-.2, -.1, 1), blade=(-.15, .75, .65),
             LU=(.1, 0, 0), RU=(-.15, 0, 0), RL=(.15, 0, 0))
HW_HOLD = add(HW_RAISE, spine=(-.03, 0, 0), RA=(-.05, 0, .05), blade=(0, .05, .02))
HW_CUT = P(spine=(.22, 0, .22), spine1=(.05, 0, .1), spine2=(.12, 0, .22), head=(-.1, 0, -.18), hips_rot=(0, 0, .12), hips=(0, -.04 * H, -.03 * H),
           LA=(.5, -.15, -.8), LF=(.3, -.45, .7), shield=(.95, -.35, .1),
           RA=(-.1, -.85, -.1), RF=(-.05, -1, -.05), blade=(.55, -.8, -.2),
           LU=(-.4, 0, 0), LL=(.45, 0, 0), RU=(.3, 0, 0), RL=(.3, 0, 0))
HA_THROUGH = P(spine=(.28, 0, .5), spine1=(.06, 0, .2), spine2=(.14, 0, .4), head=(-.1, 0, -.3), hips_rot=(0, 0, .22), hips=(0, -.045 * H, -.035 * H),
               LA=(.6, 0, -.8), LF=(.4, -.3, .7), shield=(1, 0, .1),
               RA=(.55, -.5, -.35), RF=(.9, -.45, -.2), blade=(1, -.15, -.3),
               LU=(-.4, 0, 0), LL=(.45, 0, 0), RU=(.3, 0, 0), RL=(.3, 0, 0))
@clip('heavy_windup', 18, False, 'both')
def heavy_windup(u):
    return sample([(0, GUARD, 's'), (.35, HW_RAISE, 'out'), (.72, HW_HOLD, 'lin'), (1, HW_CUT, 'in')], u)
@clip('heavy_attack', 12, False, 'both')
def heavy_attack(u):
    return sample([(0, HW_CUT, 's'), (1, HA_THROUGH, 'out')], u)
@clip('recover', 12, False, 'both')
def recover(u):
    return sample([(0, HA_THROUGH, 's'), (.5, mix(GUARD, HA_THROUGH, .3), 'out'), (1, GUARD, 's')], u)

# --- hit: o tronco recua e o escudo sobe ------------------------------------------------------------------------------------
HIT_BACK = P(spine=(-.22, 0, .08), spine1=(-.06, 0, 0), spine2=(-.14, 0, .1), neck=(-.08, 0, 0), head=(-.16, 0, .25), hips=(0, .035 * H, -.02 * H),
             LA=(.4, -.2, -.5), LF=(.1, -.4, .9), shield=(.3, -1, .2),
             RA=(-.45, .15, -.7), RF=(-.2, -.3, .3), blade=(-.45, .1, .85),
             LU=(.08, 0, 0), RU=(-.14, 0, 0), RL=(.25, 0, 0))
@clip('hit', 8, False, 'both')
def hit(u):
    return sample([(0, GUARD, 's'), (.3, HIT_BACK, 'out'), (1, GUARD, 's')], u)

# --- death: cambaleia, os joelhos cedem e tomba de costas ----------------------------------------------------------------------
DEATH_KNEES = P(spine=(-.05, 0, 0), spine2=(.1, 0, 0), head=(.3, 0, .1), hips=(0, .05 * H, -.3 * H),
                LA=(.45, -.2, -.9), LF=(.25, -.4, -.8), shield=(.9, -.1, -.3),
                RA=(-.35, -.25, -.9), RF=(-.2, -.5, -.6), blade=(-.7, -.4, .35),
                LU=(-1.35, 0, 0), LL=(2.0, 0, 0), RU=(-1.3, 0, 0), RL=(2.0, 0, 0), LFt=(-.5, 0, 0), RFt=(-.5, 0, 0))
DEATH_FLAT = P(spine=(-.4, 0, 0), spine1=(-.15, 0, 0), spine2=(-.25, 0, 0), neck=(-.1, 0, 0), head=(-.25, 0, .25), hips=(0, .24 * H, -.12 * H), hips_rot=(-1.5, 0, 0),
               LA=(.95, -.1, .15), LF=(1, .1, .1), shield=(0, 0, 1),
               RA=(-.95, .2, .25), RF=(-1, .25, .2), blade=(-1, .3, .4),
               LU=(-.2, 0, 0), LL=(.35, 0, 0), RU=(-.4, 0, .1), RL=(.4, 0, 0))
@clip('death', 24, False, 'both')
def death(u):
    return sample([(0, GUARD, 's'), (.2, HIT_BACK, 'out'), (.55, DEATH_KNEES, 's'), (1, DEATH_FLAT, 'in')], u)

# --- gravação ---------------------------------------------------------------------------------------------------------
def bake():
    arm.animation_data_create()
    for track in list(arm.animation_data.nla_tracks): arm.animation_data.nla_tracks.remove(track)
    arm.animation_data.action = None
    for old in list(bpy.data.actions): old.use_fake_user = False; bpy.data.actions.remove(old)
    report = {}
    for name, (length, loop, ground, fn) in CLIPS.items():
        action = bpy.data.actions.new(name); action.use_fake_user = True
        arm.animation_data.action = action
        floor = []; grip = []
        for f in range(length + 1):
            p = fn(f / length)
            apply(p); hip = Vector(p['hips']); set_hips(hip)
            low = lowest_point(); floor.append(low)
            # Ângulo entre a lâmina e o antebraço (o encaixe do punho exige uma faixa estreita).
            fore = bone('RightForeArm'); blade = sword.matrix_world.to_3x3() @ Vector((0, 0, 1))
            grip.append((math.degrees((fore.tail - fore.head).angle(blade)), f + 1))            # Pés no chão: 'both' acompanha o chão em ambos os sentidos, 'down' só o impede de atravessá-lo (não usado no cavaleiro).
            if ground == 'both' or (ground == 'down' and low < 0):
                hip.z -= low; set_hips(hip)
            for b in arm.pose.bones:
                b.keyframe_insert('rotation_quaternion', frame=f + 1)
                if b.name.endswith('Hips'): b.keyframe_insert('location', frame=f + 1)
        action['loop'] = loop
        report[name] = (length, round(min(floor), 3), 'lâmina×antebraço', (round(min(a for a, _ in grip)), round(max(a for a, _ in grip))))
    return report

fit_equipment()
report = bake()
arm.animation_data.action = bpy.data.actions['idle']
arm.animation_data.action_slot = bpy.data.actions['idle'].slots[0]
sc.frame_start = 1; sc.frame_end = 49; sc.frame_set(1)
print('KNIGHT_MOTION', report)
if EXPORT:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in (arm, *arm.children_recursive): obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=str(BASE / 'exports' / 'v2_enemy_knight.glb'), export_format='GLB', use_selection=True, export_animation_mode='ACTIONS',
                              export_skins=True, export_yup=True, export_force_sampling=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BASE / 'models' / 'v2_enemy_knight.blend'))
    print('KNIGHT_EXPORTED')
