# Zumbi e Esqueleto — modelos low-poly + esqueleto + animações (idle, walk, attack, death)
# Uso: OUT_DIR=out python3 mob.py zombie|skeleton
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, math
from mathutils import Vector
import common as C
from common import *
KIND = sys.argv[1] if len(sys.argv)>1 else 'zombie'
OUT = os.environ.get('OUT_DIR', os.path.dirname(os.path.abspath(__file__)))
reset_scene(); sc=bpy.context.scene

def rig():
    bone('root',(0,0,0),(0,0,.12))
    bone('hips',(0,0,.92),(0,0,1.06),'root'); bone('spine',(0,0,1.06),(0,0,1.26),'hips'); bone('chest',(0,0,1.26),(0,0,1.46),'spine')
    bone('neck',(0,0,1.46),(0,0,1.55),'chest'); bone('head',(0,0,1.55),(0,0,1.8),'neck')
    for s,sx in (('L',1),('R',-1)):
        bone(f'shoulder.{s}',(0,0,1.4),(sx*.2,0,1.4),'chest')
        bone(f'arm.{s}',(sx*.2,0,1.4),(sx*.22,0,1.12),f'shoulder.{s}')
        bone(f'forearm.{s}',(sx*.22,0,1.12),(sx*.22,0,.86),f'arm.{s}')
        bone(f'hand.{s}',(sx*.22,0,.86),(sx*.22,0,.74),f'forearm.{s}')
        bone(f'thigh.{s}',(sx*.09,0,.92),(sx*.09,0,.5),'hips'); bone(f'shin.{s}',(sx*.09,0,.5),(sx*.09,0,.1),f'thigh.{s}')
        bone(f'foot.{s}',(sx*.09,0,.1),(sx*.09,-.14,.04),f'shin.{s}')
    if KIND=='skeleton': bone('weapon',(-.22,0,.8),(-.22,-.7,.8),'hand.R')
rig(); build_rig()

if KIND=='zombie':
    mat('skin','#78a65a',.9,gain=1.25); mat('skin2','#5d8a45',.9,gain=1.2); mat('cloth','#5a4632',.95,gain=1.5); mat('pants','#47473a',.95,gain=1.5)
    mat('boot','#2a1a10',.9); mat('bone','#e6dcc0',.7,gain=1.1); mat('dark','#07030d',1); mat('blood','#6a1010',.8,gain=1.4); mat('eye','#e8e060',.4,emit='#e8e060',es=2.0)
    mat('hair','#2a3a1c',.95)
    # pernas (calça rasgada + botas)
    for s,sx in (('L',1),('R',-1)):
        seg((sx*.09,0,.92),(sx*.09,0,.52),.095,.075,'pants',f'thigh.{s}',9); sphere((sx*.09,0,.5),.075,m='pants',bone=f'thigh.{s}',seg=8)
        seg((sx*.09,0,.5),(sx*.09,0,.17),.07,.06,'pants' if s=='L' else 'skin2',f'shin.{s}',9)
        box((sx*.09,-.07,.065),(.115,.27,.12),'boot',f'foot.{s}')
    box((0,0,.95),(.3,.2,.16),'pants','hips')
    # tronco curvado + camisa rasgada
    seg((0,0,1.0),(0,-.01,1.28),.2,.22,'cloth','spine',10,True); seg((0,-.01,1.26),(0,-.02,1.46),.23,.2,'cloth','chest',10,True)
    for i in range(5):
        a=math.radians(-80+i*40); box((math.sin(a)*.2,-math.cos(a)*.17+.0,.97),(.07,.012,.17),'cloth','hips',rot=(0,0,-a))   # tiras da barra
    # ferida com costelas expostas
    box((.1,-.205,1.28),(.1,.02,.13),'blood','chest')
    for i in range(3): box((.1,-.218,1.23+i*.04),(.085,.012,.012),'bone','chest')
    # ombros e braços (verdes, estendidos animados depois)
    for s,sx in (('L',1),('R',-1)):
        sphere((sx*.21,0,1.4),.085,m='cloth' if s=='L' else 'skin',bone=f'shoulder.{s}',seg=10)
        seg((sx*.21,0,1.4),(sx*.22,0,1.13),.063,.052,'skin',f'arm.{s}',8,True); sphere((sx*.22,0,1.12),.055,m='skin2',bone=f'arm.{s}',seg=8)
        seg((sx*.22,0,1.12),(sx*.22,0,.88),.052,.042,'skin2',f'forearm.{s}',8,True)
        sphere((sx*.22,0,.82),.058,(1,1,1.2),'skin',f'hand.{s}',8)
        for k in (-1,0,1): seg((sx*.22+k*.025,0,.8),(sx*.22+k*.03,-.012,.7),.016,.004,'bone',f'hand.{s}',5)   # garras
    # pescoço, cabeça
    seg((0,0,1.46),(0,-.02,1.56),.06,.055,'skin','neck',8)
    sphere((0,-.03,1.64),.115,(.95,1.0,1.05),'skin','head',12)
    sphere((0,-.05,1.69),.118,(.96,1.0,.7),'hair','head',10)  # cabelo ralo
    box((0,-.085,1.555),(.1,.075,.04),'skin2','head')           # mandíbula caída
    box((0,-.118,1.575),(.06,.01,.015),'dark','head')           # boca aberta
    for dx in (-.045,.045):
        sphere((dx,-.115,1.665),.032,(1,.55,1.2),'dark','head',8); sphere((dx,-.128,1.665),.016,(1,.6,1),'eye','head',6)
    sphere((0,-.13,1.62),.014,(1,.5,1.5),'dark','head',6)
    sphere((-.1,-.07,1.7),.03,(1,1,1),'blood','head',6)
