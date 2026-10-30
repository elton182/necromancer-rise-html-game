"""Refaz os clipes do player (necromante, v2) a partir de models/rigged_player.blend, sem alterá-lo.

Uso na raiz do projeto (ou na sessão Blender via MCP com rigged_player.blend aberto):
  blender --background blender/models/rigged_player.blend --python blender/scripts/v2_player_motion.py
Na sessão MCP defina `PLAYER_EXPORT = False` antes para só pré-visualizar; com True (padrão) grava models/v2_player.blend e exports/v2_player.glb.
O rigged_player.blend e o lab_player_current.glb continuam sendo a fonte do pipeline de sprites legado e do laboratório 3D antigo.
Clipes (registro `player` em v2/assets/models.json): idle (2 s), walk (0,667 s, ciclo de 1,5 u), cast (0,375 s) e death (0,8 s).
O motor dispara o feitiço no instante em que `cast` começa e, na carga do Tiro de Osso, mantém o último quadro; por isso `cast` começa quase
no pico do gesto e termina numa pose de canalização com o cajado à frente.
"""
from pathlib import Path
import bpy, math
import numpy as np
from mathutils import Vector, Quaternion, Matrix

BASE = Path(__file__).resolve().parents[1] if '__file__' in globals() else Path(bpy.data.filepath).resolve().parents[1]
EXPORT = globals().get('PLAYER_EXPORT', True)
sc = bpy.context.scene
arm = bpy.data.objects['Armature']
body = next(o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers) and o.name.startswith('tripo'))
staff = bpy.data.objects['ImportedStaff']
SCALE = arm.matrix_world.to_scale()[0]  # o rig vem escalado (≈2,42); poses e deslocamentos são em unidades locais do armature
H = .9  # altura do corpo em unidades locais; deslocamentos são frações dela
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
    b = bone(n); Bw = b.matrix.to_3x3()
    b.rotation_quaternion = (b.rotation_quaternion.to_matrix() @ Bw.inverted() @ dq @ Bw).to_quaternion()
def forearm_axis(side):
    b = bone(side + 'ForeArm'); return (b.tail - b.head).normalized()
def roll_forearm(side, angle):
    # Gira o antebraço em torno do próprio eixo (vira a palma).
    if angle: bpy.context.view_layer.update(); world_rotate(side + 'ForeArm', Quaternion(forearm_axis(side), angle).to_matrix())
def orient_staff(target):
    # Gira a mão até o eixo do cajado (cristal para `STAFF_HEAD` no objeto) apontar para `target`.
    bpy.context.view_layer.update()
    current = (staff.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized()
    world_rotate('RightHand', current.rotation_difference(Vector(target).normalized()).to_matrix())

HIPS_R = bone('Hips').bone.matrix_local.to_3x3()
def set_hips(v):
    bone('Hips').location = HIPS_R.inverted() @ Vector(v)

def local_points():
    # Vértices do corpo na pose atual, em unidades locais do armature.
    bpy.context.view_layer.update()
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co); ev.to_mesh_clear()
    M = np.array(arm.matrix_world.inverted() @ ev.matrix_world)
    return co.reshape(-1, 3) @ M[:3, :3].T + M[:3, 3]
groups = {g.index: g.name for g in body.vertex_groups}
FOOT = np.array([i for i, v in enumerate(body.data.vertices) if v.groups and any(
    k in groups[max(v.groups, key=lambda x: x.weight).group] for k in ('Foot', 'Toe'))])
def lowest(mode):
    pts = local_points()
    return float(pts[FOOT, 2].min()) if mode == 'feet' else float(pts[:, 2].min())

def reset_pose():
    for b in arm.pose.bones:
        b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = Quaternion(); b.location = (0, 0, 0)
def curl_fingers(side, amount=1.0):
    for digit in ('Index', 'Middle', 'Ring', 'Pinky'):
        for joint in (1, 2, 3): rotate(side + 'Hand' + digit + str(joint), (0, 1, 0), (.9 if side == 'Left' else -.9) * amount)
    if side == 'Left' and amount < 1:
        for joint in (1, 2, 3): rotate('LeftHandThumb' + str(joint), (0, 0, 1), -.25 * (1 - amount))

