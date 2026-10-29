"""Prévias de revisão do piloto em processo separado."""
from pathlib import Path
import bpy, sys
from mathutils import Vector
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE/'scripts'))
character=next((a.split('=',1)[1] for a in sys.argv if a.startswith('--character=')), 'knight')
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models'/f'v2_enemy_{character}.blend'))
sc=bpy.context.scene
sc.render.engine='CYCLES';sc.cycles.samples=8;sc.render.film_transparent=True
sc.render.resolution_x=640;sc.render.resolution_y=640;sc.render.resolution_percentage=100
if sc.world is None:sc.world=bpy.data.worlds.new('PreviewWorld')
sc.world.color=(.3,.3,.3)
bpy.ops.object.camera_add(location=(1.5,-2.5,1.4));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,.48))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=1.6;sc.camera=cam
for loc,power,size in [((1,-3,4),300,4),((-2,-1,2),180,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size
    o.rotation_euler=(Vector((0,0,.4))-o.location).to_track_quat('-Z','Y').to_euler()
arm=next(o for o in sc.objects if o.type=='ARMATURE')
out=BASE/'previews/imported_enemies';out.mkdir(parents=True,exist_ok=True)
for name,f in [('idle',1),('walk',7),('attack',8),('attack',13),('death',25)]:
    a=next(a for a in bpy.data.actions if a.name.split('.')[0]==name);arm.animation_data.action=a;arm.animation_data.action_slot=a.slots[0];sc.frame_set(f)
    sc.render.image_settings.file_format='PNG';sc.render.filepath=str(out/f'{character}_{name}_{f}.png')
    bpy.ops.render.render(write_still=True)
