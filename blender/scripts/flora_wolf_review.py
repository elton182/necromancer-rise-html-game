"""Auditoria e prévias PBR do lobo revisado; não salva alterações na cena.

blender --background _to_delete/blender-models/models/flora_wolf_revised.blend --python blender/scripts/flora_wolf_review.py
python blender/scripts/pack_flora_wolf_review.py
"""
from pathlib import Path
import sys,json,math
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1];sc=bpy.context.scene
rig=next(o for o in sc.objects if o.type=='ARMATURE');mesh=next(o for o in sc.objects if o.type=='MESH')
DYNAMIC='--dynamic' in sys.argv
LABEL='flora_wolf_dynamic' if DYNAMIC else 'flora_wolf_review'
OUT=ROOT/'frames'/LABEL;OUT.mkdir(parents=True,exist_ok=True)
DEST=ROOT/'previews'/LABEL;DEST.mkdir(parents=True,exist_ok=True)
sums=[sum(g.weight for g in v.groups) for v in mesh.data.vertices]
result={'fps':sc.render.fps,'bones':len(rig.data.bones),'weights':{'unweighted':sum(s==0 for s in sums),
    'max_influences':max(len(v.groups) for v in mesh.data.vertices),'normalization_error':max(abs(s-1) for s in sums)},'clips':{}}
assert min(sums)>.99 and result['weights']['max_influences']<=4
paws=[s+k for s in ['Left','Right'] for k in ['Hand','Foot']]
indices={}
for n in paws:
    prefix='mixamorig:'+n
    groups={g.index for g in mesh.vertex_groups if g.name.startswith(prefix)}
    if n.endswith('Foot'):groups|={g.index for g in mesh.vertex_groups if g.name.startswith('mixamorig:'+n.replace('Foot','Toe'))}
    indices[n]=[v.index for v in mesh.data.vertices if sum(g.weight for g in v.groups if g.group in groups)>.65]
for tr in rig.animation_data.nla_tracks:tr.mute=True
for tr in rig.animation_data.nla_tracks:
    a=tr.strips[0].action;rig.animation_data.action=a;end=int(a.frame_range[1])
    mats=[];positions=[];low=99;heights={n:[] for n in paws};body_motion=[]
    for f in range(1,end+1):
        sc.frame_set(f);bpy.context.view_layer.update()
        ev=mesh.evaluated_get(bpy.context.evaluated_depsgraph_get());low=min(low,min(v.co.z for v in ev.data.vertices))
        mats.append([b.matrix.copy() for b in rig.pose.bones])
        positions.append({n:rig.pose.bones['mixamorig:'+n].head.copy() for n in paws})
        spine=rig.pose.bones['mixamorig:Spine2'];delta=spine.matrix@spine.bone.matrix_local.inverted()
        forward=delta.to_3x3()@Vector((0,-1,0))
        body_motion.append((rig.pose.bones['mixamorig:Hips'].head.copy(),math.atan2(forward.x,-forward.y),
            {s:rig.pose.bones['mixamorig:'+s+'ToeBase'].head.copy() for s in ['Left','Right']}))
        for n in paws:heights[n].append(min(ev.data.vertices[i].co.z for i in indices[n]))
    travel={n:max((p[n]-positions[0][n]).length for p in positions) for n in paws}
    seam=max(abs(x-y) for m,n in zip(mats[0],mats[-1]) for a,b in zip(m,n) for x,y in zip(a,b))
    loop=tr.name in ['idle','walk','strafe_left','strafe_right']
    result['clips'][tr.name]={'action':a.name,'frames':[1,end],'seconds':(end-1)/30,'body_min_z':low,
        'loop_matrix_error':seam if loop else None,'paw_travel':travel,
        'paw_height_ranges':{n:[min(v),max(v)] for n,v in heights.items()}}
    assert low>-.001,(tr.name,'piso',low)
    assert not loop or seam<.0001,(tr.name,'ciclo',seam)
    support=(['LeftHand','LeftFoot'] if DYNAMIC else ['LeftHand','LeftFoot','RightFoot']) if tr.name=='claw_1' else (['RightHand','RightFoot'] if DYNAMIC else ['RightHand','LeftFoot','RightFoot']) if tr.name=='claw_2' else ['LeftFoot','RightFoot'] if tr.name=='howl' else paws if tr.name=='idle' else []
    assert not support or max(travel[n] for n in support)<.001,(tr.name,'apoios',travel)
    if DYNAMIC and tr.name in ['claw_1','claw_2']:
        side='Right' if tr.name=='claw_1' else 'Left'
        hip_travel=max((p[0]-q[0]).length for p in body_motion for q in body_motion)
        yaw_span=max(p[1] for p in body_motion)-min(p[1] for p in body_motion)
        toe_xy=max(math.hypot(p[2][side].x-body_motion[0][2][side].x,p[2][side].y-body_motion[0][2][side].y) for p in body_motion)
        result['clips'][tr.name]['weight_shift']={'hip_travel':hip_travel,'torso_yaw_span_degrees':math.degrees(yaw_span),
            'drive_ankle_travel':travel[side+'Foot'],'drive_toe_xy_drift':toe_xy}
        assert hip_travel>.07 and yaw_span>.7,(tr.name,'corpo pouco ativo',hip_travel,yaw_span)
        assert travel[side+'Foot']>.025 and toe_xy<.003,(tr.name,'pivô',travel,toe_xy)
    if tr.name=='leap':assert max(heights['LeftHand'])>.15
(DEST/'validation.json').write_text(json.dumps(result,indent=2),encoding='utf8')
print('AUDIT',json.dumps(result),flush=True)
if '--audit-only' in sys.argv:raise SystemExit
cam=bpy.data.objects.new('WolfReviewCamera',bpy.data.cameras.new('WolfReviewCamera'));sc.collection.objects.link(cam)
direction=Vector((.7,-1,.55)).normalized();target=Vector((0,-.06,.35))
cam.location=target+direction*4;cam.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=1.35;sc.camera=cam
for name,loc,energy in [('Key',(-2,-3,4),260),('Rim',(2,2,3),190)]:
    o=bpy.data.objects.new(name,bpy.data.lights.new(name,'AREA'));sc.collection.objects.link(o)
    o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler();o.data.energy=energy;o.data.size=4
world=bpy.data.worlds.new('WolfReviewWorld');world.use_nodes=True
bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.18,.20,.24,1);bg.inputs[1].default_value=.7;sc.world=world
# Prévia PBR em Eevee, sem trocar os materiais da fonte.
sc.render.engine='BLENDER_EEVEE';sc.render.resolution_x=sc.render.resolution_y=320;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.film_transparent=False
for tr in rig.animation_data.nla_tracks:
    rig.animation_data.action=tr.strips[0].action;end=int(tr.strips[0].action.frame_range[1])
    for f in sorted(set(range(1,end+1,2))|{end}):
        sc.frame_set(f);sc.render.filepath=str(OUT/f'{tr.name}_{f:03d}.png');bpy.ops.render.render(write_still=True)
    print('PREVIEW',tr.name,flush=True)
