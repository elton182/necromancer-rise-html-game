"""Refaz os clipes do lobo (Cão de Cripta, v2) sobre o modelo já montado em models/v2_enemy_wolf.blend.

Uso na raiz do projeto:
  blender --background blender/models/v2_enemy_wolf.blend --python blender/scripts/v2_enemy_wolf_motion.py
Na sessão MCP, execute com `WOLF_EXPORT = False` nos globais para só pré-visualizar; com True (padrão) salva o .blend e o .glb.
O modelo-base (malha e rig importados) vem de imported_enemy_beasts.py -- --character=wolf, que grava clipes provisórios.

Clipes: idle, walk, attack, hit, death, recover, windup, charge, howl (nomes exigidos em v2/assets/models.json).
Patas por IK em coordenadas do armature: frente = -Y, esquerda do lobo = +X, cima = +Z; rotações (pitch, roll, yaw) em torno de X, Y e Z.
Pitch positivo abaixa o focinho, roll positivo inclina o topo para a esquerda e yaw positivo vira o focinho para a esquerda.
O clipe `walk` é a corrida do lobo, um galope com fase de voo e pata parada no chão durante o apoio: para o pé não deslizar no jogo, `stride`
em v2/assets/models.json precisa valer STRIDE × escala do modelo (height / altura do bind, 0,465).
"""
from pathlib import Path
import bpy, math
import numpy as np
from mathutils import Vector, Quaternion, Matrix

BASE = Path(__file__).resolve().parents[1]
EXPORT = globals().get('WOLF_EXPORT', True)
TAU = math.tau
arm = bpy.data.objects['Armature']
body = bpy.data.objects['WolfBody']
sc = arm.users_scene[0]
bones = arm.pose.bones

ROOT, SPINE0, SPINE1, SPINE2 = 'tripo::Root', 'tripo::Spine_0', 'tripo::Spine_1', 'tripo::Spine_2'
AXIS_BONES = dict(s0=SPINE0, s1=SPINE1, s2=SPINE2, neck='tripo::Head_0', head='tripo::Head_1', jaw='bone_18', t0='bone_29', t1='bone_30', t2='bone_31')
LEGS = {
    'FL': dict(upper='bone_5', lower='tripo::0_Left_Limb_0', foot='tripo::0_Left_Limb_1', toes=('bone_8', 'bone_9', 'tripo::0_Left_Limb_2')),
    'FR': dict(upper='tripo::0_Right_Limb_0', lower='tripo::0_Right_Limb_1', foot='tripo::0_Right_Limb_2', toes=('bone_14', 'bone_15', 'tripo::0_Right_Limb_3')),
    'HL': dict(upper='tripo::1_Left_Limb_0', lower='tripo::1_Left_Limb_1', meta='tripo::1_Left_Limb_2', foot='tripo::1_Left_Limb_3', toes=('tripo::1_Left_Limb_4',)),
    'HR': dict(upper='tripo::1_Right_Limb_0', lower='tripo::1_Right_Limb_1', meta='tripo::1_Right_Limb_2', foot='tripo::1_Right_Limb_3', toes=('tripo::1_Right_Limb_4',)),
}
# Do ponto de contato (a almofada da pata) até o início do osso da pata, com a pata plana: é em torno desse ponto que o calcanhar sobe.
CONTACT_TO_FOOT = {'F': Vector((0, .042, .032)), 'H': Vector((0, .04, .055))}
BODY_PIVOT = Vector((0, -.12, .28))
ERROR = {}

for b in bones: b.rotation_mode = 'QUATERNION'

