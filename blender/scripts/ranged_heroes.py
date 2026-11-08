"""Arqueira e Mercenário jogáveis: arma da prancha presa à mão, clipes base e export GLB.

Uso, na raiz do projeto:
  blender --background --python blender/scripts/ranged_heroes.py -- archer
  blender --background --python blender/scripts/ranged_heroes.py -- mercenary

Pelo MCP, sobre um arquivo vazio: defina HERO = 'archer' ou 'mercenary' no namespace e
execute este arquivo. Ele só remove objetos e ações marcados com `ranged_hero`.

Fontes: blender/reference/archer_hero/ e blender/reference/mercenary/ (Tripo, rig Mixamo).
A arma vem da prancha do mesmo personagem, recortada por faixa X, alinhada por PCA e
unida à malha com peso rígido na mão. Os clipes são poses por alvos (IK analítica de
warrior_pose.py), in-place, a 30 fps.
"""
from pathlib import Path
import math
import sys
import bpy
import bmesh
from mathutils import Vector, Matrix, Quaternion, Euler

ROOT = Path(__file__).resolve().parents[1]
FPS = 30
HEROES = {
    'archer': {
        'id': 'archer_hero', 'label': 'Arqueira', 'origin': 'ArcherHeroOrigin',
        'source': 'reference/archer_hero/archer_hero_source.glb',
        'sheet': 'reference/archer_hero/archer_hero_sheet.glb',
        'weapon_x': (-0.165, 0.125), 'weapon_length': 0.74, 'weapon_hand': 'Left',
        'kind': 'bow',
    },
    'mercenary': {
        'id': 'mercenary', 'label': 'Mercenário', 'origin': 'MercenaryOrigin',
        'source': 'reference/mercenary/mercenary_source.glb',
        'sheet': 'reference/mercenary/mercenary_sheet.glb',
        'weapon_x': (-0.179, 0.225), 'weapon_length': 0.50, 'weapon_hand': 'Right',
        'kind': 'crossbow', 'decimate': 3500,
    },
}
# Ordem e duração em quadros. Os nomes formam o contrato com v2/assets/models.json.
CLIPS = [('idle', 61), ('walk', 21), ('strafe_left', 21), ('strafe_right', 21),
         ('shoot', 16), ('dodge', 16), ('death', 31)]
# Etapa 2: Chuva de Flechas e Recuo (Arqueira); arremesso e mina (Mercenário).
EXTRA = {'archer': [('shoot_up', 19), ('leap_back', 13)], 'mercenary': [('throw', 19), ('plant', 19)]}
STRIDE = 0.62      # unidades do Blender por ciclo de caminhada (dois passos)
STRAFE_STRIDE = 0.48
TEXTURE = 1024

if 'HERO' in globals():
    hero_key = globals()['HERO']
else:
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    hero_key = args[0] if args else 'archer'
H = HEROES[hero_key]
CLIPS = CLIPS + EXTRA[hero_key]
if bpy.app.background:
    bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS

# Limpar somente o que este gerador criou antes.
for o in [o for o in scene.objects if o.get('ranged_hero') == H['id']]:
    bpy.data.objects.remove(o, do_unlink=True)
for a in [a for a in bpy.data.actions if a.get('ranged_hero') == H['id'] and a.users == 0]:
    bpy.data.actions.remove(a)


def import_glb(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / path))
    return [o for o in bpy.data.objects if o not in before]


