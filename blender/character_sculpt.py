"""Hand-shaped mesh sections for the reference character style (shared rig in stylized_characters)."""
import math,bpy
import common as c

def mesh(name,verts,faces,mat,bone='chest'):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);return c._fin(obj,mat,bone,False)
def ell(name,loc,scale,mat,bone='chest',seg=10):
 obj=c.sphere(loc,1,sc=scale,m=mat,bone=bone,seg=seg,smooth=False);obj.name=name;return obj
def box(name,loc,size,mat,bone='chest',bevel=.02,rot=(0,0,0)):
 obj=c.box(loc,size,m=mat,bone=bone,rot=rot);obj.name=name
 if bevel:
  bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('Shaped corners','BEVEL');mod.width=bevel;mod.segments=1;bpy.ops.object.modifier_apply(modifier=mod.name)
 return obj
def link(name,a,b,r1,r2,mat,bone):
 obj=c.seg(a,b,r1,r2,mat,bone,sg=8,smooth=False);obj.name=name;return obj

def rings(name,sections,mat,bone='chest',n=12):
 # Sections: z, half-width, front depth, back depth, center y.
 verts=[]
 for z,w,front,back,cy in sections:
  for i in range(n):
   a=math.tau*i/n;co=math.cos(a);verts.append((w*math.sin(a),cy-(front if co>=0 else back)*co,z))
 faces=[tuple(reversed(range(n)))]
 for row in range(len(sections)-1):
  for i in range(n):faces.append((row*n+i,row*n+(i+1)%n,(row+1)*n+(i+1)%n,(row+1)*n+i))
 faces.append(tuple((len(sections)-1)*n+i for i in range(n)))
 return mesh(name,verts,faces,mat,bone)

def apron():
 # Wide curved belly and a separate hanging skirt, rather than a flat rectangle.
 sections=[(1.66,.30,.285),(1.46,.45,.385),(1.23,.52,.435),(.98,.49,.415),(.71,.40,.32)]
 angles=[-1.28,-.91,-.45,0,.45,.91,1.28];verts=[]
 for z,w,depth in sections:
  for a in angles:verts.append((w*math.sin(a),-depth*math.cos(a)-.025,z))
 faces=[]
 for row in range(4):
  for i in range(6):faces.append((row*7+i,row*7+i+1,(row+1)*7+i+1,(row+1)*7+i))
 mesh('Belly-shaped leather apron',verts,[tuple(reversed(f)) for f in faces],'apron')
 for side in [-1,1]:
  link('Wide apron shoulder strap',(side*.33,-.11,1.84),(side*.245,-.305,1.59),.043,.043,'strap','chest')
  ell('Apron rivet',(side*.23,-.32,1.60),(.023,.018,.023),'gold')
  points=[(side*w*math.sin(1.28),-depth*math.cos(1.28)-.036,z) for z,w,depth in sections]
  for a,b in zip(points,points[1:]):link('Apron edge seam',a,b,.012,.012,'strap','chest')
 for i in range(6):link('Worn apron hem',verts[28+i],verts[29+i],.013,.013,'strap','chest')
 box('Apron pocket',(0,-.468,1.21),(.25,.025,.16),'apronlight',bevel=.008)
 mesh('Apron wear patch',[(-.25,-.395,1.4),(-.08,-.43,1.43),(-.13,-.451,1.29),(-.27,-.40,1.27)],[(0,1,2,3)],'apronlight')

