"""Planta Carnívora da Druida: GLB animado, fonte reproduzível e validação.

Raiz do projeto: blender --background --threads 4 --python blender/scripts/carnivorous_plant.py
Brief: aliado fixo low-poly, boca vinho com dentes claros, folhas verdes largas;
até 2400 triângulos, quatro materiais sólidos, sem textura; pivô no chão,
frente -Y no Blender; idle/attack/death (30 FPS), sem deslocamento de raiz.
Uma planta no jogo: mesma malha leve para todas as qualidades, sem LOD adicional.
"""
from pathlib import Path
import sys, math, json
sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy, bmesh
import common as c

ROOT=Path(__file__).resolve().parents[1]
c.reset_scene()
c.mat('MAT_stem','#446b36')
c.mat('MAT_leaf','#8fba50')
c.mat('MAT_mouth','#93495d')
c.mat('MAT_tooth','#f0ddac')
c.bone('root',(0,0,0),(0,0,.3))
c.bone('stem',(0,0,.25),(0,0,1.25),'root')
c.bone('head',(0,0,1.25),(0,-.45,1.4),'stem')
c.bone('jaw',(0,.12,1.3),(0,-.5,1.05),'head')
c.build_rig()
c.cone((0,0,.45),.23,.13,.9,'MAT_stem','stem',seg=8)
for i in range(6):
    a=i*math.tau/6
    c.sphere((math.cos(a)*.5,math.sin(a)*.5,.16),.45,(1,.35,.22),'MAT_leaf','root',seg=8,smooth=False)
    leaf=c.PARTS[-1]
    # Rotação das folhas aplicada antes de juntar a malha.
    leaf.rotation_euler.z=a
    bpy.context.view_layer.objects.active=leaf
    leaf.select_set(True)
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    leaf.select_set(False)
c.sphere((0,.02,1.27),.52,(1,1,.55),'MAT_stem','head',seg=10,smooth=False)
c.sphere((0,-.25,1.55),.5,(1,.95,.4),'MAT_leaf','head',seg=10,smooth=False)
c.sphere((0,-.3,1.05),.49,(1,.95,.22),'MAT_mouth','jaw',seg=10,smooth=False)
for i in range(7):
    a=math.pi*(i/6)
    x=math.cos(a)*.43
    y=-.17-math.sin(a)*.5
    c.cone((x,y,1.34),.065,0,.28,'MAT_tooth','head',rot=(math.pi,0,0),seg=5)
    c.cone((x,y,1.17),.055,0,.24,'MAT_tooth','jaw',seg=5)
c.finish('SM_carnivorous_plant')
scene=bpy.context.scene
c.init_anim(scene,30)
def idle(t):
    c.R('stem',x=.05*math.sin(t*math.tau))
    c.R('head',z=.08*math.sin(t*math.tau))
    c.R('jaw',x=.05*math.sin(t*math.tau))
def attack(t):
    bite=math.sin(math.pi*min(1,t/.4)) if t<.4 else 0
    c.R('head',x=-.15*math.sin(t*math.pi))
    c.R('jaw',x=-.7*bite)
def death(t):
    c.R('stem',x=1.3*t)
    c.R('head',x=.3*t)
    c.R('jaw',x=-.3*t)
c.bake_loop('idle',60,idle)
c.bake_once('attack',30,attack)
c.bake_once('death',30,death)
c.reset()
meshes=[o for o in bpy.data.objects if o.type=='MESH']
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
assert triangles<=2400, triangles
for o in meshes:
    bm=bmesh.new(); bm.from_mesh(o.data)
    assert all(e.is_manifold for e in bm.edges), 'Malha aberta'
    bm.free()
    assert all(abs(s-1)<1e-6 for s in o.scale)
assert len(c.MATS)==4
c.export(str(ROOT/'models'),'carnivorous_plant',scene)
report={'triangles':triangles,'materials':4,'animations':['idle','attack','death'],'fps':30,'validation':'PASS','texture':'solid colors','lod':'single lightweight summon'}
out=ROOT/'previews'/'carnivorous_plant'
out.mkdir(parents=True,exist_ok=True)
(out/'validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps(report))
