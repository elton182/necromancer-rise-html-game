"""Blocking e breakdowns do Guerreiro; fase 0,5 dos cortes coincide com o dano."""
import math
from mathutils import Vector
R=Vector((-.13,.27,.43));L=Vector((.07,.25,.49));S=Vector((-.12,-.25,.96))
J1=Vector((.005,.28,.42));D1=Vector((.8,-.3,-.5))
J2=Vector((-.20,.31,.50));D2=Vector((-.7,-.3,.65))
def curve(t,keys):
    for (ta,a),(tb,b) in zip(keys,keys[1:]):
        if ta<=t<=tb:
            u=(t-ta)/(tb-ta);u=u*u*(3-2*u)
            return Vector(a).lerp(Vector(b),u)
    return Vector(keys[-1][1])
def scalar(t,keys):return curve(t,[(time,(value,0,0)) for time,value in keys]).x

def motion(name,t):
    wave=math.sin(t*math.tau);pulse=math.sin(math.pi*t)**2
    out=dict(right=R.copy(),left=L.copy(),sword=S.copy(),shield=Vector((0,0,1)),twist=0,lean=0,hip=(0,0,-.012),feet={},foot_pitch={},foot_yaw={},extension=0,shield_extension=0)
    if name=='idle':
        out['hip']=(.002*wave,0,-.012+.001*math.sin(t*math.tau*2))
        out['lean']=.007*wave;out['twist']=.008*math.sin(t*math.tau)
        out['right'].z+=.002*wave;out['left'].z+=.001*math.sin(t*math.tau+.4)-.001*math.sin(.4)
    if name=='walk':
        # Apoio recua a velocidade constante; balanço retorna em arco, com elevação do pé.
        for side,offset in [('Right',0),('Left',.5)]:
            phase=(t+offset)%1
            if phase<.5:
                u=phase*2;y=-.12+.24*u;z=0;pitch=.08*(1-2*u)
            else:
                u=(phase-.5)*2;y=.12-.24*(u*u*(3-2*u));z=.045*math.sin(math.pi*u);pitch=-.15*math.sin(math.pi*u)
            out['feet'][side]=(0,y,z);out['foot_pitch'][side]=pitch
        out['hip']=(.004*wave,0,-.032+.004*math.cos(t*math.tau*2))
        out['twist']=.045*wave;out['lean']=.045
        out['right'].y+=.01*wave;out['left'].y-=.008*wave
    if name.startswith('slash'):
        n=int(name[-1])
        start,end,ds,de,prep,hit,dp,dh,starttw,endtw,pretw,hittw={
          1:(R,J1,S,D1,(-.21,.35,.55),(.00,.16,.48),(-.6,.2,.8),(.9,-.4,-.12),0,.40,-.85,.95),
          2:(J1,J2,D1,D2,(.015,.30,.46),(-.22,.18,.45),(.9,-.15,.4),(-.85,-.5,.1),.40,-.40,.80,-.95),
          3:(J2,R,D2,S,(-.10,.34,.65),(-.10,.13,.39),(0,.05,1),(0,-.8,-.6),-.40,0,-.55,.42),
        }[n]
        out['right']=curve(t,[(0,start),(.36,prep),(.5,hit),(.65,end),(1,end)])
        out['sword']=curve(t,[(0,ds),(.36,dp),(.5,dh),(.65,de),(1,de)])
        out['twist']=scalar(t,[(0,starttw),(.36,pretw),(.5,hittw),(.72,endtw),(1,endtw)])
        out['lean']=scalar(t,[(0,0),(.36,-.10 if n==3 else -.045),(.5,.48 if n==3 else .18),(.7,.22 if n==3 else .10),(1,0)])
        out['extension']=scalar(t,[(0,0),(.36,.15),(.5,1),(.63,.80),(1,0)])
        shield_link=Vector((.15,.30,.49))
        out['left']=curve(t,[(0,L if n==1 else shield_link),(.35,(.15,.31,.49)),(.65,shield_link),(1,L if n==3 else shield_link)])
        sink=scalar(t,[(0,.012),(.36,.065 if n==3 else .050),(.5,.090 if n==3 else .055),(.72,.065 if n==3 else .038),(1,.012)])
        out['hip']=(.025*pulse*(1 if n==1 else -1),-.035*pulse,-sink)
        out['foot_yaw']={'Right':out['twist']*.38,'Left':out['twist']*.18}
    if name=='thrust':
        out['right']=curve(t,[(0,R),(.30,(-.14,.34,.46)),(.525,(-.10,.12,.47)),(.65,(-.10,.15,.46)),(1,R)])
        out['sword']=curve(t,[(0,S),(.30,(0,-.4,.8)),(.48,(0,-1,0)),(.65,(0,-1,0)),(1,S)])
        out['left']=L.lerp(Vector((.15,.31,.48)),pulse)
        out['lean']=scalar(t,[(0,0),(.3,-.04),(.525,.42),(.68,.28),(1,0)])
        out['twist']=-.55*pulse;out['hip']=(0,-.065*pulse,-.012-.055*pulse)
        out['extension']=scalar(t,[(0,0),(.30,0),(.525,1),(.68,.9),(1,0)])
        out['foot_yaw']={'Right':-.08*pulse,'Left':-.25*pulse}
        out['feet']={'Right':(0,-.085*pulse,0),'Left':(0,.04*pulse,0)}
    if name=='shield_bash':
        out['left']=curve(t,[(0,L),(.25,(.09,.32,.47)),(.375,(.045,.13,.48)),(.52,(.045,.15,.48)),(1,L)])
        out['lean']=scalar(t,[(0,0),(.25,-.07),(.375,.40),(.6,.23),(1,0)])
        out['twist']=.50*pulse;out['hip']=(.012*pulse,-.050*pulse,-.012-.050*pulse)
        out['shield_extension']=scalar(t,[(0,0),(.25,0),(.375,.95),(.55,.75),(1,0)])
        out['foot_yaw']={'Right':.18*pulse,'Left':.08*pulse}
        out['right']=R+Vector((-.02*pulse,.02*pulse,-.015*pulse))
    if name=='death':
        out['lean']=.15*min(1,t*2)
    return out