def face(elder=False,child=False,bearded=False):
 # Forehead, cheek and jaw are deliberately broad flat planes.
 rings('Sculpted face',[(1.88,.20,.18,.17,.015),(1.99,.29,.285,.23,.015),(2.19,.32,.29,.245,.015),(2.38,.30,.245,.23,.025),(2.48,.21,.16,.15,.035)],'skin','head',12)
 for s in [-1,1]:
  ell('Ear',(s*.325,-.005,2.17),(.068,.065,.105),'skinshade','head',8)
  box('Small dark eye',(s*.125,-.292,2.255),(.048,.025,.044),'eyes','head',.003)
  box('Heavy brow',(s*.125,-.285,2.33),(.14,.04,.044),'hair','head',.008,rot=(0,s*.02,0))
  mesh('Cheek plane',[(s*.20,-.264,2.20),(s*.285,-.195,2.19),(s*.22,-.262,2.07)],[(0,1,2)],'skinshade','head')
 ell('Rounded nose tip',(0,-.385,2.17),(.079,.075,.066),'nose','head',10)
 mesh('Angular nose',[(-.06,-.278,2.265),(.06,-.278,2.265),(-.078,-.385,2.15),(.078,-.385,2.15),(0,-.415,2.18),(0,-.34,2.12)],[(0,1,4),(0,4,2),(1,3,4),(2,4,5),(4,3,5)],'nose','head')
 if bearded:
  ell('Full sculpted jaw beard',(0,-.245,1.985),(.30,.215,.23),'beard','head',12)
  for s in [-1,1]:ell('Bearded cheek and sideburn',(s*.25,-.17,2.145),(.105,.14,.18),'beard','head',10)
  for s in [-1,1]:
   mesh('Moustache',[ (s*.018,-.402,2.15),(s*.14,-.365,2.13),(s*.135,-.395,2.075),(s*.035,-.425,2.09)],[(0,1,2,3)],'hairlight','head')
  box('Mouth opening',(0,-.413,2.065),(.1,.016,.021),'eyes','head',.003)
 else:box('Quiet smile',(0,-.284,2.03),(.09,.022,.018),'skinshade','head',.003)
 if elder:
  for s in [-1,1]:
   link('Silver eyebrow',(s*.06,-.292,2.33),(s*.19,-.274,2.34),.017,.014,'hairlight','head')
   link('Eye crease',(s*.16,-.282,2.22),(s*.23,-.26,2.2),.008,.005,'skinshade','head')


def hair(elder=False,child=False):
 n=14;verts=[]
 for row in range(3):
  for i in range(n):
   a=math.tau*i/n;co=math.cos(a);front=max(0,co);rough=.012*math.sin(i*2.7)
   w=[.338,.35,.19][row];d=[.27,.28,.16][row]
   z=(2.19+.20*front+.035*math.sin(i*2.4)) if row==0 else (2.48+.035*math.sin(i*2.1)) if row==1 else (2.57+rough)
   verts.append((w*math.sin(a),.04-d*co,z))
 faces=[]
 for row in range(2):
  for i in range(n):faces.append((row*n+i,row*n+(i+1)%n,(row+1)*n+(i+1)%n,(row+1)*n+i))
 verts.append((-.04,.04,2.60));top=len(verts)-1
 for i in range(n):faces.append((2*n+i,2*n+(i+1)%n,top))
 obj=mesh('Hand-shaped swept hair',verts,faces,'hair','head');obj.data.materials.append(c.MATS['hairlight'])
 for i,poly in enumerate(obj.data.polygons):
  if i in [3,4,17,18,19,29,30]:poly.material_index=1
 mesh('Swept crown tuft left',[(-.28,-.01,2.47),(-.34,-.02,2.57),(-.15,-.15,2.65),(-.08,-.22,2.53)],[(0,1,2),(0,2,3)],'hairlight','head')
 mesh('Swept crown tuft right',[(.2,-.05,2.53),(.35,-.01,2.54),(.33,.1,2.48),(.1,.06,2.62)],[(0,1,2),(0,2,3)],'hair','head')
 for x,y,z,rx,ry in [(-.22,-.055,2.54,.15,.15),(-.08,-.16,2.55,.14,.13),(.085,-.12,2.555,.14,.14),(.23,.015,2.52,.13,.15)]:
  ell('Overlapping swept hair clump',(x,y,z),(rx,ry,.095),'hairlight' if x<-.12 else 'hair','head',8)
 # A few angled fringe locks create an irregular hairline, not a helmet or beads.
 for x,z,w in [(-.22,2.38,.11),(-.07,2.39,.12),(.1,2.40,.13),(.245,2.37,.08)]:
  mesh('Swept forehead lock',[(x-w*.5,-.225,z+.12),(x+w*.5,-.245,z+.11),(x+w*.25,-.29,z-.035),(x-w*.6,-.25,z+.015)],[(0,1,2),(0,2,3)],'hairlight' if x<-.1 else 'hair','head')
 if elder:
  ell('Silver hair bun',(0,.30,2.39),(.19,.17,.18),'hairlight','head',10)
  for s in [-1,1]:ell('Silver side hair',(s*.29,.05,2.20),(.07,.23,.18),'hair','head',8)
 if child:
  for s in [-1,1]:
   for j in range(4):ell('Braided hair',(s*(.29+.012*(j%2)),.10,2.13-j*.11),(.075,.08,.09),'hair','head',8)
   link('Braid ribbon',(s*.29,.1,1.81),(s*.29,.1,1.77),.077,.077,'cloth','head')


