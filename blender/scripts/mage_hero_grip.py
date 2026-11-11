"""Autoria da luva fechada e haste contínua do Mago; chamada pelo gerador T."""
import math
import bpy
import bmesh
from mathutils import Vector, Quaternion
import common


def repair_shaft(staff, axis):
    """Preserva a cabeça esculpida e substitui a madeira recortada por haste fechada."""
    bottom = min(v.co.z for v in staff.data.vertices)
    bm = bmesh.new()
    bm.from_mesh(staff.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < .595], context='VERTS')
    bm.to_mesh(staff.data)
    bm.free()
    wood = common.mat('MageStaffWood', '#64452f', rough=.85)
    material_index = len(staff.data.materials)
    staff.data.materials.append(wood)
    bm = bmesh.new()
    bm.from_mesh(staff.data)
    rings = []
    # A junção sobrepõe a base sólida da cabeça; não há mais recorte sob os dedos.
    for z in [bottom, bottom+.012, .25, .43, .58, .64, .665]:
        radius = .0125 + .0035*(z-bottom)/(.665-bottom)
        center = axis(z)
        rings.append([bm.verts.new(center+Vector((radius*math.cos(i*math.tau/12), radius*math.sin(i*math.tau/12), 0))) for i in range(12)])
    for a,b in zip(rings,rings[1:]):
        for i in range(12):
            face=bm.faces.new((a[i],a[(i+1)%12],b[(i+1)%12],b[i]))
            face.material_index=material_index
            face.smooth=True
    for ring in (list(reversed(rings[0])),rings[-1]):
        bm.faces.new(ring).material_index=material_index
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(staff.data)
    bm.free()
    staff['continuous_shaft']=True


def closed_glove(body, rig):
    """Luva compacta em torno da haste, rígida na mão em vez de dobrar a malha T."""
    bm=bmesh.new()
    bm.from_mesh(body.data)
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.x < -.370],context='VERTS')
    bm.to_mesh(body.data)
    bm.free()
    common.mat('MageGlove', '#2c3548', rough=.87)
    hand='mixamorig:RightHand'
    parts=[]
    def ellipsoid(center,scale):
        ob=common.sphere(center,1,sc=scale,m='MageGlove',bone=hand,seg=16)
        parts.append(ob)

    # Espaço de autoria: punho em zero, palma à frente (-Y), polegar acima (+Z).
    ellipsoid((.004,-.024,-.003),(.020,.026,.033))
    # O cano da luva entra na manga, cobrindo a junção de pesos do punho antigo.
    ellipsoid((0,.012,0),(.022,.035,.027))

    def finger(name,points,radius):
        points=[Vector(p) for p in points]
        path=[]
        for i in range(len(points)-1):
            p0,p1,p2,p3=points[max(0,i-1)],points[i],points[i+1],points[min(len(points)-1,i+2)]
            for j in range(4):
                t=j/4
                path.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
        path.append(points[-1])
        vertices=[];faces=[];sides=10
        for i,p in enumerate(path):
            tangent=(path[min(i+1,len(path)-1)]-path[max(0,i-1)]).normalized()
            normal=tangent.cross(Vector((0,0,1))).normalized()
            other=tangent.cross(normal).normalized()
            r=radius*(1-.20*i/(len(path)-1))
            for k in range(sides):
                angle=k*math.tau/sides
                vertices.append(p+r*(normal*math.cos(angle)+other*math.sin(angle)))
        for i in range(len(path)-1):
            for k in range(sides):
                a=i*sides+k;b=i*sides+(k+1)%sides
                faces.append((a,b,b+sides,a+sides))
        faces.extend([tuple(reversed(range(sides))),tuple(range((len(path)-1)*sides,len(path)*sides))])
        data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
        ob=bpy.data.objects.new(name,data);bpy.context.scene.collection.objects.link(ob)
        data.materials.append(common.MATS['MageGlove'])
        for face in data.polygons:face.use_smooth=True
        ob.vertex_groups.new(name=hand).add(list(range(len(vertices))),1,'REPLACE')
        parts.append(ob)
        ellipsoid(points[-1],(radius*.82,)*3)

    for i,z in enumerate([.017,.003,-.011,-.025]):
        finger('MageGripFinger'+str(i),[(.014,-.029,z),(.026,-.046,z),(.012,-.064,z-.001),(-.009,-.063,z-.002),(-.018,-.046,z-.003)],.0078 if i<3 else .007)
    finger('MageGripThumb',[(-.010,-.007,.014),(-.024,-.025,.031),(-.020,-.047,.033),(.003,-.058,.030)],.0095)

    rotation=Quaternion(Vector((0,1,0)),math.pi) @ Quaternion(Vector((1,1,1)).normalized(),math.tau/3)
    wrist=rig.data.bones[hand].head_local
    # Volta ao bind; a mão/antebraço animados levam toda a pegada ao destino.
    for ob in parts:
        for v in ob.data.vertices:v.co=wrist+rotation.inverted() @ v.co
        ob['mage_t_generated']=True
    bpy.ops.object.select_all(action='DESELECT')
    body.hide_set(False);body.select_set(True)
    for ob in parts:ob.select_set(True)
    bpy.context.view_layer.objects.active=body
    bpy.ops.object.join()
    body['closed_grip']=True
