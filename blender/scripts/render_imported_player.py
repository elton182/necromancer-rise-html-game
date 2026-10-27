"""Teste de GLB importado: -- rigged para o mago animado; preview para poses."""
from pathlib import Path
import sys, math, json
import bpy
from mathutils import Vector, Quaternion, Matrix

BASE = Path(__file__).resolve().parents[1]
RIGGED = 'rigged' in sys.argv
NAME = 'rigged_player' if RIGGED else 'imported_player'
SOURCE = 'purple_hooded_mage.glb' if RIGGED else 'necromancer_1.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(BASE / 'exports'/SOURCE))
bpy.context.view_layer.update()
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render and o.visible_get()]
depsgraph = bpy.context.evaluated_depsgraph_get()
points = [o.matrix_world @ v.co for source in meshes
          for o in [source.evaluated_get(depsgraph)] for v in o.data.vertices]
lo = Vector(tuple(min(v[i] for v in points) for i in range(3)))
hi = Vector(tuple(max(v[i] for v in points) for i in range(3)))
scale = 2.25 / (hi.z-lo.z)
root = bpy.data.objects.new('ImportedPlayer', None)
bpy.context.collection.objects.link(root)
for o in list(bpy.context.scene.objects):
    if o != root and o.parent is None:
        o.parent = root