def sleeve(side,s,shoulder,material,strong=False):
 # Puff sleeve with a narrowed elbow and a thick rolled cuff.
 r=.235 if strong else .175;x=s*shoulder
 verts=[];n=10
 for z,xx,yy,rad in [(1.78,x,0,r*.73),(1.64,s*(shoulder+.065),-.015,r),(1.43,s*(shoulder+.115),-.04,r*.96),(1.32,s*(shoulder+.12),-.075,r*.72)]:
  for i in range(n):
   a=math.tau*i/n;verts.append((xx+math.cos(a)*rad,yy+math.sin(a)*rad*.9,z+.017*math.sin(i*2.3)))
 faces=[tuple(reversed(range(n)))]
 for row in range(3):
  for i in range(n):faces.append((row*n+i,row*n+(i+1)%n,(row+1)*n+(i+1)%n,(row+1)*n+i))
 faces.append(tuple(30+i for i in range(n)));mesh('Puffed linen sleeve' if strong else 'Shaped sleeve',verts,[tuple(reversed(f)) for f in faces],material,'arm.'+side)
 if strong:
  link('Rolled linen cuff',(s*(shoulder+.12),-.075,1.37),(s*(shoulder+.12),-.075,1.27),.185,.185,'cuff','arm.'+side)
  mesh('Sleeve folded cloth plane',[(x+s*.11,-.20,1.70),(x+s*.20,-.18,1.60),(x+s*.08,-.22,1.43)],[(0,1,2)],'cuff','arm.'+side)


def gloves_and_legs(strong,hero=False,robed=False):
 for side,s in [('L',1),('R',-1)]:
  shoulder=.52 if strong else .34 if hero else .40
  b=(s*(shoulder+.12),-.075,1.31);w=(s*(shoulder+.1),-.20,1.04)
  link('Forearm',b,w,.145 if strong else .11,.115 if strong else .08,'glove' if strong else 'robe' if hero else 'skin','forearm.'+side)
  ell('Leather mitten' if strong else 'Hand',(w[0],w[1]-.025,1.03),(.16,.13,.155) if strong else (.1,.09,.12),'glove' if strong else 'robe' if hero else 'skin','hand.'+side,8)
  ell('Thumb',(w[0]-s*.11,w[1]-.09,1.09),(.062,.062,.082) if strong else (.04,.04,.06),'glove' if strong else 'robe' if hero else 'skin','hand.'+side,8)
  if strong:link('Glove rolled edge',(b[0],b[1],1.30),(b[0],b[1],1.22),.16,.16,'strap','forearm.'+side)
  if not robed:
   rings('Short heavy trousers',[(.3,.15,.14,.13,-.005),(.55,.18,.17,.16,0),(.94,.20,.20,.18,0)],'trousers','leg.'+side,n=8)
   # Position the trouser vertices around the leg without changing its bone bind.
   obj=c.PARTS[-1]
   for v in obj.data.vertices:v.co.x+=s*.23
  if hero:continue
  if not hero:
   link('Leather boot shaft',(s*.23,0,.22),(s*.23,0,.48),.18 if strong else .14,.165 if strong else .13,'boots','leg.'+side)
  box('Wide boot sole',(s*.23,-.1,.105),(.39 if strong else .29,.57 if strong else .43,.18 if not hero else .1),'boots','leg.'+side,.055 if strong else .035)
  ell('Broad boot toe',(s*.23,-.19,.205),(.215,.29,.16) if strong else (.15,.21,.12),'boots','leg.'+side,8)


