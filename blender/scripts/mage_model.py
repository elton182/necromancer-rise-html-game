"""Variação de mago a partir do necromante; executar no Blender com --python."""
import sys as _asset_sys
from pathlib import Path as _AssetPath
_asset_sys.path.insert(0, str(_AssetPath(__file__).resolve().parent))
from asset_paths import asset_path

from pathlib import Path
import bpy, math
from mathutils import Vector
BASE = Path(__file__).resolve().parents[1]
# Carrega em cena independente, preservando a cena aberta.
scene = bpy.data.scenes.new('Mago')
bpy.context.window.scene = scene
with bpy.data.libraries.load(asset_path(str(BASE / 'models/v2_necromancer.blend')), link=False) as (src, dst):
    dst.objects = [n for n in src.objects if n not in ('Icosphere', 'Camera', 'Area')]
for o in dst.objects:
    scene.collection.objects.link(o)
arm = next(o for o in dst.objects if o.type == 'ARMATURE')
body = next(o for o in dst.objects if o.name.startswith('tripo'))
# Preserva explicitamente os quatro clipes, inclusive os não ativos na fonte.
with bpy.data.libraries.load(asset_path(str(BASE / 'models/v2_necromancer.blend')), link=False) as (src, clips):
    clips.actions = [n for n in src.actions if n in ('idle','walk','cast','death')]
arm.animation_data_create()
for action in clips.actions:
    action.use_fake_user = True
    track = arm.animation_data.nla_tracks.new()
    track.name = action.name.split('.')[0]
    track.strips.new(track.name, int(action.frame_range[0]), action)
    track.mute = True
    if track.name == 'idle': arm.animation_data.action = action
for b in arm.pose.bones: b.matrix_basis.identity()
bpy.context.view_layer.update()
# Achata apenas a ponta do capuz, formando a cobertura sob a aba.
inv = body.matrix_world.inverted()
for v in body.data.vertices:
    p = body.matrix_world @ v.co
    if p.z > 1.98:
        p.z = 1.98 + (p.z - 1.98) * .08
        v.co = inv @ p
mat = bpy.data.materials.new('Mago_Chapeu_Violeta'); mat.diffuse_color=(.18,.035,.42,1); mat.use_nodes=True
next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Base Color'].default_value=mat.diffuse_color
rings=[(0,0,1.985,.56),(0,0,2.025,.55),(0,0,2.07,.31),(0,0,2.20,.28),(.025,.015,2.42,.20),(.09,.025,2.65,.12),(.21,.025,2.80,.065),(.33,.025,2.81,.005)]
verts=[];faces=[];N=32
for x,y,z,r in rings:
    for j in range(N):
        a=math.tau*j/N
        verts.append((x+r*math.cos(a),y+r*.87*math.sin(a),z+.025*math.sin(a*2)*(r/.56)))
for k in range(len(rings)-1):
    for j in range(N): faces.append((k*N+j,k*N+(j+1)%N,(k+1)*N+(j+1)%N,(k+1)*N+j))
faces.append(tuple(reversed(range(N))));faces.append(tuple((len(rings)-1)*N+j for j in range(N)))
mesh=bpy.data.meshes.new('Mago_Chapeu');mesh.from_pydata(verts,[],faces);mesh.update()
hat=bpy.data.objects.new('SM_Mago_Chapeu',mesh);scene.collection.objects.link(hat);hat.data.materials.append(mat)
# Vínculo rígido ao osso da cabeça, preservando posição mundial.
mw=hat.matrix_world.copy();hat.parent=arm;hat.parent_type='BONE';hat.parent_bone='mixamorig:Head';bpy.context.view_layer.update();hat.matrix_world=mw
bpy.ops.object.select_all(action='DESELECT')
body.select_set(True);hat.select_set(True);bpy.context.view_layer.objects.active=hat
# Salva somente a cena do mago em biblioteca editável.
scene.frame_set(1)
bpy.data.libraries.write(asset_path(str(BASE/'models/mage.blend')),{scene},fake_user=True)
print('Mago salvo em',BASE/'models/mage.blend')

