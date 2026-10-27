"""Extrai o cajado original por componente soldado e o monta na mão direita."""
import bpy,bmesh
from mathutils import Vector,Matrix

def attach(base,arm):
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(base/'exports/necromancer_1.glb'))
    objects=[o for o in bpy.data.objects if o not in before]
    source=next(o for o in objects if o.type=='MESH' and o.visible_get())
    bm=bmesh.new();bm.from_mesh(source.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001)
    # Componentes conectados após soldar as costuras de UV.
    unseen=set(bm.verts);components=[];crystals=[]
    while unseen:
        seed=unseen.pop();part={seed};stack=[seed]
        while stack:
            v=stack.pop()
            for edge in v.link_edges:
                n=edge.other_vert(v)
                if n in unseen:unseen.remove(n);part.add(n);stack.append(n)
        coords=[source.matrix_world@v.co for v in part]
        lo=Vector(tuple(min(v[i] for v in coords) for i in range(3)))
        hi=Vector(tuple(max(v[i] for v in coords) for i in range(3)))
        if hi.z-lo.z>.8 and hi.x-lo.x<.25 and lo.x>.1:components.append(part)
        if lo.x>.15 and lo.z>.8 and hi.z>.95 and len(part)<50:crystals.append(part)
    assert len(components)==1,'Componente do cajado não encontrado de forma única'
    assert len(crystals)==1,'Cristal original não encontrado de forma única'
    keep=components[0]|crystals[0]
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if v not in keep],context='VERTS')
    bm.to_mesh(source.data);bm.free()
    source.name='ImportedStaff'
    for o in objects:
        if o!=source:bpy.data.objects.remove(o,do_unlink=True)
    coords=[source.matrix_world@v.co for v in source.data.vertices]
    bottom=min(v.z for v in coords);top=max(v.z for v in coords);height=top-bottom
    low=[v for v in coords if v.z<bottom+height*.1]
    high=[v for v in coords if v.z>top-height*.1]
    a=sum(low,Vector())/len(low);b=sum(high,Vector())/len(high)
    axis=(b-a).normalized();origin=a+(b-a)*.48
    straighten=axis.rotation_difference(Vector((0,0,1)))
    for vertex,co in zip(source.data.vertices,coords):vertex.co=straighten@(co-origin)*(1.0/height)
    source.parent=arm;source.parent_type='BONE';source.parent_bone='mixamorig:RightHand'
    source.matrix_parent_inverse=Matrix.Identity(4)
    # Neutralizar o eixo local do osso para que o cajado descanse vertical.
    bone=arm.data.bones['mixamorig:RightHand']
    rest=bone.matrix_local.to_3x3()
    source.rotation_mode='QUATERNION';source.rotation_quaternion=rest.inverted().to_quaternion()
    source.location=(0,-bone.length*.4,0)
    source.scale=(1,1,1)
    return source
