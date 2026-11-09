"""Prévia PBR em Eevee do novo mago (não altera o .blend nem o GLB).

Uso: blender --background blender/models/mage_hero_t.blend --python blender/scripts/mage_hero_t_review.py
PNG e GIF em previews/mage_hero_t; quadros descartáveis em frames/mage_hero_t.
"""
from pathlib import Path
import bpy
import sys
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
sc=bpy.context.scene
rig=bpy.data.objects['ARM_MageT']
GAIT='--gait' in sys.argv
out=ROOT/('frames/mage_gait' if GAIT else 'frames/mage_hero_t')
out.mkdir(parents=True,exist_ok=True)
for o in sc.objects:
    visible=o.name in ('ARM_MageT','MageTBody','MageTStaff')
    o.hide_render=not visible
cam=bpy.data.objects.new('MageTReviewCamera',bpy.data.cameras.new('MageTReviewCamera'))
sc.collection.objects.link(cam)
direction=Vector((.7,-1,.65)).normalized()
target=Vector((0,-.08,.47))
cam.location=target+direction*4
cam.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO'
cam.data.ortho_scale=1.42
sc.camera=cam
for name,loc,energy,size in [('Key',(-2,-3,4),240,4),('Rim',(2,2,3),180,3)]:
    light=bpy.data.objects.new(name,bpy.data.lights.new(name,'AREA'))
    sc.collection.objects.link(light)
    light.location=loc
    light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
    light.data.energy=energy
    light.data.shape='DISK'
    light.data.size=size
world=bpy.data.worlds.new('MageTReviewWorld')
world.use_nodes=True
bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs[0].default_value=(.18,.20,.24,1)
bg.inputs[1].default_value=.7
sc.world=world
# O asset usa PBR; prévia explicitamente Eevee, sem substituir materiais toon.
sc.render.engine='BLENDER_EEVEE'
sc.render.resolution_x=sc.render.resolution_y=320
sc.render.resolution_percentage=100
sc.render.film_transparent=False
sc.render.image_settings.file_format='PNG'
sc.render.fps=30
if hasattr(sc,'eevee'): sc.eevee.taa_render_samples=16
for tr in rig.animation_data.nla_tracks:
    if GAIT and tr.name not in ('walk','strafe_left','strafe_right'):continue
    tr.mute=True
    action=tr.strips[0].action
    rig.animation_data.action=action
    end=int(action.frame_range[1])
    for view in (['front','right','iso'] if GAIT else ['iso']):
        direction={'front':Vector((0,-1,.12)),'right':Vector((1,0,.12)),'iso':Vector((.7,-1,.65))}[view].normalized()
        cam.location=target+direction*4
        cam.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
        for f in sorted(set(range(1,end+1,2)) | {end}):
            sc.frame_set(f)
            label=f'{tr.name}_{view}' if GAIT else tr.name
            sc.render.filepath=str(out/f'{label}_{f:03d}.png')
            bpy.ops.render.render(write_still=True)
    print('PREVIEW_CLIP',tr.name,flush=True)
