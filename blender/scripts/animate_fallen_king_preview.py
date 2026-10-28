"""Renderiza ciclos de caminhada e ataque para GIFs de revisão."""
from pathlib import Path
import bpy
from mathutils import Vector
BASE=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/boss_fallenKing.blend'))
sc=bpy.context.scene
rig=next(o for o in sc.objects if o.type=='ARMATURE')
sc.render.engine='CYCLES';sc.cycles.samples=8;sc.cycles.use_denoising=True
sc.render.resolution_x=480;sc.render.resolution_y=480;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.film_transparent=False
sc.world.use_nodes=True
sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.11,.15,.20,1)
sc.world.node_tree.nodes['Background'].inputs[1].default_value=.45
points=[]
for action in ('walk','windup','attack','recover'):
    rig.animation_data.action=bpy.data.actions[action]
    for frame in (1,7,13,19,25):
        sc.frame_set(frame);bpy.context.view_layer.update()
        deps=bpy.context.evaluated_depsgraph_get()
        for obj in sc.objects:
            if obj.type!='MESH':continue
            ev=obj.evaluated_get(deps)
            points.extend(ev.matrix_world@v.co for v in ev.data.vertices)
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)))
hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
center=(lo+hi)/2;size=max(hi-lo)
bpy.ops.object.camera_add(location=center+Vector((.65,-1,.45))*size*3)
cam=bpy.context.object;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=size*1.23;sc.camera=cam
for offset,power in [((1,-2,3),1000),((-2,-1,1),650),((0,2,2),900)]:
    bpy.ops.object.light_add(type='AREA',location=center+Vector(offset)*size)
    lamp=bpy.context.object;lamp.data.energy=power*size*size;lamp.data.size=size*2
    lamp.rotation_euler=(center-lamp.location).to_track_quat('-Z','Y').to_euler()
for name,actions in [('walk',[('walk',range(1,25))]),('attack',[('windup',range(1,26,3)),('attack',range(1,26,2)),('recover',range(1,26,3))])]:
    folder=BASE/'frames'/('fallen_king_gif_'+name);folder.mkdir(parents=True,exist_ok=True)
    i=0
    for action,frames in actions:
        rig.animation_data.action=bpy.data.actions[action]
        for frame in frames:
            sc.frame_set(frame);sc.render.filepath=str(folder/f'{i:03}.png')
            bpy.ops.render.render(write_still=True);i+=1