# Segunda direção visual: azul, ouro e barba de marfim.
def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Base Color'].default_value=m.diffuse_color
    return m
blue=material('Mago_Azul',(.025,.07,.28));gold=material('Mago_Ouro',(.7,.36,.055));ivory=material('Mago_Barba',(.82,.79,.67));brown=material('Mago_Couro',(.22,.09,.025))
hat.data.materials[0]=blue
# Desvia a ponta para uma dobra pronunciada.
for v in hat.data.vertices:
    if v.co.z>2.42: v.co.x-=1.25*(v.co.z-2.42)
# Substitui os tons violeta do atlas por azul sem perder seu sombreado.
for m in body.data.materials:
    if not m or not m.use_nodes: continue
    for n in m.node_tree.nodes:
        if n.type=='TEX_IMAGE' and n.image:
            import numpy as np
            im=n.image.copy();im.name='Mago_Atlas_Azul';n.image=im
            px=np.array(im.pixels[:],dtype=np.float32).reshape(-1,4)
            mask=(px[:,2]>px[:,1]*1.25)&(px[:,0]>px[:,1]*1.2)
            px[mask,0]*=.28;px[mask,1]*=1.25
            im.pixels.foreach_set(px.ravel());im.pack()
def attach(o,bone):
    # Deformação rígida preserva as dimensões e evita escala herdada do osso.
    vg=o.vertex_groups.new(name='mixamorig:'+bone);vg.add(list(range(len(o.data.vertices))),1.0,'REPLACE')
    mod=o.modifiers.new('Mago_Rig','ARMATURE');mod.object=arm

def cone(name,loc,r1,r2,depth,mat,scale=(1,1,1)):
    bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=r1,radius2=r2,depth=depth,location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat);attach(o,'Head');return o
cone('SM_Mago_Faixa_Chapeu',(0,0,2.15),.34,.305,.12,brown, (1,.87,1))
def box(name,loc,scale,mat,bone='Head'):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat);attach(o,bone);return o
for x,z,sx,sz in [(-.075,2.15,.025,.13),(.075,2.15,.025,.13),(0,2.21,.17,.025),(0,2.09,.17,.025),(0,2.15,.085,.018)]:box('SM_Mago_Fivela', (x,-.30,z),(sx,.025,sz),gold)
# Barba em tufos facetados, base larga e pontas separadas.
for x,z,r,d in [(0,1.50,.17,.43),(-.115,1.57,.095,.28),(.115,1.57,.095,.28),(0,1.33,.095,.23)]:
    cone('SM_Mago_Barba',(x,-.35,z),.005,r,d,ivory,(1,.6,1))
for x in [-.065,.065]:
    o=cone('SM_Mago_Bigode',(x,-.405,1.71),.025,.075,.14,ivory,(1,.5,1));o.rotation_euler[1]=-.65 if x<0 else .65
# Recolore o cristal do cajado.
for o in dst.objects:
 if o.type=='MESH' and 'Staff' in o.name:
  for m in o.data.materials:
   if m and m.use_nodes:
    for n in m.node_tree.nodes:
     if n.type=='TEX_IMAGE' and n.image:
      import numpy as np
      im=n.image.copy();n.image=im;px=np.array(im.pixels[:],dtype=np.float32).reshape(-1,4)
      mask=(px[:,2]>px[:,0]*.85)&(px[:,2]>px[:,1]*1.2)
      px[mask,0]*=.2;px[mask,1]=np.minimum(1,px[mask,2]*1.4);im.pixels.foreach_set(px.ravel());im.pack()
scene.frame_set(1)
bpy.data.libraries.write(asset_path(str(BASE/'models/mage.blend')),{scene},fake_user=True)




