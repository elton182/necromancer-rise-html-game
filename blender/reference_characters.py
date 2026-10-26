"""Reference cast: editable meshes, UVs, skeletal GLB and game-camera animation atlases.
Blender -b -t 4 --python blender/reference_characters.py -- --only=bram,zephyr,skeleton [--preview]
Enemy proposals are optional visual assets, never new combat types.
"""
import bpy,math,sys,json
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
import common as c
import character_sculpt as s
import stylized_characters as original
OUT=HERE/'reference';OUT.mkdir(exist_ok=True)
IDS=['bram','zephyr','skeleton','archer','skeleton_mage','raider','corrupted','shadow_wolf']

def palette():
 for n,h in {'bone':'#eee2b5','joint':'#c4b68e','socket':'#283b37','soul':'#8ff2df','teal':'#3d6468','tealdark':'#284347','wood':'#655035','woodlight':'#8b7047','iron':'#727779','edge':'#a6abad','leather':'#53422e','gold':'#ac934c','purple':'#850bdf','crystal':'#8d32cf','dark':'#24212b','wine':'#703d3a','rust':'#644a3e','fur':'#36333d','furlight':'#4c4653','amber':'#edb648'}.items():
  c.mat(n,h,rough=.9,emit=h if n in ['soul','crystal','amber'] else None,es=.7 if n in ['soul','crystal','amber'] else 0)

def crystal(loc,size,mat,bone):
 x,y,z=loc;r=size*.35
 v=[(x+r*math.sin(i*math.tau/5),y+r*math.cos(i*math.tau/5),z) for i in range(5)]+[(x,y,z+size*.65),(x,y,z-size*.45)]
 return s.mesh('Faceted magic crystal',v,[(i,(i+1)%5,5) for i in range(5)]+[((i+1)%5,i,6) for i in range(5)],mat,bone)

def humanoid_rig():
 c.bone('root',(0,0,0),(0,0,.15));c.bone('hips',(0,0,.92),(0,0,1.13),'root');c.bone('chest',(0,0,1.13),(0,0,1.65),'hips');c.bone('head',(0,0,1.65),(0,0,2.1),'chest')
 for side,x in [('L',1),('R',-1)]:
  c.bone('arm.'+side,(x*.31,0,1.58),(x*.39,-.015,1.26),'chest');c.bone('forearm.'+side,(x*.39,-.015,1.26),(x*.42,-.12,1.00),'arm.'+side);c.bone('hand.'+side,(x*.42,-.12,1.00),(x*.42,-.17,.89),'forearm.'+side)
  c.bone('leg.'+side,(x*.16,0,.94),(x*.17,0,.52),'hips');c.bone('shin.'+side,(x*.17,0,.52),(x*.18,0,.13),'leg.'+side);c.bone('foot.'+side,(x*.18,0,.13),(x*.18,-.19,.07),'shin.'+side)
 c.build_rig()

def skull():
 s.rings('Angular ivory cranium',[(1.76,.15,.13,.14,0),(1.88,.23,.19,.18,0),(2.12,.22,.17,.18,0),(2.23,.12,.1,.11,0)],'bone','head',10)
 # Dark inset planes stay readable from the elevated camera; cheek rims give depth.
 for x in [-.095,.095]:
  s.box('Deep orbital socket',(x,-.181,2.015),(.126,.046,.125),'socket','head',.017,rot=(0,0,x*.7))
  s.box('Turquoise eye',(x,-.209,2.01),(.045,.015,.056),'soul','head',.005)
  s.link('Cheekbone',(x*1.7,-.15,1.95),(x*1.1,-.19,1.89),.045,.035,'bone','head')
 s.mesh('Nasal opening',[(-.026,-.198,1.95),(.026,-.198,1.95),(0,-.205,1.902)],[(0,1,2)],'socket','head')
 s.box('Separate jaw',(0,-.08,1.795),(.30,.24,.09),'bone','head',.025)
 s.box('Mouth recess',(0,-.185,1.85),(.22,.02,.045),'socket','head',.005)
 for i in range(5):s.box('Readable upper teeth',((i-2)*.041,-.203,1.866),(.030,.034,.065),'bone','head',.005)