# Personagem com rig.
new = import_glb(H['source'])
rig = next(o for o in new if o.type == 'ARMATURE')
body = max((o for o in new if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
for o in new:
    if o not in (rig, body):
        bpy.data.objects.remove(o, do_unlink=True)
rig.name = H['label'] + 'Rig'
body.name = H['label'] + 'Body'
for o in (rig, body):
    o['ranged_hero'] = H['id']
body_height = max((body.matrix_world @ v.co).z for v in body.data.vertices)

# Arma recortada da prancha.
sheet = next(o for o in import_glb(H['sheet']) if o.type == 'MESH')
lo, hi = H['weapon_x']
bm = bmesh.new()
bm.from_mesh(sheet.data)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not (lo < v.co.x < hi)], context='VERTS')
bm.to_mesh(sheet.data)
bm.free()
weapon = sheet
weapon.name = H['label'] + 'Weapon'
weapon['ranged_hero'] = H['id']
bpy.context.view_layer.objects.active = weapon
if H.get('decimate'):
    faces = len(weapon.data.polygons)
    mod = weapon.modifiers.new('decimate', 'DECIMATE')
    mod.ratio = min(1, H['decimate'] / max(1, faces))
    bpy.ops.object.select_all(action='DESELECT')
    weapon.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)

# Eixos principais da arma (PCA): comprimento, largura, espessura.
pts = [weapon.matrix_world @ v.co for v in weapon.data.vertices]
center = sum(pts, Vector()) / len(pts)
cov = Matrix(((0, 0, 0), (0, 0, 0), (0, 0, 0)))
for p in pts:
    d = p - center
    for i in range(3):
        for j in range(3):
            cov[i][j] += d[i] * d[j]
axes = []
m = cov.copy()
for _ in range(3):
    v = Vector((1, 0.31, 0.17))
    for _ in range(80):
        v = (m @ v).normalized()
    lam = v.dot(cov @ v)
    axes.append(v.copy())
    for i in range(3):
        for j in range(3):
            m[i][j] -= lam * v[i] * v[j]
length_axis, width_axis = axes[0], axes[1]
width_axis = (width_axis - length_axis * width_axis.dot(length_axis)).normalized()
proj = [(p - center).dot(length_axis) for p in pts]
span = max(proj) - min(proj)
if H['kind'] == 'bow':
    # A empunhadura (meio do arco) fica à frente da corda: o lado do bojo é a frente do tiro.
    mid = [p for p, t in zip(pts, proj) if abs(t) < span * 0.12]
    tips = [p for p, t in zip(pts, proj) if abs(t) > span * 0.40]
    bulge = (sum(mid, Vector()) / len(mid) - sum(tips, Vector()) / len(tips)).dot(width_axis)
    forward = width_axis if bulge > 0 else -width_axis
    up = length_axis if length_axis.z >= 0 else -length_axis
    grip = sum(mid, Vector()) / len(mid)
    # Arco: X = comprimento (ponta de cima), Y = direção do tiro, Z = lateral.
    native = Matrix((up, forward, up.cross(forward))).transposed()
else:
    # Besta: o arco (prod) fica na ponta mais larga do eixo longo.
    ends = []
    for sign in (1, -1):
        sel = [p for p, t in zip(pts, proj) if t * sign > span * 0.32]
        spread = max(abs((p - center).dot(width_axis)) for p in sel)
        ends.append((spread, sign))
    sign = max(ends)[1]
    forward = length_axis * sign
    thin = forward.cross(width_axis).normalized()
    # O lado de cima é o mais plano (trilho); a coronha e o gatilho pendem para baixo.
    below = [(p - center).dot(thin) for p in pts]
    up = thin if sum(1 for b in below if b > 0) > sum(1 for b in below if b < 0) else -thin
    rear = [p for p, t in zip(pts, proj) if -0.30 * span < t * sign < -0.05 * span]
    grip = sum(rear, Vector()) / len(rear) if rear else center
    side = forward.cross(up).normalized()
    # Besta: X = lateral, Y = direção do tiro, Z = cima.
    native = Matrix((side, forward, up)).transposed()
scale = H['weapon_length'] * body_height / span
# Transformar a arma para o espaço canônico: empunhadura na origem, eixos nativos alinhados.
to_canon = Matrix.Diagonal((scale, scale, scale, 1)) @ native.to_4x4().inverted() @ Matrix.Translation(-grip)
weapon.data.transform(to_canon @ weapon.matrix_world)
weapon.matrix_world = Matrix()
print('ARMA', H['kind'], 'vértices', len(weapon.data.vertices), 'faces', len(weapon.data.polygons),
      'comprimento', round(span * scale, 3), 'altura do corpo', round(body_height, 3))

