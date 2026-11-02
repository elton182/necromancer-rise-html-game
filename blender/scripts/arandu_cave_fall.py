"""Borda desmoronada e poço da queda, abertos para a câmera do jogo."""
import sys,math
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import v2_village_kit as kit
BASE=Path(__file__).resolve().parents[1]
kit.OUT_BLEND=BASE/'models'/'arandu_cave_fall.blend';kit.OUT_GLB=BASE/'exports'/'arandu_cave_fall.glb'
kit.clear();kit.PALETTE.update({'earth':('#75604b',1,None),'deep':('#443f39',1,None),'stone':('#625d52',1,None)})
objects=[]
p=kit.Piece('pit_rim')
for i in range(16):
 a=i*math.tau/16;b=(i+1)*math.tau/16;inner=1.7+.12*math.sin(i*2.399);outer=2.05+.35*(.5+.5*math.sin(i*4.7))
 rows=[]
 for r,z in [(inner,-.12),(outer,0),(outer,.12+(i%2)*.07),(inner,.035)]:
  rows.append([p.bm.verts.new((r*math.cos(t),r*math.sin(t),z)) for t in [a,b]])
 faces=[]
 for j in range(4):faces.append(p.bm.faces.new((rows[j][0],rows[j][1],rows[(j+1)%4][1],rows[(j+1)%4][0])))
 p._faces(faces,'earth' if i%3 else 'stone')
objects.append(p.finish(bevel=.007))
p=kit.Piece('pit_shaft')
for i in range(16):
 a=i*math.tau/16;b=(i+1)*math.tau/16
 # Face inward: the circular opening reveals walls, not a flat dark decal.
 vs=[p.bm.verts.new((r*math.cos(t),r*math.sin(t),z)) for r,t,z in [(1.8,a,0),(1.8,b,0),(1.55,b,-6),(1.55,a,-6)]]
 face=p.bm.faces.new(vs);p._faces([face],'earth' if i%3 else 'deep')
for z in [-1.1,-2.8,-4.4]:
 for i in range(6):
  a=i*math.tau/6;p.box('stone',(math.cos(a)*1.6-.15,math.sin(a)*1.6-.15,z-.15),(math.cos(a)*1.6+.15,math.sin(a)*1.6+.15,z+.15))
objects.append(p.finish(bevel=0))
p=kit.Piece('collapse_chunk');p.prism('earth',[(-.45,0),(.4,.06),(.32,.28),(-.34,.38)],-.3,.3);objects.append(p.finish(bevel=.015))
kit.export(objects)
