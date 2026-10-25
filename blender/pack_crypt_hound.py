"""Pack, validate and embed the Crypt Hound atlas; generate a review board."""
import json,base64,re
from pathlib import Path
from PIL import Image,ImageDraw
HERE=Path(__file__).resolve().parent
meta=json.loads((HERE/'cryptHound_sheet.json').read_text())
sheet=Image.new('RGBA',(6*224,56*224))
for name,a in meta['anims'].items():
 for di in range(8):
  for fi in range(a['n']):
   row=a['row']+di
   with Image.open(HERE/'frames_cryptHound'/f'{row:02}_{fi:02}.png')as im:
    box=im.getchannel('A').getbbox()
    if not box or box[0]<=1 or box[1]<=1 or box[2]>=223 or box[3]>=223:raise ValueError(f'Clipped or empty {name} {di} {fi}: {box}')
    sheet.paste(im,(fi*224,row*224))
sheet.save(HERE/'cryptHound_sheet.webp',quality=86,method=6)
game=HERE.parent/'necromancer-canvas.html';html=game.read_text(encoding='utf-8')
html=re.sub(r"\nSPR\.load\('cryptHound',[^\n]+",'',html)
payload=base64.b64encode((HERE/'cryptHound_sheet.webp').read_bytes()).decode()
marker='\nfunction drawSprite(key,ref,o){';assert html.count(marker)==1
html=html.replace(marker,"\nSPR.load('cryptHound',"+json.dumps(meta,separators=(',',':'))+",'"+payload+"');\n"+marker)
# r+ works with the live desktop file watcher and preserves the existing file.
with game.open('r+',encoding='utf-8',newline='')as f:f.write(html);f.truncate()
board=Image.new('RGB',(8*160,7*170),'#26343b');draw=ImageDraw.Draw(board)
for ai,(name,a)in enumerate(meta['anims'].items()):
 draw.text((8,ai*170+5),name,fill='#e4d6b3')
 for di in range(8):
  col=0 if name=='idle' else a['n']-1 if name in ('windup','death') else a['n']//2
  im=sheet.crop((col*224,(a['row']+di)*224,(col+1)*224,(a['row']+di+1)*224)).resize((160,160),Image.Resampling.LANCZOS)
  board.paste(im,(di*160,ai*170+10),im)
board.save(HERE/'preview_crypt_hound.png')
print('Validated 272 frames, packed and embedded cryptHound')
