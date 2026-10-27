"""Outline, validate and embed five Blender character atlases; preserve the rest of the game.
python3 blender/pack_stylized_characters.py [--preview]
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageChops
import json,base64,re,sys
HERE=Path(__file__).resolve().parent
IDS={'bram':'smith','lysa':'elder','tilda':'tilda','merchant':'merch','zephyr':'necro'}
PREVIEW='--preview' in sys.argv

def outline(im):
 alpha=im.getchannel('A');dilated=alpha.filter(ImageFilter.MaxFilter(5));ink=Image.new('RGBA',im.size,(31,28,21,255));ink.putalpha(dilated);return Image.alpha_composite(ink,im)
board=Image.new('RGB',(5*320,3*350),'#8b9667');draw=ImageDraw.Draw(board)
html=(HERE.parent/'necromancer-canvas.html').read_text();count=0
for i,(ident,key) in enumerate(IDS.items()):
 if any(a.startswith('--only=') for a in sys.argv) and '--only='+ident not in sys.argv:continue
 meta=json.loads((HERE/('stylized_'+ident+'_render.json')).read_text());cell=meta['cell'];rows=8*len(meta['anims']);cols=max(a['n'] for a in meta['anims'].values())
 sheet=Image.new('RGBA',(cell*cols,cell*rows))
 folder=HERE/('frames_stylized_'+ident)
 for name,anim in meta['anims'].items():
  for direction in range(8):
   row=anim['row']+direction
   for col in range(anim['n']):
    if PREVIEW:continue
    path=folder/f'{row:02}_{col:02}.png'
    with Image.open(path) as im:
     im=im.convert('RGBA');bounds=im.getchannel('A').getbbox()
     if not bounds or bounds[0]<3 or bounds[1]<3 or bounds[2]>cell-3 or bounds[3]>cell-3:raise ValueError(f'Empty/clipped frame: {ident}/{name}/{direction}/{col}: {bounds}')
     sheet.paste(outline(im),(col*cell,row*cell));count+=1
 if not PREVIEW:
  # A real geometry animation must change both idle and action frames.
  for anim in meta['anims'].values():
   row=anim['row']+1;a=sheet.crop((0,row*cell,cell,(row+1)*cell));b=sheet.crop((cell*3,row*cell,cell*4,(row+1)*cell))
   assert ImageChops.difference(a,b).getbbox(),(ident,anim)
  runtime=json.loads(json.dumps(meta))
  if cell!=224:
   # Keep the original atlas dimensions while accommodating the sculpted silhouette.
   factor=224/cell;sheet=sheet.resize((224*cols,224*rows),Image.Resampling.LANCZOS)
   runtime.update(cell=224,ppu=round(meta['ppu']*factor,4),anchorX=112,anchorY=round(meta['anchorY']*factor,4))
  (HERE/('stylized_'+ident+'_sheet.json')).write_text(json.dumps(runtime,separators=(',',':')))
  path=HERE/('stylized_'+ident+'_sheet.webp');sheet.save(path,quality=90,method=4)
  payload=base64.b64encode(path.read_bytes()).decode();record="SPR.load('"+key+"',"+json.dumps(runtime,separators=(',',':'))+",'"+payload+"');"
  html,n=re.subn(r"SPR\.load\('"+key+r"',[^\n]+",lambda _:record,html);assert n==1,(key,n)
 for j,direction in enumerate([1,2,3]):
  path=folder/f'{direction:02}_00.png'
  with Image.open(path) as im:
   im=outline(im.convert('RGBA'));bounds=im.getchannel('A').getbbox();im=im.crop((bounds[0]-6,bounds[1]-6,bounds[2]+6,bounds[3]+6));im.thumbnail((290,300),Image.Resampling.NEAREST)
   # Enlarge the actual game pixels for visual review.
   im=im.resize((round(im.width*min(290/im.width,300/im.height)),round(im.height*min(290/im.width,300/im.height))),Image.Resampling.NEAREST)
   board.paste(im,(i*320+(320-im.width)//2,j*350+40),im);draw.text((i*320+15,j*350+15),ident+' / '+str(direction*45)+' deg',fill='#201e17')
board.save(HERE/'preview_stylized_characters.png')
if not PREVIEW:
 game=HERE.parent/'necromancer-canvas.html';pending=game.with_suffix('.html.pending');pending.write_text(html);pending.replace(game)
 print('Outlined, validated and embedded',count,'frames across five characters.')
else:print('Saved enlarged character review board.')