def skeleton_body():
 skull();s.link('Cervical vertebrae',(0,.015,1.57),(0,0,1.79),.045,.05,'joint','head')
 s.rings('Pelvic girdle',[(.89,.19,.11,.13,0),(1.02,.22,.13,.14,0),(1.09,.13,.09,.1,0)],'joint','hips',8)
 s.link('Spinal column',(0,.09,1.04),(0,.08,1.65),.04,.037,'joint','chest')
 for j,z in enumerate([1.18,1.28,1.39,1.5]):
  r=[.16,.21,.23,.22][j]
  for sign in [-1,1]:
   pts=[(sign*r*math.sin(a),.025-r*.65*math.cos(a),z+.055*math.sin(a)) for a in [0,.55,1.1,1.8,2.5,math.pi]]
   for a,b in zip(pts,pts[1:]):s.link('Individual curved rib',a,b,.025,.022,'bone','chest')
 s.link('Sternum',(0,-.125,1.18),(0,-.13,1.56),.028,.03,'bone','chest')
 for side,sign in [('L',1),('R',-1)]:
  s.link('Clavicle',(0,-.03,1.61),(sign*.30,0,1.58),.032,.034,'bone','chest')
  s.ell('Shoulder articulation',(sign*.31,0,1.58),(.065,.066,.07),'joint','arm.'+side,8)
  for label,a,b,r1,r2,bone in [('Humerus',(sign*.31,0,1.58),(sign*.39,-.015,1.27),.044,.034,'arm.'+side),('Radius',(sign*.38,-.028,1.25),(sign*.40,-.14,1.01),.024,.02,'forearm.'+side),('Ulna',(sign*.415,.006,1.25),(sign*.44,-.10,1.01),.023,.019,'forearm.'+side),('Femur',(sign*.16,0,.94),(sign*.17,0,.53),.055,.038,'leg.'+side),('Tibia',(sign*.17,0,.5),(sign*.18,0,.13),.037,.026,'shin.'+side)]:s.link(label,a,b,r1,r2,'bone',bone)
  s.ell('Elbow',(sign*.39,-.015,1.26),(.055,.055,.055),'joint','forearm.'+side,8);s.ell('Kneecap',(sign*.17,-.025,.52),(.055,.055,.057),'bone','shin.'+side,8)
  s.box('Palm',(sign*.42,-.12,.98),(.09,.07,.13),'bone','hand.'+side,.015)
  for i in [-1,0,1]:s.link('Curled finger',(sign*.42+i*.028,-.15,.98),(sign*.42+i*.028,-.19,.91),.016,.013,'bone','hand.'+side)
  s.box('Broad skeletal foot',(sign*.18,-.085,.065),(.16,.31,.09),'bone','foot.'+side,.02)
  for i in [-1,0,1]:s.box('Toe',(sign*.18+i*.04,-.235,.055),(.036,.07,.065),'joint','foot.'+side,.006)
 s.rings('Teal waist wrap',[(.86,.24,.15,.16,0),(1.05,.23,.15,.15,0)],'tealdark','hips',10)
 for x,z in [(-.13,.57),(.08,.68),(.22,.74)]:s.mesh('Hanging teal cloth panel',[(x-.08,-.17,1),(x+.08,-.17,1),(x+.065,-.19,z),(x-.07,-.19,z-.04)],[(0,1,2,3)],'teal','hips')

def sword(curved=False):
 first=len(c.PARTS);x=-.42;y=-.19
 s.link('Leather sword grip',(x,y,.88),(x,y,1.12),.037,.037,'leather','hand.R')
 s.box('Sword guard',(x,y,1.12),(.23,.075,.055),'gold','hand.R',.012)
 verts=[(x-.065,y,1.15),(x+.065,y,1.15),(x+.065+(.18 if curved else 0),y,1.68),(x+(.25 if curved else 0),y,1.85),(x-.065+(.1 if curved else 0),y,1.67),(x,y-.045,1.44)]
 s.mesh('Forged blade with central ridge',verts,[(0,1,5),(1,2,5),(2,3,5),(3,4,5),(4,0,5),(0,4,3,2,1)],'iron','hand.R')

 # Tilt the finished blade away from the body; keep its pivot in the gripping hand.
 angle=-.40
 for part in c.PARTS[first:]:
  for vertex in part.data.vertices:
   dx=vertex.co.x-x;dz=vertex.co.z-.99;vertex.co.x=x+dx*math.cos(angle)+dz*math.sin(angle);vertex.co.z=.99-dx*math.sin(angle)+dz*math.cos(angle)

def shield():
 x=.48;y=-.21;z=1.08;n=12;v=[(x+.30*math.sin(i*math.tau/n),y,z+.35*math.cos(i*math.tau/n)) for i in range(n)]+[(x,y-.05,z)]
 obj=s.mesh('Round wooden shield',v,[(i,(i+1)%n,n) for i in range(n)],'wood','hand.L');obj.data.materials.append(c.MATS['woodlight'])
 for i,p in enumerate(obj.data.polygons):p.material_index=i%2
 for i in range(n):s.link('Iron shield rim',v[i],v[(i+1)%n],.025,.025,'iron','hand.L')
 s.ell('Shield boss',(x,y-.075,z),(.09,.045,.10),'iron','hand.L',8)