else:
    mat('bone','#e6dcc0',.7,gain=1.0); mat('bone2','#bfb596',.8,gain=1.0); mat('dark','#07030d',1); mat('eye','#ff3322',.3,emit='#ff3322',es=3.0)
    mat('steel','#8a919c',.4,gain=1.2); mat('wood','#3a2414',.85,gain=1.3); mat('cloth','#4a3040',.95,gain=1.4)
    # pélvis e coluna
    box((0,0,.95),(.26,.14,.12),'bone2','hips'); sphere((0,0,.9),.08,(1.6,1,.85),'bone2','hips',8)
    seg((0,.03,.97),(0,.04,1.5),.04,.04,'bone2','spine',8)
    cone((0,0,1.27),.15,.19,.34,'dark','spine',seg=10,sc=(1,.75,1))          # interior escuro do tórax
    for i,z in enumerate((1.12,1.2,1.28,1.36,1.43)):
        r=.12+.035*(1-abs(i-2)/2.0); torus((0,0,z),r,.03,'bone','spine' if z<1.26 else 'chest',sc=(1,.8,1))
    box((0,-.115,1.28),(.05,.025,.26),'bone','chest')   # esterno
    for s,sx in (('L',1),('R',-1)): seg((0,-.01,1.45),(sx*.2,0,1.4),.028,.026,'bone','chest',6)
    # cabeça: caveira
    seg((0,.02,1.46),(0,.02,1.56),.035,.035,'bone2','neck',6)
    sphere((0,-.02,1.66),.125,(.95,1.0,1.02),'bone','head',12)
    box((0,-.065,1.57),(.11,.085,.055),'bone','head')
    for k in range(5): box((-.04+k*.02,-.108,1.57),(.009,.014,.04),'dark','head')
    for dx in (-.048,.048):
        sphere((dx,-.1,1.67),.04,(1,.55,1.2),'dark','head',8); sphere((dx,-.114,1.67),.022,(1,.6,1),'eye','head',6)
    box((0,-.118,1.625),(.02,.014,.036),'dark','head')
    # braços
    for s,sx in (('L',1),('R',-1)):
        sphere((sx*.2,0,1.4),.06,m='bone',bone=f'shoulder.{s}',seg=8)
        seg((sx*.2,0,1.4),(sx*.22,0,1.13),.045,.038,'bone',f'arm.{s}',7); sphere((sx*.22,0,1.12),.052,m='bone',bone=f'arm.{s}',seg=8)
        seg((sx*.22,0,1.12),(sx*.22,0,.88),.038,.032,'bone',f'forearm.{s}',7)
        box((sx*.22,-.0,.8),(.075,.045,.12),'bone2',f'hand.{s}')
    # pernas
    for s,sx in (('L',1),('R',-1)):
        seg((sx*.09,0,.92),(sx*.09,0,.52),.055,.045,'bone',f'thigh.{s}',7); sphere((sx*.09,0,.5),.058,m='bone',bone=f'thigh.{s}',seg=8)
        seg((sx*.09,0,.5),(sx*.09,0,.12),.045,.04,'bone',f'shin.{s}',7)
        box((sx*.09,-.06,.05),(.09,.22,.08),'bone2',f'foot.{s}')
    box((0,-.115,.87),(.2,.02,.22),'cloth','hips'); box((0,.115,.87),(.2,.02,.18),'cloth','hips')
    # espada na mão direita (osso 'weapon')
    box((-.22,.02,.8),(.05,.2,.05),'wood','weapon')
    box((-.22,-.1,.8),(.04,.045,.2),'steel','weapon')
    box((-.22,-.5,.8),(.028,.74,.085),'steel','weapon')
    box((-.22,-.9,.8),(.022,.07,.05),'steel','weapon')
    sphere((-.22,.13,.8),.035,m='steel',bone='weapon',seg=6)
body=finish('Mob_'+KIND)

# ───────── animações ─────────
init_anim(sc)
Z = KIND=='zombie'
def idle(t):
    p=tau*t
    C.PB['hips'].location=(0,.008*sin(p),0); R('chest',-.03*sin(p+.4)); R('head',.03*sin(p-.6),0,.05*sin(p*.5))
    if Z:
        R('spine',-.28); R('chest',-.12-.03*sin(p)); R('head',.2+.03*sin(p),0,.1*sin(p*.5)); R('neck',.05)
        R('arm.L',-1.25+.05*sin(p),0,-.12); R('arm.R',-1.15+.05*sin(p+1),0,.12); R('forearm.L',-.35); R('forearm.R',-.4); R('hand.L',-.15); R('hand.R',.1)
        R('thigh.L',.1); R('thigh.R',-.05)
    else:
        R('arm.L',0,0,-.05+.03*sin(p)); R('arm.R',-.35,0,.08); R('forearm.R',-.7); R('forearm.L',-.1); R('weapon',0); R('spine',-.04); R('head',.05*sin(p-.6),0,.08*sin(p*.5))
