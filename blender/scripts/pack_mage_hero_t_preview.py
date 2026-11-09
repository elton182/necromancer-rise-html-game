"""Monta PNG e GIFs dos quadros de mage_hero_t_review.py, com Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'frames/mage_hero_t'
OUT=ROOT/'previews/mage_hero_t'
OUT.mkdir(parents=True,exist_ok=True)
CLIPS=['idle','walk','strafe_left','strafe_right','cast','cast_up','dodge','death']
paths={n:[p for p in sorted(SOURCE.glob(n+'_*.png')) if p.stem.rsplit('_',1)[0]==n] for n in CLIPS}
frames={n:[Image.open(p).convert('RGB') for p in paths[n]] for n in CLIPS}
size=256
sheet=Image.new('RGB',(size*5,(size+28)*8),(24,27,34))
draw=ImageDraw.Draw(sheet)
for row,name in enumerate(CLIPS):
    seq=frames[name]
    for col,t in enumerate([0,.25,.45,.7,1]):
        i=round(t*(len(seq)-1))
        sheet.paste(seq[i].resize((size,size)),(col*size,row*(size+28)+28))
        frame=int(paths[name][i].stem.rsplit('_',1)[1])
        draw.text((col*size+8,row*(size+28)+8),f'{name} / f{frame}',fill='white')
    # Primeiro e último quadros do loop são iguais; exclui a duplicata.
    loop=name in CLIPS[:4]
    sequence=seq[:-1] if loop else seq+[seq[-1]]*6
    sequence[0].save(OUT/(name+'.gif'),save_all=True,append_images=sequence[1:],duration=67,loop=0)
sheet.save(OUT/'poses.png')
combined=[]
for i in range(60):
    canvas=Image.new('RGB',(size*4,(size+26)*2),(24,27,34))
    d=ImageDraw.Draw(canvas)
    for k,name in enumerate(CLIPS):
        seq=frames[name]
        span=len(seq)-1 if name in CLIPS[:4] else len(seq)+9
        ix=min(i%span,len(seq)-1)
        x,y=(k%4)*size,(k//4)*(size+26)
        canvas.paste(seq[ix].resize((size,size)),(x,y+26))
        d.text((x+8,y+7),name,fill='white')
    combined.append(canvas)
combined[0].save(OUT/'animations.gif',save_all=True,append_images=combined[1:],duration=67,loop=0)
print(OUT)
