import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import v2_village_kit as kit
BASE=Path(__file__).resolve().parents[1]
kit.OUT_BLEND=BASE/'models'/'v2_crypt_architecture.blend';kit.OUT_GLB=BASE/'exports'/'v2_crypt_architecture.glb'
kit.clear()
kit.PALETTE.update({'glass_blue':('#427bb7',.3,('#3669a4',.8)),'glass_red':('#a34b68',.3,('#913c59',.6)),'glass_gold':('#d5aa58',.3,('#b48a40',.6))})
p=kit.Piece('crypt_wall')
# Module 4 m, murs de 8 m; fenêtre réelle entre les piles.
for row in range(16):
 z=row*.5
 for col in range(8):
  x=-2+col*.5
  if 2<z<6.5 and -.8<x<.8:continue
  p.box('stone',(x+.012,-.35,z+.012),(x+.488,.35,z+.488))
for x in [-1.95,1.7]:p.box('stone',(x,-.5,0),(x+.25,.5,8.25))
p.box('stone',(-2.1,-.45,0),(2.1,.45,.25));p.box('stone',(-2.1,-.45,7.8),(2.1,.45,8.1))
# Vitrail en mosaïque, serti de plomb; ouvert des deux côtés.
for i in range(3):
 for j in range(8):
  x=-.49+i*.49;z=2.5+j*.5
  p.box('iron',(x-.025,-.08,z-.025),(x+.465,.08,z+.475))
  p.box(['glass_blue','glass_red','glass_gold'][(i+j)%3],(x,-.09,z),(x+.44,.09,z+.45))
objs=[p.finish(bevel=.006)]
p=kit.Piece('crypt_floor')
for i in range(24):
 for j in range(20):
  x=-24+i*2;y=-20+j*2
  p.box('stone',(x+.025,y+.025,-.12),(x+1.975,y+1.975,0))
objs.append(p.finish(bevel=0))
p=kit.Piece('sarcophagus')
p.box('stone',(-1.9,-.9,0),(1.9,.9,.15))
# Tombe ouverte à l'est: sortie au niveau du sol, sans rebord bloquant.
p.box('stone',(-1.9,-.9,.15),(-1.6,.9,.8))
for y in [-.9,.65]:p.box('stone',(-1.6,y,.15),(1.9,y+.25,.8))
p.box('stone',(-1.8,1.25,0),(1.8,2.65,.22))
for x in [-1.3,-.6,.1,.8]:p.box('iron',(x,-.915,.3),(x+.15,-.905,.58))
objs.append(p.finish(bevel=.02))
p=kit.Piece('crypt_bench')
for x in [-1.1,.85]:p.box('stone',(x,-.35,0),(x+.25,.35,.6))
p.box('timber',(-1.3,-.45,.6),(1.3,.45,.78));objs.append(p.finish())
p=kit.Piece('crypt_altar')
p.box('stone',(-1,-.65,0),(1,.65,1.1));p.box('stone',(-1.2,-.8,1.1),(1.2,.8,1.3))
for x in [-.8,.8]:
 p.cylinder('iron',(x,0,1.3),.13,.1)
 p.cylinder('glow',(x,0,1.4),.055,.4)
objs.append(p.finish())
p=kit.Piece('crypt_shelf')
for x in [-1.1,.95]:p.box('timber',(x,-.3,0),(x+.15,.3,2.4))
for z in [.15,.85,1.55,2.3]:p.box('timber',(-1.1,-.35,z),(1.1,.35,z+.1))
for z in [.3,1,1.7]:
 for x in [-.7,-.25,.2,.65]:p.box('door',(x,-.2,z),(x+.2,.2,z+.45))
objs.append(p.finish())
p=kit.Piece('crypt_column')
for z,r,h in [(0,.85,.22),(.22,.72,.2),(.42,.58,.18),(5.4,.62,.2),(5.6,.78,.22),(5.82,.86,.18)]:p.cylinder('stone',(0,0,z),r,h,seg=12)
for i in range(12):p.cylinder('stone',(0,0,.6+i*.4),.48,.385,seg=12)
for x,y in [(-.38,0),(.38,0),(0,-.38),(0,.38)]:p.cylinder('stone',(x,y,.6),.12,4.8,seg=6)
objs.append(p.finish(bevel=.008))
p=kit.Piece('torch')
p.cylinder('stone',(0,0,0),.32,.15,seg=8)
p.cylinder('timber',(0,0,.15),.09,1.65,seg=8)
for z in [.3,1.35,1.6]:p.cylinder('iron',(0,0,z),.12,.09,seg=8)
p.cylinder('iron',(0,0,1.7),.24,.25,seg=8,r2=.32)
for x,y,h in [(-.12,0,.5),(.1,.03,.6),(0,-.1,.8)]:p.cylinder('glow',(x,y,1.94),.13,h,seg=5,r2=.015)
objs.append(p.finish(bevel=.006))
kit.export(objs);print('CRYPT_ARCHITECTURE_OK',len(objs))
