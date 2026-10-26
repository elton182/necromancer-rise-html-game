"""Pack and validate real Blender animation frames; embed core skins, publish optional variants.
python3 blender/pack_reference_characters.py [--only=bram,zephyr,skeleton]
"""
from pathlib import Path
from PIL import Image,ImageFilter,ImageChops,ImageDraw
import json,re,base64,sys
ROOT=Path(__file__).resolve().parent.parent;SOURCE=ROOT/'blender/reference';DEST=ROOT/'assets/characters/reference';DEST.mkdir(parents=True,exist_ok=True)
IDS=['bram','zephyr','skeleton','archer','skeleton_mage','raider','corrupted','shadow_wolf'];CORE={'bram':'smith','zephyr':'necro','skeleton':'skeleton','archer':'archer'}
selected=next((a.split('=',1)[1].split(',') for a in sys.argv if a.startswith('--only=')),IDS)
html=(ROOT/'necromancer-canvas.html').read_text();reports={}
for ident in selected:
 if ident=='bram':
  from bram_sprite_reference import extract
  runtime,blob=extract();(DEST/'bram.webp').write_bytes(blob);(DEST/'bram.json').write_text(json.dumps(runtime,separators=(',',':')))
  record="SPR.load('smith',"+json.dumps(runtime,separators=(',',':'))+",'"+base64.b64encode(blob).decode()+"');"
  html,n=re.subn(r"SPR\.load\('smith',[^\n]+",lambda _:record,html);assert n==1
  reports[ident]={'frames':1,'atlasSize':[320,320*4],'source':'blender/examples/image.png','staticReference':True,'parts':list(runtime['parts'])}
  continue
 meta=json.loads((SOURCE/(ident+'_render.json')).read_text());cell=meta['cell'];cols=max(a['n'] for a in meta['anims'].values());rows=8*len(meta['anims']);sheet=Image.new('RGBA',(cols*224,rows*224));checked=0
 for name,a in meta['anims'].items():
  frames=[]
  for di in range(8):
   for fi in range(a['n']):
    path=SOURCE/f'frames_{ident}/{a["row"]+di:02}_{fi:02}.png'
    with Image.open(path) as im:
     im=im.convert('RGBA');bounds=im.getchannel('A').getbbox()
     if not bounds or bounds[0]<2 or bounds[1]<2 or bounds[2]>cell-2 or bounds[3]>cell-2:raise ValueError(f'Clipped/empty: {ident}/{name}/{di}/{fi}: {bounds}')
     if di==1:frames.append(im.copy())
     # Fine colored silhouette; retain the clear internal bone gaps.
     alpha=im.getchannel('A');ink=Image.new('RGBA',im.size,(35,33,33,255));ink.putalpha(alpha.filter(ImageFilter.MaxFilter(3)));im=Image.alpha_composite(ink,im)
     sheet.paste(im.resize((224,224),Image.Resampling.LANCZOS),(fi*224,(a['row']+di)*224));checked+=1
  if len(frames)>1 and not any(ImageChops.difference(frames[0],f).getbbox() for f in frames[1:]):raise ValueError(f'Static animation: {ident}/{name}')
 runtime=json.loads(json.dumps(meta));factor=224/cell;runtime.update(cell=224,ppu=meta['ppu']*factor,anchorX=112,anchorY=meta['anchorY']*factor)
 # Conversation keeps the engine's original attack alias without allocating duplicate rows.
 if ident=='bram':runtime['anims']['attack']=runtime['anims']['greet'].copy()
 (DEST/(ident+'.json')).write_text(json.dumps(runtime,separators=(',',':')));sheet.save(DEST/(ident+'.webp'),quality=90,method=4)
 if ident in CORE:
  payload=base64.b64encode((DEST/(ident+'.webp')).read_bytes()).decode();record=f"SPR.load('{CORE[ident]}',"+json.dumps(runtime,separators=(',',':'))+",'"+payload+"');"
  html,n=re.subn(r"SPR\.load\('"+CORE[ident]+r"',[^\n]+",lambda _:record,html);assert n==1,(ident,n)
 reports[ident]={'frames':checked,'decodedBytes':sheet.width*sheet.height*4,'atlasSize':[sheet.width,sheet.height]}
(ROOT/'necromancer-canvas.html').write_text(html)
# JS catalogue avoids fetch/CORS on the standalone file:// entrypoint. Optional sheets remain lazy.
catalog={k:{'meta':json.loads((DEST/(k+'.json')).read_text()),'b64':base64.b64encode((DEST/(k+'.webp')).read_bytes()).decode() if k not in CORE else None,'url':'assets/characters/reference/'+k+'.webp'} for k in IDS if (DEST/(k+'.json')).exists()}
(DEST/'catalog.js').write_text('window.ReferenceCharacterCatalog='+json.dumps(catalog,separators=(',',':'))+';\n')
previous=json.loads((SOURCE/'validation.json').read_text()) if (SOURCE/'validation.json').exists() else {};previous.update(reports);(SOURCE/'validation.json').write_text(json.dumps(previous,indent=2))
print(json.dumps(reports,indent=2))