STAFF_REST = Vector((0, -1, .1)).normalized()  # cabo atravessando o punho no sentido dos nós dos dedos
def fit_staff():
    # Cajado: eixo real da malha (cristal no +Z do objeto), empunhadura a 47% do pé (o pé toca o chão na guarda), no centro do punho direito.
    if staff.get('grip_fit'): return
    # A cena de sprites mantém o cajado na vertical com COPY_ROTATION; o glTF não leva restrições, então no v2 o cajado só segue o osso da mão.
    for c in list(staff.constraints): staff.constraints.remove(c)
    reset_pose(); curl_fingers('Right'); bpy.context.view_layer.update()
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh(); pts = []
    for v in me.vertices:
        if v.groups and groups[max(v.groups, key=lambda x: x.weight).group].startswith(('mixamorig:RightHandIndex', 'mixamorig:RightHandMiddle', 'mixamorig:RightHandRing', 'mixamorig:RightHandPinky')):
            pts.append(ev.matrix_world @ v.co)
    ev.to_mesh_clear()
    # Os dedos curvados (em torno de Y) desenham um arco em X–Z: o cabo passa pelo centro do círculo ajustado a eles.
    xz = np.array([(p.x, p.z) for p in pts]); A = np.c_[2 * xz, np.ones(len(xz))]
    cx, cz, _ = np.linalg.lstsq(A, (xz ** 2).sum(axis=1), rcond=None)[0]
    fist = Vector((cx, sum(p.y for p in pts) / len(pts), cz))
    co = np.array([v.co[:] for v in staff.data.vertices]); mean = co.mean(axis=0)
    axis = np.linalg.eigh(np.cov((co - mean).T))[1][:, -1]; t = (co - mean) @ axis
    width = np.linalg.norm((co - mean) - np.outer(t, axis), axis=1); span = t.max() - t.min()
    if width[t < t.min() + .12 * span].max() > width[t > t.max() - .12 * span].max(): axis = -axis; t = -t  # o cristal (lado largo) é a cabeça
    grip = mean + axis * (t.min() + .47 * span)
    staff.data.transform(Vector(axis).rotation_difference(Vector((0, 0, 1))).to_matrix().to_4x4() @ Matrix.Translation(-Vector(grip)))
    bpy.context.view_layer.update()
    staff.matrix_world = Matrix.Translation(fist) @ Vector((0, 0, 1)).rotation_difference(STAFF_REST).to_matrix().to_4x4() @ Matrix.Scale(SCALE, 4)
    staff['grip_fit'] = 1

# --- poses ---------------------------------------------------------------------------------------------------
# Direções de mundo: frente = -Y, trás = +Y, esquerda do player = +X, direita (mão do cajado) = -X, cima = +Z.
GUARD = dict(
    hips=(0, 0, 0), hips_rot=(0, 0, 0),
    spine=(.02, 0, 0), spine1=(0, 0, 0), spine2=(.02, 0, 0), neck=(0, 0, 0), head=(-.02, 0, 0),
    LA=(.15, -.05, -1), LF=(.1, -.35, -.9), lroll=(0, 0, 0), open=(.4, 0, 0),
    RA=(-.12, -.15, -1), RF=(-.1, -.75, -.5), staff=(0, -.04, 1),
    LU=(0, 0, 0), LL=(0, 0, 0), LFt=(0, 0, 0), RU=(0, 0, 0), RL=(0, 0, 0), RFt=(0, 0, 0))
def P(**kw):
    p = dict(GUARD); p.update(kw); return p
def add(p, **kw):
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
    # O cabo atravessa o punho: o antebraço não pode ficar alinhado com o cajado.
    f = Vector(fore).normalized(); m = Vector(shaft).normalized(); ang = f.angle(m); target = min(GRIP_MAX, max(GRIP_MIN, ang))
    if target == ang: return f
    n = m.cross(f)
    if n.length < 1e-4: n = m.cross(Vector((0, -1, 0)))
    if n.length < 1e-4: n = m.cross(Vector((1, 0, 0)))
    return Quaternion(n.normalized(), target) @ m

LEG_CLOSE = .12  # o modelo nasce com as pernas abertas (pés a ±0,27 u contra quadris a ±0,15); aproxima as coxas da linha do corpo
def apply(p):
    reset_pose()
    euler('Hips', p['hips_rot'])
    for n in ('spine', 'spine1', 'spine2', 'neck', 'head'): euler(n.capitalize(), p[n])
    for side, key in (('Left', 'L'), ('Right', 'R')):
        u = p[key + 'U']; euler(side + 'UpLeg', (u[0], u[1] + (LEG_CLOSE if side == 'Left' else -LEG_CLOSE), u[2])); euler(side + 'Leg', p[key + 'L']); euler(side + 'Foot', p[key + 'Ft'])
    curl_fingers('Left', 1 - p['open'][0]); curl_fingers('Right')
    aim('LeftArm', p['LA']); aim('LeftForeArm', p['LF']); roll_forearm('Left', p['lroll'][0])
    aim('RightArm', p['RA']); aim('RightForeArm', clamp_forearm(p['RF'], p['staff']))
    orient_staff(p['staff'])

