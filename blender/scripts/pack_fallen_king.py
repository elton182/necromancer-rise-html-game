"""Valida, empacota e incorpora os atlas do Rei Caído; gera a prancha de revisão.

python blender/scripts/pack_fallen_king.py
Lê frames/frames_fallenKing (render_fallen_king.py). Reduz as células de 320 px
para 256 px (ppu e âncora proporcionais) e atualiza somente os registros
SPR.load('fallenKing') e SPR.load('fallenKingSlam') do HTML.
"""
import json, base64, re
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
HERE=Path(__file__).resolve().parents[1]
FRAMES=HERE/'frames/frames_fallenKing'
MASTER,CELL=320,256
game=HERE.parent/'necromancer-canvas.html';html=game.read_text(encoding='utf-8')
board_rows=[]
main_idle=json.loads((HERE/'spritesheets/fallenKing_sheet.json').read_text(encoding='utf-8'))['anims']['idle']
for key in ('fallenKing','fallenKingSlam'):
    meta=json.loads((HERE/f'spritesheets/{key}_sheet.json').read_text(encoding='utf-8'))
    # drawSprite sempre consulta 'idle'; o atlas do salto repete esses quadros no fim.
    if 'idle' not in meta['anims']:
        meta['anims']['idle']={**main_idle,'row':max(a['row'] for a in meta['anims'].values())+8}
    if meta['cell']==MASTER:  # só reduz o contrato vindo do render; reempacotar não reescala
        k=CELL/MASTER
        meta.update(cell=CELL,ppu=meta['ppu']*k,anchorX=meta['anchorX']*k,anchorY=meta['anchorY']*k)
    anims=meta['anims'];rows=max(a['row'] for a in anims.values())+8;cols=max(a['n'] for a in anims.values())
    assert rows*CELL<=16383 and cols*CELL<=16383,(key,rows,cols)
    sheet=Image.new('RGBA',(cols*CELL,rows*CELL))
    for name,a in anims.items():
        for di in range(8):
            # Pausas são intencionais (finalização do golpe); uma ação toda parada não é.
            previous=None;moved=False
            for fi in range(a['n']):
                with Image.open(FRAMES/f'{name}_{di}_{fi:02}.png') as im:
                    im=im.convert('RGBA');box=im.getchannel('A').getbbox()
                    if not box or min(box[0],box[1],MASTER-box[2],MASTER-box[3])<4:
                        raise ValueError(f'Quadro vazio ou cortado: {name} direção {di} quadro {fi}: {box}')
                    if previous is not None and ImageChops.difference(im,previous).getbbox():moved=True
                    previous=im.copy()
                    sheet.paste(im.resize((CELL,CELL),Image.Resampling.LANCZOS),(fi*CELL,(a['row']+di)*CELL))
            if a['n']>1 and not moved:raise ValueError(f'Ação sem movimento: {name} direção {di}')
    webp=HERE/f'spritesheets/{key}_sheet.webp'
    sheet.save(webp,quality=86,method=6)
    (HERE/f'spritesheets/{key}_sheet.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
    html=re.sub(r"\nSPR\.load\('"+key+r"',[^\n]+",'',html)
    payload=base64.b64encode(webp.read_bytes()).decode()
    record={k2:meta[k2] for k2 in ('cell','ppu','anchorX','anchorY','dirs','anims')}
    marker='\nfunction drawSprite(key,ref,o){';assert html.count(marker)==1
    html=html.replace(marker,"\nSPR.load('"+key+"',"+json.dumps(record,separators=(',',':'))+",'"+payload+"');"+marker)
    for name,a in anims.items():
        col=0 if name in ('idle','walk') else a['n']-1 if name in ('windup','death','slam_windup') else a['n']//2
        board_rows.append((name,[sheet.crop((col*CELL,(a['row']+di)*CELL,(col+1)*CELL,(a['row']+di+1)*CELL)) for di in range(8)]))
    print(key,f'{sum(a["n"] for a in anims.values())*8} quadros',sheet.size,f'{webp.stat().st_size//1024} KB')
# r+ preserva o arquivo aberto pelo observador do app desktop.
with game.open('r+',encoding='utf-8',newline='') as f:f.write(html);f.truncate()
size=128;board=Image.new('RGB',(8*size+110,len(board_rows)*(size+6)),'#26343b');draw=ImageDraw.Draw(board)
for r,(name,cells) in enumerate(board_rows):
    draw.text((6,r*(size+6)+size//2),name,fill='#e4d6b3')
    for di,im in enumerate(cells):
        board.paste(im.resize((size,size),Image.Resampling.LANCZOS),(110+di*size,r*(size+6)),im.resize((size,size)))
board.save(HERE/'previews/preview_fallen_king.png')
print('Atlas validados, incorporados e prancha gerada.')
