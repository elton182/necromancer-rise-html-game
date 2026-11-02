"""Validação das ações atuais, sem criar novos clipes ou modificar os pesos."""
from pathlib import Path
import bpy,json,math
ROOT=Path(__file__).resolve().parents[1]
rig=bpy.data.objects['WarriorRig'];obj=bpy.data.objects['WarriorBody'];scene=bpy.context.scene
saved_action=rig.animation_data.action;saved_frame=scene.frame_current
expected={'idle','walk','slash_1','slash_2','slash_3','thrust','shield_bash','death'}
actions={t.name:t.strips[0].action for t in rig.animation_data.nla_tracks}
if 'tornado' in actions:expected.add('tornado')
assert set(actions)==expected and len({a.as_pointer() for a in actions.values()})==len(expected)
obj.data.calc_loop_triangles();assert len(obj.data.loop_triangles)==4594
assert max(len(v.groups) for v in obj.data.vertices)<=4
report={'triangles':4594,'materials':len(obj.data.materials),'clips':sorted(actions),'loops':{},'joins':{},'bone_scale_tracks':0,'joint_ranges':{}}
def sample(name,end=False):
    a=actions[name];rig.animation_data.action=a;scene.frame_set(int(a.frame_range[1] if end else a.frame_range[0]));bpy.context.view_layer.update()
    return [tuple(value for row in b.matrix for value in row) for b in rig.pose.bones]
def difference(a,b):return max(abs(x-y) for va,vb in zip(a,b) for x,y in zip(va,vb))
try:
    for name,action in actions.items():
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    report['bone_scale_tracks']+=sum(c.data_path.endswith('.scale') for c in bag.fcurves)
        angles={'elbow':[],'right_knee':[],'left_knee':[]}
        for f in range(int(action.frame_range[0]),int(action.frame_range[1])+1):
            rig.animation_data.action=action;scene.frame_set(f)
            assert all(math.isfinite(v) for b in rig.pose.bones for row in b.matrix for v in row)
            for label,side,upper,lower in [('elbow','Right','Arm','ForeArm'),('right_knee','Right','UpLeg','Leg'),('left_knee','Left','UpLeg','Leg')]:
                a=rig.pose.bones['mixamorig:'+side+upper].vector;b=rig.pose.bones['mixamorig:'+side+lower].vector
                angles[label].append(math.degrees(a.angle(b)))
        report['joint_ranges'][name]={k:[round(min(v),1),round(max(v),1)] for k,v in angles.items()}
        if name in ['slash_1','slash_2','slash_3','thrust']:assert min(angles['elbow'])<20
        if name in ['slash_3','thrust']:assert max(angles['right_knee'])>40
    for name in ['idle','walk']:
        report['loops'][name]=difference(sample(name),sample(name,True));assert report['loops'][name]<.0001
    for a,b in [('slash_1','slash_2'),('slash_2','slash_3')]:
        report['joins'][a+' -> '+b]=difference(sample(a,True),sample(b));assert report['joins'][a+' -> '+b]<.0001
    assert report['bone_scale_tracks']==0
    report['status']='PASS'
    (ROOT/'previews/warrior_animation_validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report))
finally:
    rig.animation_data.action=saved_action;scene.frame_set(saved_frame)
