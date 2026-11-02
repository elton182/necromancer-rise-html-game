# Ruínas funerárias do pântano; reutiliza a construção e o sombreamento do kit da vila.
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import v2_village_kit as kit
import bpy
BASE=Path(__file__).resolve().parents[1]
kit.OUT_BLEND=BASE/'models'/'v2_swamp_kit.blend'
kit.OUT_GLB=BASE/'exports'/'v2_swamp_kit.glb'
kit.clear()
objs=[]
for variant in range(3):
 p=kit.Piece('tomb_'+str(variant))
 p.box('stone',(-.38,-.12,0),(.38,.12,.12))
 for row in range(3):
  z=.12+row*.2
  p.box('stone',(-.31+row*.025,-.085,z),(.3-row*.03,.085,z+.19))
 # Coroa quebrada e rebaixo escuro, sem faces coplanares.
 p.prism('stone',[(-.235,.72),(.21,.72),(.19,.84),(.06,.79),(-.04,.94),(-.235,.87)],-.085,.085)
 p.box('iron',(-.095,-.092,.35),(.095,-.086,.57))
 p.box('shutter',(-.33,-.125,.12),(-.15,-.119,.28))
 o=p.finish(bevel=.008)
 # Silhuetas distintas: topo mais baixo ou tombado, sem ampliar a base.
 for v in o.data.vertices:
  v.co.z*=1-variant*.12
  if v.co.z>.3:v.co.x+=(v.co.z-.3)*(.10 if variant==1 else -.07 if variant==2 else 0)
 o.location=(variant*1.2,0,0);objs.append(o)
kit.export(objs)
print('V2_SWAMP_KIT_OK',len(objs))
