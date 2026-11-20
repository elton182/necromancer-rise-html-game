"""Prepara os seis NPCs Tripo para a v2, sem alterar os GLBs de origem.

blender --background --threads 4 --python blender/scripts/campaign_npcs_tripo.py
Opcional: -- --only marta (ou helena, joaquim, bruno, lili, tomas).
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import common as c

# Frações da altura: quadril, ombro, base da cabeça, meia largura do tórax.
# Lili tem cabeça maior; Bruno tem tronco largo e avental; capas não seguem pernas.
PROFILES = {
    'marta': ('marta-pbr-151fdde5', .46, .71, .80, .18, False),
    'helena': ('helena-pbr-39617c6b', .47, .72, .82, .17, True),
    'joaquim': ('joaquim-pbr-4035f88c', .45, .70, .80, .19, False),
    'bruno': ('bruno-pbr-57566671', .43, .69, .79, .23, False),
    'lili': ('lili-pbr-7ca110e8', .43, .65, .74, .17, True),
    'tomas': ('tomas-pbr-a7ecfa6f', .45, .70, .80, .18, True),
}


def smooth(a, b, x):
    t = max(0, min(1, (x-a)/(b-a)))
    return t*t*(3-2*t)


IDLE_SECONDS = 12
# Queda do braço, cotovelos E/D, atitude do tronco, início do gesto, olhar.
IDLE_PROFILES = {
    'marta': (80, .22, .14, -.015, .18, .075),
    'helena': (81, .18, .24, .008, .48, -.060),
    'joaquim': (79, .29, .22, .020, .34, .065),
    'bruno': (76, .28, .34, .018, .60, -.070),
    'lili': (80, .20, .16, -.008, .12, .090),
    'tomas': (80, .26, .16, -.022, .42, -.075),
}


def world_rotation(name, rotation):
    bone = c.PB[name]
    basis = bone.bone.matrix_local.to_quaternion()
    bone.rotation_euler = (basis.inverted() @ rotation @ basis).to_euler()


def idle_pose(t, name):
    # Respiração e gesto têm ritmos separados; sem pêndulo de corpo inteiro.
    drop, elbow_l, elbow_r, attitude, start, gaze = IDLE_PROFILES[name]
    p = math.tau*t
    phase = list(IDLE_PROFILES).index(name)*.61
    breath = math.sin(3*p+phase)+.12*math.sin(6*p+phase*2)
    def gesture(begin, duration):
        q = (t-begin)/duration
        return math.sin(math.pi*q)**4 if 0 < q < 1 else 0
    look = gesture(start, .24)
    settle = gesture(.64 if start < .4 else .13, .30)
    c.R('spine', x=attitude*.5+.008*breath, z=.008*settle)
    c.R('chest', x=attitude*.5+.009*breath, y=.009*settle)
    c.PB['chest'].scale = (1+.009*breath, 1+.005*breath, 1+.012*breath)
    c.R('neck', x=-attitude*.4-.006*breath, z=gaze*look*.30)
    c.R('head', x=-attitude*.6+.012*look, z=gaze*look*.70)
    c.R('cape', x=.010*math.sin(3*p+phase-.5), z=.008*settle)
    for side, sign, bend in [('L', 1, elbow_l), ('R', -1, elbow_r)]:
        # Braços baixos, cotovelos ligeiramente à frente; mãos fora do quadril.
        arm_drop = math.radians(drop)+(sign*.013)-.006*breath
        swing = -.055 + sign*.018 + .008*breath
        extra_bend = 0
        if name == 'tomas' and side == 'L':
            extra_bend = .28*look  # confere a alça/bolsa
            arm_drop -= .045*look
        elif name == 'bruno' and side == 'R':
            extra_bend = .11*settle  # acomoda o braço junto ao avental
        elif name == 'lili' and side == 'L':
            extra_bend = .10*look
        c.R('shoulder.'+side, z=sign*.007*breath)
        c.R('cape.'+side, x=.012*math.sin(3*p+phase-sign*.4), z=sign*.006*settle)
        world_rotation('arm.'+side, Quaternion((1, 0, 0), swing) @ Quaternion((0, 1, 0), sign*arm_drop))
        world_rotation('forearm.'+side, Quaternion((0, 0, 1), -sign*(bend+extra_bend+.010*breath)))
        c.R('hand.'+side, y=sign*.025, z=sign*.018*settle)


def bake_idle(name):
    frames = IDLE_SECONDS*24
    c.newact('idle')
    for frame in range(1, frames+2):
        c.reset()
        idle_pose((frame-1)/frames, name)
        c.key(frame)
        c.PB['chest'].keyframe_insert('scale', frame=frame)
    # As outras ações mantêm a escala de descanso original.
    for bone in c.PB:
        bone.scale = (1, 1, 1)


def refine_rig(name, body, rig):
    """Coluna, pescoço, ombros e abas da capa com pesos distribuídos."""
    if 'spine' in rig.data.bones:
        return
    _, hip, shoulder, neck, chest_width, _ = PROFILES[name]
    h, sh, nk, cw = [v*2.4 for v in (hip, shoulder, neck, chest_width)]
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    bones = rig.data.edit_bones
    def bone(n, head, tail, parent):
        b = bones.new(n)
        b.head, b.tail, b.parent = head, tail, bones[parent]
        direction = (b.tail-b.head).normalized()
        b.align_roll(Vector((0, 0, 1)) if abs(direction.y) > .7 else Vector((0, 1, 0)))
        return b
    bone('spine', (0, 0, h+.10), (0, 0, sh-.24), 'hips')
    bones['chest'].parent = bones['spine']
    bones['chest'].head = (0, 0, sh-.24)
    bone('neck', (0, 0, nk-.14), (0, 0, nk+.08), 'chest')
    bones['head'].parent = bones['neck']
    bones['head'].head = (0, 0, nk+.08)
    for side, sign in [('L', 1), ('R', -1)]:
        bone('shoulder.'+side, (sign*cw*.35, 0, sh-.02), (sign*cw, 0, sh), 'chest')
        bones['arm.'+side].parent = bones['shoulder.'+side]
        bone('cape.'+side, (sign*.18, .22, sh-.15), (sign*.40, .27, .5), 'cape')
    bpy.ops.object.mode_set(mode='OBJECT')
    new_names = ['spine', 'neck', 'shoulder.L', 'shoulder.R', 'cape.L', 'cape.R']
    for n in new_names:
        body.vertex_groups.new(name=n)
    # Transfere parcelas dos pesos existentes, preservando soma e UVs/geometria.
    groups = body.vertex_groups
    for v in body.data.vertices:
        x, _, z = v.co
        weights = {groups[g.group].name: g.weight for g in v.groups}
        def transfer(source, target, fraction):
            value = weights.get(source, 0)*fraction
            if value > .000001:
                groups[source].add([v.index], weights[source]-value, 'REPLACE')
                groups[target].add([v.index], value, 'REPLACE')
                weights[source] -= value
        transfer('chest', 'spine', 1-smooth(h+.12, sh-.25, z))
        transfer('head', 'neck', 1-smooth(nk-.02, nk+.18, z))
        for side in ['L', 'R']:
            transfer('arm.'+side, 'shoulder.'+side, .40*(1-smooth(cw, cw+.22, abs(x))))
        cape = weights.get('cape', 0)*.8*(1-smooth(.5, sh-.25, z))
        if cape > .000001:
            groups['cape'].add([v.index], weights['cape']-cape, 'REPLACE')
            left = smooth(-.12, .12, x)
            groups['cape.L'].add([v.index], cape*left, 'REPLACE')
            groups['cape.R'].add([v.index], cape*(1-left), 'REPLACE')
    rig.show_in_front = True
    rig.data.display_type = 'OCTAHEDRAL'
    rig['description'] = 'NPC: coluna, pescoço, ombros, cotovelos, mãos, pernas e capa articulada'
    for label, prefixes in [('Corpo', ('root', 'hips', 'spine', 'chest', 'neck', 'head')), ('Bracos', ('shoulder.', 'arm.', 'forearm.', 'hand.')), ('Pernas', ('leg.', 'shin.', 'foot.')), ('Capa', ('cape',))]:
        collection = rig.data.collections.new(label)
        for b in rig.data.bones:
            if b.name.startswith(prefixes):
                collection.assign(b)


def build(name):
    folder, hip, shoulder, neck, chest_width, has_cape = PROFILES[name]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = name.title() + ' - Tripo preparado'
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'exports/tripo-out' / folder / 'model.glb'))
    body = next(o for o in scene.objects if o.type == 'MESH')
    body.name = name.title() + '_PBR'
    body.data.transform(body.matrix_world)
    body.matrix_world.identity()
    body.data.transform(Matrix.Rotation(-math.pi/2, 4, 'Z'))
    low = Vector(tuple(min(v.co[i] for v in body.data.vertices) for i in range(3)))
    high = Vector(tuple(max(v.co[i] for v in body.data.vertices) for i in range(3)))
    center = Vector(((low.x+high.x)/2, (low.y+high.y)/2, low.z))
    for v in body.data.vertices:
        v.co = (v.co-center)*(2.4/(high.z-low.z))
    bpy.context.view_layer.objects.active = body
    # O original tem ~1,5 milhão de triângulos. Preserva UVs, materiais e silhueta.
    source_triangles = sum(len(p.vertices)-2 for p in body.data.polygons)
    decimate = body.modifiers.new('Game mesh 18000 triangles', 'DECIMATE')
    decimate.ratio = min(1, 18000/source_triangles)
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    for p in body.data.polygons:
        p.use_smooth = True
    h, sh, nk, cw = [v*2.4 for v in (hip, shoulder, neck, chest_width)]
    width = max(abs(v.co.x) for v in body.data.vertices)
    elbow, wrist = width*.63, width*.83
    c.BONES.clear()
    c.PARTS.clear()
    c.bone('root', (0, 0, 0), (0, 0, .15))
    c.bone('hips', (0, 0, h), (0, 0, h+.2), 'root')
    c.bone('chest', (0, 0, h+.2), (0, 0, nk), 'hips')
    c.bone('head', (0, 0, nk), (0, 0, 2.35), 'chest')
    c.bone('cape', (0, .18, sh), (0, .24, .5), 'chest')
    for side, sign in [('L', 1), ('R', -1)]:
        c.bone('arm.'+side, (sign*cw, 0, sh), (sign*elbow, 0, sh), 'chest')
        c.bone('forearm.'+side, (sign*elbow, 0, sh), (sign*wrist, 0, sh), 'arm.'+side)
        c.bone('hand.'+side, (sign*wrist, 0, sh), (sign*width, 0, sh), 'forearm.'+side)
        c.bone('leg.'+side, (sign*.22, 0, h), (sign*.23, 0, h*.53), 'hips')
        c.bone('shin.'+side, (sign*.23, 0, h*.53), (sign*.24, 0, .17), 'leg.'+side)
        c.bone('foot.'+side, (sign*.24, 0, .17), (sign*.24, -.25, .09), 'shin.'+side)
    rig = c.build_rig()
    rig.name = name.title() + '_Rig'
    groups = {n: body.vertex_groups.new(name=n) for n in c.BONES}
    for v in body.data.vertices:
        x, y, z = v.co
        ax = abs(x)
        side = 'L' if x > 0 else 'R'
        cape = smooth(.10, .25, y)*(1-smooth(sh-.20, sh-.04, z)) if has_cape else 0
        arm = smooth(cw-.04, cw+.18, ax)*smooth(sh-.35, sh-.17, z)
        # Inclui os dedos abaixo do punho, sem resíduos de peso no tronco/capa.
        arm = max(arm, smooth(elbow-.06, elbow+.05, ax)*smooth(sh-.40, sh-.24, z))
        cape *= 1-arm
        head = smooth(nk-.04, nk+.10, z)*(1-arm)
        weights = {}
        def add(n, value):
            weights[n] = weights.get(n, 0)+value
        e = smooth(elbow-.10, elbow+.10, ax)
        hand = smooth(wrist-.05, wrist+.04, ax)
        add('arm.'+side, arm*(1-e))
        add('forearm.'+side, arm*e*(1-hand))
        add('hand.'+side, arm*e*hand)
        add('head', head)
        remaining = max(0, 1-arm-head)
        add('cape', remaining*cape)
        # Saias e aventais mantêm a massa central; pés e pernas recebem a passada.
        leg = (1-smooth(h-.10, h+.08, z))*(1-cape)
        if name in ('lili', 'bruno', 'helena', 'joaquim'):
            leg *= smooth(.05, .18, ax) if z > h*.48 else 1
        knee = smooth(h*.43, h*.63, z)
        foot = 1-smooth(.16, .28, z)
        add('leg.'+side, remaining*leg*knee)
        add('shin.'+side, remaining*leg*(1-knee)*(1-foot))
        add('foot.'+side, remaining*leg*(1-knee)*foot)
        torso = max(0, 1-sum(weights.values()))
        chest = smooth(h+.08, sh-.22, z)
        add('chest', torso*chest)
        add('hips', torso*(1-chest))
        total = sum(weights.values())
        for n, value in weights.items():
            if value > .00001:
                groups[n].add([v.index], value/total, 'REPLACE')
    modifier = body.modifiers.new('NPC skin', 'ARMATURE')
    modifier.object = rig
    body.parent = rig
    refine_rig(name, body, rig)
    c.init_anim(scene)

    def arm_pose(side, swing=0, lift=0):
        sign = 1 if side == 'L' else -1
        bone = c.PB['arm.'+side]
        basis = bone.bone.matrix_local.to_quaternion()
        rotation = Quaternion((1, 0, 0), swing) @ Quaternion((0, 1, 0), sign*(math.radians(68)-lift))
        bone.rotation_euler = (basis.inverted() @ rotation @ basis).to_euler()

    def base_idle(t):
        p = math.tau*t
        c.R('chest', x=.009*math.sin(p))
        c.R('head', z=.015*math.sin(p+.5))
        c.R('cape', x=.014*math.sin(p+.7))
        for side in ['L', 'R']:
            arm_pose(side, .012*math.sin(p))

    def greet(t):
        base_idle(t)
        k = math.sin(math.pi*t)**2
        arm_pose('L', -.32*k, .32*k)
        c.R('head', x=.05*k)

    def walk(t):
        base_idle(t)
        p = math.tau*t
        c.PB['hips'].location.z = .009*(1-math.cos(2*p))
        for side, sign in [('L', 1), ('R', -1)]:
            step = math.sin(p)*sign
            c.R('leg.'+side, x=.23*step)
            c.R('shin.'+side, x=-.20*max(0, -step))
            c.R('foot.'+side, x=.06*step)
            arm_pose(side, -.14*step)
        c.R('cape', x=.025+.018*math.sin(p+.5))

    def death(t):
        base_idle(0)
        k = smooth(.1, .9, t)
        c.R('root', x=math.pi/2*k)
        c.PB['root'].location.z = .22*k

    bake_idle(name)
    c.bake_loop('greet', 36, greet)
    c.bake_loop('walk', 24, walk)
    c.bake_once('death', 30, death)
    rig.animation_data.action = bpy.data.actions['idle']
    scene.frame_end = IDLE_SECONDS*24+1
    scene.frame_set(1)
    stem = 'campaign_' + name + '_tripo'
    export_asset(name, body, rig)
    report = {'name': name, 'source': folder+'/model.glb', 'sourceTriangles': source_triangles, 'triangles': sum(len(p.vertices)-2 for p in body.data.polygons), 'vertices': len(body.data.vertices), 'bytes': (ROOT / 'exports' / (stem+'.glb')).stat().st_size, 'textureMaxSize': 512, 'clips': ['idle', 'greet', 'walk', 'death']}
    out = ROOT / 'previews/campaign_npcs_tripo'
    out.mkdir(parents=True, exist_ok=True)
    (out / (name+'.json')).write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report), flush=True)


def export_asset(name, body, rig):
    # Os NPCs ocupam poucos pixels no jogo; 512 mantém o HTML offline sob 100 MiB.
    for image in bpy.data.images:
        if image.type == 'IMAGE' and max(image.size) > 512:
            factor = 512/max(image.size)
            image.scale(round(image.size[0]*factor), round(image.size[1]*factor))
        if image.has_data:
            image.pack()
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
    bpy.context.view_layer.objects.active = rig
    stem = 'campaign_' + name + '_tripo'
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.export_scene.gltf(filepath=str(ROOT / 'exports' / (stem+'.glb')), export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='ACTIONS', export_skins=True, export_yup=True, export_force_sampling=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'models' / (stem+'.blend')))


def animate_existing(name, body, rig):
    # Atualiza só o idle da cena preparada: preserva malha, pesos e demais ações.
    c.ARM = rig
    c.PB = rig.pose.bones
    c.init_anim(bpy.context.scene)
    old = bpy.data.actions.get('idle')
    if old:
        bpy.data.actions.remove(old, do_unlink=True)
    bake_idle(name)
    rig.animation_data.action = bpy.data.actions['idle']
    bpy.context.scene.frame_end = IDLE_SECONDS*24+1
    bpy.context.scene.frame_set(1)


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    names = [args[1]] if args and args[0] == '--only' else PROFILES
    for name in names:
        if '--resize-existing' in args or '--animate-existing' in args or '--refine-existing' in args:
            stem = 'campaign_' + name + '_tripo'
            bpy.ops.wm.open_mainfile(filepath=str(ROOT / 'models' / (stem+'.blend')))
            body = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
            rig = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
            if '--refine-existing' in args:
                refine_rig(name, body, rig)
            if '--animate-existing' in args or '--refine-existing' in args:
                animate_existing(name, body, rig)
            export_asset(name, body, rig)
            report_path = ROOT / 'previews/campaign_npcs_tripo' / (name+'.json')
            report = json.loads(report_path.read_text(encoding='utf-8'))
            report['bytes'] = (ROOT / 'exports' / (stem+'.glb')).stat().st_size
            report['textureMaxSize'] = 512
            report['bones'] = len(rig.data.bones)
            report['idleSeconds'] = IDLE_SECONDS
            report['idleProfile'] = name
            report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
        else:
            build(name)
