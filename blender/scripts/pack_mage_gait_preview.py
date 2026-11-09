"""Prancha e GIF da locomoção do mago em três vistas; requer Pillow."""
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'previews/mage_gait';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'frames/mage_gait'
clips=['walk','strafe_left','strafe_right'];views=['front','right','iso']
labels={'walk':'Caminhada','strafe_left':'Passo lateral esquerdo','strafe_right':'Passo lateral direito'}
frames={(c,v):[Image.open(p).convert('RGB') for p in sorted(SOURCE.glob(f'{c}_{v}_*.png'))] for c in clips for v in views}
size=288
animation=[]
for i in range(12):
    canvas=Image.new('RGB',(size*3,(size+24)*3),(24,27,34));draw=ImageDraw.Draw(canvas)
    for col,c in enumerate(clips):
        for row,v in enumerate(views):
            x,y=col*size,row*(size+24);canvas.paste(frames[c,v][i].resize((size,size)),(x,y+24))
            draw.text((x+8,y+6),labels[c]+' / '+v,fill='white')
    animation.append(canvas.quantize(colors=128,dither=Image.Dither.NONE))
animation[0].save(OUT/'locomotion.gif',save_all=True,append_images=animation[1:],duration=[67,66,67]*4,loop=0)
focused=[]
for i in range(12):
    canvas=Image.new('RGB',(320*3,344),(24,27,34));draw=ImageDraw.Draw(canvas)
    for col,(c,v) in enumerate([('walk','right'),('strafe_left','front'),('strafe_right','front')]):
        canvas.paste(frames[c,v][i],(col*320,24));draw.text((col*320+8,6),labels[c],fill='white')
    focused.append(canvas.quantize(colors=128,dither=Image.Dither.NONE))
focused[0].save(OUT/'locomotion_focus.gif',save_all=True,append_images=focused[1:],duration=[67,66,67]*4,loop=0)
poses=Image.new('RGB',(size*5,(size+24)*3),(24,27,34));draw=ImageDraw.Draw(poses)
for row,c in enumerate(clips):
    for col,index in enumerate([0,3,6,9,12]):
        x,y=col*size,row*(size+24);poses.paste(frames[c,'iso'][index].resize((size,size)),(x,y+24))
        draw.text((x+8,y+6),labels[c]+f' / f{1+index*2}',fill='white')
poses.save(OUT/'poses.png')
print(OUT)
