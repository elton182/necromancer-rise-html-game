"""Audita pesos, ciclos, contatos, solo e rigidez do cajado; salva evidência JSON.

blender --background blender/models/mage_hero_t.blend --python blender/scripts/validate_mage_hero_t.py
"""
from pathlib import Path
import json
import bpy
import math,sys
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
sc=bpy.context.scene
rig=bpy.data.objects['ARM_MageT']
body=bpy.data.objects['MageTBody']
staff=bpy.data.objects['MageTStaff']
result={'fps':sc.render.fps,'bones':len(rig.data.bones),'clips':{},'weights':{}}
if body.get('articulated_fingers'):
    from mage_hero_fingers import FINGERS
    from asset_paths import asset_path
    source_path=asset_path(str(ROOT/'models/mage_hero_t_source.blend'))
    with bpy.data.libraries.load(source_path) as (src,dst):dst.objects=[n for n in src.objects if n.startswith('tripo_node_')]
    source=dst.objects[0]
    assert len(body.data.vertices)==len(source.data.vertices),'malha original alterada'
    error=max((v.co-source.matrix_world@original.co).length for v,original in zip(body.data.vertices,source.data.vertices))
    assert error<1e-7,('bind original',error)
    uv_error=max((a.uv-b.uv).length for a,b in zip(body.data.uv_layers.active.data,source.data.uv_layers.active.data))
    assert uv_error<1e-7,('UV original',uv_error)
    counts={}
    for digit in FINGERS:
        for i in range(1,4):
            name=f'mixamorig:RightHand{digit}{i}'
            bone=rig.data.bones[name];group=body.vertex_groups[name].index
            assert bone.parent.name==('mixamorig:RightHand' if i==1 else f'mixamorig:RightHand{digit}{i-1}')
            counts[name]=sum(any(g.group==group and g.weight>1e-5 for g in v.groups) for v in body.data.vertices)
            assert counts[name]>0,(name,'sem pesos')
    result['fingers']={'original_bind_error':error,'original_uv_error':uv_error,'weighted_vertices_per_bone':counts}
    bpy.data.objects.remove(source,do_unlink=True)
if body.get('closed_grip'):
    glove_slots={i for i,m in enumerate(body.data.materials) if m and m.name.startswith('MageGlove')}
    glove_vertices={i for p in body.data.polygons if p.material_index in glove_slots for i in p.vertices}
    hand_group=body.vertex_groups['mixamorig:RightHand'].index
    assert glove_vertices
    assert all(len(body.data.vertices[i].groups)==1 and body.data.vertices[i].groups[0].group==hand_group for i in glove_vertices)
if staff.get('continuous_shaft'):
    wood_slots={i for i,m in enumerate(staff.data.materials) if m and m.name.startswith('MageStaffWood')}
    edge_uses={}
    for p in staff.data.polygons:
        if p.material_index in wood_slots:
            for edge in p.edge_keys:edge_uses[edge]=edge_uses.get(edge,0)+1
    assert edge_uses and all(count==2 for count in edge_uses.values()), 'haste reconstruída aberta'
    result['shaft_boundary_edges']=sum(count!=2 for count in edge_uses.values())
for ob in [body,staff]:
    sums=[sum(g.weight for g in v.groups) for v in ob.data.vertices]
    result['weights'][ob.name]={'vertices':len(sums),'unweighted':sum(s==0 for s in sums),
        'max_influences':max(len(v.groups) for v in ob.data.vertices),
        'normalization_error':max(abs(s-1) for s in sums)}
    assert min(sums)>.99 and max(abs(s-1) for s in sums)<1e-5
    assert result['weights'][ob.name]['max_influences']<=4
for tr in rig.animation_data.nla_tracks:
    tr.mute=True
for tr in rig.animation_data.nla_tracks:
    a=tr.strips[0].action
    rig.animation_data.action=a
    end=int(a.frame_range[1])
    samples=[]
    feet=[]
    low=1e9
    rigid_error=0
    reference=None
    locomotion=tr.name in ['walk','strafe_left','strafe_right']
    support={};drift=0;knee_min=math.pi;left_hands=[]
    for f in range(1,end+1):
        sc.frame_set(f)
        bpy.context.view_layer.update()
        samples.append([b.matrix.copy() for b in rig.pose.bones])
        feet.append([rig.pose.bones['mixamorig:'+s+'Foot'].head.copy() for s in ['Left','Right']])
        if locomotion:
            t=(f-1)/(end-1);stride=.56 if tr.name=='walk' else .44
            for side,offset in [('Left',0),('Right',.5)]:
                u=(t+offset)%1;foot=rig.pose.bones['mixamorig:'+side+'Foot']
                if u<.56:
                    point=foot.head.copy()
                    if tr.name=='walk':point.y-=stride*t
                    else:point.x+=(1 if tr.name=='strafe_left' else -1)*stride*t
                    key=(side,math.floor(t+offset+1e-6));base=support.setdefault(key,point)
                    drift=max(drift,math.hypot(point.x-base.x,point.y-base.y))
                upper=rig.pose.bones['mixamorig:'+side+'UpLeg'];shin=rig.pose.bones['mixamorig:'+side+'Leg']
                knee_min=min(knee_min,math.pi-(upper.head-shin.head).angle(foot.head-shin.head))
            left_hands.append(rig.pose.bones['mixamorig:LeftHand'].head.copy())
        dg=bpy.context.evaluated_depsgraph_get()
        low=min(low,min(v.co.z for v in body.evaluated_get(dg).data.vertices))
        ev=staff.evaluated_get(dg)
        grip=rig.pose.bones['mixamorig:RightHand'].matrix.inverted()
        points=[grip@ev.data.vertices[i].co for i in [0,len(ev.data.vertices)//2,len(ev.data.vertices)-1]]
        if reference is None:reference=points
        rigid_error=max(rigid_error,max((p-q).length for p,q in zip(points,reference)))
    loop=tr.name in ['idle','walk','strafe_left','strafe_right']
    seam=max(abs(x-y) for m,n in zip(samples[0],samples[-1]) for row1,row2 in zip(m,n) for x,y in zip(row1,row2))
    contact=max((p-q).length for pair in feet for p,q in zip(pair,feet[0]))
    result['clips'][tr.name]={'action':a.name,'start':1,'end':end,'seconds':(end-1)/sc.render.fps,
        'loop':loop,'loop_matrix_error':seam if loop else None,'body_min_z':low,
        'foot_displacement':contact,'staff_rigidity_error':rigid_error}
    if locomotion:
        result['clips'][tr.name]['gait']={'support_xy_drift':drift,'minimum_knee_flex_degrees':math.degrees(knee_min),
            'free_hand_travel':max((p-q).length for p in left_hands for q in left_hands)}
        assert drift<.004,(tr.name,'apoio',drift)
        assert knee_min>math.radians(4),(tr.name,'joelho travado',math.degrees(knee_min))
    assert not loop or seam<1e-5,(tr.name,'loop',seam)
    assert tr.name!='idle' or contact<1e-5,(tr.name,'apoio parado',contact)
    assert tr.name not in ['cast','cast_up'] or contact<1e-5,(tr.name,'pés',contact)
    assert low>-.001,(tr.name,'solo',low)
    assert rigid_error<1e-5,(tr.name,'cajado',rigid_error)
out=ROOT/('previews/mage_idle/validation.json' if '--idle' in sys.argv else 'previews/mage_gait/validation.json' if '--gait' in sys.argv else 'previews/mage_hero_t/validation.json')
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps(result))