bones = {b.name.split(':')[-1]: b for b in rig.pose.bones}
hand_name = H['weapon_hand'] + 'Hand'
hand_rest = rig.data.bones['mixamorig:' + hand_name]
# Peso rígido da arma na mão; o repouso deixa a arma ao longo do braço para não aumentar a altura.
rest_rot = hand_rest.matrix_local.to_quaternion()
rest_weapon_rot = Quaternion()  # arco deitado ao longo do braço; besta apontando para trás
palm = Vector((0, 0.035, 0))  # deslocamento da empunhadura ao longo do osso da mão
grip_rest = hand_rest.matrix_local @ palm
weapon.data.transform(Matrix.Translation(grip_rest) @ rest_weapon_rot.to_matrix().to_4x4())
# Rotação da arma relativa à mão: W = H @ H0^-1 @ W0  =>  H = W @ W0^-1 @ H0.
weapon_in_hand = rest_rot.inverted() @ rest_weapon_rot
grip_in_hand = palm

group = weapon.vertex_groups.new(name='mixamorig:' + hand_name)
group.add(list(range(len(weapon.data.vertices))), 1.0, 'REPLACE')
bpy.ops.object.select_all(action='DESELECT')
weapon.select_set(True)
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
mesh = body

# Texturas menores e sem mapa normal: a câmera do jogo é distante.
for mat in mesh.data.materials:
    nodes = mat.node_tree.nodes
    for n in list(nodes):
        if n.type == 'NORMAL_MAP':
            nodes.remove(n)
    for n in list(nodes):
        if n.type == 'TEX_IMAGE' and n.image:
            if 'normal' in n.image.name.lower():
                nodes.remove(n)
                continue
            if n.image.size[0] > TEXTURE:
                n.image.scale(TEXTURE, TEXTURE)
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = 0.85
    bsdf.inputs['Metallic'].default_value = 0.0

# ---------------------------------------------------------------- poses
def frame_from(fwd, up):
    """Rotação cujas colunas são lateral/frente/cima (besta) ou cima/frente/lateral (arco)."""
    f = Vector(fwd).normalized()
    u = Vector(up)
    u = (u - f * u.dot(f)).normalized()
    if H['kind'] == 'bow':
        return Matrix((u, f, u.cross(f))).transposed().to_quaternion()
    return Matrix((f.cross(u).normalized(), f, u)).transposed().to_quaternion()


def rot_world(key, angles):
    b = bones.get(key)
    if not b:
        return
    basis = b.bone.matrix_local.to_quaternion()
    b.rotation_quaternion = basis.inverted() @ Euler(angles).to_quaternion() @ basis


def aim_bones(upper, lower, root, target, pole):
    l1, l2 = upper.bone.length, lower.bone.length
    delta = target - root
    dist = min(delta.length, l1 + l2 - 0.0008)
    axis = delta.normalized()
    target = root + axis * dist
    along = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist)
    bend = pole - root
    normal = (bend - axis * bend.dot(axis)).normalized()
    mid = root + axis * along + normal * math.sqrt(max(0, l1 * l1 - along * along))
    for bone, head, tail in [(upper, root, mid), (lower, mid, target)]:
        direction = bone.bone.tail_local - bone.bone.head_local
        q = direction.rotation_difference(tail - head) @ bone.bone.matrix_local.to_quaternion()
        bone.matrix = Matrix.LocRotScale(head, q, Vector((1, 1, 1)))
        bpy.context.view_layer.update()
    return target


