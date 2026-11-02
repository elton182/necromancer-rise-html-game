"""Carroça e estandarte da abertura. Executar com Blender --background --python."""
import sys, math, bpy, bmesh
from pathlib import Path
from mathutils import Vector, Matrix
sys.path.insert(0, str(Path(__file__).resolve().parent))
import v2_village_kit as kit
BASE=Path(__file__).resolve().parents[1]
kit.OUT_BLEND=BASE/'models'/'arandu_caravan_kit.blend'
kit.OUT_GLB=BASE/'exports'/'arandu_caravan_kit.glb'
kit.clear()
kit.PALETTE.update({
 'canvas':('#c9b895',.95,None),'canvas_seam':('#a38d69',.95,None),'red':('#783e34',.9,None),
 'plank':('#9d754e',.9,None),'plank_dark':('#89633f',.9,None),'rim':('#715035',.9,None),
 'steel':('#495355',.55,None),'brass':('#b18a4d',.55,None)
})

def cylinder_x(p,mat,c,r,length):
 center=Vector(c);vs=p.cylinder(mat,center,r,length,seg=12)
 for v in vs:v.co=center+Matrix.Rotation(math.pi/2,4,'Y')@(v.co-center)

def ring_x(p,mat,c,outer,inner,width):
 # Aro vazado: madeira e cinta de ferro, com oito raios verdadeiros.
 cx,cy,cz=c;rows=[]
 for x,r in [(cx-width/2,outer),(cx+width/2,outer),(cx-width/2,inner),(cx+width/2,inner)]:
  rows.append([p.bm.verts.new((x,cy+r*math.cos(i*math.tau/16),cz+r*math.sin(i*math.tau/16))) for i in range(16)])
 faces=[]
 for i in range(16):
  j=(i+1)%16
  for a,b in [(0,1),(2,0),(1,3),(3,2)]:faces.append(p.bm.faces.new((rows[a][i],rows[a][j],rows[b][j],rows[b][i])))
 p._faces(faces,mat)

def wheel(p,c):
 ring_x(p,'rim',c,.65,.49,.17);ring_x(p,'steel',c,.665,.63,.21)
 center=Vector(c)
 for i in range(8):
  verts=p.box('plank',(-.055,.11,-.045),(.055,.52,.045))
  rot=Matrix.Rotation(i*math.tau/8,4,'X')
  for v in verts:v.co=center+rot@v.co
 cylinder_x(p,'rim',(c[0]-.14,c[1],c[2]),.15,.28)
 cylinder_x(p,'steel',(c[0]-.16,c[1],c[2]),.09,.32)

