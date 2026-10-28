"""Extract the supplied Bram pixels; no redraw and no invented views.
The full pose stays on row 0. Rows 1-3 are the same pixels split into the body,
the hammer arm and the free arm so those limbs can pivot in the game.
"""
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw,ImageFilter
import io
ROOT=Path(__file__).resolve().parents[2]
OUTLINE=[(142,34),(153,36),(163,41),(164,48),(172,51),(167,63),(173,69),(168,78),(177,89),(192,96),(204,111),(210,132),(216,144),(221,166),(220,188),(226,212),(220,222),(211,227),(199,219),(201,204),(202,191),(191,177),(188,208),(188,250),(177,258),(181,266),(191,270),(195,279),(181,285),(157,279),(150,268),(150,260),(127,264),(122,282),(113,296),(91,298),(79,288),(83,272),(86,259),(84,256),(83,235),(76,231),(67,239),(51,234),(47,225),(34,224),(29,220),(33,208),(43,208),(48,214),(51,207),(49,184),(43,174),(44,157),(41,149),(49,127),(53,111),(65,99),(83,91),(104,85),(107,78),(101,73),(110,66),(110,55),(119,50),(119,44),(133,40)]
# Source-image polygons. The shoulder edge is the pivot side; the rest follows the limb.
# Simple non-crossing outlines. The hammer head is a second polygon on the same mask.
HAMMER=[(112,112),(78,102),(52,118),(38,150),(32,188),(28,214),(34,232),(78,236),(96,210),(104,168),(110,136)]
HAMMER_HEAD=[(70,198),(64,236),(74,272),(128,272),(132,204),(104,192)]
FREE=[(172,114),(196,102),(222,116),(230,150),(226,186),(214,220),(188,224),(174,196),(166,156),(172,114)]
# Pivots sit on the shoulder seam, above the limb, so the whole arm swings together.
HAMMER_PIVOT=(104,100)
FREE_PIVOT=(184,100)

def masked_source():
 source=Image.open(ROOT/'blender/examples/image.png').convert('RGBA')
 if source.size!=(1009,672):raise ValueError('Bram reference expected 1009 x 672; review silhouette coordinates for another source.')
 mask=Image.new('L',source.size);draw=ImageDraw.Draw(mask);draw.polygon(OUTLINE,fill=255)
 # Visible negative space under the apron and between the boots.
 draw.polygon([(125,264),(148,260),(150,268),(154,279),(130,281),(123,278)],fill=0)
 # Remove neutral background fringe only near the traced boundary; keep the iron head.
 inner=mask.filter(ImageFilter.MinFilter(9));pixels=source.load();alpha=mask.load();core=inner.load()
 for y in range(30,302):
  for x in range(26,230):
   if alpha[x,y] and not core[x,y] and not (78<=x<=120 and 195<=y<=260):
    red,green,blue,_=pixels[x,y]
    if max(red,green,blue)-min(red,green,blue)<28 and max(red,green,blue)>75:alpha[x,y]=0
 source.putalpha(mask);return source

def part_mask(size,polygons):
 mask=Image.new('L',size);draw=ImageDraw.Draw(mask)
 for polygon in polygons:draw.polygon(polygon,fill=255)
 return mask

def fill_limb_gap(body,removed,opaque,limit=8):
 """Replace limb pixels that covered the torso. Pixels on the outer edge stay empty."""
 pixels=body.load();width,height=body.size
 colors={(x,y):pixels[x,y] for y in range(height) for x in range(width) if pixels[x,y][3]}
 for y in range(height):
  for x in range(width):
   if not removed[x,y] or pixels[x,y][3]:continue
   if any(not opaque[xx,yy] for yy in range(max(0,y-1),min(height,y+2)) for xx in range(max(0,x-1),min(width,x+2))):continue
   best=None;distance=limit*limit+1
   for yy in range(max(0,y-limit),min(height,y+limit+1)):
    for xx in range(max(0,x-limit),min(width,x+limit+1)):
     color=colors.get((xx,yy))
     if color is None:continue
     score=(xx-x)*(xx-x)+(yy-y)*(yy-y)
     if score<distance:distance=score;best=color
   if best:pixels[x,y]=best

def cell_of(image,box,origin):
 cell=Image.new('RGBA',(320,320));cell.paste(image.crop(box),origin);return cell

def extract():
 source=masked_source();box=source.getbbox();crop=source.crop(box)
 origin=((320-crop.width)//2,286-crop.height)
 def to_cell(point):return [point[0]-box[0]+origin[0],point[1]-box[1]+origin[1]]
 alpha=source.getchannel('A')
 # Pull the one-pixel rim of each limb onto that limb so it does not stay behind as a speck.
 hammer=ImageChops.multiply(part_mask(source.size,[HAMMER,HAMMER_HEAD]).filter(ImageFilter.MaxFilter(5)),alpha)
 free=ImageChops.multiply(part_mask(source.size,[FREE]).filter(ImageFilter.MaxFilter(5)),alpha)
 limbs=ImageChops.lighter(hammer,free)
 def clip_part(mask):
  part=source.copy();part.putalpha(ImageChops.multiply(source.getchannel('A'),mask));return part
 arm=clip_part(hammer);other=clip_part(free)
 body=source.copy();cleared=body.load();removed=limbs.load()
 for y in range(source.size[1]):
  for x in range(source.size[0]):
   if removed[x,y]:cleared[x,y]=(0,0,0,0)
 # Fill in source space, restricted to the crop, so the apron shows when a limb lifts.
 local=body.crop(box);local_removed=limbs.crop(box);opaque_image=source.crop(box).getchannel('A')
 fill_limb_gap(local,local_removed.load(),opaque_image.load())
 body.paste(local,box[:2])
 rows=[cell_of(source,box,origin),cell_of(body,box,origin),cell_of(arm,box,origin),cell_of(other,box,origin)]
 sheet=Image.new('RGBA',(320,320*len(rows)))
 for index,row in enumerate(rows):sheet.paste(row,(0,index*320))
 png=ROOT/'assets/characters/bram-reference.png';png.parent.mkdir(parents=True,exist_ok=True);sheet.save(png)
 blob=io.BytesIO();sheet.save(blob,format='WEBP',lossless=True,method=4)
 meta={'cell':320,'ppu':100,'anchorX':160,'anchorY':286,'dirs':1,'anims':{'idle':{'n':1,'fps':1,'loop':True,'row':0}},'source':'blender/examples/image.png','sourceBounds':list(box),'sourceOffset':list(origin),'staticReference':True,'parts':{'body':{'row':1},'hammer':{'row':2,'pivot':to_cell(HAMMER_PIVOT)},'freeArm':{'row':3,'pivot':to_cell(FREE_PIVOT)}}}
 return meta,blob.getvalue()
