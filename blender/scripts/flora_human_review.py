"""Audita e renderiza a revisão humana, sem alterar fonte nem export.

blender --background blender/models/flora_human_revised.blend --python blender/scripts/flora_human_review.py
python blender/scripts/pack_flora_human_review.py
"""
from pathlib import Path
import json
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
sc=bpy.context.scene
rig=next(o for o in sc.objects if o.type=='ARMATURE')
body=next(o for o in sc.objects if o.name.startswith('FloraHumanBody'))
staff=next(o for o in sc.objects if o.name.startswith('FloraHumanStaff'))
out=ROOT/'frames/flora_human_review';out.mkdir(parents=True,exist_ok=True)
dest=ROOT/'previews/flora_human_review';dest.mkdir(parents=True,exist_ok=True)
result={'fps':sc.render.fps,'bones':len(rig.data.bones),'weights':{},'clips':{}}
for ob in [body,staff]:
    sums=[sum(g.weight for g in v.groups) for v in ob.data.vertices]
    result['weights'][ob.name]={'unweighted':sum(s==0 for s in sums),
        'max_influences':max(len(v.groups) for v in ob.data.vertices),
        'normalization_error':max(abs(s-1) for s in sums)}
    assert min(sums)>.99 and max(abs(s-1) for s in sums)<.001
for tr in rig.animation_data.nla_tracks:tr.mute=True
for tr in rig.animation_data.nla_tracks:
    action=tr.strips[0].action;rig.animation_data.action=action
    end=int(action.frame_range[1]);matrices=[];feet=[];lows=[99,99];relative=None;error=0
    for f in range(1,end+1):
        sc.frame_set(f);bpy.context.view_layer.update()
        matrices.append([b.matrix.copy() for b in rig.pose.bones])
        feet.append([rig.pose.bones['mixamorig:'+s+'Foot'].head.copy() for s in ['Left','Right']])
        dg=bpy.context.evaluated_depsgraph_get()
        for i,ob in enumerate([body,staff]):
            ev=ob.evaluated_get(dg);lows[i]=min(lows[i],min(v.co.z for v in ev.data.vertices))
        grip=rig.pose.bones['mixamorig:RightHand'].matrix.inverted()
        points=[grip@staff.evaluated_get(dg).data.vertices[i].co for i in [0,50,100]]
        if relative is None:relative=points
        error=max(error,max((p-q).length for p,q in zip(points,relative)))
    seam=max(abs(x-y) for m,n in zip(matrices[0],matrices[-1]) for a,b in zip(m,n) for x,y in zip(a,b))
    travel=max((p-q).length for pair in feet for p,q in zip(pair,feet[0]))
    loop=tr.name in ['idle','walk','strafe_left','strafe_right']
    result['clips'][tr.name]={'action':action.name,'frames':[1,end],'seconds':(end-1)/30,
        'loop_error':seam if loop else None,'body_min_z':lows[0],'staff_min_z':lows[1],
        'ankle_travel':travel,'staff_rigidity_error':error}
    assert not loop or seam<.0001,(tr.name,'loop',seam)
    assert min(lows)>-.001,(tr.name,'piso',lows)
    assert error<.00001,(tr.name,'pegada',error)
    assert tr.name not in ['cast','cast_up','slam'] or travel<.001,(tr.name,'apoio',travel)
(dest/'validation.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print('AUDIT',json.dumps(result),flush=True)
if '--audit-only' in __import__('sys').argv:raise SystemExit
cam=bpy.data.objects.new('FloraReviewCamera',bpy.data.cameras.new('FloraReviewCamera'))
sc.collection.objects.link(cam)
direction=Vector((.7,-1,.58)).normalized();target=Vector((0,-.07,.58))
cam.location=target+direction*4;cam.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=1.75;sc.camera=cam
for name,loc,energy in [('Key',(-2,-3,4),240),('Rim',(2,2,3),180)]:
    ob=bpy.data.objects.new(name,bpy.data.lights.new(name,'AREA'));sc.collection.objects.link(ob)
    ob.location=loc;ob.rotation_euler=(-ob.location).to_track_quat('-Z','Y').to_euler()
    ob.data.energy=energy;ob.data.size=4
world=bpy.data.worlds.new('FloraReviewWorld');world.use_nodes=True
bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs[0].default_value=(.18,.20,.24,1);bg.inputs[1].default_value=.7;sc.world=world
# Prévia PBR explicitamente Eevee; não altera os materiais nem a cena entregue.
sc.render.engine='BLENDER_EEVEE'
sc.render.resolution_x=sc.render.resolution_y=320;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.film_transparent=False
for tr in rig.animation_data.nla_tracks:
    rig.animation_data.action=tr.strips[0].action;end=int(tr.strips[0].action.frame_range[1])
    for f in sorted(set(range(1,end+1,2))|{end}):
        sc.frame_set(f);sc.render.filepath=str(out/f'{tr.name}_{f:03d}.png')
        bpy.ops.render.render(write_still=True)
    print('PREVIEW',tr.name,flush=True)
