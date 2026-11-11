"""Dedos articulados sobre a mão original do Mago T, sem substituir a malha."""
from mathutils import Vector, Quaternion

FINGERS = {
    'Index': [(-.430,-.016,.633),(-.455,-.016,.631),(-.470,-.016,.626),(-.481,-.016,.623)],
    'Middle': [(-.433,.009,.633),(-.459,.009,.630),(-.477,.009,.626),(-.489,.009,.624)],
    'Ring': [(-.430,.032,.632),(-.455,.032,.628),(-.471,.032,.624),(-.479,.032,.620)],
    'Pinky': [(-.421,.052,.627),(-.444,.052,.624),(-.457,.052,.620),(-.465,.052,.615)],
    'Thumb': [(-.393,-.015,.621),(-.409,-.032,.607),(-.423,-.045,.597),(-.432,-.048,.594)],
}


def add_finger_bones(bone):
    for digit,points in FINGERS.items():
        for i,(head,tail) in enumerate(zip(points,points[1:]),1):
            bone(f'RightHand{digit}{i}',head,tail,'RightHand' if i==1 else f'RightHand{digit}{i-1}')


def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)


def weight_fingers(mesh,groups):
    count={d:0 for d in FINGERS}
    for v in mesh.data.vertices:
        x,y,z=v.co
        if x>-.382:
            continue
        thumb=(y<-.025 and z<.633 or y<-.012 and z<.616) and x>-.442
        digit='Thumb' if thumb else min(['Index','Middle','Ring','Pinky'],key=lambda d:abs(y-FINGERS[d][0][1]))
        points=[Vector(p) for p in FINGERS[digit]]
        direction=(points[-1]-points[0]).normalized() if thumb else Vector((-1,0,0))
        distance=(v.co-points[0]).dot(direction)
        joints=[(p-points[0]).dot(direction) for p in points]
        a=smooth((distance+.007)/.014)
        b=smooth((distance-joints[1]+.005)/.010)
        c=smooth((distance-joints[2]+.004)/.008)
        weights={'RightHand':1-a,f'RightHand{digit}1':a*(1-b),f'RightHand{digit}2':a*b*(1-c),f'RightHand{digit}3':a*b*c}
        # O punho continua com o gradiente mão/antebraço existente; a palma não dobra.
        if a<1e-6:
            continue
        for ge in list(v.groups):mesh.vertex_groups[ge.group].remove([v.index])
        for name,weight in weights.items():
            if weight>1e-6:groups[name].add([v.index],weight,'REPLACE')
        count[digit]+=1
    mesh['articulated_fingers']=True
    mesh['finger_vertex_counts']=str(count)


def pose_grip(rig):
    for digit,angles in {'Index':(.40,.80,.65),'Middle':(.42,.85,.65),'Ring':(.45,.90,.65),'Pinky':(.15,.55,.45),'Thumb':(-.10,-.10,.20)}.items():
        for i,angle in enumerate(angles,1):
            b=rig.pose.bones[f'mixamorig:RightHand{digit}{i}']
            axis=b.bone.matrix_local.to_quaternion().inverted() @ Vector((0,1,0))
            b.rotation_quaternion=Quaternion(axis,-angle)
            if digit=='Thumb' and i==1:
                opposition=b.bone.matrix_local.to_quaternion().inverted() @ Vector((0,0,1))
                b.rotation_quaternion=Quaternion(opposition,-.65) @ b.rotation_quaternion
