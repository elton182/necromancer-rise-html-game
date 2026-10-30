"""Placas de carne e costelas do Escudo de Carne. Geração isolada em background."""
import sys, math
from pathlib import Path
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import common as C
C.reset_scene()
C.mat('flesh','#8f6964',rough=.68)
C.mat('scar','#392f35',rough=.85)
C.mat('bone','#c9bba4',rough=.8)
for i in range(6):
    start=len(C.PARTS)
    a=i*math.tau/6
    center=Vector((math.cos(a)*.97,math.sin(a)*.97,1.03))
    skin=C.sphere(tuple(center),1,sc=(.36,.19,.5),m='flesh',seg=12)
    # A parte larga acompanha a tangente; cada placa deixa lacunas entre vizinhas.
    for v in skin.data.vertices:
        q=v.co-center
        q.x*=.88+.12*math.sin(q.z*8+q.x*5+i)
        q.z+=.035*math.sin(q.x*15+i)
        v.co=center+Vector((-math.sin(a)*q.x+math.cos(a)*q.y,math.cos(a)*q.x+math.sin(a)*q.y,q.z))
    for k in range(3):
        points=[]
        for n in range(9):
            t=-1+2*n/8
            points.append(center+Vector((-math.sin(a)*t*.34+math.cos(a)*(.19+.07*(1-t*t)),math.cos(a)*t*.34+math.sin(a)*(.19+.07*(1-t*t)),(k-1)*.29+.09*(1-t*t))))
        curve=bpy.data.curves.new('costela','CURVE');curve.dimensions='3D';curve.bevel_depth=.043;curve.bevel_resolution=1
        spl=curve.splines.new('POLY');spl.points.add(len(points)-1)
        for pt,co in zip(spl.points,points):pt.co=(*co,1)
        obj=bpy.data.objects.new('costela',curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(C.MATS['bone'])
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH');C.PARTS.append(bpy.context.object)
    scar=C.sphere(tuple(center+Vector((math.cos(a)*.215,math.sin(a)*.215,0))),1,sc=(.055,.055,.5),m='scar',seg=8)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in C.PARTS[start:]:obj.select_set(True)
    bpy.context.view_layer.objects.active=skin;bpy.ops.object.join();skin.name='flesh_plate_'+str(i)
    # Origem local no centro do personagem para a contração radial no runtime.
    bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    for frame,scale in [(1,1),(21,1.025),(41,1)]:
        skin.scale=(scale,scale,scale);skin.keyframe_insert(data_path='scale',frame=frame)
    skin.animation_data.action.name='pulse_'+str(i)
bpy.context.scene.frame_set(1)
(ROOT/'models').mkdir(exist_ok=True);(ROOT/'exports').mkdir(exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/v2_flesh_shield.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'exports/v2_flesh_shield.glb'),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_yup=True)
print('Escudo de Carne exportado: 6 placas e costelas, animações de pulsação.')
