# Estruturas do Cerco ao Ritual: GLBs com rig e idle/attack; geração reproduzível.
from pathlib import Path
import math, bpy
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
import common as C
ROOT=Path(__file__).resolve().parents[1]
for kind,color in [('core','#aa84ec'),('bone','#e9d9ae'),('frost','#83e5ff'),('plague','#a3e76d'),('crypt','#c29aff')]:
 C.reset_scene();C.mat('stone','#4d565c');C.mat('rim','#8b8587');C.mat('ivory','#eadcc0');C.mat('glow',color,emit=color,es=.7);C.mat('dark','#242a30')
 C.bone('root',(0,0,0),(0,0,.4));C.bone('hips',(0,0,.5),(0,0,2),'root');C.build_rig()
 C.cone((0,0,.15),1.05,.95,.3,'stone','root',seg=8);C.cone((0,0,.37),.85,.8,.2,'rim','root',seg=8)
 if kind=='core':
  C.cone((0,0,1.65),.55,.32,2.5,'stone','root',seg=4);C.cone((0,0,3.2),.45,0,.8,'glow','hips',seg=4)
  for n in range(4):
   a=n*math.pi/2;C.box((math.cos(a)*.4,math.sin(a)*.4,1.8),(.16,.16,1.6),'glow','root')
 elif kind=='bone':
  C.cone((0,0,1.25),.5,.38,1.7,'stone','root',seg=8)
  for x in [-.36,.36]:C.seg((x,0,.6),(x,0,2.3),.12,.09,'ivory','root')
  C.sphere((0,0,2.35),.43,sc=(1,.8,.9),m='ivory',bone='hips');C.cone((0,0,2.9),.32,0,.55,'glow','hips',seg=5)
  for x in [-.16,.16]:C.sphere((x,-.3,2.4),.1,m='dark',bone='hips',seg=8)
 elif kind=='frost':
  C.box((0,0,.7),(1.2,.65,.7),'stone','root')
  for x,y,z,h in [(0,0,1.65,1.8),(-.45,.12,1.25,1.05),(.45,.12,1.2,.95)]:C.cone((x,y,z),.28,0,h,'glow','hips',seg=5)
 elif kind=='plague':
  C.sphere((0,0,.95),.72,sc=(1,1,.8),m='dark',bone='root');C.torus((0,0,1.4),.66,.12,'rim','root');C.cone((0,0,1.4),.55,.55,.08,'glow','root',seg=16)
  for x,y,z,r in [(-.25,0,1.7,.2),(.2,.15,2,.17),(0,-.1,2.45,.12)]:C.sphere((x,y,z),r,m='glow',bone='hips')
 elif kind=='crypt':
  C.box((0,0,1.0),(1.35,.8,1.2),'stone','root');C.box((0,-.42,.92),(.62,.04,.95),'dark','root');C.cone((0,0,1.85),1.05,0,.65,'rim','root',seg=4)
  for x in [-.48,.48]:C.box((x,-.48,1.05),(.12,.12,1.2),'ivory','root')
  C.sphere((0,0,2.35),.22,m='glow',bone='hips')
 C.finish('siege_'+kind);C.init_anim(bpy.context.scene,24)
 C.bake_loop('idle',48,lambda t:C.R('hips',z=math.sin(t*math.tau)*.06))
 C.bake_once('attack',16,lambda t:C.R('hips',x=-math.sin(t*math.pi)*.22,z=math.sin(t*math.pi)*.2))
 C.export(str(ROOT/'models'),'siege_'+kind,bpy.context.scene)