CLIPS = {}
def clip(name, length, loop, ground):
    def wrap(fn): CLIPS[name] = (length, loop, ground, fn); return fn
    return wrap

# --- idle: respiração lenta, peso trocando de pé, capuz e cristal oscilando de leve --------------------------------------
@clip('idle', 48, True, 'feet')
def idle(u):
    s = math.sin(TAU * u); c = math.cos(TAU * u)
    p = add(GUARD, spine1=(.015 * s, 0, .012 * c), spine2=(.03 * s, 0, -.015 * c), neck=(-.015 * s, 0, 0), head=(-.025 * s, 0, .04 * c),
            hips_rot=(0, 0, .02 * c), LA=(.02 * s, .03 * s, .01 * s), LF=(0, .03 * c, .02 * s), RF=(0, .02 * c, 0), staff=(.015 * s, .02 * c, 0),
            LU=(.03 * c, 0, 0), RU=(-.03 * c, 0, 0))
    p['hips'] = (.008 * H * c, 0, -.005 * H * (1 - s * s))
    return p

# --- walk: passada de 1,5 u por ciclo, cajado carregado na mão direita, braço livre balançando ----------------------------------
@clip('walk', 16, True, 'feet')
def walk(u):
    s = math.sin(TAU * u); c = math.cos(TAU * u); b2 = math.cos(2 * TAU * u)
    def leg(sn, cn):
        thigh = .38 * sn                       # + = para trás
        knee = .6 * max(0, -cn) + .08          # dobra quando a coxa vai à frente
        foot = -(thigh + knee) * .85 + .18 * max(0, cn)
        return (thigh, 0, 0), (knee, 0, 0), (foot, 0, 0)
    LU, LL, LFt = leg(s, c); RU, RL, RFt = leg(-s, -c)
    p = add(GUARD, LU=LU, LL=LL, LFt=LFt, RU=RU, RL=RL, RFt=RFt,
            hips_rot=(0, .03 * s, .08 * s), spine=(.05 + .02 * b2, 0, -.09 * s), spine1=(0, 0, -.04 * s), spine2=(0, 0, -.03 * s),
            head=(.02 * b2, 0, .09 * s),
            LA=(0, -.4 * s, .02 * b2), LF=(0, -.12 * s, 0), RA=(0, .12 * s, 0), RF=(0, .05 * s, 0), staff=(0, .08 * s, .02 * c))
    p['hips'] = (.025 * H * s, 0, .015 * H * b2)
    return p

# --- cast: gesto rápido; o cajado aponta para o alvo, a mão livre abre a palma à frente --------------------------------------
CAST_PEAK = P(spine=(.14, 0, .12), spine1=(.04, 0, .06), spine2=(.1, 0, .12), neck=(-.04, 0, 0), head=(-.1, 0, -.1), hips_rot=(0, 0, .06), hips=(0, -.02 * H, -.012 * H),
              LA=(.3, -.8, .15), LF=(.15, -1, .25), lroll=(.6, 0, 0), open=(1, 0, 0),
              RA=(-.1, -.8, -.3), RF=(-.1, -1, .1), staff=(-.05, -.85, .5),
              LU=(-.2, 0, 0), LL=(.25, 0, 0), RU=(.18, 0, 0), RL=(.18, 0, 0))
CAST_HOLD = add(CAST_PEAK, spine=(-.03, 0, 0), spine2=(-.02, 0, 0), LA=(.02, .05, 0), RA=(.03, .03, 0), staff=(0, .05, .05))
CAST_WIND = P(spine=(-.03, 0, -.1), spine2=(-.02, 0, -.1), head=(0, 0, .08), hips_rot=(0, 0, -.04),
              LA=(.25, -.25, -.7), LF=(.1, -.5, .3), open=(.7, 0, 0), RA=(-.15, -.3, -.8), RF=(-.1, -.8, -.2), staff=(-.05, -.2, .95))
@clip('cast', 9, False, 'feet')
def cast(u):
    return sample([(0, mix(CAST_WIND, CAST_PEAK, .65), 's'), (.25, CAST_PEAK, 'out'), (.7, CAST_HOLD, 's'), (1, CAST_HOLD, 's')], u)

