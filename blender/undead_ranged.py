"""Blender: --background --python undead_ranged.py -- archer|specter.

Uses the same rig, proportions, palette and sprite pipeline as mob.py.
"""
import math
import os
import sys
import bmesh
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import common as C
from common import *

KIND = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'archer'
assert KIND in ('archer', 'specter')

if KIND == 'archer':
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'mob_skeleton.blend'))
    C.ARM = bpy.data.objects['Rig']; C.PB = C.ARM.pose.bones
    C.MATS = {m.name: m for m in bpy.data.materials}
    C.PARTS = []
    body = bpy.data.objects['Mob_skeleton']
    # Replace the sword by a bow; preserve the existing skeleton mesh and rig.
    group = body.vertex_groups['weapon'].index
    bm = bmesh.new(); bm.from_mesh(body.data)
    layer = bm.verts.layers.deform.active
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if group in v[layer]], context='VERTS')
    bm.to_mesh(body.data); bm.free(); body.name = 'Mob_archer'
    mat('bow', '#785136', gain=1.4)
    mat('leather', '#473040', gain=1.5)
    mat('string', '#b9c8bd', gain=1.3)
    mat('soul', '#67ddec', emit='#67ddec', es=2)
    # Blue eyes distinguish the allied archer from the red-eyed swordsman.
    eye = C.MATS['eye'].node_tree.nodes['Principled BSDF']
    eye.inputs['Emission Color'].default_value = (*hexc('#67ddec'), 1)
    eye.inputs['Base Color'].default_value = (*hexc('#67ddec'), 1)
    # Bow lies across the hand in bind pose; follows the left arm when aiming.
    points = [(.22, -.04, .34), (.35, -.04, .48), (.42, -.04, .67),
              (.45, -.04, .82), (.42, -.04, .97), (.35, -.04, 1.16), (.22, -.04, 1.30)]
    points = [(x-.23,y,z) for x,y,z in points]
    for a, b in zip(points, points[1:]): seg(a, b, .022, .018, 'bow', 'hand.L', 7)
    seg(points[0], (-.01, .015, .82), .005, .005, 'string', 'hand.L', 5)
    seg((-.01, .015, .82), points[-1], .005, .005, 'string', 'hand.L', 5)
    seg((.22, -.04, .76), (.22, -.04, .88), .03, .03, 'leather', 'hand.L', 8)
    # Quiver and visible feathered arrows behind the right shoulder.
    seg((-.15, .17, 1.03), (-.22, .20, 1.49), .085, .09, 'leather', 'chest', 9)
    for i in range(3):
        x = -.26 + i*.04
        seg((x, .20, 1.22), (x-.025, .20, 1.69+i*.025), .007, .007, 'bow', 'chest', 5)
        box((x-.025, .20, 1.64+i*.025), (.045, .015, .075), 'bone', 'chest')
    # Shoulder mantle and cross-body strap.
    for sx in (-1, 1): sphere((sx*.19, .01, 1.44), .095, (1, 1, .55), 'leather', 'chest', 8, False)
    seg((-.17, -.13, 1.42), (.14, -.14, 1.03), .024, .024, 'leather', 'chest', 5)
    finish('Archer_equipment')
else:
    reset_scene()
    bone('root', (0,0,0), (0,0,.12))
    bone('hips', (0,0,.8), (0,0,1.02), 'root')
    bone('spine', (0,0,1.02), (0,0,1.3), 'hips')
    bone('chest', (0,0,1.3), (0,0,1.48), 'spine')
    bone('head', (0,0,1.48), (0,0,1.78), 'chest')
    for side, sx in (('L',1), ('R',-1)):
        bone('arm.'+side, (sx*.22,0,1.4), (sx*.34,-.03,1.12), 'chest')
        bone('forearm.'+side, (sx*.34,-.03,1.12), (sx*.36,-.15,.94), 'arm.'+side)
        bone('hand.'+side, (sx*.36,-.15,.94), (sx*.36,-.18,.8), 'forearm.'+side)
    build_rig()
    mat('robe', '#425781', gain=1.8); mat('robe_dark', '#29314f', gain=1.7)
    mat('rim', '#7cabbc', gain=1.4); mat('void', '#0b1327')
    mat('soul', '#8de5ed', emit='#8de5ed', es=2)
    mat('claw', '#bfdce1', gain=1.1)
    # Floating, tapered body with an irregular hem; no feet or solid skirt base.
    verts=[]; faces=[]; count=12
    for ring in range(4):
        for i in range(count):
            a=math.tau*i/count
            r=(.035,.18,.30,.24)[ring]
            z=(.18,.53,.99,1.39)[ring]
            if ring==0: z += .1*math.sin(a*3); x=.13
            else: x=0
            verts.append((x+math.cos(a)*r, .07+math.sin(a)*r*.72, z))
    for ring in range(3):
        for i in range(count):
            j=ring*count+i; k=ring*count+(i+1)%count
            faces.append((j,k,k+count,j+count))
    mesh=bpy.data.meshes.new('Tattered_shroud'); mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new('Shroud',mesh); bpy.context.collection.objects.link(obj)
    C._fin(obj,'robe','hips',False)
    for i in range(7):
        a=math.tau*i/7
        seg((math.cos(a)*.22, .07+math.sin(a)*.15,.78),
            (math.cos(a)*.13+.06,.07+math.sin(a)*.1,.26+.1*(i%3)), .06,.003,'robe_dark','hips',5)
    # Deep hood opening, surrounded by a thick faceted rim.
    sphere((0,.015,1.62), .235, (1,.83,1.18), 'robe_dark', 'head', 10, False)
    sphere((0,-.172,1.61), .165, (.88,.25,1.05), 'void', 'head', 10, False)
    for sx in (-1,1):
        seg((sx*.145,-.16,1.47),(sx*.18,-.14,1.68),.045,.055,'rim','head',6)
        seg((sx*.18,-.14,1.68),(0,-.13,1.85),.055,.035,'robe','head',6)
        sphere((sx*.063,-.215,1.65),.026,(1,.4,.6),'soul','head',8,False)
        seg((sx*.22,0,1.4),(sx*.34,-.03,1.12),.12,.085,'robe','arm.'+('L' if sx==1 else 'R'),8)
        side='L' if sx==1 else 'R'
        seg((sx*.34,-.03,1.12),(sx*.36,-.15,.94),.085,.11,'robe_dark','forearm.'+side,8)
        sphere((sx*.36,-.17,.91),.065,(.85,.6,1.3),'claw','hand.'+side,8,False)
        for k in (-1,0,1):
            seg((sx*.36+k*.036,-.18,.88),(sx*.36+k*.047,-.23,.73+abs(k)*.025),.017,.003,'claw','hand.'+side,5)
    sphere((0,-.20,1.28),.043,(.8,.6,1.2),'soul','chest',8,False)
    finish('Mob_specter')