def curl(side, amount=1.0, thumb=0.5):
    for digit in ['Index', 'Middle', 'Ring', 'Pinky']:
        for n, angle in [(1, .85), (2, 1.15), (3, .9)]:
            bone = rig.pose.bones.get('mixamorig:' + side + 'Hand' + digit + str(n))
            if bone:
                direction = (bone.bone.tail_local - bone.bone.head_local).normalized()
                axis = direction.cross(Vector((0, 0, -1))).normalized()
                basis = bone.bone.matrix_local.to_quaternion()
                bone.rotation_quaternion = basis.inverted() @ Quaternion(axis, angle * amount) @ basis
    for n in (1, 2, 3):
        bone = rig.pose.bones.get('mixamorig:' + side + 'HandThumb' + str(n))
        if bone:
            basis = bone.bone.matrix_local.to_quaternion()
            bone.rotation_quaternion = basis.inverted() @ Quaternion((0, -1 if side == 'Left' else 1, 0), .35 * thumb) @ basis


def arm(side, target, pole, hand_q=None):
    upper = bones[side + 'Arm']
    lower = bones[side + 'ForeArm']
    hand = bones[side + 'Hand']
    bpy.context.view_layer.update()
    end = aim_bones(upper, lower, upper.head.copy(), Vector(target), Vector(pole))
    if hand_q is None:
        hand_q = lower.matrix.to_quaternion() @ lower.bone.matrix_local.to_quaternion().inverted() @ hand.bone.matrix_local.to_quaternion()
    hand.matrix = Matrix.LocRotScale(end, hand_q, Vector((1, 1, 1)))
    bpy.context.view_layer.update()


def weapon_arm(target_grip, w_rot, pole):
    """Posiciona a mão da arma para que a empunhadura fique em target_grip com orientação w_rot."""
    side = H['weapon_hand']
    hand_q = w_rot @ weapon_in_hand.inverted()
    wrist = Vector(target_grip) - hand_q @ grip_in_hand
    arm(side, wrist, pole, hand_q)


def leg(side, target, pole, pitch=0.0, yaw=0.0):
    upper, lower, foot = bones[side + 'UpLeg'], bones[side + 'Leg'], bones[side + 'Foot']
    bpy.context.view_layer.update()
    end = aim_bones(upper, lower, upper.head.copy(), Vector(target), Vector(pole))
    foot.matrix = Matrix.LocRotScale(end, Quaternion((0, 0, 1), yaw) @ Quaternion((1, 0, 0), pitch) @ foot.bone.matrix_local.to_quaternion(), Vector((1, 1, 1)))
    bpy.context.view_layer.update()


def rest(name):
    return rig.data.bones['mixamorig:' + name].head_local.copy()


HIP = rest('Hips')
FOOT = {s: rest(s + 'Foot') for s in ('Left', 'Right')}
SH = {s: rest(s + 'Arm') for s in ('Left', 'Right')}
HEAD = rest('Head')
LEG = HIP.z - FOOT['Left'].z
smooth = lambda t: t * t * (3 - 2 * t)
lerp = lambda a, b, t: a + (b - a) * t


def ease(points, t):
    """Interpola chaves (t, valor) com suavização; valores podem ser float ou Vector."""
    for (t0, v0), (t1, v1) in zip(points, points[1:]):
        if t <= t1:
            u = 0 if t1 == t0 else smooth((t - t0) / (t1 - t0))
            return lerp(v0, v1, u)
    return points[-1][1]


def gait(t, stride, lateral):
    """Pés (offset do repouso) e quadril para um ciclo de passos; lateral move no eixo X."""
    duty = 0.56
    feet, lift = {}, {}
    for side, phase in (('Left', 0.0), ('Right', 0.5)):
        u = (t + phase) % 1
        if u < duty:
            s = 0.5 - u / duty  # de +0.5 a -0.5 em apoio
            z = 0
        else:
            v = (u - duty) / (1 - duty)
            s = -0.5 + smooth(v)
            z = math.sin(v * math.pi) * 0.055
        d = s * stride * duty
        feet[side] = Vector((d * lateral[0], d * lateral[1], z))
        lift[side] = z
    bob = -0.012 + 0.012 * math.cos(t * 4 * math.pi)
    return feet, bob