def fix_leg_weights():
    # O rig importado pesa parte da pata traseira esquerda em ossos da pata dianteira, a ~0,4 de distância: com a passada, a malha vira uma lâmina.
    # Cada osso de perna só influencia vértices próximos; o peso retirado volta ao maior peso que restou no vértice. Idempotente.
    leg_groups = {n for leg in LEGS.values() for key, value in leg.items() for n in ((value,) if isinstance(value, str) else value)}
    names = {g.index: g.name for g in body.vertex_groups}
    fixed = 0
    for v in body.data.vertices:
        far, kept = [], []
        for g in v.groups:
            name = names[g.group]; bone = arm.data.bones.get(name)
            if name in leg_groups and bone:
                a, c = bone.head_local, bone.tail_local; ab = c - a
                t = max(0, min(1, (v.co - a).dot(ab) / max(ab.dot(ab), 1e-9)))
                if (v.co - (a + ab * t)).length > .12: far.append(g); continue
            kept.append(g)
        if far and kept:
            total = sum(g.weight for g in far); strongest = max(kept, key=lambda g: g.weight)
            new_weight = strongest.weight + total
            for g in far: body.vertex_groups[g.group].remove([v.index])
            body.vertex_groups[strongest.group].add([v.index], new_weight, 'REPLACE')
            fixed += 1
    return fixed

# --- FK / IK ---------------------------------------------------------------------------------------------------------
def rx(a): return Matrix.Rotation(a, 3, 'X')
def euler(e): return Matrix.Rotation(e[0], 3, 'X') @ Matrix.Rotation(e[1], 3, 'Y') @ Matrix.Rotation(e[2], 3, 'Z')
def pose_matrix(b):
    local = Matrix.Translation(b.location) @ b.rotation_quaternion.to_matrix().to_4x4()
    if not b.parent: return b.bone.matrix_local @ local
    return pose_matrix(b.parent) @ b.parent.bone.matrix_local.inverted() @ b.bone.matrix_local @ local
def parent_delta(b):
    # Rotação de mundo já acumulada pelo pai em relação ao repouso.
    if not b.parent: return Matrix.Identity(3)
    return pose_matrix(b.parent).to_3x3() @ b.parent.bone.matrix_local.to_3x3().inverted()
def set_axes(b, e):
    # Rotação nos eixos do armature, relativa ao pai.
    rest = b.bone.matrix_local.to_3x3()
    b.rotation_quaternion = (rest.inverted() @ euler(e) @ rest).to_quaternion()
def aim(b, direction):
    # Giro mínimo a partir da pose herdada: não acrescenta torção ao osso.
    rest = b.bone.matrix_local.to_3x3()
    target = parent_delta(b).inverted() @ Vector(direction).normalized()
    delta = (b.bone.tail_local - b.bone.head_local).normalized().rotation_difference(target).to_matrix()
    b.rotation_quaternion = (rest.inverted() @ delta @ rest).to_quaternion()
def set_world_rotation(b, rotation):
    rest = b.bone.matrix_local.to_3x3()
    b.rotation_quaternion = (rest.inverted() @ parent_delta(b).inverted() @ rotation @ rest).to_quaternion()
def length(b): return (b.bone.tail_local - b.bone.head_local).length
def two_bone(start, target, a, b, pole):
    # Devolve a articulação do meio e o quanto o alvo ficou fora do alcance.
    to_target = target - start
    d = to_target.length
    reach = max(abs(a - b) + 1e-4, min(a + b - 1e-4, d))
    n = to_target / max(d, 1e-6)
    side = pole - n * pole.dot(n)
    side = side.normalized() if side.length > 1e-5 else Vector((0, 1, 0))
    along = (a * a - b * b + reach * reach) / (2 * reach)
    return start + n * along + side * math.sqrt(max(0, a * a - along * along)), max(0, d - reach)

