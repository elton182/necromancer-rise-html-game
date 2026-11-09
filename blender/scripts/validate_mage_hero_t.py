"""Audita pesos, ciclos, contatos, solo e rigidez do cajado; salva evidência JSON.

blender --background blender/models/mage_hero_t.blend --python blender/scripts/validate_mage_hero_t.py
"""
from pathlib import Path
import json
import bpy
import math,sys
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
sc=bpy.context.scene
rig=bpy.data.objects['ARM_MageT']
body=bpy.data.objects['MageTBody']
staff=bpy.data.objects['MageTStaff']
result={'fps':sc.render.fps,'bones':len(rig.data.bones),'clips':{},'weights':{}}
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
    assert tr.name not in ['cast','cast_up'] or contact<1e-5,(tr.name,'pés',contact)
    assert low>-.001,(tr.name,'solo',low)
    assert rigid_error<1e-5,(tr.name,'cajado',rigid_error)
out=ROOT/('previews/mage_gait/validation.json' if '--gait' in sys.argv else 'previews/mage_hero_t/validation.json')
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(result,indent=2),encoding='utf8')
print(json.dumps(result))
