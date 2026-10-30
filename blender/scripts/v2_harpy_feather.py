"""Pena arremessada pela harpia (projétil hostil da v2); cria somente saídas novas v2_harpy_feather.*.
blender --background --threads 4 --python blender/scripts/v2_harpy_feather.py
Eixo +X (ponta da pena), topo +Z, comprimento 0,86 u. Sem rig, câmeras, luzes ou recursos externos no GLB.
Num Blender aberto (MCP) defina REVIEW=True antes de executar: a pena vai para a coleção 'HarpyFeatherReview' da cena
atual, sem limpar a cena nem gravar arquivos.
"""
from pathlib import Path
import math,sys,bpy,bmesh
BASE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(BASE/'scripts'))
import common as C
REVIEW=globals().get('REVIEW',False)
if not REVIEW:C.reset_scene()
tag='Review' if REVIEW else ''
C.mat('FeatherQuill','#e9dcc0',gain=1.0)
C.mat('FeatherRoot','#c9a876',gain=1.0)
C.mat('FeatherVane','#8a5a36',gain=1.0)
C.mat('FeatherTip','#3d2616',gain=1.0)
LENGTH=.86;STATIONS=14;HALF=.105
def width(t):
    # Largura da lâmina em t=0 (base) a 1 (ponta): sobe depressa, fica larga no meio e afila até a ponta.
    return HALF*math.sin(math.pi*min(1,t**.7))**.8
# Lâmina: tira de losangos em volta do cálamo, com as barbas varridas para trás e a borda levemente curvada.
mesh=bpy.data.meshes.new('HarpyFeatherVane'+tag);bm=bmesh.new()
rows=[]
for i in range(STATIONS+1):
    t=i/STATIONS;x=-LENGTH/2+t*LENGTH;w=width(t)*(1-.13*(i%2)*(3<=i<=STATIONS-3))   # recortes nas barbas
    row=[]
    for side in (1,-1):
        wy=w*(1.0 if side==1 else .72)   # o lado de trás da pena é mais estreito, como numa pena de voo
        row.append(bm.verts.new((x-wy*.55,side*wy,-.018*(wy/HALF))))
    row.insert(1,bm.verts.new((x,0,.012)))
    rows.append(row)
mats={0:'FeatherRoot',1:'FeatherVane',2:'FeatherTip'}
for i in range(STATIONS):
    for a,b in ((0,1),(1,2)):
        f=bm.faces.new((rows[i][a],rows[i][b],rows[i+1][b],rows[i+1][a]))
        f.material_index=0 if i<3 else 1 if i<STATIONS-4 else 2
bm.to_mesh(mesh);bm.free()
vane=bpy.data.objects.new('HarpyFeatherVane'+tag,mesh);bpy.context.collection.objects.link(vane)
for m in ('FeatherRoot','FeatherVane','FeatherTip'):vane.data.materials.append(C.MATS[m])
solid=vane.modifiers.new('Espessura','SOLIDIFY');solid.thickness=.012;solid.offset=0
bpy.context.view_layer.objects.active=vane;vane.select_set(True)
bpy.ops.object.modifier_apply(modifier=solid.name);vane.select_set(False)
for p in vane.data.polygons:p.use_smooth=False
vane.vertex_groups.new(name='feather').add(range(len(vane.data.vertices)),1.0,'REPLACE')
C.PARTS.append(vane)
# Cálamo: haste fina e afilada, saindo um pouco além da base da lâmina.
C.seg((-LENGTH/2-.07,0,.006),(LENGTH/2-.05,0,.012),.016,.006,'FeatherQuill','feather',6,True)
if REVIEW:
    parts=list(C.PARTS);C.PARTS.clear()
    for o in parts:o.name=o.name+tag if not o.name.endswith(tag) else o.name
else:
    bpy.ops.object.select_all(action='DESELECT')
    for o in C.PARTS:o.select_set(True)
    bpy.context.view_layer.objects.active=C.PARTS[0]
    bpy.ops.object.join()
    feather=bpy.context.object;feather.name='V2HarpyFeather'
    bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'models/v2_harpy_feather.blend'))
    bpy.ops.export_scene.gltf(filepath=str(BASE/'exports/v2_harpy_feather.glb'),export_format='GLB',use_selection=True,export_yup=True)
    print('V2_HARPY_FEATHER_OK',len(feather.data.vertices))