def solve_leg(name, foot):
    x, y, z, pitch, toe = foot
    frame = LEG_FRAME[0]
    leg = LEGS[name]; kind = name[0]
    contact = Vector((x, y, z))
    foot_rotation = frame @ rx(pitch)
    foot_target = contact + foot_rotation @ CONTACT_TO_FOOT[kind]
    upper, lower, foot_bone = bones[leg['upper']], bones[leg['lower']], bones[leg['foot']]
    start = pose_matrix(upper).translation
    if kind == 'F':
        joint, _ = two_bone(start, foot_target, length(upper), length(lower), frame @ Vector((0, 1, 0)))
        aim(upper, joint - start); aim(lower, foot_target - joint)
    else:
        # Jarrete: a canela inclina com a posição da pata. Se o jarrete ficar fora do alcance, inclina a canela em direção ao quadril.
        meta = bones[leg['meta']]; meta_len = length(meta); side = 1 if x > 0 else -1
        tilt = max(-1.15, min(.65, -.21 - 2.6 * (y - .145) - .35 * toe))
        hock = None
        for step in range(15):
            lean = tilt - .1 * step if y > .041 else tilt + .1 * step
            shin = frame @ Vector((-.3 * side, math.sin(lean), math.cos(lean)))
            hock = foot_target + shin.normalized() * meta_len
            if (hock - start).length < length(upper) + length(lower) - .002: break
        joint, _ = two_bone(start, hock, length(upper), length(lower), frame @ Vector((0, -1, 0)))
        aim(upper, joint - start); aim(lower, hock - joint); aim(meta, foot_target - hock)
    set_world_rotation(foot_bone, foot_rotation)
    for toe_name in leg['toes']: set_world_rotation(bones[toe_name], frame @ rx(toe))
    return (pose_matrix(foot_bone).translation - foot_target).length

LEG_FRAME = [Matrix.Identity(3)]
ROOT_REST = bones[ROOT].bone.matrix_local
def apply(p):
    for b in bones: b.rotation_quaternion = Quaternion(); b.location = (0, 0, 0)
    root = bones[ROOT]
    rotation = euler(p['body']); rest3 = ROOT_REST.to_3x3(); head = ROOT_REST.translation
    root.location = rest3.inverted() @ (Vector(p['root']) + (BODY_PIVOT - rotation @ BODY_PIVOT) - (head - rotation @ head))
    root.rotation_quaternion = (rest3.inverted() @ rotation @ rest3).to_quaternion()
    for key, name in AXIS_BONES.items(): set_axes(bones[name], p[key])
    LEG_FRAME[0] = euler(p['legs'])
    return max(solve_leg(name, p[name]) for name in LEGS)

