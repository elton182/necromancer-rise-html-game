"""Estudo exclusivo de caminhada: alvos de tornozelo e joelhos resolvidos em duas articulações.

Blender --background --python blender/scripts/fallen_king_walk.py -- preview
Sem preview, renderiza 32 quadros para o GIF de revisão.
"""
from pathlib import Path
import bpy, math, sys, json
from mathutils import Vector, Matrix
BASE=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/boss_fallenKing_v2.blend'))
sc=bpy.context.scene
rig=next(o for o in sc.objects if o.type=='ARMATURE')
# The imported V2 sword is oversized. Scale its mesh around the grip origin,
# preserving the bone attachment and the existing source study.
for obj in sc.objects:
    if obj.type=='MESH' and obj.parent_type=='BONE' and obj.parent_bone=='mixamorig:RightHand':
        obj.data.transform(Matrix.Scale(.60,4))
rig.animation_data_clear()
for a in list(bpy.data.actions):bpy.data.actions.remove(a)
rig.animation_data_create()
action=bpy.data.actions.new('walk');action.use_fake_user=True;rig.animation_data.action=action
def bone(name):return rig.pose.bones['mixamorig:'+name]
def aim(name,direction):
    bpy.context.view_layer.update()
    b=bone(name);m=b.matrix.copy();q=m.to_quaternion()
    q=(q@Vector((0,1,0))).rotation_difference(Vector(direction).normalized())@q
    b.matrix=Matrix.Translation(m.translation)@q.to_matrix().to_4x4()
    bpy.context.view_layer.update()
def leg(side,target):
    hip=bone(side+'UpLeg').head.copy()
    a=bone(side+'UpLeg').length;b=bone(side+'Leg').length
    delta=target-hip;distance=delta.length
    assert abs(a-b)<distance<a+b, (side,distance,a+b)
    direction=delta.normalized()
    pole=Vector((0,-1,0));pole=(pole-direction*pole.dot(direction)).normalized()
    along=(a*a-b*b+distance*distance)/(2*distance)
    knee=hip+direction*along+pole*math.sqrt(max(0,a*a-along*along))
    aim(side+'UpLeg',knee-hip);aim(side+'Leg',target-knee)
    return (bone(side+'Leg').tail-target).length
errors=[];previous={}
for frame in range(1,34):
    sc.frame_set(frame);t=(frame-1)/32
    for b in rig.pose.bones:
        b.rotation_mode='QUATERNION';b.matrix_basis=Matrix.Identity(4)
    bpy.context.view_layer.update()
    pelvis=bone('Hips');m=pelvis.matrix.copy()
    m.translation+=Vector((.009*math.sin(math.tau*t),0,-.025+.006*math.cos(2*math.tau*t)))
    pelvis.matrix=m;bpy.context.view_layer.update()
    aim('Spine',(-.025*math.sin(math.tau*t),-.09,1))
    aim('Spine1',(.02*math.sin(math.tau*t),-.035,1))
    for side,sign,offset in [('Left',1,0),('Right',-1,.5)]:
        phase=(t+offset)%1
        if phase<.6:
            y=-.095+.19*(phase/.6);lift=0
        else:
            u=(phase-.6)/.4;s=u*u*(3-2*u)
            y=.095-.19*s;lift=.065*math.sin(math.pi*u)**1.3
        target=Vector((sign*.125,y-.035,.064+lift))
        errors.append(leg(side,target))
        aim(side+'Foot',(sign*.12,-1,-.40))
    swing=math.sin(math.tau*t)
    aim('LeftArm',(.22,.23*swing,-1))
    aim('LeftForeArm',(-.08,-.24+.23*swing,-1))
    aim('LeftHand',(.05,-.25,-1))
    aim('RightArm',(-.23,-.08-.08*swing,-1))
    aim('RightForeArm',(-.16,-.65,-.45))
    aim('RightHand',(-.55,-1,-.30))
    for b in rig.pose.bones:
        if b.name in previous and b.rotation_quaternion.dot(previous[b.name])<0:b.rotation_quaternion.negate()
        previous[b.name]=b.rotation_quaternion.copy()
        b.keyframe_insert('rotation_quaternion',frame=frame);b.keyframe_insert('location',frame=frame)
sc.render.fps=24;sc.frame_start=1;sc.frame_end=32;sc.frame_set(1)
assert max(errors)<.001,max(errors)
(BASE/'previews/fallen_king_walk_validation.json').write_text(json.dumps({'max_ankle_target_error':max(errors),'frames':32,'fps':24,'scope':'Estudo de caminhada, sem integração ao jogo.'},indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/boss_fallenKing_walk.blend'))
sc.render.engine='CYCLES';sc.cycles.samples=16;sc.cycles.use_denoising=True
sc.render.resolution_x=560;sc.render.resolution_y=560;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.film_transparent=True
sc.world.use_nodes=True
sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.22,.28,1)
sc.world.node_tree.nodes['Background'].inputs[1].default_value=.5
center=Vector((-.05,-.07,.43));size=1.25
bpy.ops.object.camera_add(location=center+Vector((.95,-1,.38))*3)
cam=bpy.context.object;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=size;sc.camera=cam
# Fit every evaluated pose in camera space, including the separate sword.
inverse=cam.rotation_euler.to_quaternion().inverted()
minimum=Vector((1e9,1e9,1e9));maximum=-minimum
for frame in range(1,33):
    sc.frame_set(frame);bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
    for obj in sc.objects:
        if obj.type!='MESH':continue
        ev=obj.evaluated_get(deps)
        for vertex in ev.data.vertices:
            p=inverse@(ev.matrix_world@vertex.co-center)
            for axis in (0,1):
                minimum[axis]=min(minimum[axis],p[axis]);maximum[axis]=max(maximum[axis],p[axis])
offset=Vector(((minimum.x+maximum.x)/2,(minimum.y+maximum.y)/2,0))
cam.location+=cam.rotation_euler.to_quaternion()@offset
cam.data.ortho_scale=max(maximum.x-minimum.x,maximum.y-minimum.y)*1.12
for offset,power in [((-1,-2,3),700),((2,-1,1),400),((0,2,2),700)]:
    bpy.ops.object.light_add(type='AREA',location=center+Vector(offset))
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=2
    lamp.rotation_euler=(center-lamp.location).to_track_quat('-Z','Y').to_euler()
folder=BASE/'frames/fallen_king_walk_review';folder.mkdir(parents=True,exist_ok=True)
frames=(1,9,17,25) if 'preview' in sys.argv else range(1,33)
for frame in frames:
    sc.frame_set(frame);sc.render.filepath=str(folder/f'{frame:03}.png')
    bpy.ops.render.render(write_still=True)
