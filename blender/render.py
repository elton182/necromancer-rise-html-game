import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import bpy, math, sys, os
from mathutils import Vector
blend = sys.argv[1]; outdir = sys.argv[2]; shots = sys.argv[3:]   # ex: idle:1:front  walk:7:three
bpy.ops.wm.open_mainfile(filepath=blend)
import toon
sc = bpy.context.scene; arm = bpy.data.objects['Rig']
sc.view_settings.view_transform='Standard'; sc.render.engine='CYCLES'; sc.cycles.samples=24; sc.cycles.device='CPU'; sc.cycles.use_denoising=False
sc.render.resolution_x=360; sc.render.resolution_y=520; sc.render.film_transparent=False
w = bpy.data.worlds.new('w'); w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(.02,.012,.04,1); w.node_tree.nodes['Background'].inputs[1].default_value=1.0; sc.world=w
def light(kind, loc, energy, col, size=2):
    bpy.ops.object.light_add(type=kind, location=loc); l=bpy.context.object; l.data.energy=energy; l.data.color=col
    if kind=='AREA': l.data.size=size
    d=Vector((0,0,1.2))-l.location; l.rotation_euler=d.to_track_quat('-Z','Y').to_euler()
light('AREA',(-2.5,-3,3),260,(1,.9,.95),3); light('AREA',(3,2.5,2.5),180,(.5,.3,1),3); light('POINT',(-.3,-.5,2.4),25,(0,1,.5))
bpy.ops.object.camera_add(); cam=bpy.context.object; sc.camera=cam; cam.data.lens=60
if os.environ.get('TOON')=='1': toon.toonify(sc, thick=1.5, line=(0,0,0))
def pose(act, f):
    arm.animation_data.action=bpy.data.actions[act]; sc.frame_set(f)
for s in shots:
    act,f,view=s.split(':'); pose(act,int(f))
    az={'front':0,'three':40,'side':90,'back':180,'face':25,'faceside':80,'wide':35}[view]; a=math.radians(az); dist=6.4 if 'face' not in view else 1.5; tz=1.2 if 'face' not in view else 1.72
    if view=='wide': tz=.35; dist=5.5
    tgt=Vector((0,.5 if view=='wide' and act=='death' else 0,tz))
    cam.location=(math.sin(a)*dist*-1*-1*1, -math.cos(a)*dist, 1.3); 
    cam.location=(math.sin(a)*dist, -math.cos(a)*dist, tz+.15)
    cam.location+=Vector((0,tgt.y,0)); cam.rotation_euler=(tgt-cam.location).to_track_quat('-Z','Y').to_euler()
    sc.render.filepath=os.path.join(outdir,f'{act}_{f}_{view}.png'); bpy.ops.render.render(write_still=True)