def bow():
 pts=[(.42+(.25*math.sin(t*math.pi)), -.17, .56+t*1.05) for t in [0,.16,.33,.5,.67,.84,1]]
 for a,b in zip(pts,pts[1:]):s.link('Shaped wooden bow limb',a,b,.028,.021,'wood','hand.L')
 s.link('Bowstring',pts[0],pts[-1],.006,.006,'joint','hand.L')
 s.link('Held arrow',(-.42,-.19,1.02),(.61,-.19,1.02),.012,.009,'woodlight','hand.R')
 s.link('Leather quiver',(-.20,.19,1.05),(-.27,.22,1.66),.09,.11,'leather','chest')
 for i in range(3):
  x=-.33+i*.06;s.link('Quivered arrow',(x,.22,1.42),(x,.22,1.95+i*.04),.008,.008,'woodlight','chest');s.mesh('Broad arrow fletching',[(x-.045,.22,1.88),(x,.22,2.01),(x+.045,.22,1.91),(x,.22,1.82)],[(0,1,2,3)],'teal','chest')
 s.link('Quiver strap',(-.24,.03,1.6),(.22,-.17,1.03),.027,.027,'leather','chest')

def mage():
 # Open hood rim around the same skull, with an actual recessed opening.
 outer=[(-.32,-.21,1.82),(-.36,-.14,2.15),(-.16,-.10,2.37),(.06,-.05,2.41),(.32,-.13,2.2),(.32,-.21,1.82)]
 back=[(x*.9,.25,z-.03) for x,y,z in outer];n=len(outer)
 s.mesh('Teal angular hood',outer+back,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]+[tuple(n+i for i in range(n))],'teal','head')
 s.rings('Layered teal shoulder mantle',[(1.53,.42,.22,.22,0),(1.78,.24,.18,.18,0)],'teal','chest',10)
 for sign in [-1,1]:s.mesh('Long split mantle',[(sign*.20,.10,1.58),(sign*.32,.10,1.5),(sign*.33,.21,.41),(sign*.18,.23,.5)],[(0,1,2,3)],'tealdark','hips')
 s.link('Mage staff',(-.43,-.18,.06),(-.43,-.18,2.21),.035,.025,'wood','hand.R');crystal((-.43,-.18,2.3),.40,'soul','hand.R')
 for sign in [-1,1]:s.link('Crystal fork',(-.43,-.18,2.12),(-.43+sign*.11,-.18,2.32),.035,.025,'wood','hand.R')

def humanoid_actions(kind):
 sc=bpy.context.scene;c.init_anim(sc)
 def idle(t):c.R('chest',x=.018*math.sin(math.tau*t));c.R('head',z=.025*math.sin(math.tau*t))
 def walk(t):
  p=t*math.tau;c.R('chest',z=.035*math.sin(p));c.PB['hips'].location.y=.018*abs(math.sin(p))
  for side,phase in [('L',0),('R',math.pi)]:
   c.R('leg.'+side,x=.48*math.sin(p+phase));c.R('shin.'+side,x=max(0,-math.sin(p+phase))*.6);c.R('foot.'+side,x=-.12*math.sin(p+phase));c.R('arm.'+side,x=-.22*math.sin(p+phase))
 def attack(t):
  v=math.sin(math.pi*t)**2
  if kind=='archer':c.R('arm.L',x=-1.2*v,z=-.3*v);c.R('arm.R',x=-1.15*v,z=.45*v);c.R('forearm.R',x=-1.15*v);c.R('chest',z=.3*v)
  elif kind=='skeleton_mage':c.R('arm.R',x=-.3*v);c.R('arm.L',x=-1.2*v);c.R('forearm.L',x=-.4*v);c.R('chest',x=-.13*v)
  else:c.R('arm.R',x=-1.7*math.sin(math.pi*t),z=.25*v);c.R('forearm.R',x=-.4*v);c.R('chest',z=-.35*math.sin(math.tau*t))
 def hurt(t):v=math.sin(math.pi*t);c.R('chest',x=-.23*v);c.R('head',x=-.19*v)
 def death(t):
  v=t*t*(3-2*t);c.R('root',x=1.48*v);c.R('chest',x=.2*v);c.R('arm.L',z=-.4*v);c.R('arm.R',z=.4*v)
 def spawn(t):
  v=1-t;c.PB['root'].location.y=-1.4*v;c.R('chest',x=.5*v);c.R('head',x=.35*v);c.R('leg.L',x=-.4*v);c.R('shin.L',x=.8*v)
 for name,n,fn,loop in [('idle',4,idle,True),('walk',6,walk,True),('attack',6,attack,False),('hurt',3,hurt,False),('death',6,death,False),('spawn',6,spawn,False)]:
  (c.bake_loop if loop else c.bake_once)(name,n,fn)
 if kind in ['skeleton','archer','skeleton_mage']:
  import combat_animation_clips
  combat_animation_clips.minion(kind)
  return [('idle',4,5,True),('walk',6,10,True),('attack',8,20,False),('hurt',3,12,False),('death',6,10,False),('spawn',6,10,False)]
 return [('idle',4,5,True),('walk',6,10,True),('attack',6,14,False),('hurt',3,12,False),('death',6,10,False),('spawn',6,10,False)]

