"""Original war-priest: hood, ivory stole, sun staff and six rigged actions."""
import os, sys, math
import bpy
HERE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import common as C
from common import *
reset_scene(); sc=bpy.context.scene
bone('root',(0,0,0),(0,0,.12))
bone('hips',(0,0,.65),(0,0,.95),'root')
bone('chest',(0,0,.95),(0,0,1.43),'hips')
bone('head',(0,0,1.43),(0,0,1.8),'chest')
for side,s in [('L',1),('R',-1)]:
    bone('arm'+side,(s*.25,0,1.35),(s*.39,0,1.04),'chest')
    bone('hand'+side,(s*.39,0,1.04),(s*.4,-.14,.87),'arm'+side)
    bone('leg'+side,(s*.15,0,.65),(s*.15,0,.12),'hips')
build_rig()
mat('robe','#9a4543'); mat('fold','#694950'); mat('ivory','#ead7ad')
mat('gold','#d5a45a'); mat('skin','#c2a484'); mat('dark','#414451')
mat('fire','#ffce7b',emit='#ffbd61',es=1.1)
cone((0,0,.57),.36,.22,.96,'robe','hips',seg=10,sc=(1,.75,1))
sphere((0,0,1.18),.29,(1,.7,1.05),'robe','chest',10,False)
box((0,-.196,1.18),(.25,.035,.5),'ivory','chest')
box((0,-.25,.57),(.22,.04,.65),'ivory','hips')
box((0,-.28,.31),(.23,.03,.065),'gold','hips')
box((0,-.225,1.2),(.14,.025,.04),'gold','chest')
box((0,-.225,1.2),(.04,.025,.21),'gold','chest')
sphere((0,.01,1.65),.23,(1,.85,1.2),'robe','head',10,False)
sphere((0,-.158,1.64),.158,(.87,.4,1.05),'dark','head',10,False)
sphere((0,-.211,1.61),.11,(.85,.38,1.05),'skin','head',10,False)
for s in [-1,1]:
    seg((s*.16,-.15,1.49),(s*.18,-.12,1.72),.035,.04,'gold','head')
    seg((s*.18,-.12,1.72),(0,-.12,1.89),.04,.025,'gold','head')
    sphere((s*.04,-.255,1.65),.018,(1,.5,.6),'fire','head',8,False)
    side='L' if s==1 else 'R'
    seg((s*.25,0,1.35),(s*.39,0,1.04),.135,.095,'robe','arm'+side)
    seg((s*.39,0,1.04),(s*.4,-.14,.87),.095,.075,'ivory','hand'+side)
    sphere((s*.4,-.14,.87),.075,m='skin',bone='hand'+side,seg=8)
    box((s*.15,-.07,.1),(.19,.3,.18),'dark','leg'+side)
    sphere((s*.24,0,1.38),.12,(1,.85,.6),'gold','chest',8,False)
# Staff passes through the left palm, with a large open sun symbol above it.
seg((.4,-.14,.15),(.4,-.14,1.84),.025,.025,'dark','handL')
for z in [.55,.87,1.55]:sphere((.4,-.14,z),.041,m='gold',bone='handL',seg=8)
torus((.4,-.14,1.92),.15,.028,'gold','handL',rot=(math.pi/2,0,0))
sphere((.4,-.14,1.92),.065,m='fire',bone='handL',seg=8,smooth=False)
for i in range(8):
    a=i*math.tau/8
    seg((.4+math.cos(a)*.17,-.14,1.92+math.sin(a)*.17),
        (.4+math.cos(a)*.23,-.14,1.92+math.sin(a)*.23),.025,.005,'gold','handL',5)
# A short pennant makes the support silhouette readable from behind too.
box((.48,-.11,1.53),(.19,.025,.3),'robe','handL')
box((.48,-.13,1.53),(.04,.018,.18),'ivory','handL')
finish('Mob_warAcolyte');init_anim(sc)
def idle(t):
    R('chest',.025*math.sin(t*math.tau));R('head',0,0,.06*math.sin(t*math.tau))
    R('armR',-.2,0,.16);R('handR',-.35)
def walk(t):
    idle(t);p=t*math.tau
    for side,s in [('L',1),('R',-1)]:R('leg'+side,.3*math.sin(p)*s)
    R('hips',0,0,.04*math.sin(p));C.PB['hips'].location=(0,.018*math.cos(p*2),0)
def attack(t):
    idle(0);p=math.sin(t*math.pi)
    R('chest',.18*p,0,-.3*p);R('armL',-.85*p,0,-.18*p);R('handL',.4*p)
def windup(t):
    idle(0);R('armL',-.7*t,0,-.18*t);R('handL',.4*t)
    R('armR',-1.35*t,0,.42*t);R('handR',-.3);R('head',-.15*t)
def channel(t):
    windup(1);R('armR',-1.35+.08*math.sin(t*math.tau),0,.42)
    R('chest',-.04+.025*math.sin(t*math.tau));R('head',-.15)
def death(t):
    e=min(1,t/.85);e=e*e*(3-2*e)
    R('root',1.4*e,0,0);C.PB['root'].location=(0,-.03*e,0)
    R('head',.4*e);R('armL',.35*e,0,-.45*e);R('armR',0,0,.7*e)
bake_loop('idle',25,idle);bake_loop('walk',25,walk)
bake_once('attack',18,attack);bake_once('windup',25,windup)
bake_loop('channel',25,channel);bake_once('death',30,death)
sc.frame_set(1);export(os.path.join(HERE,'models'),'mob_warAcolyte',sc)
import combat_toon
combat_toon.save_editable(sc,os.path.join(HERE,'models','mob_warAcolyte.blend'))
