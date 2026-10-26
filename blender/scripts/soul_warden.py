"""Carcereiro das Almas: original rigged boss, seven reusable actions."""
import sys, os, math
import bpy
HERE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for _folder in ('models', 'exports', 'frames', 'spritesheets', 'previews'):
    os.makedirs(os.path.join(HERE, _folder), exist_ok=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C
from common import *
reset_scene();sc=bpy.context.scene
bone('root',(0,0,0),(0,0,.15))
bone('hips',(0,0,1.05),(0,0,1.3),'root')
bone('chest',(0,0,1.3),(0,0,1.95),'hips')
bone('head',(0,-.04,1.95),(0,-.04,2.4),'chest')
for s,x in [('L',-.52),('R',.52)]:
 elbow=(-.65,-.08,1.42) if s=='L' else (x,0,1.35)
 grip=(-.8,-.48,1.12) if s=='L' else (x,-.08,1.05)
 bone('arm'+s,(x,0,1.85),elbow,'chest')
 bone('hand'+s,elbow,grip,'arm'+s)
 bone('leg'+s,(x*.46,0,1.12),(x*.46,0,.63),'hips')
 bone('shin'+s,(x*.46,0,.63),(x*.46,0,.16),'leg'+s)
bone('cage',(0,.34,1.65),(0,.34,2.3),'chest')
bone('hammer',(-.8,-.54,1.12),(-.8,-.54,.5),'handL')
build_rig()
mat('iron','#75818b',metal=.65);mat('edge','#b1abb0',metal=.6)
mat('shade','#424b59');mat('bone','#f1e5c4');mat('cloth','#69445f')
mat('gold','#bc935a',metal=.7);mat('soul','#eeac69',emit='#ffb35f',es=2)
mat('haft','#765241');mat('wrap','#cfaa77')
# Wide plated torso, split tabard, exposed bone joints.
seg((0,0,1.14),(0,0,1.85),.32,.48,'iron','chest',8)
box((0,-.315,1.62),(.52,.09,.45),'shade','chest')
for z in [1.42,1.58,1.74]:
 box((0,-.37,z),(.43,.035,.055),'gold','chest')
sphere((0,-.395,1.66),.105,sc=(1,.45,1.2),m='soul',bone='chest',seg=10)
box((0,0,1.14),(.72,.48,.18),'gold','hips')
for x in [-.23,.23]:
 cone((x,-.19,.85),.22,.16,.56,'cloth','hips',seg=4,sc=(1,.5,1))
for s,x in [('L',-.52),('R',.52)]:
 sphere((x,0,1.91),.285,sc=(1.15,1,.65),m='iron',bone='arm'+s,seg=8,smooth=False)
 for off in [-.12,.12]:cone((x+off,0,2.16),.07,0,.27,'bone','arm'+s,seg=6)
 if s=='L':
  # Bent elbow, narrow wrist and fingers around a visibly separate wooden haft.
  seg((x,0,1.8),(-.65,-.08,1.47),.13,.09,'shade','armL')
  sphere((-.65,-.08,1.42),.105,m='bone',bone='armL',seg=8)
  seg((-.67,-.13,1.38),(-.78,-.41,1.17),.125,.075,'iron','handL')
  sphere((-.8,-.47,1.12),.10,sc=(1,.7,1),m='shade',bone='handL',seg=8)
  for z in [1.055,1.105,1.155]:
   seg((-.88,-.50,z),(-.86,-.60,z),.028,.025,'bone','handL',6)
   seg((-.86,-.60,z),(-.76,-.60,z),.025,.02,'bone','handL',6)
  seg((-.72,-.48,1.18),(-.72,-.56,1.11),.035,.028,'bone','handL',6)
 else:
  seg((x,0,1.8),(x,0,1.4),.15,.11,'shade','arm'+s)
  sphere((x,0,1.35),.115,m='bone',bone='arm'+s,seg=8)
  seg((x,0,1.32),(x,-.05,1.09),.17,.12,'iron','hand'+s)
  sphere((x,-.05,1.05),.13,m='bone',bone='hand'+s,seg=8)
 xx=x*.46
 seg((xx,0,1.1),(xx,0,.65),.16,.13,'shade','leg'+s)
 sphere((xx,-.07,.63),.16,m='bone',bone='shin'+s,seg=8)
 seg((xx,0,.58),(xx,0,.18),.15,.12,'iron','shin'+s)
 box((xx,-.12,.13),(.31,.48,.23),'iron','shin'+s)
 box((xx,-.21,.25),(.25,.22,.055),'gold','shin'+s)
# Skull, jaw, sockets and a broken crown; faces toward -Y.
sphere((0,-.04,2.21),.245,sc=(.88,.84,1.08),m='bone',bone='head',seg=12,smooth=False)
box((0,-.16,2.025),(.29,.18,.13),'bone','head')
for x in [-.095,.095]:
 sphere((x,-.218,2.24),.083,sc=(1,.35,.8),m='shade',bone='head',seg=8)
 sphere((x,-.242,2.24),.039,sc=(1,.4,.8),m='soul',bone='head',seg=8)
for x in [-.085,0,.085]:box((x,-.26,2.05),(.045,.025,.065),'shade','head')
torus((0,-.04,2.38),.21,.038,'gold','head')
for i in range(5):
 a=i*tau/5;cone((.2*cos(a),-.04+.2*sin(a),2.52),.055,.008,.25 if i%2 else .34,'gold','head',seg=5)
# Upright execution hammer: head above the grip, short pommel below it.
seg((-.8,-.54,.84),(-.8,-.54,1.75),.04,.04,'haft','hammer')
for z in [.90,1.03,1.10,1.17,1.24,1.54]:
 torus((-.8,-.54,z),.042,.012,'wrap','hammer')
box((-.8,-.54,1.75),(.76,.38,.36),'iron','hammer')
for x in [-1.15,-.45]:box((x,-.54,1.75),(.09,.43,.41),'gold','hammer')
sphere((-.8,-.745,1.75),.105,sc=(1,.35,1),m='soul',bone='hammer',seg=8)
# Open cage on the back, with three captive flame souls.
for z in [1.68,2.35]:torus((0,.46,z),.29,.045,'gold','cage')
for i in range(8):
 a=i*tau/8;x=.29*cos(a);y=.46+.29*sin(a)
 seg((x,y,1.68),(x*.7,.46+(y-.46)*.7,2.35),.024,.024,'iron','cage')
for x,z in [(-.11,1.96),(.11,2.08),(0,2.23)]:
 sphere((x,.46,z),.09,sc=(.8,.8,1.4),m='soul',bone='cage',seg=8)
 cone((x,.46,z+.13),.055,0,.17,'soul','cage',seg=6)
# Right hand is empty; no dangling chain or held accessory.
finish('Carcereiro das Almas');init_anim(sc)
def idle(t):
 R('chest',.025*sin(t*tau));R('head',0,0,.06*sin(t*tau));R('cage',0,.05*sin(t*tau),0)
def walk(t):
 for s,k in [('L',1),('R',-1)]:
  R('leg'+s,.45*sin(t*tau)*k);R('shin'+s,.25*max(0,-sin(t*tau)*k));R('arm'+s,-.2*sin(t*tau)*k)
 C.PB['root'].location.y=.035*sin(t*tau*2);R('chest',.06)
def windup(t):
 R('armL',-1.45*t,0,-.18*t);R('handL',-.25*t);R('hammer',-1.1*t);R('chest',-.16*t);R('head',.2*t)
def attack(t):
 k=1-min(1,t*2.5);R('armL',-1.45*k+.6*(1-k),0,-.18*k);R('chest',-.16*k+.28*(1-k));R('handL',-.25*k);R('hammer',-1.1*k)
def cast(t):
 k=sin(math.pi*t);R('armR',-1.5*k,0,.35*k);R('head',-.2*k);R('cage',0,0,.12*sin(t*tau));R('armL',-.3*k)
def recover(t):
 R('chest',.28*(1-t));R('armL',.6*(1-t));R('head',.15*(1-t))
def death(t):
 R('root',0,0,1.4*t);C.PB['root'].location.y=.15*t;R('head',.4*t);R('armL',.6*t);R('armR',-.8*t)
bake_loop('idle',24,idle);bake_loop('walk',24,walk);bake_once('windup',24,windup)
bake_once('attack',24,attack);bake_once('cast',24,cast);bake_once('recover',24,recover);bake_once('death',32,death)
sc.frame_set(1);export(os.path.join(HERE,'models'),'boss_soulWarden',sc)
import combat_toon
combat_toon.save_editable(sc,os.path.join(HERE, 'models', 'boss_soulWarden.blend'))
print('Soul Warden exported: mesh, rig, seven actions',flush=True)
