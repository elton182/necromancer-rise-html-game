"""Empacota e verifica apenas o protótipo; não modifica o HTML do jogo."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
BASE=Path(__file__).resolve().parents[1]
board=Image.new('RGB',(1200,760),'#242b30');draw=ImageDraw.Draw(board)
for index,name in enumerate(['flora_druid','flora_werewolf']):
    meta=json.loads((BASE/'spritesheets'/f'{name}_sheet.json').read_text())
    atlas=Image.new('RGBA',(896,1792))
    for di in range(8):
        for fi in range(4):
            im=Image.open(BASE/'frames'/name/f'{di}_{fi}.png').convert('RGBA')
            bbox=im.getchannel('A').getbbox()
            assert bbox and bbox[0]>1 and bbox[1]>1 and bbox[2]<223 and bbox[3]<223,(name,di,fi,bbox)
            atlas.paste(im,(fi*224,di*224))
    atlas.save(BASE/'spritesheets'/f'{name}_sheet.webp',lossless=True)
    hero=Image.open(BASE/'previews'/f'{name}.png').convert('RGBA')
    hero.thumbnail((512,512),Image.Resampling.LANCZOS)
    board.paste(hero,(index*600+44,36),hero)
    draw.text((index*600+38,22),'FLORA / DRUIDA' if index==0 else 'FLORA / LOBISOMEM',fill='#e8dbb6')
    for j,bg in enumerate(['#ded5bf','#161d25']):
        x=index*600+45+j*270;draw.rectangle((x,560,x+250,738),fill=bg)
        for k,size in enumerate([64,96,144]):
            sprite=Image.open(BASE/'frames'/name/'1_0.png').convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)
            board.paste(sprite,(x+3+k*72,710-size),sprite)
        draw.text((x+8,720),'64 / 96 / 144 px',fill='#9b916f')
board.save(BASE/'previews'/'flora_prototype_board.png')
print('64 quadros verificados: RGBA, conteudo e margens; dois atlas 896 x 1792.')
