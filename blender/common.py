# Utilitários comuns: materiais, esqueleto, malhas rígidas por osso, animação e exportação
import bpy, bmesh, math, os
from mathutils import Vector
sin=math.sin; cos=math.cos; tau=2*math.pi
PARTS=[]; MATS={}; BONES={}; ARM=None; PB=None
def reset_scene():
    global PARTS, MATS, BONES, ARM, PB
    bpy.ops.wm.read_factory_settings(use_empty=True); PARTS=[]; MATS={}; BONES={}; ARM=None; PB=None
def hexc(h): h=h.lstrip('#'); return tuple(((int(h[i:i+2],16)/255)**2.2) for i in (0,2,4))
def mat(name, hexcol, rough=.85, emit=None, es=0.0, gain=None, metal=0.0):
    m=bpy.data.materials.new(name); m.use_nodes=True; b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*hexc(hexcol),1); b.inputs['Roughness'].default_value=rough; b.inputs['Metallic'].default_value=metal
    if emit: b.inputs['Emission Color'].default_value=(*hexc(emit),1); b.inputs['Emission Strength'].default_value=es
    if gain is not None: m['toon_gain']=gain
    MATS[name]=m; return m
def bone(n,h,t,p=None): BONES[n]=(Vector(h),Vector(t),p)
def build_rig():
    global ARM, PB
    bpy.ops.object.armature_add(enter_editmode=True, location=(0,0,0)); arm=bpy.context.object; arm.name='Rig'; ad=arm.data
    for b in list(ad.edit_bones): ad.edit_bones.remove(b)
    for n,(h,t,p) in BONES.items():
        e=ad.edit_bones.new(n); e.head=h; e.tail=t
        if p: e.parent=ad.edit_bones[p]
    for n,(h,t,p) in BONES.items():
        e=ad.edit_bones[n]; d=(t-h).normalized(); e.align_roll(Vector((0,0,1)) if abs(d.y)>.7 else Vector((0,1,0)))
    bpy.ops.object.mode_set(mode='OBJECT'); ARM=arm; PB=arm.pose.bones; return arm
# ── malhas ──
def _apply(o):
    bpy.context.view_layer.objects.active=o; o.select_set(True)
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True); o.select_set(False)
def _fin(o,m,bone_w,smooth):
    o.data.materials.append(MATS[m])
    for p in o.data.polygons: p.use_smooth=smooth
    if isinstance(bone_w,str): bone_w={bone_w:1.0}
    for b,w in bone_w.items():
        g=o.vertex_groups.new(name=b); g.add(range(len(o.data.vertices)),w,'REPLACE')
    PARTS.append(o); return o
def sphere(loc,r,sc=(1,1,1),m='skin',bone='chest',seg=12,smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=max(6,seg//2),radius=r,location=loc); o=bpy.context.object; o.scale=sc; _apply(o); return _fin(o,m,bone,smooth)
def cone(loc,r1,r2,d,m='skin',bone='chest',rot=(0,0,0),seg=10,smooth=False,sc=(1,1,1)):
    bpy.ops.mesh.primitive_cone_add(vertices=seg,radius1=r1,radius2=r2,depth=d,location=loc,rotation=rot); o=bpy.context.object; o.scale=sc; _apply(o); return _fin(o,m,bone,smooth)
def box(loc,s,m='skin',bone='chest',rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rot); o=bpy.context.object; o.scale=s; _apply(o); return _fin(o,m,bone,False)
def torus(loc,R,r,m='bone',bone='chest',sc=(1,1,1),rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R,minor_radius=r,major_segments=14,minor_segments=6,location=loc,rotation=rot); o=bpy.context.object; o.scale=sc; _apply(o); return _fin(o,m,bone,False)
def seg(p1,p2,r1,r2,m,bone,sg=8,smooth=False):
    a=Vector(p1); b=Vector(p2); d=b-a
    return cone((a+b)/2,r1,r2,d.length,m,bone,rot=d.to_track_quat('Z','Y').to_euler(),seg=sg,smooth=smooth)
def finish(name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in PARTS: o.select_set(True)
    bpy.context.view_layer.objects.active=PARTS[0]; bpy.ops.object.join(); body=bpy.context.object; body.name=name
    mod=body.modifiers.new('Armature','ARMATURE'); mod.object=ARM; body.parent=ARM; return body
# ── animação ──
def init_anim(scene, fps=24):
    scene.render.fps=fps
    for b in PB: b.rotation_mode='XYZ'
def reset():
    for b in PB: b.rotation_euler=(0,0,0); b.location=(0,0,0)
def R(b,x=0,y=0,z=0): PB[b].rotation_euler=(x,y,z)
def key(frame):
    for b in PB:
        b.keyframe_insert('rotation_euler',frame=frame)
        if b.name in ('root','hips'): b.keyframe_insert('location',frame=frame)
def newact(name):
    a=bpy.data.actions.new(name); a.use_fake_user=True; ARM.animation_data_create(); ARM.animation_data.action=a; reset(); return a
def bake_loop(name,n,fn):
    newact(name)
    for f in range(1,n+1): reset(); fn((f-1)/n); key(f)
    reset(); fn(0.0); key(n+1)
def bake_once(name,n,fn):
    newact(name)
    for f in range(1,n+1): reset(); fn((f-1)/(n-1)); key(f)
def export(outdir,name,scene,default='idle',endf=49):
    ARM.animation_data.action=bpy.data.actions[default]; reset()
    os.makedirs(outdir,exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(outdir,name+'.glb'),export_format='GLB',export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True,export_apply=False,export_force_sampling=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(outdir,name+'.blend'))