def bow_draw(draw, lift=0.0):
    """Arqueira de lado para o alvo: braço do arco estendido, mão da corda recuada.
    lift (0-1) inclina a mira para cima, até 45°, para a Chuva de Flechas."""
    twist = -1.05 * draw
    fwd = Vector((0, -math.cos(0.8 * lift), math.sin(0.8 * lift)))
    yaw = Quaternion((0, 0, 1), twist)
    sh_l = HIP + yaw @ (SH['Left'] - HIP)
    grip = lerp(HIP + Vector((0.19, -0.12, 0.02)), sh_l + fwd * 0.235 + Vector((0, 0, 0.01)), draw)
    up = lerp(Vector((0.10, -0.35, 1.0)), Vector((0.12, fwd.z, -fwd.y)), draw)
    aim = lerp(Vector((0.30, -1.0, 0.0)), fwd, draw)
    return twist, grip, frame_from(aim, up)


def pose(name, t):
    """Retorna parâmetros do quadro. Frente do personagem é -Y; esquerda é +X."""
    p = {'hip': Vector((0, 0, -0.025)), 'twist': 0.0, 'lean': 0.06, 'feet': {'Left': Vector(), 'Right': Vector()},
         'head': 0.0, 'roll': 0.0}
    breath = math.sin(t * math.tau)
    if H['kind'] == 'bow':
        twist, grip, wq = bow_draw(0.0)
        p['grip'] = grip
        p['wq'] = wq
        p['free'] = HIP + Vector((-0.17, -0.10, 0.04 + 0.006 * breath))
    else:
        p['grip'] = HIP + Vector((-0.07, -0.15, 0.03))
        p['wq'] = frame_from(Vector((0.35, -1, -0.55)), Vector((0, 0.2, 1)))
        p['free'] = None
    p['hip'].z += 0.006 * breath
    p['feet']['Left'] = Vector((0.015, -0.03, 0))
    p['feet']['Right'] = Vector((-0.015, 0.04, 0))
    if name in ('walk', 'strafe_left', 'strafe_right'):
        direction = {'walk': (0, -1), 'strafe_left': (1, 0), 'strafe_right': (-1, 0)}[name]
        stride = STRIDE if name == 'walk' else STRAFE_STRIDE
        feet, bob = gait(t, stride, direction)
        p['feet'] = feet
        p['hip'] = Vector((0, 0, -0.035 + bob))
        p['lean'] = 0.10 if name == 'walk' else 0.06
        sway = math.sin(t * math.tau)
        p['twist'] = 0.10 * sway if name == 'walk' else 0.0
        p['roll'] = 0.04 * math.sin(t * 2 * math.tau) if name != 'walk' else 0.0
        if p['free'] is not None:
            p['free'] = p['free'] + Vector((0, 0.05 * sway, 0))
    elif name in ('shoot', 'shoot_up') and H['kind'] == 'bow':
        # shoot: 0-0.45 sacar e mirar; 0.5 soltura. shoot_up: mira a 45° e solta em 0.58.
        up_shot = name == 'shoot_up'
        if True:
            k = 1.16 if up_shot else 1.0
            draw = ease([(0, 0.0), (0.38 * k, 1.0), (0.62 * k, 1.0), (1.0, 0.0)], t)
            twist, grip, wq = bow_draw(draw, 1.0 if up_shot else 0.0)
            p['twist'] = twist
            p['grip'] = grip
            p['wq'] = wq
            yaw = Quaternion((0, 0, 1), twist)
            anchor = HIP + yaw @ (Vector((-0.06, -0.02, HEAD.z - 0.04)) - HIP)
            string = grip + wq @ Vector((0, -0.05, 0))
            released = ease([(0, 0.0), (0.46 * k, 0.0), (0.52 * k, 1.0), (0.75, 1.0), (1.0, 0.0)], t)
            p['free'] = lerp(lerp(Vector((-0.17, -0.10, HIP.z + 0.04)), string, min(1, draw * 1.6)), anchor, ease([(0, 0), (0.18, 0), (0.42, 1), (1, 1)], t) * draw)
            p['free'] = p['free'] + yaw @ Vector((-0.06, 0.04, 0.02)) * released
            p['feet']['Left'] = Vector((0.03, -0.10 * draw, 0))
            p['feet']['Right'] = Vector((-0.04, 0.08 * draw, 0))
            p['head'] = -twist * 0.8
            p['lean'] = 0.04 - (0.10 * draw if up_shot else 0)
    elif name == 'shoot':
        if True:
            # Besta no ombro: subir, disparo em 0.4, coice e volta.
            up = ease([(0, 0.0), (0.30, 1.0), (0.72, 1.0), (1.0, 0.0)], t)
            kick = ease([(0, 0), (0.38, 0), (0.44, 1), (0.70, 0), (1, 0)], t)
            shoulder = HIP + Vector((-0.07, -0.18, SH['Right'].z - HIP.z - 0.02))
            p['grip'] = lerp(p['grip'], shoulder + Vector((0, 0.07 * kick, 0.03 * kick)), up)
            p['wq'] = frame_from(lerp(Vector((0.35, -1, -0.55)), Vector((0.0, -1, 0.25 * kick)), up), lerp(Vector((0, 0.2, 1)), Vector((0, 0, 1)), up))
            p['twist'] = 0.12 * up
            p['lean'] = 0.06 - 0.08 * kick
            p['head'] = -0.10 * up
            p['feet']['Left'] = Vector((0.03, -0.09 * up, 0))
            p['feet']['Right'] = Vector((-0.03, 0.07 * up, 0))
    elif name == 'dodge':
        # Rolamento curto in-place: agachar, girar o tronco à frente e levantar.
        roll = ease([(0, 0), (0.25, 1), (0.70, 1), (1, 0)], t)
        p['hip'] = Vector((0, 0, -0.025 - 0.17 * roll))
        p['lean'] = 0.06 + 0.95 * roll + 0.6 * math.sin(min(1, max(0, (t - 0.2) / 0.5)) * math.pi)
        p['feet']['Left'] = Vector((0.03, -0.10 * roll, 0))
        p['feet']['Right'] = Vector((-0.03, 0.10 * roll, 0.02 * roll))
        p['grip'] = lerp(p['grip'], HIP + Vector((0.0 if H['kind'] == 'crossbow' else 0.12, -0.22, -0.10)), roll)
        if p['free'] is not None:
            p['free'] = lerp(p['free'], HIP + Vector((-0.12, -0.22, -0.10)), roll)
    elif name == 'leap_back':
        # Recuo: agachar, saltar para trás com o arco à frente e aterrissar. O deslocamento é do jogo.
        crouch = ease([(0, 0), (0.2, 1), (0.35, 0), (0.75, 0), (0.9, 1), (1, 0)], t)
        air = ease([(0, 0), (0.25, 0), (0.45, 1), (0.7, 1), (0.85, 0), (1, 0)], t)
        p['hip'] = Vector((0, 0, -0.025 - 0.12 * crouch + 0.05 * air))
        p['lean'] = 0.06 + 0.25 * crouch - 0.20 * air
        for side in ('Left', 'Right'):
            p['feet'][side] = p['feet'][side] + Vector((0, 0.04 * air, 0.10 * air))
        twist, grip, wq = bow_draw(0.55 * air)
        p['grip'], p['wq'] = grip, wq
        p['free'] = lerp(p['free'], HIP + Vector((-0.20, -0.05, 0.12)), air)
    elif name == 'throw':
        # Mercenário: a mão esquerda solta a coronha, puxa a bomba da cintura e lança por cima do ombro.
        wind = ease([(0, 0), (0.35, 1), (0.48, 0), (1, 0)], t)
        throw = ease([(0, 0), (0.35, 0), (0.50, 1), (0.72, 1), (1, 0)], t)
        away = ease([(0, 0), (0.12, 1), (0.85, 1), (1, 0)], t)
        hand = HIP + Vector((0.17, -0.06, 0.02))
        hand = lerp(hand, HIP + Vector((0.22, 0.16, HEAD.z - HIP.z + 0.06)), wind)
        hand = lerp(hand, HIP + Vector((0.12, -0.30, SH['Left'].z - HIP.z + 0.04)), throw)
        hand = lerp(hand, HIP + Vector((0.06, -0.24, 0.02)), ease([(0, 0), (0.55, 0), (0.75, 1), (1, 0)], t))
        p['free'] = lerp(p['grip'] + p['wq'] @ Vector((0, 0.11, -0.012)), hand, away)
        p['grip'] = lerp(p['grip'], HIP + Vector((-0.16, -0.08, 0.0)), away)
        p['wq'] = frame_from(lerp(Vector((0.35, -1, -0.55)), Vector((0.1, -1, -0.9)), away), Vector((0, 0.2, 1)))
        p['twist'] = 0.45 * wind - 0.40 * throw
        p['lean'] = 0.06 - 0.12 * wind + 0.18 * throw
        p['feet']['Left'] = Vector((0.03, -0.10 * throw, 0))
        p['feet']['Right'] = Vector((-0.03, 0.09 * (wind + throw) * 0.6, 0))
    elif name == 'plant':
        # Mina: agachar e assentar a carga no chão à frente com a mão esquerda.
        down = ease([(0, 0), (0.35, 1), (0.70, 1), (1, 0)], t)
        away = ease([(0, 0), (0.15, 1), (0.85, 1), (1, 0)], t)
        p['hip'] = Vector((0, 0, -0.025 - 0.19 * down))
        p['lean'] = 0.06 + 0.55 * down
        p['feet']['Left'] = Vector((0.04, -0.12 * down, 0))
        p['feet']['Right'] = Vector((-0.04, 0.10 * down, 0))
        ground = HIP + Vector((0.08, -0.28, -HIP.z + 0.07 + 0.03 * math.sin(t * 9)))
        p['free'] = lerp(p['grip'] + p['wq'] @ Vector((0, 0.11, -0.012)), ground, away * down + 0.3 * away * (1 - down))
        p['grip'] = lerp(p['grip'], HIP + Vector((-0.17, -0.06, -0.06)), away)
        p['wq'] = frame_from(lerp(Vector((0.35, -1, -0.55)), Vector((0.1, -1, -0.95)), away), Vector((0, 0.2, 1)))
    elif name == 'death':
        fall = ease([(0, 0), (0.55, 1), (1, 1)], t)
        p['death'] = fall
        p['lean'] = 0.06 + 0.35 * fall
        p['hip'] = Vector((0, 0, -0.025 - 0.12 * fall))
    return p