sc=bpy.context.scene
init_anim(sc)

def idle(t):
    p=math.tau*t
    if KIND=='archer':
        R('spine',-.04); R('head',0,0,.06*math.sin(p))
        R('arm.L',-.3,0,-.12); R('forearm.L',-.38)
        R('hand.L',.68)
        R('arm.R',-.3,0,.1); R('forearm.R',-.75)
        R('chest',.025*math.sin(p))
    else:
        C.PB['root'].location=(0,.07*math.sin(p),0)
        R('hips',0,.07*math.sin(p),.045*math.sin(p))
        R('head',.04*math.sin(p+.5),0,.08*math.sin(p))
        for side,sx in (('L',1),('R',-1)):
            R('arm.'+side,-.24+.07*math.sin(p+sx),0,-sx*.18)
            R('forearm.'+side,-.35)

def walk(t):
    idle(t); p=math.tau*t
    if KIND=='archer':
        for side,ph in (('L',0),('R',math.pi)):
            q=math.sin(p+ph)
            R('thigh.'+side,-.55*q); R('shin.'+side,max(0,.8*math.sin(p+ph+1)))
            R('foot.'+side,.22*q)
        R('hips',0,0,.045*math.sin(p))
        C.PB['hips'].location=(0,-.025*abs(math.cos(p)),0)
    else:
        R('spine',.18); R('hips',.12,.13*math.sin(p),.08*math.sin(p))
        R('arm.L',.12,0,-.35); R('arm.R',.08,0,.35)

def attack(t):
    idle(0)
    # Draw, release, recover. The left arm holds the bow, the right draws.
    e=min(1,t/.4) if t<.4 else max(0,1-(t-.58)/.42)
    if KIND=='archer':
        R('arm.L',-1.4*e-.3,0,-.13); R('forearm.L',-.12-.26*(1-e))
        R('hand.L',.68+1.14*e)
        R('arm.R',-.3-1.15*e,0,.1+.8*e); R('forearm.R',-.75-1.0*e)
        R('chest',0,0,-.22*e); R('head',0,0,.22*e)
        R('thigh.L',-.12*e); R('thigh.R',.12*e)
    else:
        pulse=math.sin(math.pi*t)
        R('spine',-.25*pulse); R('chest',-.15*pulse)
        R('arm.L',-1.6*pulse,0,-.32); R('arm.R',-1.6*pulse,0,.32)
        R('forearm.L',-.5*pulse); R('forearm.R',-.5*pulse)

def death(t):
    e=min(1,t/.8); e=e*e*(3-2*e)
    if KIND=='archer':
        R('root',math.pi*.4*e); C.PB['root'].location=(0,.12*e,0)
        R('spine',.2*e); R('head',.3*e,0,.2*e)
        R('arm.L',-.4*e,0,-.7*e); R('arm.R',.2*e,0,.7*e)
        R('hand.L',0,0,math.pi*.5*e)
        R('thigh.L',-.5*e); R('shin.L',.6*e)
    else:
        C.PB['root'].location=(0,-.55*e,0)
        R('hips',0,.6*e,1.1*e); R('spine',.9*e); R('head',.6*e)
        R('arm.L',0,0,-1.1*e); R('arm.R',0,0,1.1*e)

# Replace inherited actions, keeping exactly the four actions the runtime uses.
C.ARM.animation_data_clear()
for action in list(bpy.data.actions): bpy.data.actions.remove(action)
bake_loop('idle',49,idle); bake_loop('walk',25,walk)
bake_once('attack',24,attack); bake_once('death',36,death)
sc.frame_set(1)
export(HERE,'mob_'+KIND,sc)
print('DONE',KIND,flush=True)
