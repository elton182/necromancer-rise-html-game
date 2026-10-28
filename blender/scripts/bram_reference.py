"""Bram's reference-specific mesh. Uses the existing village rig and actions."""
import math
import character_sculpt as s
import common as c

def sculpt():
 palette={'skin':'#d5b47a','skinshade':'#b48d58','nose':'#dcbc83','linen':'#e4dab1','cuff':'#d4c89e','apron':'#4d3e29','apronlight':'#59482f','strap':'#403321','beard':'#858277','glove':'#493822','trousers':'#403625','hair':'#44382b','hairlight':'#594837','eyes':'#251f15','metal':'#555658','metallight':'#858586','boots':'#382c1e','gold':'#ad944e','wood':'#80603b'}
 for name,color in palette.items():
  if name in c.MATS:c.MATS[name].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c.hexc(color),1)
  else:c.mat(name,color)
 s.rings('Broad linen shirt',[(.95,.35,.24,.23,0),(1.2,.43,.30,.25,0),(1.55,.45,.28,.24,0),(1.76,.37,.23,.21,0),(1.83,.22,.17,.16,0)],'linen',n=10)
 s.ell('Visible neck',(0,0,1.87),(.16,.145,.15),'skin','head',8)
 # Compact angular face with eyes unobscured by the hairline.
 s.rings('Angular blacksmith face',[(1.98,.17,.17,.15,0),(2.10,.235,.215,.19,0),(2.30,.245,.215,.19,0),(2.41,.20,.18,.17,0)],'skin','head',8)
 for sign in [-1,1]:
  s.ell('Ear',(sign*.25,0,2.20),(.065,.06,.09),'skin','head',8)
  s.box('Deep set eye',(sign*.095,-.218,2.275),(.044,.018,.046),'eyes','head',.002)
  s.box('Angled brow',(sign*.10,-.22,2.325),(.13,.035,.033),'hair','head',.003,rot=(0,sign*-.13,0))
 s.mesh('Chiselled nose',[(-.038,-.22,2.29),(.038,-.22,2.29),(-.045,-.29,2.17),(.045,-.29,2.17),(0,-.32,2.19)],[(0,1,4),(0,4,2),(1,3,4),(2,4,3)],'nose','head')
 s.rings('Faceted grey beard',[(1.92,.105,.13,.11,-.11),(1.98,.18,.17,.14,-.10),(2.10,.215,.18,.13,-.09),(2.18,.19,.14,.11,-.07)],'beard','head',9)
 for sign in [-1,1]:
  s.link('Grey sideburn',(sign*.21,-.07,2.27),(sign*.20,-.16,2.08),.055,.07,'beard','head')
  s.ell('Grey moustache',(sign*.065,-.285,2.145),(.085,.045,.046),'beard','head',6)
 s.box('Mouth',(0,-.285,2.105),(.085,.012,.025),'eyes','head',.002)
 # Swept, irregular chunks with a pointed silhouette rather than a spherical cap.
 s.rings('Angular brown hair',[(2.32,.25,.18,.22,.035),(2.46,.28,.22,.23,.04),(2.56,.18,.15,.15,.035)],'hair','head',9)
 for x,y,z,rx,ry in [(-.18,-.13,2.43,.14,.10),(-.06,-.17,2.47,.15,.11),(.10,-.10,2.50,.14,.12),(.21,.015,2.44,.10,.13),(-.23,.04,2.37,.09,.13)]:
  s.ell('Swept angular hair lock',(x,y,z),(rx,ry,.085),'hairlight' if x<0 else 'hair','head',5)
 for sign in [-1,1]:
  s.mesh('Pointed side hair',[(sign*.22,-.02,2.42),(sign*.32,.02,2.34),(sign*.24,-.08,2.30),(sign*.30,.08,2.23),(sign*.20,.10,2.24)],[(0,1,2),(2,1,3),(2,3,4)],'hair','head')
 # Linen collar opens around the neck.
 for sign in [-1,1]:
  s.mesh('Folded shirt collar',[(sign*.05,-.20,1.88),(sign*.22,-.19,1.83),(sign*.17,-.28,1.68),(sign*.04,-.27,1.76)],[(0,1,2),(0,2,3)],'cuff')
  side='L' if sign==1 else 'R'
  s.sleeve(side,sign,.48,'linen',True)
  s.link('Bare muscular forearm',(sign*.60,-.075,1.31),(sign*.60,-.16,1.07),.145,.115,'skin','forearm.'+side)
  s.link('Dark leather wrist guard',(sign*.60,-.13,1.18),(sign*.60,-.18,.98),.13,.115,'strap','forearm.'+side)
  s.ell('Exposed broad hand',(sign*.60,-.18,.92),(.13,.11,.14),'skin','hand.'+side,7)
  s.ell('Exposed thumb',(sign*.51,-.25,.96),(.06,.06,.075),'skin','hand.'+side,6)
  s.link('Trouser leg',(sign*.21,0,.16),(sign*.21,0,.82),.145,.17,'trousers','leg.'+side)
  s.box('Heavy boot',(sign*.23,-.09,.10),(.35,.46,.17),'boots','leg.'+side,.045)
  s.box('Boot upper',(sign*.23,-.045,.27),(.27,.31,.21),'boots','leg.'+side,.035)
 # Continuous leather skirt, gently flared and triangulated for broad worn facets.
 sections=[(.48,.40,.26,.23,0),(.93,.36,.28,.23,0),(1.16,.39,.32,.24,0),(1.48,.39,.355,.26,0),(1.68,.31,.32,.24,0)]
 apron=s.rings('Long leather apron',sections,'apron',n=10)
 import bpy
 bpy.context.view_layer.objects.active=apron
 mod=apron.modifiers.new('Leather triangular panels','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=mod.name)
 apron.data.materials.append(c.MATS['apronlight'])
 for i,p in enumerate(apron.data.polygons):p.material_index=1 if i%7 in [1,3] else 0
 s.rings('Leather waist belt',[(1.06,.403,.335,.25,0),(1.135,.405,.335,.25,0)],'strap',n=10)
 for sign in [-1,1]:
  s.link('Broad shoulder strap',(sign*.28,-.10,1.84),(sign*.27,-.29,1.47),.047,.047,'strap','chest')
  for z in [1.48,1.66]:s.ell('Brass apron rivet',(sign*.27,-.31,z),(.025,.018,.025),'gold','chest',8)
 # Horizontal wooden grip through the hand, deep vertical iron striking block.
 s.link('Hammer ash handle',(-.93,-.23,.91),(-.33,-.23,.91),.042,.037,'wood','hand.R')
 s.box('Large vertical forged hammer',(-.39,-.23,.82),(.25,.26,.49),'metal','hand.R',.035,rot=(0,.14,0))
 s.box('Bright hammer bevel',(-.39,-.23,1.065),(.22,.23,.025),'metallight','hand.R',.012,rot=(0,.14,0))
