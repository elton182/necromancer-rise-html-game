"""Render Blender frames; assemble with pack_undead.py (system Python/Pillow).

blender --background --threads 4 --python render_undead.py -- archer|specter [preview]
"""
import sys, os, math, json
import bpy
from mathutils import Vector
HERE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for _folder in ('models', 'exports', 'frames', 'spritesheets', 'previews'):
    os.makedirs(os.path.join(HERE, _folder), exist_ok=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
kind=sys.argv[sys.argv.index('--')+1]
preview='preview' in sys.argv
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'models', 'mob_'+kind+'.blend'))
sc=bpy.context.scene; arm=bpy.data.objects['Rig']
sc.view_settings.view_transform='Standard'
sc.render.engine='CYCLES'; sc.cycles.samples=1; sc.cycles.use_denoising=False
sc.render.film_transparent=True
sc.render.resolution_x=448
sc.render.resolution_y=448
sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
# At gameplay size, black crease lines swallowed the ribs, fingers and bow.
# Keep a thin, colored silhouette; let the toon shading describe the surfaces.
toon.toonify(sc,thick=.65,line=(.12,.15,.20))
lines=bpy.context.view_layer.freestyle_settings.linesets[0]
lines.select_crease=False
lines.select_border=False
bpy.ops.object.camera_add(); cam=bpy.context.object; sc.camera=cam
cam.data.type='ORTHO'; cam.data.ortho_scale=3.1 if preview else 4
p=math.radians(35); fwd=Vector((0,math.cos(p),-math.sin(p)))
tgt=Vector((0,math.sin(p),math.cos(p)))*(165-112)/56
cam.location=tgt-fwd*12; cam.rotation_euler=(tgt-cam.location).to_track_quat('-Z','Y').to_euler()
out=os.path.join(HERE, 'frames', 'frames_'+kind); os.makedirs(out,exist_ok=True)
anims=[('idle',8,6,True),('walk',10,12,True),('attack',8,16,False),('death',10,12,False)]
meta={'cell':224,'ppu':56,'anchorX':112,'anchorY':165,'dirs':8,'anims':{}}
for ai,(name,n,fps,loop) in enumerate(anims):
    act=bpy.data.actions[name]; arm.animation_data.action=act
    # Blender 4.4+ requires selecting the action's slot when switching actions.
    if hasattr(act,'slots') and len(act.slots): arm.animation_data.action_slot=act.slots[0]
    meta['anims'][name]={'n':n,'fps':fps,'loop':loop,'row':ai*8}
    if os.environ.get('ANIM_ONLY') and name!=os.environ['ANIM_ONLY']: continue
    for di in range(8):
        arm.rotation_euler=(0,0,math.radians(90-di*45))
        for fi in range(n):
            if preview and (di!=2 or fi!=0 or ai!=0): continue
            t=fi/n if loop else fi/(n-1)
            fr=1+t*(act.frame_range[1]-1)
            sc.frame_set(math.floor(fr),subframe=fr-math.floor(fr))
            sc.render.filepath=os.path.join(HERE, 'previews', kind+'_preview.png') if preview else os.path.join(out,f'{ai*8+di:02}_{fi:02}.png')
            bpy.ops.render.render(write_still=True)
    print('FINISHED',kind,name,flush=True)
if not preview:
    with open(os.path.join(HERE, 'spritesheets', kind+'_sheet.json'),'w') as f: json.dump(meta,f)
