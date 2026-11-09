"""Pranchas e GIFs da Flora humana, a partir dos renders; requer Pillow."""
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'previews/flora_human_review';OUT.mkdir(parents=True,exist_ok=True)
CLIPS=['idle','walk','strafe_left','strafe_right','cast','cast_up','slam','dodge','death']
paths={n:[p for p in sorted((ROOT/'frames/flora_human_review').glob(n+'_*.png')) if p.stem.rsplit('_',1)[0]==n] for n in CLIPS}
frames={n:[Image.open(p).convert('RGB') for p in paths[n]] for n in CLIPS}
size=224
sheet=Image.new('RGB',(size*5,(size+26)*len(CLIPS)),(24,27,34))
draw=ImageDraw.Draw(sheet)
for row,name in enumerate(CLIPS):
    seq=frames[name]
    for col,t in enumerate([0,.25,.45,.7,1]):
        i=round(t*(len(seq)-1));frame=int(paths[name][i].stem.rsplit('_',1)[1])
        sheet.paste(seq[i].resize((size,size)),(col*size,row*(size+26)+26))
        draw.text((col*size+8,row*(size+26)+7),f'{name} / f{frame}',fill='white')
    seq=(seq[:-1] if name in CLIPS[:4] else seq+[seq[-1]]*7)
    seq[0].save(OUT/(name+'.gif'),save_all=True,append_images=seq[1:],duration=67,loop=0)
sheet.save(OUT/'poses.png')
combined=[]
for i in range(48):
    canvas=Image.new('RGB',(size*3,(size+26)*3),(24,27,34));d=ImageDraw.Draw(canvas)
    for k,name in enumerate(CLIPS):
        seq=frames[name];span=len(seq)-1 if name in CLIPS[:4] else len(seq)+9
        ix=min(i%span,len(seq)-1);x,y=(k%3)*size,(k//3)*(size+26)
        canvas.paste(seq[ix].resize((size,size)),(x,y+26));d.text((x+8,y+7),name,fill='white')
    combined.append(canvas.quantize(colors=96,dither=Image.Dither.NONE))
combined[0].save(OUT/'animations.gif',save_all=True,append_images=combined[1:],duration=67,loop=0)
print(OUT)
