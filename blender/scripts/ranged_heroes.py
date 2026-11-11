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
if hero_key == 'archer':
    # Corrida e chassé com a duração do ciclo no jogo (6 u/s): 0,4 s e 0,3 s a 30 fps.
    CLIPS = [(n, {'walk': 13, 'strafe_left': 10, 'strafe_right': 10}.get(n, f)) for n, f in CLIPS]
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


def vertex_colors(obj):
    """Cor-base média de cada vértice, lida da textura do material 0 (para separar peças por cor)."""
    import numpy as np
    me = obj.data
    mat = me.materials[0]
    img = next(n.image for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image
               and any(l.to_socket.name == 'Base Color' for l in n.outputs[0].links))
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    uv = me.uv_layers.active.data
    col = np.zeros((len(me.vertices), 3))
    cnt = np.zeros(len(me.vertices))
    for poly in me.polygons:
        if poly.material_index != 0:
            continue
        for li in poly.loop_indices:
            u, v = uv[li].uv
            vi = me.loops[li].vertex_index
            col[vi] += px[min(h - 1, int(v % 1 * h)), min(w - 1, int(u % 1 * w)), :3]
            cnt[vi] += 1
    return col / np.maximum(cnt, 1)[:, None]


def fix_archer_weights():
    """Pesos automáticos da fonte Tripo corrigidos para a Arqueira.

    Aljava: vinha presa ao ombro e braço direitos, à coxa direita e à cabeça, e balançava com a
    corda e a passada; agora é rígida no peito (Spine2), com transição suave na capa ao redor.
    Joelho: a troca coxa/canela era um degrau de 2 cm sobre a joelheira, e o cano da bota ainda
    seguia um pouco a coxa; agora a troca é suave em ±2,5 cm e o cano segue só a canela.
    Medidas no espaço do rig (eixo da aljava ajustado por círculos sobre a malha da fonte)."""
    me = body.data
    col = vertex_colors(body)
    green = col[:, 1] > col[:, 0] * 0.95
    groups = {vg.name: vg for vg in body.vertex_groups}
    names = {vg.index: vg.name for vg in body.vertex_groups}
    chest = groups['mixamorig:Spine2']
    spine2 = rig.data.bones['mixamorig:Spine2'].head_local
    axis_c = spine2 + Vector((-0.0403, 0.1389, -0.0614))
    axis_d = Vector((0.3003, 0.252, -0.9199)).normalized()  # da boca (flechas) para o fundo
    arm_chain = {groups[n].index for n in groups if any(k in n for k in ('Arm', 'Hand'))}
    quiver = 0
    for v in me.vertices:
        d = v.co - axis_c
        t = d.dot(axis_d)
        rad = (d - axis_d * t).length
        if t < -0.37 or t > 0.23:
            continue
        top = t < -0.20  # flechas acima da boca: exclui o capuz (verde)
        if top and green[v.index]:
            continue
        reach = 0.075 if top else 0.070
        if sum(g.weight for g in v.groups if g.group in arm_chain) >= 0.5:
            # Pele do ombro encostada na boca da aljava: só o que está bem dentro do cilindro.
            w = 1.0 if rad < 0.055 else 0.0
        else:
            w = 1.0 if rad < reach else max(0.0, 1 - (rad - reach) / 0.025)
        if t > 0.20:
            w *= 1 - (t - 0.20) / 0.03
        if w <= 0:
            continue
        for g in v.groups:
            if names[g.group] != chest.name:
                g.weight *= 1 - w
        old = next((g.weight for g in v.groups if g.group == chest.index), 0.0)
        chest.add([v.index], old + w, 'REPLACE')
        quiver += w >= 1
    for side in ('Left', 'Right'):
        up = rig.data.bones['mixamorig:' + side + 'UpLeg']
        low = rig.data.bones['mixamorig:' + side + 'Leg']
        gu, gl = groups[up.name], groups[low.name]
        knee = low.head_local
        along = (up.head_local - low.tail_local).normalized()
        for v in me.vertices:
            d = v.co - knee
            h = d.dot(along)
            if abs(h) > 0.06 or (d - along * h).length > 0.07:
                continue
            w = {names[g.group]: g.weight for g in v.groups}
            pair = w.get(gu.name, 0) + w.get(gl.name, 0)
            if pair < 0.85 * sum(w.values()):
                continue
            share = min(1, max(0, (h + 0.025) / 0.05))
            share = share * share * (3 - 2 * share)
            gu.add([v.index], pair * share, 'REPLACE')
            gl.add([v.index], pair * (1 - share), 'REPLACE')
    print('PESOS aljava rígida no peito:', quiver, 'vértices; joelhos suavizados')