def improve_original(ident):
 sc,arm,body=original.build(ident)
 # Add real knees and foot pivots to the original two leg chains.
 bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
 for side,sign in [('L',1),('R',-1)]:
  upper=arm.data.edit_bones['leg.'+side];upper.tail=(sign*.20,0,.54)
  lower=arm.data.edit_bones.new('shin.'+side);lower.head=upper.tail;lower.tail=(sign*.20,0,.16);lower.parent=upper
  foot=arm.data.edit_bones.new('foot.'+side);foot.head=lower.tail;foot.tail=(sign*.20,-.18,.08);foot.parent=lower
 bpy.ops.object.mode_set(mode='OBJECT');c.PB=arm.pose.bones
 for side in ['L','R']:
  group=body.vertex_groups.get('leg.'+side)
  if group is None:continue
  lower=body.vertex_groups.new(name='shin.'+side);foot=body.vertex_groups.new(name='foot.'+side)
  for vertex in body.data.vertices:
   if any(g.group==group.index for g in vertex.groups) and vertex.co.z<.54:
    group.remove([vertex.index]);(foot if vertex.co.z<.25 else lower).add([vertex.index],1,'REPLACE')
 # Remove the old pale staff tip, replace it with the reference's wooden fork/crystal.
 if ident=='zephyr':
  import bmesh
  bm=bmesh.new();bm.from_mesh(body.data);slots=[i for i,m in enumerate(body.data.materials) if m.name=='orb'];bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index in slots],context='FACES');bm.to_mesh(body.data);bm.free()
  c.PARTS=[];c.mat('reference_crystal','#be75ff',emit='#bd71ff',es=.75);c.mat('reference_eyes','#d4a0ff',emit='#d4a0ff',es=.8)
  crystal((-.48,-.23,2.40),.42,'reference_crystal','staff')
  for sign in [-1,1]:s.link('Wooden crystal cradle',(-.48,-.23,2.12),(-.48+sign*.12,-.23,2.4),.037,.025,'wood','staff')
  for x in [-.085,.085]:s.ell('Luminous lilac eye',(x,-.255,2.08),(.027,.025,.036),'reference_eyes','head',8)
  for sign in [-1,1]:
   s.mesh('Angular violet shoulder cape',[(sign*.12,-.20,1.80),(sign*.36,-.22,1.75),(sign*.60,-.19,1.40),(sign*.25,-.29,1.47),(sign*.34,.18,1.72),(sign*.56,.16,1.40)],[(0,1,2,3),(1,4,5,2),(3,2,5)],'robe','chest')
  s.rings('Leather belt',[(1.01,.30,.245,.23,0),(1.12,.30,.245,.23,0)],'strap','hips',12)
  s.box('Belt buckle',(0,-.257,1.07),(.13,.04,.13),'gold','hips',.015,rot=(0,math.pi/4,0))
  s.mesh('Dark inner robe panel',[(-.11,-.351,.13),(.13,-.351,.13),(.09,-.246,1.01),(-.08,-.246,1.01)],[(0,1,2,3)],'robeshade','hips')
  # Actual boots below the split hem; bone-attached, with no gameplay scale change.
  for sign,side in [(1,'L'),(-1,'R')]:s.box('Visible protagonist boot',(sign*.20,-.18,.065),(.25,.40,.13),'boots','foot.'+side,.025)
  extra=c.finish('Zephyr_reference_accessories');bpy.ops.object.select_all(action='DESELECT');extra.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=body;bpy.ops.object.join()
  # Black-violet gloves instead of exposing skin or bright robe-colored hands.
  dark_index=next(i for i,m in enumerate(body.data.materials) if m.name=='robeshade')
  hand_indices={body.vertex_groups[n].index for n in ['hand.L','hand.R']}
  for poly in body.data.polygons:
   if all(any(g.group in hand_indices for g in body.data.vertices[v].groups) for v in poly.vertices):poly.material_index=dark_index
  for material in body.data.materials:
   if material.name in ['robe','robebright','robeshade','face']:
    h={'robe':'#6506c6','robebright':'#830ae5','robeshade':'#24152f','face':'#10091b'}[material.name];material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c.hexc(h),1)
  import zephyr_materials
  zephyr_materials.apply(body)
  def summon(t):
   v=math.sin(math.pi*t)**2;c.R('arm.L',x=-1.3*v,z=-.45*v);c.R('arm.R',x=-.45*v);c.R('forearm.L',x=-.6*v);c.R('staff',x=-.14*v);c.R('cape',x=.2*v)
  def hurt(t):v=math.sin(math.pi*t);c.R('chest',x=-.2*v);c.R('head',x=-.12*v)
  c.bake_once('summon',6,summon);c.bake_once('hurt',3,hurt)
  def walk(t):
   p=t*math.tau;c.R('chest',z=.04*math.sin(p));c.R('cape',x=.1+.06*math.sin(p))
   for side,phase in [('L',0),('R',math.pi)]:
    c.R('leg.'+side,x=.36*math.sin(p+phase));c.R('shin.'+side,x=.45*max(0,-math.sin(p+phase)));c.R('foot.'+side,x=-.08*math.sin(p+phase))
   c.R('arm.L',x=-.3*math.sin(p));c.R('arm.R',x=.08*math.sin(p))
  bpy.data.actions.remove(bpy.data.actions['walk'])
  c.bake_loop('walk',6,walk)
  import combat_animation_clips
  anims=combat_animation_clips.zephyr()
 else:
  def hammer(t):
   v=math.sin(math.pi*t)**2;c.R('arm.R',x=-1.25*v);c.R('forearm.R',x=-.8*v);c.R('chest',x=.12*math.sin(math.pi*t));c.R('head',x=.12)
  c.bake_loop('hammer',8,hammer);anims=[('idle',4,5,True),('greet',4,6,True),('hammer',4,8,True)]
 return sc,arm,body,anims