def hero_mesh():
 # Twelve long draped panels with subtle folds, a broad hem and no straight tube torso.
 sections=[(.12,.48,.34,.33,0),(.24,.47,.34,.32,0),(.70,.39,.28,.27,0),(1.15,.27,.22,.20,0),(1.46,.33,.24,.24,0),(1.73,.30,.22,.22,0)]
 rings('Draped violet robe',sections,'robe','hips',12)
 # Surface folds are restrained large shapes at actual sprite size.
 mesh('Robe front shadow fold',[(-.12,-.335,.14),(-.04,-.34,.14),(-.06,-.267,.76),(-.12,-.22,1.18)],[(0,1,2,3)],'robeshade','hips')
 mesh('Robe edge light',[(.27,-.285,.16),(.33,-.24,.16),(.19,-.22,1.1),(.12,-.23,1.2)],[(0,1,2,3)],'robebright','hips')
 outer=[(-.28,-.29,1.80),(-.4,-.22,2.11),(-.23,-.20,2.36),(.02,-.12,2.43),(.30,-.18,2.30),(.37,-.28,2.02),(.25,-.30,1.80)]
 inner=[(-.17,-.31,1.82),(-.24,-.32,2.09),(-.13,-.30,2.25),(.02,-.28,2.28),(.17,-.30,2.20),(.23,-.33,2.02),(.15,-.33,1.82)]
 back=[(x*.82,.29,z-.07) for x,y,z in outer];n=len(outer)
 mesh('Sculpted hood shell',outer+back,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]+[tuple(n+i for i in range(n))],'robe','head')
 mesh('Rolled hood edge',outer+inner,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],'robebright','head')
 recess=[(x*.88,-.12,z+.01) for x,y,z in inner]
 mesh('Deep hood lining',inner+recess,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]+[tuple(n+i for i in range(n))],'face','head')
 mesh('Soft folded hood tip',[(-.17,.14,2.33),(.17,.15,2.30),(.08,.46,2.16),(0,.20,2.45)],[(0,1,3),(0,3,2),(1,2,3)],'robe','head')
 for side,s in [('L',1),('R',-1)]:
  sleeve(side,s,.34,'robe');c.cone((s*.45,-.15,1.18),.18,.12,.3,m='robeshade',bone='forearm.'+side,seg=9)
 gloves_and_legs(False,True,True)
 ell('Small staff grip',(-.48,-.245,1.12),(.05,.055,.07),'skin','hand.R',8)
 link('Plain wooden staff',(-.48,-.23,.12),(-.48,-.23,2.24),.033,.027,'wood','staff');ell('Pale staff tip',(-.48,-.23,2.25),(.078,.078,.095),'orb','staff',10)