if hero_key == 'archer':
    fix_archer_weights()

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


# Arqueira: idle e deslocamento orgânicos (peso alternando, quadril/ombros em contrarrotação,
# rolagem do pé, braços acompanhando o peito). O Mercenário mantém os clipes originais.
SOFT = hero_key == 'archer'
TOE = {s: rest(s + 'ToeBase') for s in ('Left', 'Right')}
HEEL = {s: FOOT[s] + Vector((0, 0.02, -0.075)) for s in ('Left', 'Right')}


def roll_foot(side, offset, angle):
    """Desloca o tornozelo para que o pé gire sobre o calcanhar (ângulo < 0, ponta para cima)
    ou sobre a base dos dedos (ângulo > 0, calcanhar erguido) em vez de girar no tornozelo."""
    pivot = HEEL[side] if angle < 0 else TOE[side]
    turned = pivot + Quaternion((1, 0, 0), angle) @ (FOOT[side] - pivot)
    return offset + turned - FOOT[side]


# O jogador anda a 6 u/s: com pernas de ~0,9 u isso é corrida. O `walk` da Arqueira é uma corrida
# leve com fase de voo; a passada (RUN_STRIDE) fecha com a velocidade numa cadência de ~2,6 ciclos/s,
# e o clipe tem essa duração, para o Blender mostrar o mesmo ritmo do jogo. Os valores de passada em
# unidades do jogo ficam em v2/assets/models.json (stride/strafeStride = passada x 2,3).
RUN_STRIDE = 1.0
RUN_DUTY = 0.34
RUN_LAND = 0.13          # o pé toca à frente do quadril e sai RUN_STRIDE x RUN_DUTY atrás
GALLOP_STRIDE = 0.75     # passo lateral: chassé (pé guia abre, o outro fecha sem cruzar, salto curto)
GALLOP_DUTY = 0.32
GALLOP_TRAIL = 0.22      # fase em que o pé de trás toca, depois do pé guia


def run_cycle(t):
    """Corrida: apoio curto com toque na sola média, desenrolar até os dedos, voo e calcanhar
    alto na volta. Retorna deslocamento do tornozelo e inclinação do pé por lado."""
    reach = RUN_STRIDE * RUN_DUTY
    feet, pitch = {}, {}
    for side, phase in (('Left', 0.0), ('Right', 0.5)):
        u = (t + phase) % 1
        if u < RUN_DUTY:
            y = RUN_LAND - reach * u / RUN_DUTY
            z = 0.0
            k = u / RUN_DUTY
            angle = lerp(-0.12, 0.0, smooth(min(1, k / 0.3))) + 0.6 * smooth(max(0, (k - 0.55) / 0.45))
        else:
            v = (u - RUN_DUTY) / (1 - RUN_DUTY)
            y = lerp(RUN_LAND - reach, RUN_LAND, smooth(v))
            # O calcanhar sobe cedo, rente às costas; o pé desce estendido para o toque.
            z = 0.075 * math.sin(math.pi * v ** 0.6)
            back = 0.05 * math.sin(math.pi * min(1, v / 0.6)) if v < 0.6 else 0.0
            y -= back
            angle = lerp(0.6, -0.12, smooth(v))
        off = Vector((-0.018 if side == 'Left' else 0.018, -y, z))
        feet[side] = roll_foot(side, off, angle)
        pitch[side] = angle
    return feet, pitch


