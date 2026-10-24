# Renderiza spritesheet 8 direções (vista de cima ~35°) do necromante
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, math, json, toon
from mathutils import Vector
from PIL import Image
blend, outdir = sys.argv[1], sys.argv[2]
NAME = sys.argv[3] if len(sys.argv)>3 else 'necromante'
CELL, SS, PPU, PITCH, ANCHOR_Y = 224, 2, 56, 35, 165
A3=os.environ.get('ANIM3','cast')
ANIMS = [('idle',8,6,True),('walk',10,12,True),(A3,8,16,False),('death',10,12,False)]
os.makedirs(outdir, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene; arm = bpy.data.objects['Rig']
sc.view_settings.view_transform='Standard'; sc.render.engine='CYCLES'; sc.cycles.samples=20; sc.cycles.device='CPU'; sc.cycles.use_denoising=False
sc.render.film_transparent=True; sc.render.resolution_x=CELL*SS; sc.render.resolution_y=CELL*SS; sc.render.image_settings.color_mode='RGBA'
w=bpy.data.worlds.new('w'); w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(.35,.3,.5,1); w.node_tree.nodes['Background'].inputs[1].default_value=.9; sc.world=w
if os.environ.get('TOON','1')=='1': toon.toonify(sc, thick=1.5, line=(0,0,0))
def light(kind, loc, energy, col, size=3):
    bpy.ops.object.light_add(type=kind, location=loc); l=bpy.context.object; l.data.energy=energy; l.data.color=col
    if kind=='AREA': l.data.size=size
    l.rotation_euler=(Vector((0,0,.9))-l.location).to_track_quat('-Z','Y').to_euler()
light('AREA',(-2,-3.5,5),320,(1,.95,1),4); light('AREA',(3,2,3),120,(.6,.4,1),3)
bpy.ops.object.camera_add(); cam=bpy.context.object; sc.camera=cam; cam.data.type='ORTHO'; cam.data.ortho_scale=CELL/PPU
d=12; p=math.radians(PITCH)
# o pé do personagem (0,0,0) deve cair em ANCHOR_Y; o centro da imagem fica em CELL/2 -> deslocar alvo
off = (CELL/2-ANCHOR_Y)/PPU  # unidades de tela acima do pé
fwd=Vector((0,math.cos(p),-math.sin(p)))  # direção de olhar
up=Vector((0,math.sin(p),math.cos(p)))
tgt=up*off*-1  # alvo desloca para cima na tela => câmera mira acima
cam.location = tgt - fwd*d
cam.rotation_euler = ((tgt)-cam.location).to_track_quat('-Z','Y').to_euler()
tgt_s = Vector((0,0,0)) + up*(ANCHOR_Y-CELL/2)/PPU
cam.location = tgt_s - fwd*d; cam.rotation_euler = (tgt_s-cam.location).to_track_quat('-Z','Y').to_euler()
rows=[]; meta={'cell':CELL,'ppu':PPU,'anchorX':CELL//2,'anchorY':ANCHOR_Y,'dirs':8,'anims':{}}
tmp=os.path.join(outdir,'_f.png'); sc.render.filepath=tmp
frames={}
for ai,(an,n,fps,loop) in enumerate(ANIMS):
    act=bpy.data.actions[an]; arm.animation_data.action=act
    f0,f1=1,int(act.frame_range[1]) if loop else int(act.frame_range[1])
    if loop: f1=int(act.frame_range[1])-0  # inclui quadro de fechamento; amostra sem repetir
    L = (f1-f0+1) if loop else (f1-f0)
    meta['anims'][an]={'n':n,'fps':fps,'loop':loop,'row':ai*8}
    for di in range(8):
        theta=math.radians(di*45)          # ângulo do jogo (x direita, y para baixo)
        arm.rotation_euler=(0,0,math.radians(90)-theta)
        for fi in range(n):
            t = fi/n if loop else fi/(n-1)
            fr = f0 + t*(L-1 if not loop else L-1)
            sc.frame_set(int(math.floor(fr)), subframe=fr-math.floor(fr))
            bpy.ops.render.render(write_still=True)
            im=Image.open(tmp).convert('RGBA').resize((CELL,CELL),Image.LANCZOS); im.load()
            frames[(ai*8+di,fi)]=im.copy()
    print('anim',an,'ok',flush=True)
cols=max(a[1] for a in ANIMS); sheet=Image.new('RGBA',(cols*CELL,32*CELL),(0,0,0,0))
for (r,c),im in frames.items(): sheet.paste(im,(c*CELL,r*CELL))
sheet.save(os.path.join(outdir,NAME+'_sheet.png'),optimize=True)
sheet.save(os.path.join(outdir,NAME+'_sheet.webp'),quality=82,method=6)
json.dump(meta,open(os.path.join(outdir,NAME+'_sheet.json'),'w'))
os.remove(tmp); print('DONE',sheet.size)
