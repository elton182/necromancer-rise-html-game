"""Prepara o GLB Tripo de João, preservando a malha, UVs e materiais PBR.

Da raiz: blender --background --python blender/scripts/joao_tripo.py
Também pode ser executado com runpy no Blender aberto; cria uma cena separada.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import common as c

SOURCE = ROOT / 'exports/tripo-out/joao-pbr-ccfe3c4b/model.glb'
NAME = 'campaign_joao_tripo'


def smooth(a, b, x):
    t = max(0, min(1, (x-a)/(b-a)))
    return t*t*(3-2*t)


def build():
    if any(a.name in ('idle', 'greet', 'walk', 'death') for a in bpy.data.actions):
        raise RuntimeError('Há ações com os mesmos nomes na sessão. Regenere em um processo Blender --background separado para preservar o trabalho aberto.')
    scene = bpy.data.scenes.new('João - modelo Tripo')
    bpy.context.window.scene = scene
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    body = next(o for o in scene.objects if o.type == 'MESH')
    body.name = 'Joao_PBR'
    # Tripo entrega largura no eixo Y; o jogo espera frente em -Y no Blender.
    body.data.transform(body.matrix_world)
    body.matrix_world.identity()
    body.data.transform(Matrix.Rotation(-math.pi/2, 4, 'Z'))
    coords = [v.co.copy() for v in body.data.vertices]
    low = Vector(tuple(min(v[i] for v in coords) for i in range(3)))
    high = Vector(tuple(max(v[i] for v in coords) for i in range(3)))
    scale = 2.4/(high.z-low.z)
    center = Vector(((low.x+high.x)/2, (low.y+high.y)/2, low.z))
    for v in body.data.vertices:
        v.co = (v.co-center)*scale
    body.data.update()
    print('Normalized bounds:', [(min(v.co[i] for v in body.data.vertices), max(v.co[i] for v in body.data.vertices)) for i in range(3)])
    c.BONES.clear()
    c.PARTS.clear()
    c.bone('root', (0, 0, 0), (0, 0, .15))
    c.bone('hips', (0, 0, 1.02), (0, 0, 1.28), 'root')
    c.bone('chest', (0, 0, 1.28), (0, 0, 1.85), 'hips')
    c.bone('head', (0, 0, 1.85), (0, 0, 2.36), 'chest')
    c.bone('cape', (0, .22, 1.73), (0, .28, .45), 'chest')
    for side, sign in [('L', 1), ('R', -1)]:
        c.bone('arm.'+side, (sign*.43, 0, 1.73), (sign*.85, 0, 1.73), 'chest')
        c.bone('forearm.'+side, (sign*.85, 0, 1.73), (sign*1.13, 0, 1.73), 'arm.'+side)
        c.bone('hand.'+side, (sign*1.13, 0, 1.73), (sign*1.35, 0, 1.73), 'forearm.'+side)
        c.bone('leg.'+side, (sign*.22, 0, 1.04), (sign*.23, -.015, .59), 'hips')
        c.bone('shin.'+side, (sign*.23, -.015, .59), (sign*.24, 0, .17), 'leg.'+side)
        c.bone('foot.'+side, (sign*.24, 0, .17), (sign*.24, -.25, .09), 'shin.'+side)
    rig = c.build_rig()
    rig.name = 'Joao_Rig'
    groups = {name: body.vertex_groups.new(name=name) for name in c.BONES}
    # Pesos espaciais determinísticos: a capa não acompanha braços ou joelhos.
    for v in body.data.vertices:
        x, y, z = v.co
        ax = abs(x)
        side = 'L' if x > 0 else 'R'
        cape = smooth(.10-.12*smooth(.38,.55,ax), .26-.12*smooth(.38,.55,ax), y)*(1-smooth(1.52, 1.68, z))
        arm = smooth(.39, .57, ax)*smooth(1.36, 1.53, z)*(1-cape)
        # Os dedos estão abaixo da linha do braço na referência: todo o extremo
        # lateral pertence ao braço, sem resíduo de peso no tórax ou na capa.
        arm += (1-arm)*smooth(.68, .82, ax)*smooth(1.30, 1.48, z)
        head = smooth(1.82, 1.96, z)*(1-arm)
        leg = (1-smooth(.97, 1.15, z))*(1-cape)
        weights = {}
        def add(name, value):
            weights[name] = weights.get(name, 0)+value
        if arm:
            elbow = smooth(.76, .95, ax)
            hand = smooth(1.00, 1.08, ax)
            add('arm.'+side, arm*(1-elbow))
            add('forearm.'+side, arm*elbow*(1-hand))
            add('hand.'+side, arm*elbow*hand)
        add('head', head)
        remaining = max(0, 1-arm-head)
        add('cape', remaining*cape)
        add('leg.'+side, remaining*leg*smooth(.48, .67, z))
        add('shin.'+side, remaining*leg*(1-smooth(.48, .67, z))*smooth(.16, .28, z))
        add('foot.'+side, remaining*leg*(1-smooth(.16, .28, z)))
        torso = max(0, 1-sum(weights.values()))
        chest = smooth(1.14, 1.43, z)
        add('chest', torso*chest)
        add('hips', torso*(1-chest))
        total = sum(weights.values())
        for name, weight in weights.items():
            if weight > .00001:
                groups[name].add([v.index], weight/total, 'REPLACE')
    modifier = body.modifiers.new('Joao skin', 'ARMATURE')
    modifier.object = rig
    body.parent = rig
    c.init_anim(scene)

    def arm_pose(side, angle, swing=0, bend=0):
        sign = 1 if side == 'L' else -1
        bone = c.PB['arm.'+side]
        basis = bone.bone.matrix_local.to_quaternion()
        world = Quaternion((1, 0, 0), swing) @ Quaternion((0, 1, 0), sign*angle)
        bone.rotation_euler = (basis.inverted() @ world @ basis).to_euler()
        c.R('forearm.'+side, z=sign*bend)

    def idle(t):
        p = math.tau*t
        c.R('chest', x=.012*math.sin(p))
        c.R('head', z=.018*math.sin(p+.5))
        c.R('cape', x=.018*math.sin(p+.7))
        for side in ['L', 'R']:
            arm_pose(side, math.radians(72), .015*math.sin(p), .04)

    def greet(t):
        idle(t)
        gesture = math.sin(math.pi*t)**2
        arm_pose('L', math.radians(72)-.48*gesture, -.4*gesture, -.22*gesture)
        c.R('head', x=.06*gesture)

    def walk(t):
        idle(t)
        p = math.tau*t
        c.PB['hips'].location.z = .012*(1-math.cos(2*p))
        for side, sign in [('L', 1), ('R', -1)]:
            step = math.sin(p)*sign
            c.R('leg.'+side, x=.29*step)
            c.R('shin.'+side, x=-.22*max(0, -step))
            c.R('foot.'+side, x=.08*step)
            arm_pose(side, math.radians(72), -.18*step, .04)
        c.R('cape', x=.04+.025*math.sin(p+.5))

    def death(t):
        idle(0)
        k = smooth(.1, .9, t)
        c.R('root', x=math.pi/2*k)
        c.PB['root'].location.z = .22*k

    c.bake_loop('idle', 72, idle)
    c.bake_loop('greet', 36, greet)
    c.bake_loop('walk', 24, walk)
    c.bake_once('death', 30, death)
    rig.animation_data.action = bpy.data.actions['idle']
    scene.frame_end = 73
    scene.frame_set(1)
    images = {node.image for mat in body.data.materials if mat.use_nodes for node in mat.node_tree.nodes if node.type == 'TEX_IMAGE' and node.image}
    for image in images:
        if image.source == 'FILE' and image.has_data and not image.packed_file:
            image.pack()
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(filepath=str(ROOT / 'exports' / (NAME+'.glb')), export_format='GLB', use_selection=True, use_active_scene=True, export_animations=True, export_animation_mode='ACTIONS', export_skins=True, export_yup=True, export_force_sampling=True)
    bpy.data.libraries.write(str(ROOT / 'models' / (NAME+'.blend')), {scene}, fake_user=True)
    print('João PBR: exportado com idle, greet, walk, death; fonte Tripo preservada.')


if __name__ == '__main__':
    build()
