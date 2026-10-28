"""Validate and pack village NPCs, replacing only their SPR.load records."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
import json,re,base64,sys
HERE=Path(__file__).resolve().parents[1]
IDS={'bram':'smith','lysa':'elder','tilda':'tilda','merchant':'merch'}
only=next((arg.split('=',1)[1] for arg in sys.argv[1:] if arg.startswith('--only=')),None)
if only and only not in IDS:raise SystemExit('Unknown villager: '+only)
board=Image.new('RGB',(224*4,260*2),'#39352f');draw=ImageDraw.Draw(board)
game=HERE.parent/'necromancer-canvas.html';html=game.read_text()
packed=[]
for i,(ident,key) in enumerate(IDS.items()):
 if only and ident!=only:continue
 meta=json.loads((HERE/'spritesheets'/('villager_'+ident+'_sheet.json')).read_text())
 cell,dirs=meta['cell'],meta['dirs']
 cols=max(anim['n'] for anim in meta['anims'].values())
 rows=max(anim['row']+dirs for anim in meta['anims'].values())
 sheet=Image.new('RGBA',(cell*cols,cell*rows))
 for anim in meta['anims'].values():
  for direction in range(dirs):
   row=anim['row']+direction
   for col in range(anim['n']):
    path=HERE/'frames'/('frames_villager_'+ident)/f'{row:02}_{col:02}.png'
    with Image.open(path) as im:
     im=im.convert('RGBA');bounds=im.getchannel('A').getbbox()
     if im.size!=(cell,cell) or not bounds:raise ValueError(f'Empty frame: {path}')
     if cell==224 and (bounds[0]<=1 or bounds[1]<=1 or bounds[2]>=223 or bounds[3]>=223):raise ValueError(f'Clipped frame: {path}')
     sheet.paste(im,(col*cell,row*cell))
 # Motion must come from the frames, not a static image repeated across the row.
 if dirs==8:assert ImageChops.difference(sheet.crop((0,2*cell,cell,3*cell)),sheet.crop((3*cell,2*cell,4*cell,3*cell))).getbbox(),ident
 else:assert ImageChops.difference(sheet.crop((0,0,cell,cell)),sheet.crop((2*cell,cell,3*cell,2*cell))).getbbox(),ident
 path=HERE/'spritesheets'/('villager_'+ident+'_sheet.webp');sheet.save(path,quality=88,method=4)
 payload=base64.b64encode(path.read_bytes()).decode()
 record="SPR.load('"+key+"',"+json.dumps(meta,separators=(',',':'))+",'"+payload+"');"
 html,n=re.subn(r"SPR\.load\('"+key+r"',[^\n]+",lambda _:record,html)
 assert n==1,(key,n)
 packed.append(ident)
 if not only:
  idle=meta['anims']['idle'];greet=meta['anims'].get('greet') or meta['anims'].get('attack')
  for j,(anim,col) in enumerate(((idle,min(2,idle['n']-1)),(greet,min(4,greet['n']-1)))):
   im=sheet.crop((col*cell,anim['row']*cell,(col+1)*cell,(anim['row']+1)*cell)).resize((224,224),Image.Resampling.NEAREST)
   board.paste(im,(i*224,j*260+28),im);draw.text((i*224+12,j*260+10),ident+' '+('idle' if j==0 else 'greet'),fill='#e9d5ac')
if not only:board.save(HERE/'previews'/'preview_village_npcs.png')
pending=game.with_suffix('.html.pending');pending.write_text(html);pending.replace(game)
print('Embedded village sprites:', ', '.join(packed))
