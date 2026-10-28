"""Empacota um estudo: Flora por padrão, --wolf ou --necro para as outras formas."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, sys

BASE=Path(__file__).resolve().parents[1]
name='necromante_art' if '--necro' in sys.argv else ('flora_werewolf' if '--wolf' in sys.argv else 'flora_druid')
meta=json.loads((BASE/'spritesheets'/f'{name}_sheet.json').read_text())
cell=meta['cell'];n=meta['anims']['idle']['n'];dirs=meta['dirs']
assert (cell,n,dirs)==(224,4,8)
atlas=Image.new('RGBA',(cell*n,cell*dirs))
frames=[];margins=[]
for di in range(dirs):
    direction=[]
    for fi in range(n):
        im=Image.open(BASE/'frames'/name/f'{di}_{fi}.png').convert('RGBA')
        assert im.size==(cell,cell)
        bbox=im.getchannel('A').getbbox()
        assert bbox and bbox[0]>1 and bbox[1]>1 and bbox[2]<cell-1 and bbox[3]<cell-1,(di,fi,bbox)
        margins.append(min(bbox[0],bbox[1],cell-bbox[2],cell-bbox[3]))
        atlas.paste(im,(fi*cell,di*cell));direction.append(im.tobytes())
        if fi==0:frames.append(im)
    assert len(set(direction))>1,('idle sem movimento',di)
atlas.save(BASE/'spritesheets'/f'{name}_sheet.webp',lossless=True)
assert Image.open(BASE/'spritesheets'/f'{name}_sheet.webp').size==atlas.size

def font(size):
    try:return ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',size)
    except OSError:return ImageFont.load_default(size=size)

board=Image.new('RGB',(1000,900),'#242a29');d=ImageDraw.Draw(board)
title={'flora_werewolf':'FLORA / LOBISOMEM','flora_druid':'FLORA / REVISÃO DE ARTE','necromante_art':'NECROMANTE / ESTUDO VIOLETA'}[name]
d.text((40,20),title,font=font(26),fill='#e6dfca')
d.text((40,62),'Oito direções • mesma câmera e âncora dos sprites do projeto',font=font(18),fill='#aab5a7')
for i,frame in enumerate(frames):
    x=32+(i%4)*240;y=94+(i//4)*236
    board.paste(frame,(x,y),frame)
    d.text((x+15,y+210),f'Direção {i}',font=font(15),fill='#b0baa8')
for j,bg in enumerate(['#e0d8c6','#151c23']):
    x=40+j*480;y=600
    d.rectangle((x,y,x+440,y+260),fill=bg)
    for k,ppu in enumerate([24,36,56]):
        size=round(cell*ppu/meta['ppu']);im=frames[2].resize((size,size),Image.Resampling.LANCZOS)
        # Alinhar a âncora do chão, mantendo o teste de escala visível.
        tx=round(x+(k+.5)*440/3-size/2);ty=y+210-round(meta['anchorY']*ppu/meta['ppu'])
        board.paste(im,(tx,ty),im)
        d.text((round(x+(k+.5)*440/3-27),y+237),f'{ppu} px/u',font=font(15),fill='#a38f69')
board.save(BASE/'previews'/f'{name}_review.png')
report={'frames':32,'atlas':list(atlas.size),'minimumTransparentMargin':min(margins),
        'directions':8,'animatedDirections':8,'artVersion':meta['artVersion'],
        'inGameValidation':False}
(BASE/'previews'/f'{name}_validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
