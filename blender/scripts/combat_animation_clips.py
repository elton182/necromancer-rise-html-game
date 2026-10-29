"""Presentation-only action curves. Geometry, damage and attack clocks live elsewhere."""
import math
import bpy
import common as c

def pulse(t,peak=.38):
 return math.sin(math.pi*min(1,t/peak)/2) if t<peak else math.cos(math.pi*min(1,(t-peak)/(1-peak))/2)**2

def replace(name,n,fn,loop=False):
 old=bpy.data.actions.get(name)
 if old:bpy.data.actions.remove(old)
 (c.bake_loop if loop else c.bake_once)(name,n,fn)

def zephyr():
 def cast(t):
  v=pulse(t,.27);release=math.sin(math.pi*t)
  c.R('chest',z=-.22*v,x=.10*v-.15*release);c.R('head',x=-.08*release,z=.12*v)
  c.R('arm.L',x=-1.42*v,z=-.25*v);c.R('forearm.L',x=-.40*v)
  c.R('arm.R',x=-.35*v,z=.12*v);c.R('forearm.R',x=-.24*v);c.R('staff',x=-.28*v);c.R('cape',x=.20*release)
 def summon(t):
  v=math.sin(math.pi*t)**.8;c.R('chest',x=-.18*v);c.R('head',x=-.16*v)
  c.R('arm.L',x=-1.35*v,z=-.6*v);c.R('forearm.L',x=-.6*v)
  c.R('arm.R',x=-.55*v,z=.25*v);c.R('staff',x=-.24*v);c.R('cape',x=.28*v)
 def nova(t):
  v=pulse(t,.48);spread=max(0,math.sin(math.pi*(t-.22)/.78)) if t>.22 else 0
  c.R('chest',x=.15*v-.3*spread);c.R('head',x=.12*v-.2*spread)
  c.R('arm.L',x=-.6*v,z=-1.0*spread);c.R('forearm.L',x=-1.1*v)
  c.R('arm.R',x=-.8*v,z=.45*spread);c.R('staff',x=-.45*spread);c.R('cape',x=.38*spread)
 def channel(t):
  v=math.sin(math.pi*t)**.65;c.R('chest',x=-.17*v,z=.13*v);c.R('head',x=-.24*v)
  c.R('arm.R',x=-1.1*v);c.R('forearm.R',x=-.45*v);c.R('staff',x=-.18*v)
  c.R('arm.L',x=-.95*v,z=-.45*v);c.R('forearm.L',x=-.6*v);c.R('cape',x=.2*v)
 def dash(t):
  v=.75+.25*math.sin(math.pi*t);c.R('chest',x=.38*v);c.R('head',x=-.2*v);c.R('cape',x=.6*v)
  c.R('arm.R',x=.3*v);c.R('staff',x=.4*v);c.R('arm.L',x=.55*v)
  c.R('leg.L',x=.65*v);c.R('shin.L',x=.3*v);c.R('leg.R',x=-.45*v);c.R('shin.R',x=.6*v)
 replace('cast',8,cast);replace('summon',8,summon)
 replace('nova',8,nova);replace('channel',8,channel);replace('dash',6,dash)
 return [('idle',4,5,True),('walk',6,12,True),('cast',8,22,False),('summon',8,16,False),('hurt',3,12,False),('death',6,10,False),('nova',8,18,False),('channel',8,16,False),('dash',6,30,False)]

