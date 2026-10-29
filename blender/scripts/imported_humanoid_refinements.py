"""Refinamentos compartilhados pelo gerador e pela sessão Blender via MCP."""
import bpy, bmesh, math
from mathutils import Vector, Quaternion, Matrix

def separate_harpy_wings(scene,arm):
    if arm.get('independent_wings'):return
    body=next(o for o in arm.children_recursive if o.type=='MESH' and o.name.startswith('GriffinBody'))
    body.data=body.data.copy()
    # Select complete feather islands behind the forearms; no cut through skin surfaces.
    bm=bmesh.new();bm.from_mesh(body.data);bm.verts.ensure_lookup_table()
    seen=set();selected=set()
    for v in bm.verts:
        if v.index in seen:continue
        stack=[v];seen.add(v.index);island=[]
        while stack:
            a=stack.pop();island.append(a)
            for edge in a.link_edges:
                other=edge.other_vert(a)
                if other.index not in seen:seen.add(other.index);stack.append(other)
        centre=sum((a.co for a in island),Vector())/len(island)
        if abs(centre.x)>.11 and centre.y>.043 and min(a.co.z for a in island)>.32 and max(a.co.z for a in island)<.56:
            selected.update(a.index for a in island)
    bm.free()
    if len(selected)<100:raise RuntimeError('Seleção de penas insuficiente; revisar anatomia antes de separar.')
    bpy.context.view_layer.objects.active=arm;arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for side,sign in [('Left',1),('Right',-1)]:
        root=arm.data.edit_bones.new('Wing'+side)
        root.head=(sign*.055,.07,.49);root.tail=(sign*.25,.08,.48);root.parent=arm.data.edit_bones['mixamorig:Spine2']
        tip=arm.data.edit_bones.new('Wing'+side+'Tip');tip.head=root.tail;tip.tail=(sign*.46,.09,.45);tip.parent=root
    bpy.ops.object.mode_set(mode='OBJECT')
    for side,sign in [('Left',1),('Right',-1)]:
        wing=body.copy();wing.data=body.data.copy();wing.name='HarpyWing'+side;scene.collection.objects.link(wing)
        mesh=bmesh.new();mesh.from_mesh(wing.data)
        remove=[v for v in mesh.verts if v.index not in selected or v.co.x*sign<0]
        bmesh.ops.delete(mesh,geom=remove,context='VERTS');mesh.to_mesh(wing.data);mesh.free()
        for v in wing.data.vertices:v.co.y+=.035;v.co.z+=.015
        wing.vertex_groups.clear()
        root=wing.vertex_groups.new(name='Wing'+side);tip=wing.vertex_groups.new(name='Wing'+side+'Tip')
        for v in wing.data.vertices:
            t=max(0,min(1,(abs(v.co.x)-.19)/.22));root.add([v.index],1-t,'REPLACE');tip.add([v.index],t,'REPLACE')
    mesh=bmesh.new();mesh.from_mesh(body.data)
    bmesh.ops.delete(mesh,geom=[v for v in mesh.verts if v.index in selected],context='VERTS');mesh.to_mesh(body.data);mesh.free()
    arm['independent_wings']=True

