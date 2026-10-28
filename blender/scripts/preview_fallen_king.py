"""Prévias do modelo importado, sem alterar a cena fonte."""
from pathlib import Path
import bpy, math
from mathutils import Vector
BASE=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/boss_fallenKing.blend'))
sc=bpy.context.scene
rig=next(o for o in sc.objects if o.type=='ARMATURE')
sc.render.engine='CYCLES';sc.cycles.samples=16
sc.cycles.use_denoising=True
sc.render.resolution_x=600;sc.render.resolution_y=600;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.film_transparent=True
sc.world.color=(.25,.25,.25)
sc.frame_set(1);bpy.context.view_layer.update()
points=[o.matrix_world@Vector(c) for o in sc.objects if o.type=='MESH' for c in o.bound_box]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)))
hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
center=(lo+hi)/2; size=max(hi-lo)
bpy.ops.object.camera_add(location=center+Vector((.65,-1,.45))*size*3)
cam=bpy.context.object;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=size*1.65;sc.camera=cam
for offset,power in [((1,-2,3),1300),((-2,-1,1),800),((0,2,2),1100)]:
    bpy.ops.object.light_add(type='AREA',location=center+Vector(offset)*size)
    lamp=bpy.context.object;lamp.data.energy=power*size*size;lamp.data.shape='DISK';lamp.data.size=size*2
    lamp.rotation_euler=(center-lamp.location).to_track_quat('-Z','Y').to_euler()
for name,frame in [('idle',1),('walk',7),('windup',25),('attack',18),('cast',13),('death',25)]:
    rig.animation_data.action=bpy.data.actions[name]
    sc.frame_set(frame)
    sc.render.filepath=str(BASE/'previews'/('fallen_king_'+name+'.png'))
    bpy.ops.render.render(write_still=True)