def walk(t):
    p=tau*t; s=sin(p); c=cos(p)
    C.PB['hips'].location=(0,-.03*abs(c)+.01,0); R('hips',0,0,.07*s)
    for sd,ph in (('L',0),('R',math.pi)):
        q=sin(p+ph); R(f'thigh.{sd}',-.62*q); R(f'shin.{sd}',max(0,.95*sin(p+ph+1.0))+.05); R(f'foot.{sd}',.28*q-.1*max(0,sin(p+ph+1)))
    if Z:
        R('spine',-.3,0,-.05*s); R('chest',-.1,0,-.08*s); R('head',.22+.04*c,0,.1*s); R('neck',.05)
        R('arm.L',-1.3+.12*s,0,-.1); R('arm.R',-1.2-.12*s,0,.1); R('forearm.L',-.35); R('forearm.R',-.4); C.PB['hips'].location=(0,-.04*abs(c)+.01,0)
    else:
        R('spine',-.05,0,-.06*s); R('chest',-.02,0,-.06*s); R('head',0,0,.05*s)
        R('arm.L',.6*sin(p+math.pi),0,-.05); R('forearm.L',-.2-.2*max(0,sin(p+math.pi))); R('arm.R',-.35+.1*s,0,.08); R('forearm.R',-.7); R('weapon',0)
def attack(t):  # one-shot
    if Z:
        up=min(1,t/.35) if t<.35 else None
        if t<.35: e=sin(up*math.pi/2); lean=-.28+.5*e; ar=-1.25-.35*e
        elif t<.55: k=(t-.35)/.2; e=1-k; lean=-.28+.5*e-.25*k; ar=-1.25-.35*e+.6*k*0   # golpe: braços descem à frente
        else: k=(t-.55)/.45; e=0; lean=-.28-.25*(1-k); ar=-1.25
        if t<.35: R('spine',lean); R('chest',-.1+.35*e); R('head',.2-.3*e)
        elif t<.55: k=(t-.35)/.2; R('spine',-.28-.45*k+.22*(1-k)); R('chest',-.45*k+.25*(1-k)); R('head',.2+.2*k)
        else: k=(t-.55)/.45; R('spine',-.73+.45*k); R('chest',-.45+.33*k); R('head',.4-.2*k)
        if t<.35: a=-1.25-.5*e; fa=-.35-.2*e
        elif t<.55: k=(t-.35)/.2; a=-1.75+1.0*k; fa=-.55+.3*k
        else: k=(t-.55)/.45; a=-.75-.5*k; fa=-.25-.1*k
        R('arm.L',a,0,-.15); R('arm.R',a,0,.15); R('forearm.L',fa); R('forearm.R',fa)
    else:
        # golpe de espada com o braço direito: arma levantada -> corte descendente
        if t<.4: e=sin(t/.4*math.pi/2); a=-.25-2.2*e; fa=-.55-.2*e; tw=.35*e; ch=.18*e
        elif t<.6: k=(t-.4)/.2; a=-2.45+1.95*k; fa=-.75+.3*k; tw=.35-.9*k; ch=.18-.5*k
        else: k=(t-.6)/.4; a=-.5+.25*k; fa=-.45-.1*k; tw=-.55*(1-k); ch=-.32*(1-k)
        R('arm.R',a,0,.1); R('forearm.R',fa); R('spine',ch*.5,0,tw*.5); R('chest',ch*.5,0,tw*.5); R('arm.L',-.3*(1-abs(tw)),0,-.1); R('weapon',0)
        R('thigh.L',-.25 if t>.4 else 0); R('thigh.R',.2 if t>.4 else 0)
def death(t):
    e=min(1,t/.7); e2=e*e*(3-2*e)
    R('root',math.pi/2*e2*.97); C.PB['root'].location=(0,.12*e2,0)
    R('hips',-.2*e2); R('spine',.15*e2); R('head',.3*e2,0,.2*e2); R('thigh.L',-.5*e2); R('thigh.R',-.2*e2); R('shin.L',.6*e2); R('shin.R',.2*e2)
    R('arm.L',-.6*e2,0,-.6*e2); R('arm.R',.2*e2,0,.7*e2); R('forearm.L',-.3*e2); R('forearm.R',-.2*e2)
    if not Z: R('weapon',0,0,.8*e2)
bake_loop('idle',49,idle); bake_loop('walk',25,walk); bake_once('attack',18,attack); bake_once('death',36,death)
if os.environ.get('NO_EXPORT')!='1': export(OUT,'mob_'+KIND,sc)
print('OK',KIND,len(body.data.vertices),'verts')
