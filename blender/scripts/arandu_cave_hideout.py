"""Adereços narrativos da galeria dos salteadores; compartilha materiais da vila."""
import sys,math,bmesh
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import v2_village_kit as kit
BASE=Path(__file__).resolve().parents[1]
kit.OUT_BLEND=BASE/'models'/'arandu_cave_hideout.blend';kit.OUT_GLB=BASE/'exports'/'arandu_cave_hideout.glb'
kit.clear();kit.PALETTE.update({'paper':('#dbc89d',.95,None),'ink':('#4b4132',.9,None),'cloth':('#646b57',1,None),'sack':('#a58d62',1,None),'cave':('#696c68',1,None),'wax':('#9b4938',.8,None)})
objects=[]
p=kit.Piece('hideout_table')
for x in [-.75,.65]:
 for y in [-.4,.3]:p.box('timber',(x,y,0),(x+.1,y+.1,.87))
for i in range(5):p.box('door',(-.9+i*.36,-.55,.86),(-.9+i*.36+.35,.55,.99))
p.box('timber',(-.7,-.4,.25),(.7,-.3,.34))
# Ordem, selo arrancado, tinta e lâmina prendendo o papel à mesa.
p.box('paper',(-.35,-.32,.997),(.3,.3,1.01))
for i in range(5):p.box('ink',(-.25,-.2+i*.08,1.011),(.15-(i%2)*.12,-.19+i*.08,1.013))
p.cylinder('wax',(.24,.23,1.012),.055,.008,seg=8)
p.box('iron',(.07,-.16,1.018),(.11,.3,1.038));p.box('timber',(.05,.28,1.017),(.13,.48,1.055))
p.cylinder('iron',(-.64,.25,1),.13,.035,seg=10);p.cylinder('paper',(-.64,.25,1.03),.05,.2,seg=8)
p.cylinder('glow',(-.64,.25,1.23),.045,.14,seg=5,r2=.005)
objects.append(p.finish(bevel=.008))
p=kit.Piece('hideout_cargo')
for x,y,z,w,d,h in [(-.95,-.65,0,1.1,.9,.75),(.2,-.6,0,.75,.85,1.15),(-.5,.15,.76,.85,.55,.6)]:
 for row in range(4):p.box('door',(x,y,z+row*h/4),(x+w,y+d,z+(row+.94)*h/4))
 for dx in [.05,w-.12]:p.box('iron',(x+dx,y-.018,z),(x+dx+.055,y+.02,z+h))
 p.box('timber',(x,y,z+h),(x+w,y+d,z+h+.045))
 # Marca de guilda raspada, sem afirmar quem contratou os bandidos.
 p.box('paper',(x+w*.35,y-.025,z+h*.35),(x+w*.65,y-.02,z+h*.7))
for x in [-.55,-.1,.35]:p.cylinder('sack',(x,.25,0),.24,.65,seg=8,r2=.18,bulge=.25)
p.box('cloth',(-.85,.35,.45),(.65,.65,.55))
objects.append(p.finish(bevel=.012))
p=kit.Piece('hideout_bedroll')
p.box('sack',(-.44,-.9,.015),(.44,.9,.1));p.box('cloth',(-.4,-.84,.1),(.4,.6,.19))
for y in [-.4,.1]:p.box('cloth',(-.38,y,.19),(.38,y+.035,.205))
p.box('sack',(-.3,.6,.1),(.3,.85,.31));objects.append(p.finish(bevel=.025))
p=kit.Piece('cave_support')
for x in [-6.3,6.05]:
 p.box('timber',(x,-.15,0),(x+.25,.15,3.6));p.box('iron',(x-.025,-.175,.8),(x+.275,.175,.89))
p.box('timber',(-6.4,-.19,3.4),(6.4,.19,3.67))
for x in [-6.2,5.3]:p.beam('timber',(x,0,2.8),(x+.8,0,3.45),(.14,.16))
objects.append(p.finish(bevel=.02))
p=kit.Piece('cave_spire')
for x,y,r,h in [(0,0,.48,1.6),(.32,.15,.24,.8),(-.3,-.15,.22,.65)]:p.cylinder('cave',(x,y,0),r,h,seg=7,r2=.025)
objects.append(p.finish(bevel=.008))
kit.export(objects)