def enemy_body(kind):
 # Proposed cosmetics share the humanoid rig, never ENEMY_TYPES or combat rules.
 s.rings('Tailored torso',[(.95,.23,.16,.15,0),(1.35,.34,.22,.19,0),(1.64,.32,.20,.19,0)],'iron' if kind=='corrupted' else 'leather','chest',10)
 for side,sign in [('L',1),('R',-1)]:
  for a,b,bone,r in [((sign*.31,0,1.57),(sign*.39,-.015,1.26),'arm.'+side,.105),((sign*.39,-.015,1.26),(sign*.42,-.12,1.0),'forearm.'+side,.095),((sign*.16,0,.94),(sign*.17,0,.52),'leg.'+side,.14),((sign*.17,0,.52),(sign*.18,0,.13),'shin.'+side,.11)]:s.link('Segmented armor' if kind=='corrupted' else 'Leather clothing',a,b,r,r*.85,'iron' if kind=='corrupted' else 'leather',bone)
  s.box('Gloved hand',(sign*.42,-.12,.96),(.14,.12,.17),'dark','hand.'+side,.025);s.box('Heavy boot',(sign*.18,-.10,.09),(.23,.36,.18),'dark','foot.'+side,.035)
  s.ell('Layered shoulder plate',(sign*.34,0,1.57),(.22,.25,.17),'iron' if kind=='corrupted' else 'leather','arm.'+side,8)
 s.rings('Burgundy tabard',[(.74,.25,.18,.16,0),(1.08,.26,.19,.17,0)],'wine','hips',8)
 s.rings('Belt',[(.95,.28,.21,.20,0),(1.04,.28,.21,.20,0)],'leather','hips',8);s.box('Buckle',(0,-.225,1),(.13,.05,.12),'gold','hips',.012)
 if kind=='raider':
  # Peaked hood with thickness and an actual recessed human face.
  outer=[(-.26,-.20,1.77),(-.30,-.14,2.07),(-.11,-.07,2.31),(.11,-.02,2.28),(.28,-.15,2.05),(.24,-.21,1.77)]
  inner=[(-.15,-.225,1.82),(-.19,-.23,2.04),(-.07,-.20,2.16),(.09,-.20,2.14),(.18,-.23,2.03),(.14,-.23,1.82)]
  back=[(x*.85,.21,z-.04) for x,y,z in outer];n=len(outer)
  s.mesh('Wine hood shell',outer+back,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]+[tuple(n+i for i in range(n))],'wine','head')
  s.mesh('Thick angular hood rim',outer+inner,[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],'wine','head')
  c.mat('raider_skin','#bc9a68');s.rings('Partially covered human face',[(1.82,.14,.13,.13,0),(2.11,.17,.18,.14,0),(2.17,.12,.13,.12,0)],'raider_skin','head',8)
  for x in [-.067,.067]:
   s.box('Watchful dark eye',(x,-.19,2.045),(.043,.018,.030),'dark','head',.005)
   s.box('Angled eyebrow',(x,-.19,2.09),(.075,.025,.025),'leather','head',.004,rot=(0,x,0))
  s.box('Wrapped lower face scarf',(0,-.185,1.92),(.29,.09,.17),'leather','head',.025)
  s.rings('Broad hood mantle',[(1.52,.39,.23,.22,0),(1.79,.25,.20,.19,0)],'wine','chest',8)
  for sign in [-1,1]:
   s.mesh('Crossed leather band',[(sign*.28,-.237,1.55),(sign*.36,-.23,1.46),(-sign*.19,-.24,1.08),(-sign*.27,-.23,1.15)],[(0,1,2,3)],'wood','chest')
   s.ell('Bent elbow guard',(sign*.39,-.015,1.26),(.12,.12,.10),'leather','forearm.'+('L' if sign>0 else 'R'),8)
   s.link('Exposed rolled-sleeve forearm',(sign*.39,-.015,1.29),(sign*.41,-.07,1.17),.087,.079,'raider_skin','forearm.'+('L' if sign>0 else 'R'))
   s.box('Tall boot cuff',(sign*.18,0,.33),(.25,.23,.19),'wood','shin.'+('L' if sign>0 else 'R'),.025)
  sword(True)
 else:
  s.rings('Faceted iron helmet',[(1.73,.22,.18,.17,0),(1.99,.26,.23,.20,0),(2.22,.18,.17,.16,0),(2.28,.07,.07,.08,0)],'iron','head',10)
  s.box('Visor shadow',(0,-.233,1.98),(.34,.05,.09),'dark','head',.01)
  for x in [-.08,.08]:s.box('Amber eye',(x,-.263,1.99),(.07,.015,.027),'amber','head',.005)
  for x in [-.15,0,.15]:s.box('Helmet face guard',(x,-.25,1.85),(.055,.045,.23),'iron','head',.01)
  s.link('Axe haft',(-.42,-.15,.57),(-.42,-.15,1.64),.04,.035,'wood','hand.R')
  s.mesh('Broad worn axe head',[(-.46,-.15,1.57),(-.74,-.15,1.71),(-.87,-.15,1.37),(-.48,-.15,1.29),(-.65,-.21,1.48)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(0,3,2,1)],'iron','hand.R')
  for x,z in [(-.21,1.4),(.20,1.53),(-.67,1.51)]:s.box('Restrained rust wear',(x,-.225,z),(.07,.012,.06),'rust','chest' if x>-.3 else 'hand.R',.005)
  s.mesh('Burgundy chest cloth',[(-.24,-.235,1.63),(.24,-.235,1.63),(.19,-.245,1.30),(0,-.25,1.19),(-.19,-.245,1.30)],[(0,1,2,3,4)],'wine','chest')
  for side,sign in [('L',1),('R',-1)]:
   s.box('Raised layered pauldron',(sign*.35,-.05,1.62),(.35,.39,.19),'iron','arm.'+side,.045,rot=(0,sign*.34,0))
   s.box('Angular armored vambrace',(sign*.41,-.08,1.14),(.24,.23,.23),'iron','forearm.'+side,.035)
   s.box('Heavy knee plate',(sign*.17,-.09,.53),(.23,.13,.22),'iron','shin.'+side,.035)
   s.box('Raised shin plate',(sign*.18,-.085,.31),(.22,.12,.28),'iron','shin.'+side,.035)
   s.mesh('Articulated thigh tasset',[(sign*.03,-.19,.96),(sign*.30,-.17,.96),(sign*.28,-.23,.65),(sign*.12,-.24,.64)],[(0,1,2,3)],'iron','leg.'+side)
   s.box('Chamfered armored toe',(sign*.18,-.17,.11),(.26,.37,.19),'iron','foot.'+side,.045)
  for part in c.PARTS:
   for vertex in part.data.vertices:vertex.co.x*=1.16
  bpy.context.view_layer.objects.active=c.ARM;bpy.ops.object.mode_set(mode='EDIT')
  for bone in c.ARM.data.edit_bones:bone.head.x*=1.16;bone.tail.x*=1.16
  bpy.ops.object.mode_set(mode='OBJECT');c.PB=c.ARM.pose.bones


