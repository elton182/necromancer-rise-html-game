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
 def attack(t):
  v=pulse(t,.35)
  if kind=='archer':
   draw=min(1,t/.55);release=max(0,(t-.55)/.45)
   c.R('chest',z=.22*draw*(1-release));c.R('head',z=-.13*draw)
   c.R('arm.L',x=-1.32*v,z=-.18*v);c.R('forearm.L',x=-.12*v)
   c.R('arm.R',x=-1.2*v,z=.7*v);c.R('forearm.R',x=-1.5*draw*(1-release))
  elif kind=='skeleton_mage':
   c.R('chest',x=-.18*v);c.R('head',x=-.16*v);c.R('arm.R',x=-.65*v);c.R('forearm.R',x=-.3*v)
   c.R('arm.L',x=-1.4*v,z=-.4*v);c.R('forearm.L',x=-.55*v)
  else:
   wind=math.sin(math.pi*min(1,t/.35)/2) if t<.35 else max(0,1-(t-.35)/.65)
   slash=max(0,math.sin(math.pi*(t-.18)/.82)) if t>.18 else 0
   c.R('chest',z=.28*wind-.55*slash,x=.12*slash);c.R('head',z=-.18*wind)
   c.R('arm.R',x=-1.7*wind,z=-.55*slash);c.R('forearm.R',x=-.5*wind)
   c.R('arm.L',x=-.75*slash,z=-.25*slash);c.R('forearm.L',x=-.55*slash)
   c.R('leg.L',x=.13*slash);c.R('shin.L',x=.12*slash)
 def walk(t):
  p=math.tau*t;c.R('chest',z=.055*math.sin(p));c.R('head',z=-.04*math.sin(p));c.PB['hips'].location.y=.018*abs(math.sin(p))
  for side,phase in [('L',0),('R',math.pi)]:
   v=math.sin(p+phase);c.R('leg.'+side,x=.46*v);c.R('shin.'+side,x=.68*max(0,-v));c.R('foot.'+side,x=-.15*v)
   c.R('arm.'+side,x=-.17*v);c.R('forearm.'+side,x=-.12)
 replace('attack',8,attack);replace('walk',6,walk,True)
