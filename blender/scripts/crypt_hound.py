"""Reproducible quadruped, rig and seven actions. Run with Blender --background --python."""
import sys, os, math
import bpy
HERE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for _folder in ('models', 'exports', 'frames', 'spritesheets', 'previews'):
    os.makedirs(os.path.join(HERE, _folder), exist_ok=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C
from common import *
reset_scene();sc=bpy.context.scene
bone('root',(0,0,0),(0,0,.16))
bone('hips',(0,.48,.73),(0,.3,.82),'root')
bone('chest',(0,-.1,.83),(0,-.5,.95),'hips')
bone('head',(0,-.61,1),(0,-1.02,1.04),'chest')
bone('jaw',(0,-.69,.94),(0,-1.08,.87),'head')
bone('tail',(0,.67,.78),(0,1.15,.84),'hips')
for side,x in [('L',-.24),('R',.24)]:
 for end,y in [('front',-.42),('back',.48)]:
  bone(end+side,(x,y,.8),(x,y+.12,.4),'chest' if end=='front' else 'hips')
  bone(end+'shin'+side,(x,y+.12,.4),(x,y,.13),end+side)
build_rig()
mat('bone','#e4d6b3',gain=1.2);mat('leather','#887461',gain=1.2)
mat('shade','#514c46');mat('eye','#efb65d',emit='#efb65d',es=1.6)
sphere((0,.43,.76),.29,sc=(.85,1.05,.9),m='leather',bone='hips',smooth=False)
sphere((0,-.27,.89),.3,sc=(.85,1.2,1),m='shade',bone='chest',smooth=False)
# Ivory ribs exposed against a muted torso, with a continuous spine.
for y in [-.38,-.20,-.02,.16]:
 torus((0,y,.84),.255,.038,m='bone',bone='chest',sc=(1,1,1.06),rot=(math.pi/2,0,0))
seg((0,.48,1),(0,-.53,1.12),.055,.07,'bone','chest')
for y in [-.32,-.08,.16,.4]:sphere((0,y,1.065),.065,m='bone',bone='chest',seg=8)
sphere((0,-.72,1.04),.24,sc=(.9,1.2,.95),m='bone',bone='head',smooth=False)
box((0,-1.0,.99),(.3,.32,.18),m='bone',bone='head')
box((0,-1.01,.87),(.28,.32,.075),m='leather',bone='jaw')
box((0,-1.18,.99),(.18,.045,.1),m='shade',bone='head')
for x in [-.17,.17]:
 sphere((x,-.84,1.09),.064,sc=(.5,1,1),m='shade',bone='head',seg=8)
 sphere((x*1.05,-.865,1.105),.033,m='eye',bone='head',seg=8)
 cone((x,-.61,1.29),.09,.008,.28,m='leather',bone='head',rot=(.25,0,x),seg=5)
 for y in [-1.11,-.95]:cone((x*.65,y,.886),.036,0,.14,m='bone',bone='head',rot=(math.pi,0,0),seg=5)
for side,x in [('L',-.24),('R',.24)]:
 for end,y in [('front',-.42),('back',.48)]:
  seg((x,y,.81),(x,y+.12,.4),.08,.055,'leather',end+side)
  sphere((x,y+.12,.4),.07,m='bone',bone=end+side,seg=8)
  seg((x,y+.12,.4),(x,y,.13),.043,.03,'bone',end+'shin'+side)
  sphere((x,y-.07,.1),.09,sc=(1,1.5,.65),m='leather',bone=end+'shin'+side,seg=8)
  for off in [-.045,0,.045]:seg((x+off,y-.12,.1),(x+off,y-.21,.065),.022,.002,'bone',end+'shin'+side,5)
seg((0,.66,.79),(0,1.18,.85),.065,.012,'bone','tail')
finish('Crypt Hound');init_anim(sc)
def idle(t):
 R('chest',.025*math.sin(t*tau));R('head',0,0,.045*math.sin(t*tau));R('tail',0,0,.1*math.sin(t*tau))
def walk(t):
 for side,s in [('L',1),('R',-1)]:
  R('front'+side,.55*math.sin(t*tau)*s);R('back'+side,-.6*math.sin(t*tau)*s)
  R('frontshin'+side,.3*max(0,math.sin(t*tau)*s));R('backshin'+side,.3*max(0,-math.sin(t*tau)*s))
 C.PB['root'].location.y=.05*math.sin(t*tau*2);R('head',-.07);R('tail',0,0,.12*math.sin(t*tau))
def attack(t):
 pulse=math.sin(t*math.pi);R('head',-.28*pulse);R('jaw',-.65*pulse);R('chest',.12*pulse)
def windup(t):
 R('chest',-.16*t);R('head',.22*t);R('jaw',-.3*t);R('frontL',-.24*t);R('frontR',-.24*t)
def charge(t):
 walk(t);R('head',.15);R('jaw',-.42);R('chest',.08)
def recover(t):
 R('head',.25*(1-t));R('chest',-.1*(1-t));R('jaw',-.25*(1-t))
def death(t):
 # Bone-local Y is vertical: roll around local Z to fall onto the side.
 R('root',0,0,1.4*t);C.PB['root'].location.y=.18*t;R('head',-.3*t);R('jaw',-.3*t)
bake_loop('idle',24,idle);bake_loop('walk',18,walk);bake_once('attack',18,attack)
bake_once('windup',18,windup);bake_loop('charge',12,charge);bake_once('recover',24,recover);bake_once('death',24,death)
sc.frame_set(1);export(os.path.join(HERE,'models'),'mob_cryptHound',sc)
import combat_toon
combat_toon.save_editable(sc,os.path.join(HERE, 'models', 'mob_cryptHound.blend'))
print('Crypt Hound model, rig and actions exported',flush=True)