def gallop_cycle(t, lead):
    """Passo lateral em chassé para o lado de `lead` ('Left' anda para +X). O pé guia toca em t=0,
    o de trás toca em GALLOP_TRAIL sem passar do guia (folga >= 0,12 entre tornozelos)."""
    sign = 1 if lead == 'Left' else -1
    trail = 'Right' if lead == 'Left' else 'Left'
    reach = GALLOP_STRIDE * GALLOP_DUTY
    feet = {}
    for side, phase, land in ((lead, 0.0, 0.16), (trail, GALLOP_TRAIL, 0.08)):
        u = (t - phase) % 1
        if u < GALLOP_DUTY:
            x = land - reach * u / GALLOP_DUTY
            z = 0.0
        else:
            v = (u - GALLOP_DUTY) / (1 - GALLOP_DUTY)
            x = lerp(land - reach, land, smooth(v))
            z = 0.04 * math.sin(math.pi * v)
        feet[side] = Vector((x * sign, 0.0, z))
    return feet


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
    if SOFT and name == 'idle':
        # Pernas quase retas (cada cm de quadril abaixado dobra muito o joelho nesta escala),
        # peso indo de um pé ao outro, respiração no peito e cabeça com atraso de fase.
        sway = math.sin(t * math.tau)
        drift = math.sin(t * math.tau + 0.6)
        p['hip'] = Vector((0.007 * sway, 0, -0.003 + 0.0015 * breath))
        p['pelvis'] = Vector((0.015, -0.03 * sway, 0.025 * drift))
        p['chest'] = Vector((0.035 - 0.015 * breath, 0.02 * sway, -0.02 * drift))
        p['neck'] = Vector((0.012 * math.sin(2 * t * math.tau + 1.1), -0.01 * sway, 0.06 * math.sin(t * math.tau + 2.2)))
        p['follow'] = True
        p['grip'] = p['grip'] + Vector((0, 0.004 * math.sin(t * math.tau + 2.5), 0.02 + 0.003 * breath))
        # Mão livre solta ao lado da coxa, cotovelo levemente dobrado (antes ficava à frente, em garra).
        p['free'] = HIP + Vector((-0.15 + 0.003 * math.sin(t * math.tau + 1.9), 0.02 + 0.005 * math.sin(t * math.tau + 0.4), -0.004 + 0.004 * breath))
        p['free_curl'] = 0.30
    elif SOFT and name == 'walk':
        feet, pitch = run_cycle(t)
        swing = math.cos(t * math.tau)  # +1 com o pé esquerdo à frente
        side = math.sin(t * math.tau + 0.5)  # +1 com o peso no pé esquerdo
        # Mais baixo no meio do apoio (o joelho amortece), mais alto no voo.
        p['hip'] = Vector((0.006 * side, 0, -0.033 - 0.008 * math.cos((t - RUN_DUTY / 2) * 4 * math.pi)))
        p['pelvis'] = Vector((0.06, -0.03 * side, -0.12 * swing))
        p['chest'] = Vector((0.17, 0.012 * side, 0.13 * swing))
        p['neck'] = Vector((0.04, 0.0, 0.03 * swing))
        # Braço livre de corrida: cotovelo a 90°, mão do quadril (atrás) até a frente do peito.
        f = smooth((swing + 1) / 2)
        p['free'] = lerp(HIP + Vector((-0.14, 0.09, 0.07)), HIP + Vector((-0.07, -0.12, 0.16)), f)
        p['free_curl'] = 0.85
        # O arco vai baixo ao lado do corpo e balança menos, do lado oposto.
        p['grip'] = p['grip'] + Vector((0, 0.05 * swing, 0.03 + 0.02 * max(0, -swing)))
        p['feet'] = feet
        p['pitch'] = pitch
        p['toes'] = {s: max(0.0, a) for s, a in pitch.items()}
        p['follow'] = True
    elif SOFT and name in ('strafe_left', 'strafe_right'):
        lead = 'Left' if name == 'strafe_left' else 'Right'
        sign = 1 if lead == 'Left' else -1
        p['feet'] = gallop_cycle(t, lead)
        low = math.cos((t - 0.27) * math.tau)  # +1 no apoio duplo, -1 no meio do salto
        # O quadril vai sobre o pé que apoia: guia ao tocar, o de trás ao impulsionar.
        p['hip'] = Vector((0.055 * sign * math.cos((t - 0.03) * math.tau), 0, -0.036 - 0.012 * low))
        p['pelvis'] = Vector((0.03, -0.04 * sign * math.cos((t - 0.03) * math.tau), 0.0))
        p['chest'] = Vector((0.07, 0.02 * sign * math.cos((t - 0.03) * math.tau), 0.0))
        p['neck'] = Vector((0.02, 0.0, 0.0))
        p['free'] = HIP + Vector((-0.15, -0.02, 0.06 + 0.012 * low))
        p['free_curl'] = 0.7
        p['grip'] = p['grip'] + Vector((0, 0, 0.02 + 0.012 * low))
        p['follow'] = True
    elif name in ('walk', 'strafe_left', 'strafe_right'):
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
            yaw = Quaternion((0, 0, 1), twist)
            if SOFT:
                # A cabeça e o capuz descem até ~0,70 e, vistos de cima (câmera do jogo), cobrem a
                # região do queixo: a linha da flecha passa abaixo do capuz e a âncora fica logo atrás
                # da cabeça, onde a mão continua visível; o cotovelo aponta para trás, na linha da flecha.
                grip = grip + Vector((0, 0, -0.025 * draw))
                anchor = HIP + yaw @ (Vector((-0.13, 0.0, SH['Right'].z - 0.035)) - HIP)
                p['free_pole'] = yaw @ Vector((-0.30, 0.12, 0.08))
                rest_hand = HIP + Vector((-0.15, 0.02, 0.0))
            else:
                anchor = HIP + yaw @ (Vector((-0.06, -0.02, HEAD.z - 0.04)) - HIP)
                rest_hand = Vector((-0.17, -0.10, HIP.z + 0.04))
            p['twist'] = twist
            p['grip'] = grip
            p['wq'] = wq
            string = grip + wq @ Vector((0, -0.05, 0))
            released = ease([(0, 0.0), (0.46 * k, 0.0), (0.52 * k, 1.0), (0.75, 1.0), (1.0, 0.0)], t)
            p['free'] = lerp(lerp(rest_hand, string, min(1, draw * 1.6)), anchor, ease([(0, 0), (0.18, 0), (0.42, 1), (1, 1)], t) * draw)
            if SOFT and t > 0.52 * k:
                # Depois da soltura a mão recua um pouco e desce pela lateral até o repouso,
                # em vez de voltar pela frente do rosto até a corda.
                u = (t - 0.52 * k) / (1 - 0.52 * k)
                follow = anchor + yaw @ Vector((-0.03, 0.03, 0.0))
                side = HIP + yaw @ Vector((-0.17, 0.07, 0.08))
                a, b = lerp(follow, side, smooth(min(1, u * 1.6))), lerp(side, rest_hand, smooth(max(0, u * 1.6 - 0.6)))
                p['free'] = lerp(a, b, smooth(u))
            else:
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
    if 'pelvis' in p:
        # Ângulos (frente, lado, giro) do quadril, do peito e da cabeça no mundo; cada osso
        # recebe a diferença para o pai, então peito e quadril podem girar em sentidos opostos.
        pel, chest, head = p['pelvis'], p['chest'], p['neck']
        rot_world('Hips', pel)
        for key, k in (('Spine', .30), ('Spine1', .35), ('Spine2', .35)):
            rot_world(key, (chest - pel) * k)
        rot_world('Neck', (head - chest) * .4)
        rot_world('Head', (head - chest) * .6)
    else:
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
            leg(side, foot, pole, p.get('pitch', {}).get(side, 0.0), 0.0)
    for side, angle in p.get('toes', {}).items():
        rot_world(side + 'ToeBase', (-angle, 0, 0))  # dedos ficam no chão com o calcanhar erguido
    if p.get('follow'):
        # Braços presos ao peito (não a pontos fixos no mundo): acompanham respiração, peso e giro.
        bpy.context.view_layer.update()
        chest_bone = bones['Spine2']
        follow = chest_bone.matrix @ chest_bone.bone.matrix_local.inverted()
        p['grip'] = follow @ p['grip']
        p['free'] = follow @ p['free']
        p['wq'] = follow.to_quaternion() @ p['wq']
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
        pole = p.get('free_pole', Vector((0.30 * side_sign, 0.30, -0.10)))
        arm(free_side, free, free + pole)
        curl(free_side, p.get('free_curl', 0.8 if name in ('shoot', 'shoot_up', 'throw', 'plant') else 0.45), 0.6)


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
