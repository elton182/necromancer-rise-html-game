"""Prévias Cycles do Guerreiro na sessão Blender, sem alterar a cena salva."""
from pathlib import Path
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
scene=bpy.context.scene;rig=bpy.data.objects['WarriorRig'];body=bpy.data.objects['WarriorBody']
old_camera=scene.camera;old_engine=scene.render.engine;old_action=rig.animation_data.action;old_frame=scene.frame_current
old_world=scene.world;old_transparent=scene.render.film_transparent
old_res=(scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage)
hidden={o:o.hide_render for o in scene.objects};created=[]
try:
    for o in scene.objects:o.hide_render=o not in [rig,body]
    world=bpy.data.worlds.new('WarriorReviewWorld');world.use_nodes=True
    world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.15,.18,.22,1)
    world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.45
    scene.world=world;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.film_transparent=True;scene.render.resolution_percentage=100
    camera=bpy.data.cameras.new('WarriorReviewCamera');cam=bpy.data.objects.new('WarriorReviewCamera',camera);scene.collection.objects.link(cam);created.append(cam);scene.camera=cam;camera.type='ORTHO'
    for name,pos,power,size in [('Key',(-1,-1.4,2),85,1.4),('Fill',(1,-.4,1.2),40,1.0),('Rim',(0,1.1,1.4),65,1.0)]:
        data=bpy.data.lights.new('WarriorReview'+name,'AREA');data.energy=power;data.shape='DISK';data.size=size
        light=bpy.data.objects.new(data.name,data);scene.collection.objects.link(light);light.location=pos;light.rotation_euler=(Vector((0,.3,.4))-light.location).to_track_quat('-Z','Y').to_euler();created.append(light)
    rig.animation_data.action=next(t.strips[0].action for t in rig.animation_data.nla_tracks if t.name=='idle');scene.frame_set(1)
    for name,target,offset,scale,res in [('warrior_idle',(0,.3,.43),(.9,-1.5,.65),1.08,800),('warrior_grip',(-.13,.25,.445),(.12,-.25,.10),.22,700)]:
        target=Vector(target)+rig.matrix_world.translation;cam.location=target+Vector(offset);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camera.ortho_scale=scale
        scene.render.resolution_x=res;scene.render.resolution_y=res;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
        scene.render.filepath=str(ROOT/'previews'/str(name+'.png'));bpy.ops.render.render(write_still=True)
finally:
    for o in created:bpy.data.objects.remove(o,do_unlink=True)
    for o,value in hidden.items():o.hide_render=value
    scene.camera=old_camera;scene.render.engine=old_engine;scene.world=old_world;scene.render.film_transparent=old_transparent
    scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage=old_res
    rig.animation_data.action=old_action;scene.frame_set(old_frame)