def repair_wing_roots(scene,arm):
    if arm.get('wing_root_revision')==1:return
    # Close the shoulder-to-feather gap with overlapping, closed root volumes.
    material=bpy.data.materials.new('HarpyWingRootBrown');material.use_nodes=True
    shader=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value=(.18,.068,.028,1);shader.inputs['Roughness'].default_value=.9
    for side,sign in [('Left',1),('Right',-1)]:
        vertices=[(sign*x,y,z) for x,y,z in [(.035,.052,.475),(.035,.11,.475),(.035,.11,.515),(.035,.052,.515),(.19,.065,.44),(.19,.12,.44),(.19,.12,.495),(.19,.065,.495)]]
        if arm.get('raised_wings'):vertices=[(x,y,z+.035) for x,y,z in vertices]
        faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)]
        if sign<0:faces=[tuple(reversed(f)) for f in faces]
        mesh=bpy.data.meshes.new('WingRoot'+side);mesh.from_pydata(vertices,[],faces);mesh.materials.append(material)
        obj=bpy.data.objects.new('HarpyWingRoot'+side,mesh);scene.collection.objects.link(obj);obj.parent=arm;obj.matrix_parent_inverse=Matrix.Identity(4)
        group=obj.vertex_groups.new(name='Wing'+side);group.add(list(range(8)),1,'REPLACE')
        mod=obj.modifiers.new('Armature','ARMATURE');mod.object=arm
    # Imported feather islands can contain single slivers; remove only tiny loose fragments.
    for obj in arm.children_recursive:
        if obj.type!='MESH' or not obj.name.startswith(('HarpyWingLeft','HarpyWingRight','GriffinBody')):continue
        bm=bmesh.new();bm.from_mesh(obj.data);seen=set();remove=[]
        for v in bm.verts:
            if v.index in seen:continue
            stack=[v];seen.add(v.index);island=[]
            while stack:
                a=stack.pop();island.append(a)
                for edge in a.link_edges:
                    b=edge.other_vert(a)
                    if b.index not in seen:seen.add(b.index);stack.append(b)
            if len(island)<=12:remove.extend(island)
        bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(obj.data);bm.free()
    arm['wing_root_revision']=1

