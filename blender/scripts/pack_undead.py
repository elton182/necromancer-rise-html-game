"""Pack rendered frames and embed the two sprite sheets in the standalone game."""
import base64, json, re, sys, os
from pathlib import Path
from PIL import Image, ImageDraw

HERE=Path(__file__).resolve().parents[1]
for _folder in ('models', 'exports', 'frames', 'spritesheets', 'previews'):
    os.makedirs(os.path.join(HERE, _folder), exist_ok=True)
def pack(kind):
    meta=json.loads((HERE/'spritesheets'/(kind+'_sheet.json')).read_text())
    sheet=Image.new('RGBA',(2240,7168))
    for name,anim in meta['anims'].items():
        for direction in range(8):
            row=anim['row']+direction
            for col in range(anim['n']):
                with Image.open(HERE/'frames'/('frames_'+kind)/f'{row:02}_{col:02}.png') as im:
                    bounds=im.getchannel('A').getbbox()
                    if not bounds or bounds[0]<=0 or bounds[1]<=0 or bounds[2]>=im.width or bounds[3]>=im.height:
                        raise ValueError(f'Empty or clipped frame: {kind} {row:02}_{col:02}')
                    sheet.paste(im.resize((224,224),Image.Resampling.LANCZOS),(col*224,row*224))
    sheet.save(HERE/'spritesheets'/(kind+'_sheet.webp'),quality=82,method=6)
    return meta

if __name__=='__main__':
    game=HERE.parent/'necromancer-canvas.html'
    for kind in ('archer','specter'):
        if '--embed-only' not in sys.argv: pack(kind)
    html=game.read_text(encoding='utf-8')
    for kind in ('archer','specter'):
        meta=json.loads((HERE/'spritesheets'/(kind+'_sheet.json')).read_text())
        payload=base64.b64encode((HERE/'spritesheets'/(kind+'_sheet.webp')).read_bytes()).decode()
        html=re.sub(r"\nSPR\.load\('"+kind+r"',[^\n]+",'',html)
        marker='\nfunction drawSprite(key,ref,o){'
        assert html.count(marker)==1
        html=html.replace(marker,"\nSPR.load('"+kind+"',"+json.dumps(meta,separators=(',',':'))+",'"+payload+"');\n"+marker)
    pending=game.with_suffix('.html.pending')
    pending.write_text(html,encoding='utf-8')
    os.replace(pending,game)
    # Review sheet: front / three-quarter / rear / walking / attacking / death.
    shots=[(2,0),(1,0),(6,0),(10,3),(18,3),(26,9)]
    board=Image.new('RGB',(1344,520),'#271e39'); d=ImageDraw.Draw(board)
    for ri,kind in enumerate(('archer','specter')):
        with Image.open(HERE/'spritesheets'/(kind+'_sheet.webp')) as sheet:
            d.text((16,ri*260+10),kind.upper(),fill='#d0c5e5')
            for ci,(row,col) in enumerate(shots):
                im=sheet.crop((col*224+24,row*224+24,col*224+200,row*224+200)).resize((224,224),Image.Resampling.LANCZOS)
                board.paste(im,(ci*224,ri*260+30),im)
    board.save(HERE/'previews'/'preview_undead.png')
    print('Packed and embedded archer + specter')