def carriage(opened):
 p=kit.Piece('caravan_open' if opened else 'caravan_cart')
 # Chassi, piso com réguas alternadas e bordas chanfradas.
 for x in [-.82,.68]:p.box('timber',(x,-1.8,.61),(x+.14,1.9,.85))
 for y in [-1.1,1.1]:p.box('steel',(-1.53,y-.06,.59),(1.53,y+.06,.73))
 for i in range(8):
  x=-1.1+i*.275;p.box('plank' if i%3 else 'plank_dark',(x,-1.72,.86),(x+.263,1.72,1.015))
 for x in [-1.18,1.04]:
  for row in range(3):p.box('plank' if row!=1 else 'plank_dark',(x,-1.73,1.03+row*.21),(x+.14,1.73,1.21+row*.21))
  p.box('rim',(x-.035,-1.82,1.65),(x+.175,1.82,1.76))
  for y in [-1.46,0,1.46]:
   p.box('steel',(x-.015,y-.045,1.02),(x+.16,y+.045,1.69))
   for z in [1.12,1.53]:cylinder_x(p,'brass',(x-.027,y,z),.035,.2)
  # Faixa vinho da guilda, discreta, sob a borda de madeira.
  p.box('red',(x-.02,-1.4,1.49),(x+.16,1.4,1.56))
 # Tampa traseira, degrau e bancos laterais sem fechar o espaço dos passageiros.
 for z in [1.05,1.27,1.49]:p.box('plank',(-1.1,1.66,z),(1.1,1.81,z+.17))
 for x in [-.97,.72]:p.box('rim',(x,-1.22,1.1),(x+.25,1.25,1.23))
 p.box('plank',(-.94,-2.2,.88),(.94,-1.65,1.01))
 p.box('rim',(-.88,-1.7,1.26),(.88,-1.42,1.42))
 p.box('steel',(-.7,1.82,.6),(.7,2.24,.7));p.box('plank',(-.72,1.82,.7),(.72,2.3,.8))
 # Varais presos ao chassi e reforçados com pequenas cintas.
 for x in [-.65,.65]:
  p.box('timber',(x-.065,-3,.75),(x+.065,-1.5,.9))
  p.box('steel',(x-.07,-1.82,.74),(x+.07,-1.66,.92))
 # Bagagem e lona enrolada no suporte traseiro.
 p.box('plank_dark',(-.68,1.83,.81),(-.05,2.29,1.28))
 for x in [-.59,-.19]:p.box('steel',(x,1.81,.81),(x+.045,2.31,1.3))
 cylinder_x(p,'canvas',(-.76,1.9,1.85),.19,1.52)
 for x in [-.55,.48]:cylinder_x(p,'rope',(x,1.9,1.85),.203,.045)
 # Lanternas pequenas protegidas por armação de ferro, sem luz dinâmica extra.
 for x in [-1.22,1.22]:
  p.box('steel',(x-.09,-1.5,1.23),(x+.09,-1.32,1.28))
  p.box('glow',(x-.065,-1.48,1.28),(x+.065,-1.34,1.5))
  for dx in [-.085,.065]:p.box('steel',(x+dx,-1.5,1.26),(x+dx+.02,-1.32,1.53))
  p.prism('steel',[(x-.13,1.53),(x,1.65),(x+.13,1.53)],-1.53,-1.3)
 if not opened:
  # Cobertura curva facetada, costuras e arcos de sustentação.
  for i in range(12):
   x0=-1.23+i*2.46/12;x1=x0+2.46/12
   z0=2.02+1.06*math.sqrt(max(0,1-(x0/1.23)**2));z1=2.02+1.06*math.sqrt(max(0,1-(x1/1.23)**2))
   p.prism('canvas',[(x0,z0),(x1,z1),(x1,z1+.045),(x0,z0+.045)],-1.67,1.67)
   for y in [-1.51,0,1.51]:p.prism('canvas_seam',[(x0,z0+.046),(x1,z1+.046),(x1,z1+.066),(x0,z0+.066)],y-.025,y+.025)
  for x in [-1.1,1.04]:
   for y in [-1.5,1.5]:p.box('rim',(x,y-.04,1.65),(x+.06,y+.04,2.12))
  for x in [-1.35,1.35]:
   for y in [-1.1,1.1]:wheel(p,(x,y,.65))
 return p.finish(bevel=.014)

objects=[carriage(False),carriage(True)]
p=kit.Piece('caravan_wheel');wheel(p,(0,0,0));objects.append(p.finish(bevel=.006))
p=kit.Piece('road_block')
p.box('timber',(-3.5,-.35,0),(3.5,.35,.65))
for x in [-2.5,-1.5,.5,2]:p.box('door',(x,-.38,.65),(x+.3,.38,.85))
objects.append(p.finish(bevel=.015))
p=kit.Piece('bandit_banner');p.cylinder('timber',(0,0,0),.06,2.8,seg=8)
p.box('red',(.05,-.04,1.7),(.95,.04,2.65))
p.box('iron',(.43,-.055,1.9),(.55,-.045,2.5));objects.append(p.finish())
p=kit.Piece('story_arrow')
p.box('timber',(-.025,-.6,-.025),(.025,.55,.025))
p.prism('iron',[(-.13,0),(0,.05),(.13,0),(0,-.05)],-.8,-.6)
for x in [-.08,.06]:p.box('canvas',(x,.25,-.015),(x+.02,.55,.16))
objects.append(p.finish(bevel=0))
kit.export(objects)
