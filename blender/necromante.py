# Necromante — modelo low-poly + esqueleto + animações (idle, walk, cast, death) -> .glb
# Uso:  blender -b -P necromante.py   (ou python necromante.py com o módulo bpy)
import bpy, bmesh, math, os, sys
from mathutils import Vector, Euler
OUT = os.environ.get('OUT_DIR', os.path.dirname(os.path.abspath(__file__)))
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ───────── materiais ─────────
def mat(name, col, rough=.8, emit=None, es=0.0, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    return m
def hexc(h): h=h.lstrip('#'); return tuple(((int(h[i:i+2],16)/255)**2.2) for i in (0,2,4))
M = {
 'robe':  mat('robe',  hexc('#2e1266'), .9),
 'robe2': mat('robe_dark', hexc('#160836'), .95),
 'cape':  mat('cape',  hexc('#1a0a3c'), .95),
 'trim':  mat('trim',  hexc('#3c1c78'), .8),
 'skin':  mat('skin',  hexc('#9c8c84'), .7),
 'bone':  mat('bone',  hexc('#d9d0b4'), .6),
 'wood':  mat('wood',  hexc('#2c1d14'), .85),
 'dark':  mat('dark',  hexc('#07030d'), 1),
 'gold':  mat('gold',  hexc('#c9a23a'), .35, metal=.8),
 'glow':  mat('glow',  hexc('#00ff88'), .3, emit=hexc('#00ff88'), es=3.0),
 'halo':  mat('halo',  hexc('#00c060'), .3, emit=hexc('#00ff88'), es=0.8),
}
MATI = {k: i for i, k in enumerate(M)}

# ───────── esqueleto ─────────
bpy.ops.object.armature_add(enter_editmode=True, location=(0,0,0))
arm = bpy.context.object; arm.name = 'Rig'; ad = arm.data; ad.name = 'RigData'
for b in list(ad.edit_bones): ad.edit_bones.remove(b)
BONES = {}  # nome -> (head, tail, parent)
def bone(n, h, t, p=None): BONES[n] = (Vector(h), Vector(t), p)
bone('root',(0,0,0),(0,0,.12))
bone('hips',(0,0,.95),(0,0,1.1),'root')
bone('spine',(0,0,1.1),(0,0,1.32),'hips')
bone('chest',(0,0,1.32),(0,0,1.52),'spine')
bone('neck',(0,0,1.52),(0,0,1.62),'chest')
bone('head',(0,0,1.62),(0,0,1.9),'neck')
for s,sx in (('L',1),('R',-1)):
    bone(f'shoulder.{s}',(0,0,1.46),(sx*.22,0,1.46),'chest')
    bone(f'arm.{s}',(sx*.22,0,1.46),(sx*.27,0,1.18),f'shoulder.{s}')
    bone(f'forearm.{s}',(sx*.27,0,1.18),(-.4,-.19,1.04) if s=='R' else (sx*.29,-.04,.96),f'arm.{s}')
    bone(f'hand.{s}',(-.4,-.19,1.04) if s=='R' else (sx*.29,-.04,.96),(-.41,-.2,.97) if s=='R' else (sx*.29,-.07,.86),f'forearm.{s}')
    bone(f'thigh.{s}',(sx*.1,0,.95),(sx*.1,0,.52),'hips')
    bone(f'shin.{s}',(sx*.1,0,.52),(sx*.1,0,.1),f'thigh.{s}')
    bone(f'foot.{s}',(sx*.1,0,.1),(sx*.1,-.16,.04),f'shin.{s}')
HND=Vector((-.4,-.19,1.04)); STA=.12; SD=Vector((math.sin(STA),0,math.cos(STA)))
bone('staff',HND,HND+SD*1.25,'hand.R')
bone('orb',HND+SD*1.25,HND+SD*1.38,'staff')
SK = {'F':(0,-1),'B':(0,1),'L':(1,0),'R':(-1,0)}
for k,(dx,dy) in SK.items():
    bone(f'skirt.{k}',(dx*.05,dy*.05,.95),(dx*.36,dy*.36,.14),'hips')
bone('cape1',(0,.14,1.5),(0,.2,1.0),'chest')
bone('cape2',(0,.2,1.0),(0,.32,.45),'cape1')
for n,(h,t,p) in BONES.items():
    e = ad.edit_bones.new(n); e.head=h; e.tail=t
    if p: e.parent = ad.edit_bones[p]
for n,(h,t,p) in BONES.items():
    e = ad.edit_bones[n]; d=(t-h).normalized()
    e.align_roll(Vector((0,0,1)) if abs(d.y)>.7 else Vector((0,1,0)))
bpy.ops.object.mode_set(mode='OBJECT')

# ───────── malha ─────────
parts = []
def vgset(o, weights):  # weights: {bone: w} aplicado a todos os verts
    for b,w in weights.items():
        g = o.vertex_groups.new(name=b); g.add(range(len(o.data.vertices)), w, 'REPLACE')
def fin(o, m, bone_w, smooth=True):
    o.data.materials.append(M[m]); 
    for p in o.data.polygons: p.use_smooth = smooth
    if isinstance(bone_w, str): bone_w = {bone_w: 1.0}
    vgset(o, bone_w); parts.append(o); return o
def apply(o):
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True); o.select_set(False)
def sphere(loc, r, sc=(1,1,1), m='skin', bone='chest', seg=12, smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=max(6,seg//2), radius=r, location=loc); o=bpy.context.object; o.scale=sc; apply(o); return fin(o,m,bone,smooth)
def cone(loc, r1, r2, d, m='robe', bone='chest', rot=(0,0,0), seg=10, smooth=False, sc=(1,1,1)):
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r1, radius2=r2, depth=d, location=loc, rotation=rot); o=bpy.context.object; o.scale=sc; apply(o); return fin(o,m,bone,smooth)
def box(loc, s, m='dark', bone='chest', rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o=bpy.context.object; o.scale=s; apply(o); return fin(o,m,bone,False)
def torus(loc, R, r, m='trim', bone='hips', sc=(1,1,1)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=16, minor_segments=6, location=loc); o=bpy.context.object; o.scale=sc; apply(o); return fin(o,m,bone,False)

# manto inferior (saia) — pesos por ângulo/altura
def skirt():
    seg, rings = 16, 5
    bm = bmesh.new(); H0, H1 = .98, .13; R0, R1 = .2, .44
    verts=[]
    for r in range(rings+1):
        t = r/rings; z = H0+(H1-H0)*t; rad = R0+(R1-R0)*(t**.8)
        row=[]
        for i in range(seg):
            a = 2*math.pi*i/seg; rr = rad*(1+.05*math.sin(a*5)*t)
            row.append(bm.verts.new((math.cos(a)*rr, math.sin(a)*rr, z)))
        verts.append(row)
    for r in range(rings):
        for i in range(seg):
            bm.faces.new((verts[r][i],verts[r][(i+1)%seg],verts[r+1][(i+1)%seg],verts[r+1][i]))
    me = bpy.data.meshes.new('skirt'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('skirt',me); bpy.context.collection.objects.link(o)
    me.materials.append(M['robe'])
    for p in me.polygons: p.use_smooth=True
    g = {n: o.vertex_groups.new(name=n) for n in ['hips']+[f'skirt.{k}' for k in SK]}
    for r in range(rings+1):
        t=r/rings
        for i in range(seg):
            a=2*math.pi*i/seg; vi=r*seg+i
            ws={k: max(0,math.cos(a-math.atan2(dy,dx)))**2 for k,(dx,dy) in SK.items()}; s=sum(ws.values()) or 1
            g['hips'].add([vi],1-t*.92,'REPLACE')
            for k,w in ws.items(): g[f'skirt.{k}'].add([vi], t*.92*w/s,'REPLACE')
    parts.append(o); return o
skirt()
# bainha escura
torus((0,0,.14),.43,.018,'trim','skirt.F')
# torso
cone((0,0,1.22),.27,.2,.58,'robe','spine',seg=12,smooth=True)
cone((0,0,1.42),.2,.25,.2,'robe','chest',seg=12,smooth=True)
# faixa/cinto + crânio no cinto
torus((0,0,1.02),.25,.03,'robe2','hips',sc=(1,.85,1))
sphere((0,-.23,1.02),.045,(1,.8,1),'bone','hips'); box((0,-.265,1.0),(.05,.01,.02),'dark','hips')
for dx in (-.025,.025): sphere((dx,-.268,1.035),.012,(1,.5,1),'dark','hips',6)
# ombros e gola alta
for s,sx in (('L',1),('R',-1)):
    sphere((sx*.22,0,1.47),.095,(1.1,1,.85),'trim',f'shoulder.{s}')
cone((0,.03,1.58),.2,.12,.1,'trim','neck',seg=12,smooth=False)  # gola
# rosto: apenas sombra dentro do capuz
sphere((0,-.015,1.735),.115,(.95,1,1.08),'dark','head',smooth=True)
# capuz (esfera com abertura frontal)
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=.175, location=(0,.02,1.76)); hd=bpy.context.object; hd.scale=(1,1.08,1.12); apply(hd)
bm=bmesh.new(); bm.from_mesh(hd.data)
dele=[f for f in bm.faces if f.calc_center_median().y < -.04 and abs(f.calc_center_median().x) < .115 and 1.64 < f.calc_center_median().z < 1.86]
bmesh.ops.delete(bm, geom=dele, context='FACES'); bm.to_mesh(hd.data); bm.free()
for p in hd.data.polygons: p.use_smooth=True
fin(hd,'robe','head',True)
cone((0,.2,1.7),.11,.0,.34,'robe','head',rot=(math.radians(-62),0,0),seg=8,smooth=True)  # bico do capuz
# braços (mangas largas)
for s,sx in (('L',1),('R',-1)):
    cone((sx*.245,-.0,1.32),.085,.07,.3,'robe',f'arm.{s}',rot=(0,math.radians(-sx*5),0),seg=10)
    fa = (.055,.13)
    if s=='R':
        e0=Vector((-.27,0,1.18)); dv=HND-e0; mid=(e0+HND)/2+Vector((0,0,-.02))
        cone(mid,.11,.06,dv.length*1.05,'robe','forearm.R',rot=dv.to_track_quat('Z','Y').to_euler(),seg=10)
    else:
        cone((sx*.28,-.02,1.07),.11,.06,.26,'robe',f'forearm.{s}',rot=(math.radians(-6),0,0),seg=10)
    sphere((sx*.27,-.01,1.19),.07,(1,1,1),'robe',f'arm.{s}',8)
    hp=(-.405,-.2,.99) if s=='R' else (sx*.29,-.075,.9)
    sphere(hp,.045,(1,1,1.2),'skin',f'hand.{s}',8)
# pés
for s,sx in (('L',1),('R',-1)):
    box((sx*.1,-.07,.045),(.1,.22,.08),'dark',f'foot.{s}')
# capa
def cape():
    cols, rows = 6, 8; bm=bmesh.new(); V=[]
    for r in range(rows+1):
        t=r/rows; z=1.54-1.04*t; w=.16+.3*t
        row=[]
        for c in range(cols+1):
            u=c/cols-.5; row.append(bm.verts.new((u*2*w, .17+.16*t+.03*math.sin(u*9)*t, z)))
        V.append(row)
    for r in range(rows):
        for c in range(cols): bm.faces.new((V[r][c],V[r][c+1],V[r+1][c+1],V[r+1][c]))
    me=bpy.data.meshes.new('cape'); bm.to_mesh(me); bm.free(); o=bpy.data.objects.new('cape',me); bpy.context.collection.objects.link(o)
    me.materials.append(M['cape'])
    for p in me.polygons: p.use_smooth=True
    g={n:o.vertex_groups.new(name=n) for n in ('chest','cape1','cape2')}
    for r in range(rows+1):
        t=r/rows
        for c in range(cols+1):
            vi=r*(cols+1)+c
            g['chest'].add([vi],max(0,1-t*2.2),'REPLACE'); g['cape1'].add([vi],max(0,1-abs(t-.35)*2.6),'REPLACE'); g['cape2'].add([vi],max(0,min(1,(t-.3)*2.2)),'REPLACE')
    sm=o.modifiers.new('sol','SOLIDIFY'); sm.thickness=.012
    parts.append(o)
cape()
# cajado: haste + caveira na ponta (olhos verdes)
def pt(t): return HND+SD*t
cone(pt(.1),.02,.02,2.3,'wood','staff',rot=(0,STA,0),seg=8)
sk=pt(1.27)
sphere(sk,.095,(.95,1,1.02),'bone','staff',12); box(sk+Vector((0,-.015,-.085)),(.07,.06,.04),'bone','staff')
for dx in (-.034,.034):
    sphere(sk+Vector((dx,-.082,.015)),.027,(1,.5,1.2),'dark','staff',8)
    sphere(sk+Vector((dx,-.094,.015)),.017,(1,.6,1),'glow','staff',6)
sphere(sk+Vector((0,-.092,-.03)),.013,(1,.5,1.4),'dark','staff',6)

# junta tudo em uma malha só e liga ao esqueleto
bpy.ops.object.select_all(action='DESELECT')
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
for o in parts:
    for m in [x for x in o.modifiers]:
        bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=m.name)
bpy.ops.object.select_all(action='DESELECT')
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
body = bpy.context.object; body.name='Necromante'
mod = body.modifiers.new('Armature','ARMATURE'); mod.object = arm
body.parent = arm

# ───────── animações ─────────
FPS = 24; sc.render.fps = FPS
pb = arm.pose.bones
for b in pb: b.rotation_mode='XYZ'
def reset():
    for b in pb: b.rotation_euler=(0,0,0); b.location=(0,0,0)
def key(frame):
    for b in pb:
        b.keyframe_insert('rotation_euler',frame=frame)
        if b.name in ('root','hips'): b.keyframe_insert('location',frame=frame)
def newact(name, n):
    a = bpy.data.actions.new(name); a.use_fake_user=True
    arm.animation_data_create(); arm.animation_data.action=a
    sc.frame_start=1; sc.frame_end=n; reset(); return a
def R(b,x=0,y=0,z=0): pb[b].rotation_euler=(x,y,z)
def bake(name, n, fn, loop=True, step=1):
    newact(name,n)
    for f in range(1,n+1,step):
        reset(); t=(f-1)/(n-1 if not loop else n); fn(t); key(f)
    if loop:  # fecha o ciclo com o primeiro quadro
        reset(); fn(1.0 if False else 0.0); key(n+1)
        arm.animation_data.action.frame_range  # noqa
    return arm.animation_data.action
sin=math.sin; cos=math.cos; tau=2*math.pi
def idle(t):
    p=tau*t
    pb['hips'].location=(0,.01*sin(p),0); R('spine',-.02*sin(p)); R('chest',-.03*sin(p+.4)); R('head',.03*sin(p-.6),0,.04*sin(p*.5))
    R('arm.L',0,0,-.04*sin(p)); R('forearm.L',-.08-.04*sin(p+.5)); R('forearm.R',-.05); R('arm.R',0,0,.02*sin(p))
    for k,(a,b) in {'F':(1,0),'B':(1,0),'L':(0,1),'R':(0,1)}.items(): R(f'skirt.{k}',.04*sin(p+(0 if k in 'FL' else 1.6)),0,.03*sin(p+1))
    R('cape1',.05*sin(p+.8)); R('cape2',.09*sin(p+1.4)); R('staff',0,0,.01*sin(p)); pb['orb'].location=(0,.015*sin(p*2),0)
def walk(t):
    p=tau*t; s=sin(p); c=cos(p)
    pb['hips'].location=(0,-.03*abs(c)+.015,0); R('hips',0,0,.05*s); R('spine',-.05,0,-.06*s); R('chest',-.04,0,-.05*s); R('head',.03,0,.06*s)
    for sd,ph in (('L',0),('R',math.pi)):
        q=sin(p+ph); R(f'thigh.{sd}',-.3*q); R(f'shin.{sd}',max(0,.45*sin(p+ph+1.0))+.03,0,0); R(f'foot.{sd}',.12*q-.05*max(0,sin(p+ph+1)))
    R('arm.L',.55*sin(p+math.pi)); R('forearm.L',-.25-.2*max(0,sin(p+math.pi)))
    R('arm.R',.12*sin(p)); R('forearm.R',-.1)
    for k in SK:
        fw = {'F':1,'B':-1,'L':0,'R':0}[k]
        R(f'skirt.{k}',{'F':-.22*abs(s),'B':.22*abs(s),'L':0,'R':0}[k],0,.04*s*(1 if k in 'LR' else 0))
    R('cape1',.25+.1*sin(p+.6)); R('cape2',.2+.18*sin(p+1.3)); pb['orb'].location=(0,.02*sin(p*2),0)
def cast(t):  # one-shot: t em 0..1
    e=sin(min(1,t/.35)*math.pi/2) if t<.35 else (1-(t-.35)/.65)**1.5
    R('spine',-.12*e); R('chest',-.1*e); R('head',-.08*e)
    R('arm.L',-1.55*e,0,-.2*e); R('forearm.L',-.25*e); R('hand.L',-.2*e)
    R('arm.R',-.5*e); R('forearm.R',-.15-.5*e); R('staff',-.25*e)
    pb['orb'].location=(0,.02*e,0)
    for k in SK: R(f'skirt.{k}',-.12*e*(1 if k=='F' else -1))
    R('cape1',.2*e); R('cape2',.3*e); pb['hips'].location=(0,-.02*e,0)
def death(t):  # one-shot: cai para trás
    e=min(1,t/.7); e2=e*e*(3-2*e); k=max(0,(t-.7)/.3)
    R('root',math.pi/2*e2*.97); pb['root'].location=(0,.27*e2,0)
    R('hips',-.2*e2); R('spine',.2*e2); R('head',.25*e2); R('thigh.L',-.5*e2); R('thigh.R',-.3*e2); R('shin.L',.6*e2); R('shin.R',.3*e2)
    R('arm.L',-.5*e2,0,-.7*e2); R('arm.R',.3*e2,0,.5*e2); R('forearm.L',-.3*e2); R('forearm.R',-.2*e2); R('staff',0,0,1.35*e2)
    for kk in SK: R(f'skirt.{kk}',.5*e2)
    R('cape1',-.3*e2); R('cape2',-.5*e2); pb['orb'].location=(0,-.05*k,0)
def bakeonce(name,n,fn):
    newact(name,n)
    for f in range(1,n+1): reset(); fn((f-1)/(n-1)); key(f)
bake('idle',49,idle); bake('walk',25,walk)
bakeonce('cast',16,cast); bakeonce('death',36,death)
arm.animation_data.action=bpy.data.actions['idle']; sc.frame_start=1; sc.frame_end=49; reset()

# ───────── export ─────────
if os.environ.get('NO_EXPORT')!='1':
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'necromante.glb'), export_format='GLB', export_animations=True,
        export_animation_mode='ACTIONS', export_skins=True, export_yup=True, export_apply=False, export_force_sampling=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'necromante.blend'))
print('OK', len(body.data.vertices), 'verts', len(body.data.polygons), 'faces', [a.name for a in bpy.data.actions])
