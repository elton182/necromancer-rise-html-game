"""Render the bone shard projectile; assemble with pack_bone_shard.py (system Python/Pillow).

blender --background --threads 4 --python render_bone_shard.py -- [preview]

O projétil voa na altura do peito e o jogo desloca a tela sem perspectiva,
então o osso fica no plano da imagem: 16 direções de tela, com a luz do toon
fixa, e 6 quadros de giro em torno do próprio eixo.
"""
import sys, os, math, json
import bpy
from mathutils import Vector, Matrix
HERE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for _folder in ('models', 'exports', 'frames', 'spritesheets', 'previews'):
    os.makedirs(os.path.join(HERE, _folder), exist_ok=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toon
from common import hexc
preview='preview' in sys.argv
CELL, SS, PPU, PITCH, DIRS, FRAMES = 96, 4, 56, 35, 16, 6
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'models', 'bone_shard.blend'))
sc=bpy.context.scene; shard=bpy.data.objects['BoneShard']
sc.view_settings.view_transform='Standard'
sc.render.engine='CYCLES'; sc.cycles.samples=4; sc.cycles.use_denoising=False
sc.render.film_transparent=True
sc.render.resolution_x=CELL*SS
sc.render.resolution_y=CELL*SS
sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
# Borda fina azul acinzentada, como no osso desenhado (#697b80); sem quinas internas.
toon.toonify(sc,thick=1.4,line=hexc('#697b80'))
lines=bpy.context.view_layer.freestyle_settings.linesets[0]
lines.select_crease=False
lines.select_border=False
bpy.ops.object.camera_add(); cam=bpy.context.object; sc.camera=cam
cam.data.type='ORTHO'; cam.data.ortho_scale=CELL/PPU
p=math.radians(PITCH); fwd=Vector((0,math.cos(p),-math.sin(p))); up=Vector((0,math.sin(p),math.cos(p)))
cam.location=-fwd*12; cam.rotation_euler=fwd.to_track_quat('-Z','Y').to_euler()
right=Vector((1,0,0)); toward=-fwd
out=os.path.join(HERE, 'frames', 'frames_bone_shard'); os.makedirs(out,exist_ok=True)
meta={'cell':CELL,'ppu':PPU,'anchorX':CELL//2,'anchorY':CELL//2,'dirs':DIRS,'frames':FRAMES,'fps':14}
for di in range(DIRS):
    # Ângulo do jogo: x para a direita, y para baixo na tela.
    theta=di*2*math.pi/DIRS
    ax=(right*math.cos(theta)-up*math.sin(theta)).normalized()
    side=toward.cross(ax).normalized()
    basis=Matrix((ax,side,toward)).transposed().to_4x4()
    for fi in range(FRAMES):
        if preview and fi!=0: continue
        shard.matrix_world=basis@Matrix.Rotation(fi*2*math.pi/FRAMES,4,'X')
        sc.render.filepath=os.path.join(out,f'{di:02}_{fi:02}.png')
        bpy.ops.render.render(write_still=True)
    print('FINISHED dir',di,flush=True)
with open(os.path.join(HERE, 'spritesheets', 'bone_shard_sheet.json'),'w') as f: json.dump(meta,f)