def refine(scene, arm, character, actions):
    if character=='griffin':
        separate_harpy_wings(scene,arm)
        repair_wing_roots(scene,arm)
        if not arm.get('raised_wings'):
            for obj in arm.children_recursive:
                if obj.type=='MESH' and obj.name.startswith('HarpyWing'):
                    for v in obj.data.vertices:v.co.z+=.035
            bpy.context.view_layer.objects.active=arm;arm.select_set(True)
            bpy.ops.object.mode_set(mode='EDIT')
            for b in arm.data.edit_bones:
                if b.name.startswith('Wing'):b.head.z+=.035;b.tail.z+=.035
            bpy.ops.object.mode_set(mode='OBJECT');arm['raised_wings']=True
        if not arm.get('wing_fragments_cleaned'):
            for obj in arm.children_recursive:
                if obj.type!='MESH' or not obj.name.startswith(('HarpyWingLeft','HarpyWingRight','GriffinBody')):continue
                bm=bmesh.new();bm.from_mesh(obj.data);seen=set();remove=[]
                for v in bm.verts:
                    if v.index in seen:continue
                    stack=[v];seen.add(v.index);island=[]
                    while stack:
                        a=stack.pop();island.append(a)
                        for edge in a.link_edges:
                            b=edge.other_vert(a)
                            if b.index not in seen:seen.add(b.index);stack.append(b)
                    centre=sum((a.co for a in island),Vector())/len(island)
                    detached_tip=obj.name.startswith('GriffinBody') and abs(centre.x)>.43 and .465<centre.z<.495 and .02<centre.y<.065
                    claw_on_wing=obj.name.startswith('HarpyWing') and centre.z>.55
                    if detached_tip or claw_on_wing:remove.extend(island)
                bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(obj.data);bm.free()
            arm['wing_fragments_cleaned']=True
    def bone(n):return arm.pose.bones['mixamorig:'+n]
    def pose_matrix(b):
        rest=b.bone.matrix_local;local=b.rotation_quaternion.to_matrix().to_4x4()
        return pose_matrix(b.parent) @ b.parent.bone.matrix_local.inverted() @ rest @ local if b.parent else rest @ local
    def aim(n,direction):
        b=bone(n);rest=b.bone.matrix_local.to_3x3()
        parent=pose_matrix(b.parent).to_3x3() @ b.parent.bone.matrix_local.to_3x3().inverted() if b.parent else Matrix.Identity(3)
        target=parent.inverted() @ Vector(direction).normalized()
        delta=(b.bone.tail_local-b.bone.head_local).normalized().rotation_difference(target)
        b.rotation_quaternion=(rest.inverted() @ delta.to_matrix() @ rest).to_quaternion()
    def rotate(n,axis,angle):
        b=bone(n);local=b.bone.matrix_local.to_3x3().inverted() @ Vector(axis)
        b.rotation_quaternion=Quaternion(local.normalized(),angle) @ b.rotation_quaternion
    if character=='griffin':
        if 'fly' not in actions:
            actions['fly']=bpy.data.actions.new('fly');actions['fly'].use_fake_user=True
        for name,action in actions.items():
            if name=='death':continue
            arm.animation_data.action=action
            if action.slots:arm.animation_data.action_slot=action.slots[0]
            length=24 if name=='fly' else max(1,round(action.frame_range[1]-1))
            for f in range(length+1):
                u=f/length
                for b in arm.pose.bones:b.rotation_mode='QUATERNION';b.rotation_quaternion=Quaternion();b.location=(0,0,0)
                flap=math.sin(u*math.tau)*.55
                attacking=name in ('attack','claw','claw_windup')
                aim('LeftArm',(.25,-.2,-1));aim('RightArm',(-.25,-.2,-1))
                aim('LeftForeArm',(-.1,-1,.2));aim('RightForeArm',(.1,-1,.2))
                for side,sign in [('Left',1),('Right',-1)]:
                    b=arm.pose.bones['Wing'+side];axis=b.bone.matrix_local.to_3x3().inverted() @ Vector((0,1,0))
                    b.rotation_quaternion=Quaternion(axis.normalized(),sign*(flap-.25))
                    b=arm.pose.bones['Wing'+side+'Tip'];axis=b.bone.matrix_local.to_3x3().inverted() @ Vector((0,1,0))
                    b.rotation_quaternion=Quaternion(axis.normalized(),sign*.22*math.sin(u*math.tau-.6))
                for side in ('Left','Right'):
                    rotate(side+'UpLeg',(1,0,0),-.24)
                    rotate(side+'Leg',(1,0,0),.8)
                    rotate(side+'Foot',(1,0,0),-.25)
                rotate('Spine',(1,0,0),.12)
                if attacking:
                    reach=1-u if name in ('attack','claw') else u
                    rotate('LeftUpLeg',(1,0,0),-.8*reach);rotate('RightUpLeg',(1,0,0),-.8*reach)
                    rotate('LeftLeg',(1,0,0),-.6*reach);rotate('RightLeg',(1,0,0),-.6*reach)
                    aim('RightArm',(-.2,-1,-.5+.5*reach));aim('RightForeArm',(.1,-1,.2))
                if name=='hit':rotate('Spine2',(0,1,0),.15*math.sin(u*math.pi))
                for b in arm.pose.bones:b.keyframe_insert('rotation_quaternion',frame=f+1)
            action['loop']=name in ('idle','walk','fly')
        arm['flight_revision']=1
    arm.animation_data.action=actions['idle'];arm.animation_data.action_slot=actions['idle'].slots[0]
    scene.frame_set(1);bpy.context.view_layer.update()
    ratios={'KnightSword':.52/.7,'KnightShield':.34/.43,'ThiefDagger':.22/.32,'MageStaff':.84/.95}
    for obj in arm.children_recursive:
        key=next((n for n in ratios if obj.name.startswith(n)),None)
        if key is None or obj.get('equipment_revision')==1:continue
        obj.data=obj.data.copy()
        obj.data.transform(Matrix.Scale(ratios[key],4))
        if key=='KnightShield':obj.data.transform(Matrix.Rotation(-math.pi/2,4,'X'))
        b=arm.pose.bones[obj.parent_bone]
        palm=b.head+(b.tail-b.head).normalized()*.045+Vector((0,-.008,0))
        if key=='KnightShield':palm=(b.head+b.parent.head)*.5+Vector((.025,-.06,0))
        # Position evaluated in the resting pose. The bone parent keeps the grip in motion.
        obj.matrix_world=arm.matrix_world @ Matrix.Translation(palm)
        obj['equipment_revision']=1
    bpy.context.view_layer.update()