def apply(name, t):
    for b in rig.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = (1, 0, 0, 0)
        b.location = (0, 0, 0)
    p = pose(name, t)
    death = p.get('death', 0)
    rot_world('Hips', (p['lean'] * .15, p['roll'], p['twist'] * .40))
    rot_world('Spine', (p['lean'] * .30, 0, p['twist'] * .22))
    rot_world('Spine1', (p['lean'] * .30, 0, p['twist'] * .22))
    rot_world('Spine2', (p['lean'] * .25, 0, p['twist'] * .16))
    rot_world('Neck', (-p['lean'] * .25, 0, p['head'] * .4))
    rot_world('Head', (-p['lean'] * .35, 0, p['head'] * .6))
    if death:
        # Cair para trás girando sobre os calcanhares; a arma acompanha a mão.
        rot_world('Hips', (-1.45 * death, 0.10 * death, 0.15 * death))
    bpy.context.view_layer.update()
    hips = bones['Hips']
    mat = hips.matrix.copy()
    mat.translation += p['hip'] + (Vector((0, 0.10, -0.30)) * death)
    hips.matrix = mat
    bpy.context.view_layer.update()
    transform = Matrix() if not death else hips.matrix @ hips.bone.matrix_local.inverted()
    for side, sign in (('Left', 1), ('Right', -1)):
        foot = FOOT[side] + p['feet'][side]
        pole = foot + Vector((0, -0.25, 0.30))
        if death:
            target = FOOT[side] + Vector((0, -0.12 * death, 0.02))
            leg(side, target, target + Vector((0, -0.2, 0.3)), 0, 0)
        else:
            leg(side, foot, pole, 0.0, 0.0)
    rot_q = transform.to_quaternion()
    grip = transform @ p['grip'] if death else p['grip']
    wq = rot_q @ p['wq'] if death else p['wq']
    weapon_side = H['weapon_hand']
    free_side = 'Right' if weapon_side == 'Left' else 'Left'
    elbow_out = Vector((0.35 * (1 if weapon_side == 'Left' else -1), 0.25, -0.15))
    weapon_arm(grip, wq, grip + elbow_out)
    curl(weapon_side, 1.0, 0.8)
    if p['free'] is None:
        # Mercenário: a mão livre apoia a frente da coronha.
        support = grip + wq @ Vector((0, 0.11, -0.012))
        arm(free_side, support, support + Vector((0.30, 0.25, -0.20)))
        curl(free_side, 0.7, 0.5)
    else:
        free = transform @ p['free'] if death else p['free']
        side_sign = 1 if free_side == 'Left' else -1
        arm(free_side, free, free + Vector((0.30 * side_sign, 0.30, -0.10)))
        curl(free_side, 0.8 if name in ('shoot', 'shoot_up', 'throw', 'plant') else 0.45, 0.6)