def wolf():
 c.bone('root',(0,0,0),(0,0,.15));c.bone('hips',(0,.45,.78),(0,.2,.85),'root');c.bone('chest',(0,-.05,.88),(0,-.45,1.05),'hips');c.bone('head',(0,-.52,1.1),(0,-.95,1.02),'chest');c.bone('jaw',(0,-.65,.95),(0,-1.02,.88),'head');c.bone('tail',(0,.65,.82),(0,1.16,.62),'hips')
 for side,x in [('L',-.25),('R',.25)]:
  for end,y in [('front',-.39),('back',.48)]:
   c.bone(end+side,(x,y,.88),(x,y+.13,.40),'chest' if end=='front' else 'hips');c.bone(end+'shin'+side,(x,y+.13,.4),(x,y,.12),end+side)
 c.build_rig()
 s.ell('Lean wolf rump',(0,.40,.78),(.28,.44,.31),'fur','hips',10);s.ell('Angular chest',(0,-.20,.93),(.33,.53,.38),'furlight','chest',10)
 s.ell('Wedge wolf skull',(0,-.68,1.10),(.24,.34,.23),'fur','head',8);s.link('Tapered muzzle',(0,-.77,1.08),(0,-1.1,.96),.17,.11,'furlight','head');s.box('Black nose',(0,-1.13,.98),(.17,.09,.10),'dark','head',.015);s.link('Lower jaw',(0,-.73,.94),(0,-1.07,.89),.11,.07,'fur','jaw')
 for sign in [-1,1]:
  s.mesh('Pointed ear',[(sign*.10,-.58,1.22),(sign*.25,-.58,1.23),(sign*.24,-.49,1.57),(sign*.18,-.42,1.22)],[(0,1,2),(1,3,2),(3,0,2),(0,3,1)],'fur','head');s.ell('Amber wolf eye',(sign*.19,-.83,1.15),(.039,.029,.03),'amber','head',8)
 for j,y in enumerate([-.37,-.08,.22,.46]):
  crystal(((-1)**j*.10,y,1.27 if j<2 else 1.09),.38 if j==1 else .28,'crystal','chest' if j<3 else 'hips')
  for sign in [-1,1]:s.mesh('Large faceted mane tuft',[(sign*.13,y-.1,1.15),(sign*.32,y,1.05),(sign*.29,y+.15,1.34),(sign*.08,y+.15,1.16)],[(0,1,2),(0,2,3),(3,2,1)],'fur','chest')
 for side,x in [('L',-.25),('R',.25)]:
  for end,y in [('front',-.39),('back',.48)]:
   s.link('Wolf upper limb',(x,y,.88),(x,y+.13,.4),.14 if end=='back' else .12,.075,'fur',end+side);s.link('Wolf lower limb',(x,y+.13,.4),(x,y,.12),.06,.045,'furlight',end+'shin'+side);s.box('Grounded wolf paw',(x,y-.08,.065),(.17,.26,.13),'fur',end+'shin'+side,.025)
 s.link('Long wolf tail',(0,.64,.84),(0,1.18,.56),.13,.055,'fur','tail');crystal((0,1.14,.57),.19,'crystal','tail')
 body=c.finish('Shadow_wolf');sc=bpy.context.scene;c.init_anim(sc)
 def idle(t):c.R('chest',x=.025*math.sin(t*math.tau));c.R('tail',z=.1*math.sin(t*math.tau))
 def walk(t):
  for side,sign in [('L',1),('R',-1)]:
   for end,factor in [('front',1),('back',-1)]:c.R(end+side,x=.5*math.sin(t*math.tau)*sign*factor);c.R(end+'shin'+side,x=.35*max(0,math.sin(t*math.tau)*sign*factor))
 def attack(t):v=math.sin(math.pi*t);c.R('head',x=-.3*v);c.R('jaw',x=-.6*v);c.R('chest',x=.1*v)
 def death(t):c.R('root',z=1.48*t);c.R('head',x=-.3*t)
 def hurt(t):c.R('chest',z=.15*math.sin(math.pi*t))
 def spawn(t):c.PB['root'].location.y=-.7*(1-t)
 def windup(t):c.R('chest',x=-.16*t);c.R('head',x=.22*t)
 def recover(t):c.R('head',x=.22*(1-t))
 actions=[('idle',4,5,True,idle),('walk',6,12,True,walk),('attack',6,16,False,attack),('hurt',3,12,False,hurt),('death',6,10,False,death),('spawn',6,10,False,spawn),('windup',4,8,False,windup),('charge',6,16,True,walk),('recover',4,8,False,recover)]
 for name,n,fps,loop,fn in actions:(c.bake_loop if loop else c.bake_once)(name,n,fn)
 return sc,c.ARM,body,[a[:4] for a in actions]

