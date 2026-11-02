"""Controles de braços por alvos em espaço do rig; cotovelos e punhos explícitos."""
import math
import bpy
from mathutils import Vector, Matrix, Quaternion

def arm_pose(rig,side,target,pole,tool_direction=(0,0,1),extension=0):
    upper=rig.pose.bones['mixamorig:'+side+'Arm']
    lower=rig.pose.bones['mixamorig:'+side+'ForeArm']
    hand=rig.pose.bones['mixamorig:'+side+'Hand']
    bpy.context.view_layer.update()
    shoulder=upper.head.copy();target=Vector(target);pole=Vector(pole)
    l1=upper.bone.length;l2=lower.bone.length
    delta=target-shoulder;axis=delta.normalized()
    reach=l1+l2-.0006
    dist=min(delta.length,reach)
    dist=dist+(reach-dist)*max(0,min(1,extension))
    target=shoulder+axis*dist
    along=(l1*l1-l2*l2+dist*dist)/(2*dist)
    bend=pole-shoulder;normal=(bend-axis*bend.dot(axis)).normalized()
    elbow=shoulder+axis*along+normal*math.sqrt(max(0,l1*l1-along*along))
    for bone,head,tail in [(upper,shoulder,elbow),(lower,elbow,target)]:
        rest=bone.bone.matrix_local.to_quaternion()
        direction=bone.bone.tail_local-bone.bone.head_local
        q=direction.rotation_difference(tail-head)@rest
        bone.matrix=Matrix.LocRotScale(head,q,Vector((1,1,1)))
        bpy.context.view_layer.update()
    if side=='Right':
        # Eixo longitudinal da palma segue o antebraço; o cabo cruza os dedos.
        blade=Vector(tool_direction).normalized()
        forward=(target-elbow).normalized();forward=(forward-blade*forward.dot(blade)).normalized()
        x=-forward;y=-blade;z=x.cross(y).normalized()
        deform=Matrix((x,y,z)).transposed().to_quaternion()
        q=deform@hand.bone.matrix_local.to_quaternion()
    else:
        q=Vector((0,0,1)).rotation_difference(Vector(tool_direction).normalized())@hand.bone.matrix_local.to_quaternion()
    hand.matrix=Matrix.LocRotScale(target,q,Vector((1,1,1)))
    bpy.context.view_layer.update()
    # Flexão no plano anatômico de cada falange; polegar em oposição.
    for digit in ['Index','Middle','Ring','Pinky']:
        for n,angle in [(1,.85),(2,1.15),(3,.9)]:
            bone=rig.pose.bones.get('mixamorig:'+side+'Hand'+digit+str(n))
            if bone:
                direction=(bone.bone.tail_local-bone.bone.head_local).normalized()
                axis=direction.cross(Vector((0,0,-1))).normalized()
                basis=bone.bone.matrix_local.to_quaternion()
                bone.rotation_mode='QUATERNION';bone.rotation_quaternion=basis.inverted()@Quaternion(axis,angle)@basis
    if side=='Right':
        # O polegar cruza a empunhadura; não usa o eixo de flexão dos outros dedos.
        head=None
        for n,direction in [(1,(-.015,-.013,-.003)),(2,(-.018,-.002,-.004)),(3,(-.010,.011,-.003))]:
            bone=rig.pose.bones['mixamorig:RightHandThumb'+str(n)]
            rest=bone.bone
            if head is None:head=target+deform@(rest.head_local-hand.bone.head_local)
            aim=Vector(direction).normalized()
            q=deform@(rest.tail_local-rest.head_local).rotation_difference(aim)@rest.matrix_local.to_quaternion()
            bone.matrix=Matrix.LocRotScale(head,q,Vector((1,1,1)))
            head=head+deform@aim*rest.length
            bpy.context.view_layer.update()


def leg_pose(rig,side,target,pole,pitch=0,yaw=0):
    upper=rig.pose.bones['mixamorig:'+side+'UpLeg']
    lower=rig.pose.bones['mixamorig:'+side+'Leg']
    foot=rig.pose.bones['mixamorig:'+side+'Foot']
    bpy.context.view_layer.update()
    hip=upper.head.copy();target=Vector(target);pole=Vector(pole)
    l1=upper.bone.length;l2=lower.bone.length
    delta=target-hip;dist=min(delta.length,l1+l2-.0005);axis=delta.normalized()
    target=hip+axis*dist
    along=(l1*l1-l2*l2+dist*dist)/(2*dist)
    bend=pole-hip;normal=(bend-axis*bend.dot(axis)).normalized()
    knee=hip+axis*along+normal*math.sqrt(max(0,l1*l1-along*along))
    for bone,head,tail in [(upper,hip,knee),(lower,knee,target)]:
        direction=bone.bone.tail_local-bone.bone.head_local
        q=direction.rotation_difference(tail-head)@bone.bone.matrix_local.to_quaternion()
        bone.matrix=Matrix.LocRotScale(head,q,Vector((1,1,1)))
        bpy.context.view_layer.update()
    foot.matrix=Matrix.LocRotScale(target,Quaternion((0,0,1),yaw)@Quaternion((1,0,0),pitch)@foot.bone.matrix_local.to_quaternion(),Vector((1,1,1)))
    bpy.context.view_layer.update()
