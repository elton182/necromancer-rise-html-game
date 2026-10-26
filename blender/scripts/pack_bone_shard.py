"""Pack the bone shard frames and embed the sheet in the standalone game."""
import base64, json, re, sys, os
from pathlib import Path
from PIL import Image

HERE=Path(__file__).resolve().parents[1]
for _folder in ('models', 'exports', 'frames', 'spritesheets', 'previews'):
    os.makedirs(os.path.join(HERE, _folder), exist_ok=True)
KEY='boneShard'
def pack():
    meta=json.loads((HERE/'spritesheets'/'bone_shard_sheet.json').read_text())
    cell=meta['cell']
    sheet=Image.new('RGBA',(meta['frames']*cell,meta['dirs']*cell))
    for row in range(meta['dirs']):
        for col in range(meta['frames']):
            with Image.open(HERE/'frames'/'frames_bone_shard'/f'{row:02}_{col:02}.png') as im:
                bounds=im.getchannel('A').getbbox()
                if not bounds or bounds[0]<=0 or bounds[1]<=0 or bounds[2]>=im.width or bounds[3]>=im.height:
                    raise ValueError(f'Empty or clipped frame: {row:02}_{col:02}')
                sheet.paste(im.resize((cell,cell),Image.Resampling.LANCZOS),(col*cell,row*cell))
    sheet.save(HERE/'spritesheets'/'bone_shard_sheet.webp',quality=86,method=6)
    # Review sheet: oito direções, giro na primeira, em fundo escuro e na escala 2x.
    board=Image.new('RGB',(8*cell*2,2*cell*2),'#271e39')
    for i in range(8):
        im=sheet.crop((0,i*2*cell,cell,(i*2+1)*cell)).resize((cell*2,cell*2),Image.Resampling.LANCZOS)
        board.paste(im,(i*cell*2,0),im)
    for i in range(meta['frames']):
        im=sheet.crop((i*cell,0,(i+1)*cell,cell)).resize((cell*2,cell*2),Image.Resampling.LANCZOS)
        board.paste(im,(i*cell*2,cell*2),im)
    board.save(HERE/'previews'/'preview_bone_shard.png')
    return meta

if __name__=='__main__':
    game=HERE.parent/'necromancer-canvas.html'
    meta=json.loads((HERE/'spritesheets'/'bone_shard_sheet.json').read_text()) if '--embed-only' in sys.argv else pack()
    payload=base64.b64encode((HERE/'spritesheets'/'bone_shard_sheet.webp').read_bytes()).decode()
    html=game.read_text(encoding='utf-8')
    html=re.sub(r"\nSPR\.load\('"+KEY+r"',[^\n]+",'',html)
    marker='\nfunction drawSprite(key,ref,o){'
    assert html.count(marker)==1
    html=html.replace(marker,"\nSPR.load('"+KEY+"',"+json.dumps(meta,separators=(',',':'))+",'"+payload+"');\n"+marker)
    pending=game.with_suffix('.html.pending')
    pending.write_text(html,encoding='utf-8')
    os.replace(pending,game)
    print('Packed and embedded',KEY,len(payload),'bytes')