def build(ident):
 if ident in ['bram','zephyr']:return improve_original(ident)
 c.reset_scene();palette()
 if ident=='shadow_wolf':return wolf()
 humanoid_rig()
 if ident=='corrupted':
  c.MATS['iron'].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c.hexc('#484648'),1)
 if ident in ['skeleton','archer','skeleton_mage']:
  skeleton_body()
  if ident=='skeleton':sword();shield()
  elif ident=='archer':bow()
  else:mage()
 else:enemy_body(ident)
 body=c.finish('Reference_'+ident)
 return bpy.context.scene,c.ARM,body,humanoid_actions(ident)

def produce(ident,preview=False):
 sc,arm,body,anims=build(ident);arm.rotation_euler=(0,0,0);arm.animation_data.action=bpy.data.actions['idle'];sc.frame_set(1)
 # Deterministic UVs for every vertex, including accessories; materials remain editable.
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.025);bpy.ops.object.mode_set(mode='OBJECT')
 arm.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/(ident+'.glb')),export_format='GLB',use_selection=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True)
 sc.render.engine='CYCLES';sc.cycles.samples=1;sc.cycles.use_denoising=False;sc.render.film_transparent=True;sc.view_settings.view_transform='Standard';sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
 bpy.ops.object.camera_add();cam=bpy.context.object;sc.camera=cam;cam.data.type='ORTHO'
 cell=320 if ident=='zephyr' else 256;ppu=49;anchor=212 if ident=='zephyr' else 180;cam.data.ortho_scale=cell/ppu;p=math.radians(32);forward=Vector((0,math.cos(p),-math.sin(p)));target=Vector((0,math.sin(p),math.cos(p)))*(anchor-cell/2)/ppu;cam.location=target-forward*12;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 sc.render.resolution_x=sc.render.resolution_y=(768 if preview else cell);sc.render.resolution_percentage=100
 # Save PBR source before the render-only toon conversion.
 if ident!='zephyr':bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(ident+'.blend')))
 import toon
 if ident=='bram':
  # Studio lighting preserves the broad planar shading of the supplied reference.
  sc.cycles.samples=32;sc.cycles.use_denoising=False
  if sc.world is None:sc.world=bpy.data.worlds.new('Bram studio')
  sc.world.use_nodes=True;sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.62,.56,1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=.55
  bpy.ops.object.light_add(type='AREA',location=(-3,-4,7));key=bpy.context.object;key.data.energy=450;key.data.shape='DISK';key.data.size=4
  key.rotation_euler=(Vector((0,0,1.2))-key.location).to_track_quat('-Z','Y').to_euler()
 elif ident=='zephyr':
  import zephyr_materials
  zephyr_materials.studio(sc)
 else:toon.toonify(sc,light=(-.5,-.65,.9),bands=(.65,.84,1),thick=.5)
 sc.render.use_freestyle=False
 if ident=='zephyr':
  # F12 reproduces the default three-quarter idle master with the final studio.
  arm.rotation_euler.z=math.radians(45);sc.frame_set(1)
  sc.render.filepath='//frames_zephyr/01_00.png'
  bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'zephyr.blend'))
 folder=OUT/('frames_'+ident);folder.mkdir(exist_ok=True)
 meta={'cell':cell,'ppu':ppu,'anchorX':cell//2,'anchorY':anchor,'dirs':8,'anims':{}}
 manifest={'id':ident,'vertices':len(body.data.vertices),'triangles':sum(len(p.vertices)-2 for p in body.data.polygons),'bones':len(arm.data.bones),'uvLayers':len(body.data.uv_layers),'actions':[a[0] for a in anims],'origin':'feet','up':'Z in Blender; Y in GLB','rig':'quadruped' if ident=='shadow_wolf' else 'humanoid','weights':'Rigid anatomical sections; articulated joints. No automatic heat weights.'}
 (OUT/(ident+'_model.json')).write_text(json.dumps(manifest,indent=2))
 for ai,(name,n,fps,loop) in enumerate(anims):
  action=bpy.data.actions[name];arm.animation_data.action=action;meta['anims'][name]={'n':n,'fps':fps,'loop':loop,'row':ai*8}
  # Original clips have more keys; sample the entire action rather than truncating it.
  start,end=action.frame_range
  for di in range(8):
   arm.rotation_euler.z=math.radians(90-di*45)
   for fi in range(n):
    if preview and (ai!=0 or di not in [1,2,3] or fi!=0):continue
    t=fi/n if loop else fi/max(1,n-1);frame=start+t*(end-start);sc.frame_set(int(frame),subframe=frame-int(frame));sc.render.filepath=str(folder/f'{ai*8+di:02}_{fi:02}.png');bpy.ops.render.render(write_still=True)
  print('REFERENCE_ACTION',ident,name,flush=True)
 (OUT/(ident+'_render.json')).write_text(json.dumps(meta,separators=(',',':')))
 print('REFERENCE_DONE',ident,flush=True)

if __name__=='__main__':
 selected=next((a.split('=',1)[1].split(',') for a in sys.argv if a.startswith('--only=')),IDS)
 for ident in selected:
  if ident not in IDS:raise ValueError(ident)
  produce(ident,'--preview' in sys.argv)