def sculpt(ident,shoulder):
 strong=ident=='bram';elder=ident=='lysa';child=ident=='tilda';merchant=ident=='merchant';hero=ident=='zephyr'
 if strong:
  import bram_reference
  bram_reference.sculpt();return
 palette={'skin':'#bba675' if strong else '#c9b18b','skinshade':'#a08c62','nose':'#c6b181','linen':'#c8c399','cuff':'#aba87f','apron':'#5a5131','apronlight':'#695f3d','strap':'#483f26','beard':'#494936','glove':'#45402a','trousers':'#4b442e','hair':'#444535' if not elder else '#a3a595','hairlight':'#5d5b43' if not elder else '#c3c2b0','eyes':'#2c2d22','metal':'#626c65','metallight':'#838d82','boots':'#393526','gold':'#a18b46','wood':'#514b3b','cloth':'#72667d' if elder else '#904c37' if child else '#34523b','robe':'#4d079e','robeshade':'#34036d','robebright':'#5f0caf','face':'#190a30','orb':'#d9ddc3'}
 for name,color in palette.items():
  if name in c.MATS:
   mat=c.MATS[name];mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c.hexc(color),1)
  else:c.mat(name,color)
  if name in ['robe','robeshade','robebright']:c.MATS[name]['toon_gain']=1.0
 if hero:hero_mesh();return
 rings('Broad shirt chest and rounded belly',[(.98,.36,.26,.24,0),(1.17,.50 if strong else .38,.39 if strong else .28,.26,0),(1.44,.49 if strong else .39,.355 if strong else .27,.25,0),(1.69,.42 if strong else .36,.275,.23,0),(1.80,.30,.22,.20,0)],'linen' if strong or child else 'cloth',n=12)
 ell('Short neck',(0,0,1.86),(.16,.15,.14),'skin','head')
 face(elder,child,strong or merchant);hair(elder,child)
 for side,s in [('L',1),('R',-1)]:sleeve(side,s,shoulder,'linen' if strong or child else 'cloth',strong)
 gloves_and_legs(strong,False,elder or child)
 if strong:
  apron()
  link('Hammer wooden handle',(-.62,-.28,1.13),(-.69,-.33,.68),.039,.036,'wood','hand.R')
  box('Chamfered iron hammer head',(-.665,-.32,.88),(.33,.24,.24),'metal','hand.R',.04,rot=(0,.16,0))
  box('Hammer polished striking face',(-.83,-.32,.905),(.022,.22,.19),'metallight','hand.R',.009,rot=(0,.16,0))
 elif elder or child:
  rings('Long wool skirt',[(.14,.43 if elder else .37,.31,.29,0),(.6,.39 if elder else .34,.29,.26,0),(1.13,.29,.25,.22,0)],'cloth','hips',12)
  if elder:
   rings('Layered shoulder shawl',[(1.56,.44,.29,.27,0),(1.70,.43,.28,.27,0),(1.85,.23,.18,.18,0)],'cloth',n=12)
   ell('Shawl clasp',(0,-.295,1.67),(.045,.025,.05),'gold')
   link('Elder walking staff',(.51,-.22,.08),(.51,-.22,2.08),.034,.029,'wood','hand.L');ell('Staff grip',(.51,-.22,2.08),(.055,.055,.07),'wood','hand.L')
  else:
   mesh('Cream blouse collar',[(-.24,-.245,1.76),(.24,-.245,1.76),(.16,-.28,1.65),(-.16,-.28,1.65)],[(0,1,2,3)],'linen')
   box('Dress belt',(0,-.28,1.09),(.6,.04,.065),'strap',bevel=.012)
 else:
  rings('Merchant coat tails',[(.75,.37,.27,.27,0),(1.22,.32,.24,.23,0)],'cloth',n=12)
  link('Diagonal satchel strap',(-.28,-.16,1.81),(.27,-.31,1.02),.036,.036,'strap','chest')
  box('Leather satchel',(.28,-.31,.96),(.29,.13,.25),'strap',bevel=.035)
  box('Ledger in left hand',(-.51,-.25,1.04),(.24,.12,.33),'strap','hand.R',.018)
  box('Ledger pages',(-.51,-.318,1.04),(.19,.014,.26),'linen','hand.R',.005)