# --- death: cambaleia, os joelhos cedem e tomba de costas, cajado caindo ao lado ------------------------------------------------
DEATH_STAGGER = P(spine=(-.2, 0, .08), spine1=(-.05, 0, 0), spine2=(-.12, 0, .1), neck=(-.08, 0, 0), head=(-.18, 0, .25), hips=(0, .03 * H, -.015 * H),
                  LA=(.45, .25, -.6), LF=(.25, -.2, -.5), open=(1, 0, 0), RA=(-.3, .15, -.8), RF=(-.2, -.4, -.2), staff=(-.3, .3, .9),
                  LU=(.08, 0, 0), RU=(-.12, 0, 0), RL=(.2, 0, 0))
DEATH_KNEES = P(spine=(-.05, 0, 0), spine2=(.08, 0, 0), head=(.3, 0, .1), hips=(0, .04 * H, -.27 * H),
                LA=(.4, -.2, -.9), LF=(.2, -.35, -.8), open=(1, 0, 0), RA=(-.3, -.1, -.9), RF=(-.2, -.4, -.6), staff=(-.6, .3, .7),
                LU=(-1.3, 0, 0), LL=(1.9, 0, 0), RU=(-1.25, 0, 0), RL=(1.9, 0, 0), LFt=(-.5, 0, 0), RFt=(-.5, 0, 0))
DEATH_FLAT = P(spine=(-.35, 0, 0), spine1=(-.12, 0, 0), spine2=(-.2, 0, 0), neck=(-.1, 0, 0), head=(-.2, 0, .25), hips=(0, .24 * H, -.1 * H), hips_rot=(-1.5, 0, 0),
               LA=(.95, .1, .1), LF=(1, .15, .1), open=(1, 0, 0), RA=(-.95, .2, .2), RF=(-1, .25, .15), staff=(-1, .3, .3),
               LU=(-.2, 0, 0), LL=(.35, 0, 0), RU=(-.4, 0, .1), RL=(.4, 0, 0))
@clip('death', 19, False, 'mesh')
def death(u):
    return sample([(0, GUARD, 's'), (.2, DEATH_STAGGER, 'out'), (.55, DEATH_KNEES, 's'), (1, DEATH_FLAT, 'in')], u)

# --- gravação ---------------------------------------------------------------------------------------------------------
def bake():
    arm.animation_data_create()
    arm.animation_data.action = None
    for old in list(bpy.data.actions): old.use_fake_user = False; bpy.data.actions.remove(old)
    arm.data.pose_position = 'REST'; rest_feet = lowest('feet'); rest_mesh = lowest('mesh'); arm.data.pose_position = 'POSE'
    report = {}
    for name, (length, loop, ground, fn) in CLIPS.items():
        action = bpy.data.actions.new(name); action.use_fake_user = True
        arm.animation_data.action = action
        grip = []; height = []
        for f in range(length + 1):
            p = fn(f / length)
            apply(p); hip = Vector(p['hips']); set_hips(hip)
            # Pés no chão (o robe passa abaixo do chão no repouso, então os pés é que valem); na queda vale o corpo todo.
            low = lowest(ground) - (rest_feet if ground == 'feet' else rest_mesh)
            hip.z -= low; set_hips(hip)
            pts = local_points(); height.append(float(pts[:, 2].max() - pts[:, 2].min()))
            fore = bone('RightForeArm'); shaft = staff.matrix_world.to_3x3() @ Vector((0, 0, 1))
            ang = math.degrees((fore.tail - fore.head).angle(shaft)); grip.append(ang)
            for b in arm.pose.bones:
                b.keyframe_insert('rotation_quaternion', frame=f + 1)
                if b.name.endswith('Hips'): b.keyframe_insert('location', frame=f + 1)
        action['loop'] = loop
        report[name] = (length, 'cajado×antebraço', (round(min(grip)), round(max(grip))), 'altura', (round(min(height) * SCALE, 3), round(max(height) * SCALE, 3)))
    return report

fit_staff()
report = bake()
arm.animation_data.action = bpy.data.actions['idle']
arm.animation_data.action_slot = bpy.data.actions['idle'].slots[0]
sc.frame_start = 1; sc.frame_end = 49; sc.render.fps = 24; sc.frame_set(1)
print('PLAYER_MOTION', report)
if EXPORT:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in sc.objects:
        # A cena contém uma esfera auxiliar sem material, fora do rig.
        if obj.type in ('MESH', 'ARMATURE', 'EMPTY') and not obj.hide_render and obj.name != 'Icosphere':
            obj.hide_set(False); obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=str(BASE / 'exports' / 'v2_player.glb'), export_format='GLB', use_selection=True, export_animation_mode='ACTIONS',
                              export_skins=True, export_yup=True, export_force_sampling=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BASE / 'models' / 'v2_player.blend'))
    print('PLAYER_EXPORTED')