def lowest_point():
    bpy.context.view_layer.update()
    ev = body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me = ev.to_mesh()
    co = np.empty(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get('co', co)
    ev.to_mesh_clear()
    return float(co[2::3].min())

# --- poses -------------------------------------------------------------------------------------------------------------
FRONT_Y, HIND_Y = -.295, .115
STAND = dict(
    root=(0, 0, .02), body=(-.035, 0, 0), legs=(0, 0, 0),
    s0=(0, 0, 0), s1=(0, 0, 0), s2=(0, 0, 0), neck=(-.1, 0, 0), head=(.03, 0, 0), jaw=(0, 0, 0),
    t0=(.04, 0, 0), t1=(-.05, 0, 0), t2=(-.05, 0, 0),
    FL=(.125, FRONT_Y, 0, 0, 0), FR=(-.125, FRONT_Y, 0, 0, 0), HL=(.115, HIND_Y, 0, 0, 0), HR=(-.115, HIND_Y, 0, 0, 0))
def P(**kw):
    p = dict(STAND); p.update(kw); return p
def add(p, **kw):
    q = dict(p)
    for k, v in kw.items(): q[k] = tuple(a + b for a, b in zip(q[k], v))
    return q
def mix(a, b, u): return {k: tuple(x + (y - x) * u for x, y in zip(a[k], b[k])) for k in a}
def smooth(u):
    u = max(0, min(1, u)); return u * u * (3 - 2 * u)
def ease(u, mode):
    if mode == 'in': return u ** 2.2
    if mode == 'out': return 1 - (1 - u) ** 2.2
    if mode == 'lin': return u
    return smooth(u)
def sample(keys, t):
    if t <= keys[0][0]: return keys[0][1]
    for (t0, p0, _), (t1, p1, m) in zip(keys, keys[1:]):
        if t <= t1: return mix(p0, p1, ease((t - t0) / (t1 - t0), m))
    return keys[-1][1]
def foot_cycle(phi, center, travel, duty, lift, heel, fold):
    # Apoio: a pata fica parada no chão enquanto o corpo passa. Balanço: volta à frente com velocidade contínua nas duas pontas.
    phi %= 1
    if phi < duty:
        s = phi / duty
        return center - travel / 2 + travel * s, 0, heel * smooth((s - .55) / .45), 0
    s = (phi - duty) / (1 - duty)
    y0, y1, m = center + travel / 2, center - travel / 2, travel / duty * (1 - duty)
    y = (2 * s**3 - 3 * s**2 + 1) * y0 + (s**3 - 2 * s**2 + s) * m + (3 * s**2 - 2 * s**3) * y1 + (s**3 - s**2) * m
    z = lift * math.sin(math.pi * s ** .85)
    pitch = heel + (fold - heel) * smooth(s / .35) if s < .35 else fold * (1 - smooth((s - .35) / .55))
    return y, z, pitch, pitch * smooth(s / .2)

# --- idle: respira, muda o peso, olha em volta e abana devagar a cauda --------------------------------------------------
def idle(u):
    a = TAU * u; s, c = math.sin(a), math.cos(a); s2 = math.sin(2 * a); look = math.sin(a + .6)
    pant = max(0, math.sin(4 * a))
    return add(STAND, root=(.005 * s, 0, .004 * math.cos(2 * a)), body=(.008 * s2, .018 * s, 0), s0=(0, -.012 * s, 0),
               s1=(.018 * s2, 0, 0), s2=(-.012 * s2, 0, 0), neck=(.035 * c, 0, .11 * look), head=(-.02 * s2, .05 * look, .17 * look), jaw=(.05 * pant, 0, 0),
               t0=(.02 * c, 0, .1 * math.sin(a - .4)), t1=(.015 * c, 0, .13 * math.sin(a - .9)), t2=(0, 0, .17 * math.sin(a - 1.4)))

# --- galope canino: as traseiras entram por baixo da barriga e empurram, o dorso estica, as dianteiras alcançam e puxam, ------
# o corpo voa encolhido. v = 0 é o pouso da primeira traseira; `landings` dá o pouso de cada pata dentro do ciclo.
def gallop(v, stride, duty, landings, spine, pitch, rise, base, reach=0, tail=.1):
    travel = stride * duty
    feet = {}
    for name, start in landings.items():
        front = name[0] == 'F'; side = 1 if name[1] == 'L' else -1
        y, z, heel, toe = foot_cycle(v - start, (-.35 - reach) if front else (-.005 + reach * .5), travel, duty, .06 if front else .05, .6 if front else .45, 1.25 if front else .9)
        feet[name] = (side * (.1 if front else .095), y, z, heel, toe)
    # Dorso mais dobrado no voo (v≈.87) e mais esticado quando as dianteiras alcançam o chão (v≈.37).
    gather = TAU * (v - .87)
    f = spine * math.cos(gather); lead = math.cos(TAU * (v - .4))
    nose = pitch * math.cos(TAU * (v - .52))
    return P(root=(.004 * lead, -.012 * f / max(spine, .01), base + rise * math.cos(gather)), body=(nose - .03, .012 * lead, 0),
             s0=(-f, .03 * lead, -.02 * lead), s1=(f, -.02 * lead, .02 * lead), s2=(f * .9, -.02 * lead, .02 * lead),
             # O pescoço compensa parte do dorso e chega atrasado: a cabeça acompanha a passada, mas continua olhando à frente.
             neck=(-f * 1.1 - nose * .6 - .13, .01 * lead, -.012 * lead), head=(.05 + .1 * pitch * math.sin(TAU * v - 1), 0, -.008 * lead), jaw=(.2 + .06 * math.cos(gather - .8), 0, 0),
             # A cauda vai esticada para trás, em onda atrasada em relação ao dorso.
             t0=(tail + .9 * spine * math.cos(gather - .8), 0, .05 * math.sin(TAU * v - .7)), t1=(.02 + spine * math.cos(gather - 1.5), 0, .08 * math.sin(TAU * v - 1.4)),
             t2=(.02 + 1.2 * spine * math.cos(gather - 2.2), 0, .11 * math.sin(TAU * v - 2.1)), **feet)

# --- walk: é a corrida do lobo; a progressão vem da distância percorrida, então as patas de apoio ficam paradas no chão -------
STRIDE, DUTY = .96, .25
RUN_LANDINGS = dict(HR=0, HL=.08, FL=.37, FR=.46)
def walk(u):
    return gallop(u, STRIDE, DUTY, RUN_LANDINGS, spine=.19, pitch=.12, rise=.042, base=.03)

# --- windup: encolhe as ancas, abaixa a cabeça, rosna e treme antes de saltar -------------------------------------------
LOAD = P(root=(0, .05, -.045), body=(-.13, 0, 0), s0=(-.1, 0, 0), s1=(.12, 0, 0), s2=(.08, 0, 0), neck=(.1, 0, 0), head=(-.14, 0, 0), jaw=(.3, 0, 0),
         t0=(.08, 0, 0), t1=(.1, 0, 0), t2=(.14, 0, 0), FL=(.115, -.345, 0, 0, 0), FR=(-.115, -.345, 0, 0, 0),
         HL=(.105, .035, 0, .08, 0), HR=(-.105, .035, 0, .08, 0))
def windup(u):
    k = smooth(u / .6); shake = smooth((u - .45) / .55)
    q = math.sin(TAU * 7 * u) * shake
    return add(mix(STAND, LOAD, k), root=(.0025 * q, 0, .0025 * q), s2=(.008 * q, 0, 0), jaw=(.03 * q, 0, 0), t2=(0, 0, .05 * q))

# --- charge: arrancada em galope exagerado, com dois voos; a progressão vem do tempo real da investida e termina com as dianteiras no chão --
SPRINT_LANDINGS = dict(HR=0, HL=.05, FL=.42, FR=.5)
def charge(u):
    return gallop(1.45 * u, 1.3, .2, SPRINT_LANDINGS, spine=.22, pitch=.16, rise=.05, base=.04, reach=.03, tail=.16)

# --- recover: aterrissa com as patas da frente fincadas, sacode a cabeça e dá dois passos para se recompor ------------------
LANDED = P(root=(0, -.05, -.015), body=(.12, 0, 0), s0=(-.08, 0, 0), s1=(.08, 0, 0), s2=(.06, 0, 0), neck=(-.2, 0, 0), head=(.1, 0, 0), jaw=(.22, 0, 0),
           t0=(.28, 0, 0), t1=(.05, 0, 0), t2=(-.08, 0, 0), FL=(.13, -.4, 0, 0, 0), FR=(-.13, -.38, 0, 0, 0), HL=(.115, -.01, 0, .2, 0), HR=(-.115, .01, 0, .2, 0))
def recover(u):
    p = mix(LANDED, STAND, smooth((u - .1) / .85))
    shake = math.sin(TAU * 3.5 * min(u / .55, 1)) * (1 - smooth(u / .55))
    p = add(p, neck=(0, .1 * shake, .1 * shake), head=(0, .2 * shake, .14 * shake), t2=(0, 0, .15 * shake))
    # Duas passadas em diagonal: sem elas, as patas deslizariam de volta à postura.
    for names, a, b in ((('FL', 'HR'), .18, .5), (('FR', 'HL'), .45, .78)):
        s = (u - a) / (b - a)
        step = math.sin(math.pi * s) if 0 < s < 1 else 0
        # Fora do passo a pata fica parada: início no pouso, fim na postura.
        for name in names:
            start, end = LANDED[name], STAND[name]
            k = smooth(s)
            p[name] = (start[0] + (end[0] - start[0]) * k, start[1] + (end[1] - start[1]) * k, .035 * step, start[3] * (1 - k) + .5 * step, .3 * step)
    return p

# --- attack: encolhe, projeta o pescoço, fecha os dentes e puxa a cabeça ----------------------------------------------------
BITE_LOAD = P(root=(0, .045, -.012), body=(-.1, 0, 0), s1=(-.06, 0, 0), s2=(-.05, 0, 0), neck=(-.2, 0, 0), head=(-.26, 0, 0), jaw=(.5, 0, 0), t0=(-.12, 0, 0), t2=(.1, 0, 0),
              HL=(.115, .09, 0, 0, 0), HR=(-.115, .09, 0, 0, 0))
BITE_HIT = P(root=(0, -.075, .012), body=(.09, 0, 0), s0=(-.05, 0, 0), s1=(.04, 0, 0), s2=(.05, 0, 0), neck=(-.2, 0, .06), head=(.18, .08, .1), jaw=(.02, 0, 0), t0=(.24, 0, 0), t1=(.08, 0, 0), t2=(-.1, 0, 0),
             FL=(.13, -.38, 0, 0, 0), FR=(-.125, -.33, 0, 0, 0), HL=(.115, .075, 0, .25, 0), HR=(-.115, .075, 0, .25, 0))
BITE_TUG = P(root=(0, -.055, .012), body=(.05, -.03, 0), s0=(-.03, 0, 0), s2=(.03, 0, 0), neck=(-.13, .05, -.16), head=(.16, -.14, -.22), jaw=(.02, 0, 0), t0=(.12, 0, -.12), t2=(0, 0, .22),
             FL=(.13, -.38, 0, 0, 0), FR=(-.125, -.33, 0, 0, 0), HL=(.115, .075, 0, .15, 0), HR=(-.115, .075, 0, .15, 0))
def attack(u):
    return sample([(0, STAND, 's'), (.3, BITE_LOAD, 'out'), (.45, BITE_HIT, 'in'), (.68, BITE_TUG, 's'), (1, STAND, 's')], u)

# --- hit: o corpo recua de lado, a cabeça sacode e a boca abre ----------------------------------------------------------------
FLINCH = P(root=(.012, .04, -.016), body=(-.03, .13, 0), s1=(.05, -.04, 0), s2=(.06, -.04, 0), neck=(-.26, .05, -.1), head=(-.2, .16, -.26), jaw=(.32, 0, 0), t0=(-.22, 0, .12), t1=(-.1, 0, .14), t2=(0, 0, .16),
           FL=(.13, -.285, 0, 0, 0), FR=(-.12, -.285, 0, 0, 0))
def hit(u):
    return sample([(0, STAND, 's'), (.3, FLINCH, 'out'), (1, STAND, 's')], u)

# --- howl: as ancas descem, o peito sobe e o focinho aponta para o céu; a garganta treme durante o grito --------------------------
HOWL_POSE = P(root=(0, .025, .0), body=(-.2, 0, 0), s0=(-.02, 0, 0), s1=(-.08, 0, 0), s2=(-.14, 0, 0), neck=(-.52, 0, 0), head=(-.58, 0, 0), jaw=(.42, 0, 0),
              t0=(.1, 0, 0), t1=(.1, 0, 0), t2=(.14, 0, 0), FL=(.115, -.31, 0, 0, 0), FR=(-.115, -.31, 0, 0, 0), HL=(.105, .05, 0, .1, 0), HR=(-.105, .05, 0, .1, 0))
def howl(u):
    k = smooth(u / .25) * (1 - smooth((u - .85) / .15))
    q = math.sin(TAU * 11 * u) * k
    return add(mix(STAND, HOWL_POSE, k), s2=(.012 * q, 0, 0), neck=(.012 * q, 0, 0), head=(-.012 * q, 0, 0), jaw=(.03 * q, 0, 0), t2=(0, 0, .05 * math.sin(TAU * 2 * u) * k))

# --- death: cambaleia, as patas da frente cedem e cai de lado, relaxando pescoço, patas e cauda ---------------------------------------
DEATH_STAGGER = P(root=(-.015, .04, -.006), body=(-.06, -.14, .03), s1=(.04, 0, -.05), s2=(.06, 0, -.04), neck=(-.3, 0, .08), head=(-.2, -.1, .2), jaw=(.42, 0, 0), t0=(-.25, 0, 0),
                  FL=(.135, -.31, 0, 0, 0), FR=(-.13, -.285, 0, 0, 0))
# Tomba para o lado esquerdo (topo para +X): as patas ficam em -X, as esquerdas no chão e as direitas por cima delas.
DEATH_BUCKLE = P(root=(.03, .02, -.1), body=(.1, .55, .06), legs=(0, .55, 0), s1=(.08, 0, -.04), s2=(.08, 0, -.04), neck=(-.05, 0, .14), head=(.1, 0, .1), jaw=(.25, 0, 0), t0=(0, 0, -.12), t1=(-.05, 0, -.12),
                 FL=(.03, -.33, .02, .5, .2), FR=(-.2, -.31, .04, .7, .4), HL=(.02, .08, .02, .3, 0), HR=(-.2, .1, .04, .5, .2))
DEATH_FLAT = P(root=(.11, .0, -.15), body=(.03, 1.45, .05), legs=(0, 1.45, 0), s0=(0, 0, .05), s1=(.1, 0, .05), s2=(.08, 0, .05), neck=(.0, 0, .24), head=(.1, 0, .2), jaw=(.3, 0, 0),
               t0=(0, 0, -.2), t1=(0, 0, -.22), t2=(0, 0, -.24),
               FL=(-.2, -.3, .03, .5, .3), FR=(-.17, -.33, .23, .8, .5), HL=(-.2, .1, .04, .3, .1), HR=(-.16, .13, .22, .5, .3))
def death(u):
    return sample([(0, STAND, 's'), (.2, DEATH_STAGGER, 'out'), (.55, DEATH_BUCKLE, 's'), (1, DEATH_FLAT, 'in')], u)

# --- gravação ---------------------------------------------------------------------------------------------------------------------------
CLIPS = {
    'idle': (48, True, idle), 'walk': (24, True, walk), 'attack': (18, False, attack), 'hit': (8, False, hit), 'death': (24, False, death),
    'recover': (24, False, recover), 'windup': (18, False, windup), 'charge': (24, True, charge), 'howl': (24, False, howl),
}
def bake():
    arm.animation_data_create()
    report = {}
    for name, (frames, loop, fn) in CLIPS.items():
        old = bpy.data.actions.get(name)
        if old: old.use_fake_user = False; bpy.data.actions.remove(old)
        action = bpy.data.actions.new(name); action.use_fake_user = True
        arm.animation_data.action = action
        floor, miss = [], 0
        for f in range(frames + 1):
            p = fn(f / frames)
            miss = max(miss, apply(p))
            low = lowest_point()
            if name == 'death' and low < 0:
                # A queda não atravessa o chão: sobe corpo e patas juntos.
                p = add(p, root=(0, 0, -low), FL=(0, 0, -low, 0, 0), FR=(0, 0, -low, 0, 0), HL=(0, 0, -low, 0, 0), HR=(0, 0, -low, 0, 0))
                apply(p); low = lowest_point()
            floor.append(low)
            for b in bones: b.keyframe_insert('rotation_quaternion', frame=f + 1)
            bones[ROOT].keyframe_insert('location', frame=f + 1)
        action['loop'] = loop
        report[name] = dict(frames=frames, floor=(round(min(floor), 3), round(max(floor), 3)), ik_miss=round(miss, 4))
    return report

print('WOLF_WEIGHTS_FIXED', fix_leg_weights())
report = bake()
arm.animation_data.action = bpy.data.actions['idle']
arm.animation_data.action_slot = bpy.data.actions['idle'].slots[0]
sc.frame_start = 1; sc.frame_end = 49; sc.frame_set(1)
print('WOLF_MOTION', report)
if EXPORT:
    for obj in bpy.context.view_layer.objects: obj.select_set(obj in (arm, body))
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=str(BASE / 'exports' / 'v2_enemy_wolf.glb'), export_format='GLB', use_selection=True, export_animation_mode='ACTIONS',
                              export_skins=True, export_yup=True, export_force_sampling=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BASE / 'models' / 'v2_enemy_wolf.blend'))
    print('WOLF_EXPORTED')