rig.animation_data_clear()
rig.animation_data_create()
for name, frames in CLIPS:
    action = bpy.data.actions.new(name)
    action['ranged_hero'] = H['id']
    rig.animation_data.action = action
    loop = name in ('idle', 'walk', 'strafe_left', 'strafe_right')
    for frame in range(1, frames + 1):
        scene.frame_set(frame)
        t = (frame - 1) / (frames - 1)
        apply(name, t % 1 if loop and frame == frames else t)
        for b in rig.pose.bones:
            b.keyframe_insert('rotation_quaternion', frame=frame, group=b.name)
            b.keyframe_insert('location', frame=frame, group=b.name)
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 1, action)
    track.mute = True
    rig.animation_data.action = None

# Origem no centro das solas, na guarda (frame 1 do idle), como no Guerreiro.
rig.animation_data.action = bpy.data.actions['idle']
scene.frame_set(1)
bpy.context.view_layer.update()
ev = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
low = min((mesh.matrix_world @ v.co).z for v in ev.data.vertices)
sole = [mesh.matrix_world @ v.co for v in ev.data.vertices if (mesh.matrix_world @ v.co).z < low + 0.04]
anchor = Vector(((min(v.x for v in sole) + max(v.x for v in sole)) / 2, (min(v.y for v in sole) + max(v.y for v in sole)) / 2, low))
origin = bpy.data.objects.new(H['origin'], None)
scene.collection.objects.link(origin)
origin['ranged_hero'] = H['id']
origin.empty_display_size = .12
rig.parent = origin
rig.location = -anchor
rig.animation_data.action = None
for b in rig.pose.bones:
    b.rotation_quaternion = (1, 0, 0, 0)
    b.location = (0, 0, 0)

mesh.data.calc_loop_triangles()
print('MALHA', len(mesh.data.loop_triangles), 'triângulos', len(mesh.data.materials), 'materiais')
for tr in rig.animation_data.nla_tracks:
    tr.mute = False
bpy.ops.object.select_all(action='DESELECT')
for o in (origin, rig, mesh):
    o.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'exports' / (H['id'] + '.glb')), use_selection=True,
                          export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_image_format='JPEG', export_image_quality=82)
for tr in rig.animation_data.nla_tracks:
    tr.mute = True
rig.animation_data.action = bpy.data.actions['idle']
scene.frame_start, scene.frame_end = 1, 61
scene.frame_set(1)
for im in bpy.data.images:
    if im.is_dirty:
        im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'models' / (H['id'] + '.blend')))
print(H['label'] + ':', len(CLIPS), 'clipes exportados para exports/' + H['id'] + '.glb')
