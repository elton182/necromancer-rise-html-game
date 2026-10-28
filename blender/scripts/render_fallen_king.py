"""Renderiza o Rei Caído (Fallen King v4) em oito direções para os atlas do jogo.

blender --background --threads 4 --python blender/scripts/render_fallen_king.py -- preview
blender --background --threads 4 --python blender/scripts/render_fallen_king.py
python blender/scripts/pack_fallen_king.py

Célula-mestre de 320 px, 56 px/u e âncora (160, 215); o empacotador reduz para
256 px. O corpo é normalizado para 2,25 u de altura, como o player. Mantém os
materiais realçados da cena v4 (PBR com saturação/brilho ciano), não o toon.
"""
from pathlib import Path
import bpy, sys, json, math
from mathutils import Vector
BASE=Path(__file__).resolve().parents[1]
PREVIEW='preview' in sys.argv
bpy.ops.wm.open_mainfile(filepath=str(BASE/'models/boss_fallenKing_v4.blend'))
sc=bpy.context.scene
rig=next(o for o in sc.objects if o.type=='ARMATURE')
body=[o for o in sc.objects if o.type=='MESH' and o.parent==rig and o.parent_type!='BONE']
height=max((o.matrix_world@v.co).z for o in body for v in o.data.vertices)
rig.scale=(2.25/height,)*3
rig.rotation_mode='XYZ'  # o rig importado do glTF usa quatérnio e ignoraria rotation_euler
CELL,PPU,AX,AY=320,56,160,215
# (ação, quadros no atlas, fps no jogo, loop, atlas). O runtime conduz as ações
# de combate pelo tempo real de cada fase; o fps documenta essa duração.
ANIMS=[('idle',6,3,True,'main'),('walk',8,12,True,'main'),('windup',6,7.5,False,'main'),
       ('attack',7,23.3,False,'main'),('recover',6,12,False,'main'),('cast',8,6.67,False,'main'),
       ('death',10,6.25,False,'main'),('slam_windup',6,6,False,'slam'),('slam',9,12.5,False,'slam'),
       ('slam_recover',6,8,False,'slam')]
PREVIEW_FRAMES={'idle':[0],'windup':[5],'attack':[2],'slam':[6],'death':[9]}

sc.render.engine='CYCLES';sc.cycles.samples=16;sc.cycles.use_denoising=True
sc.render.resolution_x=sc.render.resolution_y=CELL;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
sc.render.film_transparent=True
sc.world=sc.world or bpy.data.worlds.new('Sprites')
sc.world.use_nodes=True
background=next(n for n in sc.world.node_tree.nodes if n.type=='BACKGROUND')
background.inputs[0].default_value=(.18,.22,.28,1);background.inputs[1].default_value=.38
bpy.ops.object.camera_add();cam=bpy.context.object;sc.camera=cam
cam.data.type='ORTHO';cam.data.ortho_scale=CELL/PPU
pitch=math.radians(35);forward=Vector((0,math.cos(pitch),-math.sin(pitch)))
target=Vector((0,math.sin(pitch),math.cos(pitch)))*(AY-CELL/2)/PPU
cam.location=target-forward*12;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
center=Vector((0,0,1.1))
# Iluminação da revisão de cores, mais forte para o sprite pequeno não virar mancha escura.
for offset,power in [((-2.5,-5,7.5),2600),((5,-2.5,2.5),1300),((0,5,5),2600)]:
    bpy.ops.object.light_add(type='AREA',location=center+Vector(offset))
    lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=5
    lamp.rotation_euler=(center-lamp.location).to_track_quat('-Z','Y').to_euler()

out=BASE/'frames/frames_fallenKing';out.mkdir(parents=True,exist_ok=True)
meta={'main':{},'slam':{}}
for name,n,fps,loop,sheet in ANIMS:
    action=bpy.data.actions[name];rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
    total=int(action['frames'])
    meta[sheet][name]=dict(n=n,fps=fps,loop=loop,row=len(meta[sheet])*8)
    for di in range(8):
        rig.rotation_euler=(0,0,math.radians(90-di*45))
        for fi in range(n):
            if PREVIEW and fi not in PREVIEW_FRAMES.get(name,[]):continue
            t=fi/n if loop else fi/(n-1)
            frame=1+t*(total if loop else total-1)
            sc.frame_set(math.floor(frame),subframe=frame-math.floor(frame))
            sc.render.filepath=str(out/f'{name}_{di}_{fi:02}.png');bpy.ops.render.render(write_still=True)
    print('FINISHED',name,flush=True)
if not PREVIEW:
    for sheet,anims in meta.items():
        key='fallenKing' if sheet=='main' else 'fallenKingSlam'
        data=dict(cell=CELL,ppu=PPU,anchorX=AX,anchorY=AY,dirs=8,anims=anims,source='models/boss_fallenKing_v4.blend')
        (BASE/f'spritesheets/{key}_sheet.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
