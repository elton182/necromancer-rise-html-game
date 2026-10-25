"""Pack, validate and embed the Soul Warden atlas; generate a review board."""
import json,base64,re
from pathlib import Path
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent
meta=json.loads((HERE/'soulWarden_sheet.json').read_text())
# WebP dimensions must remain below 16384. Downsample the 320 px masters
# to 288 px cells and preserve world scale and foot anchor proportionally.
meta.update(cell=288,ppu=50.4,anchorX=144,anchorY=211.5)
sheet=Image.new('RGBA',(8*288,56*288))
for name,a in meta['anims'].items():
 for di in range(8):
  for fi in range(a['n']):
   row=a['row']+di
   with Image.open(HERE/'frames_soulWarden'/f'{row:02}_{fi:02}.png')as im:
    box=im.getchannel('A').getbbox()
    if not box or box[0]<=1 or box[1]<=1 or box[2]>=319 or box[3]>=319:raise ValueError(f'Clipped or empty {name} {di} {fi}: {box}')
    sheet.paste(im.resize((288,288),Image.Resampling.LANCZOS),(fi*288,row*288))
sheet.save(HERE/'soulWarden_sheet.webp',quality=86,method=6)
(HERE/'soulWarden_sheet.json').write_text(json.dumps(meta),encoding='utf-8')
game=HERE.parent/'necromancer-canvas.html';html=game.read_text(encoding='utf-8')
html=re.sub(r"\nSPR\.load\('soulWarden',[^\n]+",'',html)
payload=base64.b64encode((HERE/'soulWarden_sheet.webp').read_bytes()).decode()
marker='\nfunction drawSprite(key,ref,o){';assert html.count(marker)==1
html=html.replace(marker,"\nSPR.load('soulWarden',"+json.dumps(meta,separators=(',',':'))+",'"+payload+"');\n"+marker)
# r+ works with the live desktop file watcher and preserves the existing file.
with game.open('r+',encoding='utf-8',newline='')as f:f.write(html);f.truncate()
board=Image.new('RGB',(8*160,7*170),'#26343b');draw=ImageDraw.Draw(board)
for ai,(name,a)in enumerate(meta['anims'].items()):
 draw.text((8,ai*170+5),name,fill='#e4d6b3')
 for di in range(8):
  col=0 if name=='idle' else a['n']-1 if name in ('windup','death') else a['n']//2
  im=sheet.crop((col*288,(a['row']+di)*288,(col+1)*288,(a['row']+di+1)*288)).resize((160,160),Image.Resampling.LANCZOS)
  board.paste(im,(di*160,ai*170+10),im)
board.save(HERE/'preview_soul_warden.png')
print('Validated 320 frames, packed and embedded soulWarden')