root.scale = (scale,)*3
root.location = (-(lo.x+hi.x)*scale/2, -(lo.y+hi.y)*scale/2, -lo.z*scale)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.samples = 16
sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = 224
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'
# O teste estático mantém PBR; o teste com rig reconecta a textura ao toon abaixo.
sc.world = bpy.data.worlds.new('World')
sc.world.use_nodes = True
sc.world.node_tree.nodes['Background'].inputs[0].default_value = (.65,.70,.8,1)
sc.world.node_tree.nodes['Background'].inputs[1].default_value = .8
bpy.ops.object.light_add(type='AREA', location=(-3, -4, 7))
bpy.context.object.data.energy = 450
bpy.context.object.data.shape = 'DISK'
bpy.context.object.data.size = 5
bpy.ops.object.camera_add()
cam = bpy.context.object
sc.camera = cam
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 4
p = math.radians(35)
fwd = Vector((0, math.cos(p), -math.sin(p)))
tgt = Vector((0, math.sin(p), math.cos(p))) * (165-112)/56
cam.location = tgt-fwd*12
cam.rotation_euler = (tgt-cam.location).to_track_quat('-Z','Y').to_euler()
out = BASE/'frames'/NAME
out.mkdir(parents=True, exist_ok=True)
if RIGGED:
    sys.path.insert(0,str(BASE/'scripts'))
    import combat_toon
    import imported_staff
    arm = next(o for o in sc.objects if o.type == 'ARMATURE')
    staff=imported_staff.attach(BASE,arm)
    # Guardar o nó da textura antes do toon compartilhado reconstruir o material.
    textures=[]
    for material in bpy.data.materials:
        if not material.use_nodes:continue
        pr=material.node_tree.nodes.get('Principled BSDF')
        if pr and pr.inputs['Base Color'].is_linked:
            source=pr.inputs['Base Color'].links[0].from_node
            if source.type=='TEX_IMAGE':textures.append((material,source.image))
    combat_toon.setup(sc)
    bpy.context.view_layer.freestyle_settings.linesets[0].linestyle.color=(0,0,0)
    sc.cycles.samples=16
    for material,image in textures:
        nt=material.node_tree
        tex=nt.nodes.new('ShaderNodeTexImage');tex.image=image
        # Leve aumento de cor antes das três faixas, mantendo olhos e detalhes.
        hue=nt.nodes.new('ShaderNodeHueSaturation')
        hue.inputs['Saturation'].default_value=1.05
        hue.inputs['Value'].default_value=1.12
        nt.links.new(tex.outputs['Color'],hue.inputs['Color'])
        mix=next(n for n in nt.nodes if n.type=='MIX')
        nt.links.new(hue.outputs['Color'],mix.inputs[7])
    arm = next(o for o in sc.objects if o.type == 'ARMATURE')
    # Rotações em eixos do esqueleto, convertidas ao espaço local de cada osso.
    def rotate(name, axis, angle):
        b = arm.pose.bones['mixamorig:'+name]
        b.rotation_mode = 'QUATERNION'
        local = b.bone.matrix_local.to_3x3().inverted() @ Vector(axis)
        b.rotation_quaternion = Quaternion(local.normalized(), angle) @ b.rotation_quaternion
    def pose_matrix(b):
        rest=b.bone.matrix_local
        local=b.rotation_quaternion.to_matrix().to_4x4()
        if b.parent:
            return pose_matrix(b.parent) @ b.parent.bone.matrix_local.inverted() @ rest @ local
        return rest @ local
    def aim_bone(name, direction):
        b=arm.pose.bones['mixamorig:'+name]
        parent_delta=pose_matrix(b.parent).to_3x3() @ b.parent.bone.matrix_local.to_3x3().inverted()
        target=parent_delta.inverted() @ Vector(direction).normalized()
        rest=b.bone.matrix_local.to_3x3()
        delta=(b.bone.tail_local-b.bone.head_local).normalized().rotation_difference(target)
        b.rotation_quaternion=(rest.inverted() @ delta.to_matrix() @ rest).to_quaternion()
    def cast_palm():
        b=arm.pose.bones['mixamorig:LeftHand']
        forward=(b.bone.tail_local-b.bone.head_local).normalized()
        across=(arm.data.bones['mixamorig:LeftHandIndex1'].head_local-arm.data.bones['mixamorig:LeftHandPinky1'].head_local).normalized()
        normal=forward.cross(across).normalized();across=normal.cross(forward).normalized()
        basis=Matrix((forward,across,normal)).transposed()
        # Dedos para cima e normal da palma para a frente do personagem (-Y).
        target=Matrix(((0,0,1),(-1,0,0),(0,-1,0))).transposed()
        parent_delta=pose_matrix(b.parent).to_3x3() @ b.parent.bone.matrix_local.to_3x3().inverted()
        rest=b.bone.matrix_local.to_3x3()
        b.rotation_quaternion=(rest.inverted() @ parent_delta.inverted() @ target @ basis.inverted() @ rest).to_quaternion()
    specs = [('idle',4,4,True),('walk',8,12,True),('cast',6,16,False),('death',6,7.5,False)]
    for name,n,fps,loop in specs:
        arm.animation_data_create()
        arm.animation_data.action = bpy.data.actions.new(name)
        arm.animation_data.action.use_fake_user=True
        for fi in range(n):
            sc.frame_set(fi+1)
            t = fi/n if loop else fi/(n-1)
            s = math.sin(t*math.tau)
            for b in arm.pose.bones:
                b.rotation_mode='QUATERNION'; b.rotation_quaternion=Quaternion(); b.location=(0,0,0)
            rotate('LeftArm',(0,1,0),1.25)
            rotate('RightArm',(0,1,0),-1.25)
            for side,sign in [('Left',1),('Right',-1)]:
                rotate(side+'UpLeg',(0,1,0),.17*sign)
            for finger in ('Index','Middle','Ring','Pinky'):
                for joint in (1,2,3):rotate(f'RightHand{finger}{joint}',(0,1,0),-.60)
            rotate('Spine',(1,0,0),.025*s)
            if name=='walk':
                for side,sign in [('Left',1),('Right',-1)]:
                    rotate(side+'UpLeg',(1,0,0),.25*s*sign)
                    rotate(side+'Leg',(1,0,0),-.22*max(0,-s*sign))
                    # Braço e perna do mesmo lado vão em sentidos opostos.
                    rotate(side+'Arm',(1,0,0),-.38*s*sign)
                    rotate(side+'ForeArm',(0,0,1),-.10*sign)
            if name=='cast':
                pulse=min(1,t/.40) if t<.75 else max(0,(1-t)/.25)
                rotate('Spine',(1,0,0),-.06*pulse)
                saved={bone_name:arm.pose.bones['mixamorig:'+bone_name].rotation_quaternion.copy()
                       for bone_name in ('LeftArm','LeftForeArm','LeftHand')}
                aim_bone('LeftArm',(.15,-1,.10))
                aim_bone('LeftForeArm',(.04,-1,.14))
                cast_palm()
                for bone_name,start in saved.items():
                    b=arm.pose.bones['mixamorig:'+bone_name]
                    b.rotation_quaternion=start.slerp(b.rotation_quaternion,pulse)
            if name=='death':
                rotate('Hips',(1,0,0),-1.45*t)
                arm.pose.bones['mixamorig:Hips'].location.z=-.28*t
            # Pegada: cotovelo dobrado, antebraço e mão ligeiramente à frente.
            aim_bone('RightArm',(-.08,-.26,-1))
            aim_bone('RightForeArm',(-.02,-1,.28))
            # Abrir o braço lateralmente como um conjunto, preservando a dobra.
            rotate('RightArm',(0,1,0),.20)
            for b in arm.pose.bones:
                b.keyframe_insert('rotation_quaternion',frame=fi+1)
                b.keyframe_insert('location',frame=fi+1)
        for fc in arm.animation_data.action.layers[0].strips[0].channelbag(arm.animation_data.action_slot).fcurves:
            for key in fc.keyframe_points:key.interpolation='LINEAR'
    meta=dict(cell=224,ppu=56,anchorX=112,anchorY=165,dirs=8,source=SOURCE,staticPrototype=False,
              artVersion='black-outline-layered-staff-v4',
              anims={name:dict(n=n,fps=fps,loop=loop,row=ai*8) for ai,(name,n,fps,loop) in enumerate(specs)})
    sc.frame_set(1)
    arm.animation_data.action=bpy.data.actions['idle']
    arm.animation_data.action_slot=bpy.data.actions['idle'].slots[0]
    sc.frame_set(1);bpy.context.view_layer.update()
    staff.rotation_quaternion=arm.pose.bones['mixamorig:RightHand'].matrix.to_3x3().inverted().to_quaternion()
    upright=staff.constraints.new('COPY_ROTATION');upright.name='Cajado vertical'
    upright.target=root;upright.owner_space='WORLD';upright.target_space='WORLD'
    bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models'/f'{NAME}.blend'))
    if 'poses' in sys.argv:sys.exit(0)
    for ai,(name,n,fps,loop) in enumerate(specs):
        if 'walk-only' in sys.argv and name!='walk':continue
        act=bpy.data.actions[name];arm.animation_data.action=act;arm.animation_data.action_slot=act.slots[0]
        for di in range(8):
            root.rotation_euler.z=math.radians(90-di*45)
            for fi in range(n):
                if 'preview' in sys.argv and (di not in (0,2) or fi not in (0,max(1,n//4),n//2,n-1)):continue
                sc.frame_set(fi+1)
                if 'staff-only' not in sys.argv:
                    staff.hide_render=True
                    sc.render.filepath=str(out/f'{ai*8+di}_{fi}.png')
                    bpy.ops.render.render(write_still=True)
                staff.hide_render=False
                for body in meshes:body.is_holdout=True
                sc.render.use_freestyle=False
                weapon_out=BASE/'frames/rigged_player_staff';weapon_out.mkdir(parents=True,exist_ok=True)
                sc.render.filepath=str(weapon_out/f'{ai*8+di}_{fi}.png')
                bpy.ops.render.render(write_still=True)
                sc.render.use_freestyle=True
                for body in meshes:body.is_holdout=False
    (BASE/f'spritesheets/{NAME}_sheet.json').write_text(json.dumps(meta,indent=2))
    sys.exit(0)
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/imported_player.blend'))
for di in (range(1) if 'preview' in sys.argv else range(8)):
    root.rotation_euler.z = math.radians(90-di*45)
    sc.render.filepath = str(out/f'{di}.png')
    bpy.ops.render.render(write_still=True)
meta = dict(cell=224, ppu=56, anchorX=112, anchorY=165, dirs=8,
            source='necromancer_1.glb', staticPrototype=True,
            anims={name:dict(n=1, fps=1, loop=name in ('idle','walk'), row=0)
                   for name in ('idle','walk','cast','death')})
(BASE/'spritesheets/imported_player_sheet.json').write_text(json.dumps(meta,indent=2))
