"""Blender: --background --python bone_shard.py

Estilhaço de osso do Tiro de Osso com Estilhaços. Mesma paleta do projétil base
(marfim #f1e5c4, borda #697b80): uma saliência larga atrás, haste curta e ponta
partida em três lascas, para diferenciar do osso inteiro do tiro comum.
O eixo do osso é +X; a ponta fica no lado positivo.
"""
import os
import sys
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import common as C
from common import *

reset_scene()
mat('shard', '#f1e5c4', gain=1.0)
mat('shard_light', '#fff7df', gain=1.0)

# Saliência traseira: dois nós achatados, mais largos que a haste.
for y in (-.042, .042):
    sphere((-.24, y, 0), .062, (1, 1, .8), 'shard', 'shard', 12)
sphere((-.19, 0, 0), .055, (1.2, 1, .8), 'shard', 'shard', 10)
# Haste afunilando até a quebra.
seg((-.19, 0, 0), (.10, 0, 0), .048, .040, 'shard', 'shard', 8, True)
# Ponta partida: lasca principal longa e duas laterais curtas, facetadas.
seg((.09, 0, .004), (.36, 0, 0), .044, .002, 'shard', 'shard', 6)
seg((.07, .024, .012), (.25, .068, .018), .032, .002, 'shard_light', 'shard', 5)
seg((.06, -.026, -.006), (.22, -.064, -.012), .030, .002, 'shard', 'shard', 5)
# Faixa clara no dorso, para a direção do voo continuar legível na escala do jogo.
seg((-.16, 0, .036), (.20, 0, .022), .014, .006, 'shard_light', 'shard', 5)

bpy.ops.object.select_all(action='DESELECT')
for o in C.PARTS: o.select_set(True)
bpy.context.view_layer.objects.active = C.PARTS[0]
bpy.ops.object.join()
shard = bpy.context.object; shard.name = 'BoneShard'

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=os.path.join(HERE, 'bone_shard.glb'), export_format='GLB', export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'bone_shard.blend'))
print('BONE_SHARD_OK', len(shard.data.vertices), flush=True)