def minion(kind):
 # Convenção do rig: x negativo leva braço/perna à frente; no tronco, x negativo inclina à frente.
 def smooth(x):x=min(1,max(0,x));return x*x*(3-2*x)
 def attack(t):
  v=pulse(t,.35)
  if kind=='archer':
   # Puxa a corda até a face (0–45%), segura a mira, solta com estalo em 60% e recupera.
   draw=smooth(t/.45);snap=smooth((t-.6)/.12);hold=1-smooth((t-.72)/.28);a=draw*hold
   # Tronco de perfil com o ombro do arco à frente (y negativo); a cabeça segue no alvo.
   c.R('chest',x=-.04*a+.07*snap*hold,y=-.50*a);c.R('head',y=.42*a)
   c.R('arm.L',x=-1.50*a,z=-.65*a);c.R('forearm.L',x=-.08*a)
   # Pulso compensa a subida do braço: arco vertical e corda voltada à mão que puxa.
   c.R('hand.L',x=1.95*a,z=-1.35*a)
   # Soltura: a mão da corda volta para trás e para fora (z diminui) em vez de avançar.
   c.R('arm.R',x=(-1.35*draw+.15*snap)*hold,z=(.85*draw-1.25*snap)*hold);c.R('forearm.R',x=(-2.0*draw*(1-snap)-.25*snap)*hold)
   c.R('leg.L',x=-.22*a);c.R('leg.R',x=.22*a)
  elif kind=='skeleton_mage':
   c.R('chest',x=-.18*v);c.R('head',x=-.16*v);c.R('arm.R',x=-.65*v);c.R('forearm.R',x=-.3*v)
   c.R('arm.L',x=-1.4*v,z=-.4*v);c.R('forearm.L',x=-.55*v)
  else:
   # Ergue a espada sobre o ombro (0–30%), corta em diagonal com passo à frente, sustenta e volta.
   wind=smooth(t/.3)*(1-smooth((t-.3)/.2));cut=smooth((t-.3)/.22)*(1-smooth((t-.72)/.28))
   c.R('chest',x=.08*wind-.24*cut,y=.32*wind-.42*cut);c.R('head',y=-.16*wind+.20*cut)
   # Fora do golpe, braço e pulso voltam à posição do repouso (lâmina em pé), sem salto na transição.
   rest=max(0,1-wind-cut)
   c.R('arm.R',x=-.1*rest-2.3*wind-1.0*cut,z=.35*wind-.55*cut);c.R('forearm.R',x=-.35*rest-.6*wind-.2*cut)
   c.R('hand.R',x=.64*rest,z=-.32*rest)
   c.R('arm.L',x=-.2-.15*cut,z=.45);c.R('forearm.L',x=-.6);c.R('hand.L',x=.75)
   c.R('leg.L',x=-.45*cut);c.R('shin.L',x=.35*cut);c.R('leg.R',x=.30*cut)
   c.PB['hips'].location.y=-.04*cut
 def walk(t):
  # Marcha ossuda: quadril sobe na passagem, tronco gira contra as pernas, cabeça chacoalha.
  p=math.tau*t;s=math.sin(p)
  c.PB['hips'].location.y=.035*abs(math.cos(p))-.015
  c.R('chest',x=-.06,y=-.16*s,z=.04*s);c.R('head',x=.05*math.sin(2*p),y=.12*s)
  swing={}
  for side,phase in [('L',0),('R',math.pi)]:
   v=math.sin(p+phase);swing[side]=v
   c.R('leg.'+side,x=.52*v);c.R('shin.'+side,x=.1+.75*max(0,-math.cos(p+phase)));c.R('foot.'+side,x=-.2*v)
  if kind=='skeleton':
   # Espada balança com o passo; o escudo fica em guarda à frente.
   c.R('arm.R',x=-.1-.30*swing['R']);c.R('forearm.R',x=-.35)
   # Pulso compensa o balanço do braço: lâmina em pé, levemente à frente.
   c.R('hand.R',x=.64+.32*swing['R'],z=-.24-.08*swing['R'])
   c.R('arm.L',x=-.2-.06*swing['L'],z=.45);c.R('forearm.L',x=-.6);c.R('hand.L',x=.75)
  elif kind=='archer':
   # Arco baixo à frente; o braço livre balança.
   c.R('arm.L',x=-.25-.12*swing['L']);c.R('forearm.L',x=-.3);c.R('hand.L',x=.55+.12*swing['L'])
   c.R('arm.R',x=-.30*swing['R']);c.R('forearm.R',x=-.2)
  else:
   for side in 'LR':c.R('arm.'+side,x=-.17*swing[side]);c.R('forearm.'+side,x=-.12)
 def guard_idle(t):
  # Repouso em guarda: escudo diante do peito, respiração leve.
  p=math.tau*t;c.R('chest',x=.018*math.sin(p));c.R('head',z=.025*math.sin(p))
  c.R('arm.L',x=-.2,z=.45);c.R('forearm.L',x=-.6+.04*math.sin(p));c.R('hand.L',x=.75)
  c.R('arm.R',x=-.1);c.R('forearm.R',x=-.35);c.R('hand.R',x=.64,z=-.32)
 if kind=='skeleton':replace('idle',4,guard_idle,True)
 replace('attack',8,attack);replace('walk',8,walk,True)
