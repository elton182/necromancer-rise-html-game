"""Build Bram's recover row (row 03): straighten up from the hammer rest, then pass the hammer back to the idle hand.

python3 blender/bram_recover_frames.py && python3 blender/pack_village_npcs.py --only=bram

The un-lean reuses the real rest frames in reverse. The hand swap uses the painted keys in
bram_recover_keys/ (pure green background), keyed and fitted to the 296px cell of the real frames.
Keys are held for two frames instead of cross-faded: blending these poses leaves double exposures.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

HERE=Path(__file__).resolve().parent
FRAMES=HERE/'frames_villager_bram';KEYS=HERE/'bram_recover_keys'
CELL=296;FEET=293

def load(name):return np.asarray(Image.open(FRAMES/(name+'.png')).convert('RGBA')).astype(np.float32)/255

def span(rgba,f):
 alpha=rgba[...,3]>.5;ys=np.nonzero(alpha.any(1))[0];row=alpha[ys.min()+int((ys.max()-ys.min())*f)]
 xs=np.nonzero(row)[0];return xs.min(),xs.max()+1

def height(rgba):ys=np.nonzero((rgba[...,3]>.5).any(1))[0];return ys.max()-ys.min()+1

def stats(rgba):
 m=rgba[...,3]>.5;px=rgba[...,:3][m];return px.mean(0),px.std(0)

def key(name,ref_a,ref_b,t):
 lerp=lambda f:(1-t)*f(ref_a)+t*f(ref_b)
 rgb=np.asarray(Image.open(KEYS/name).convert('RGB')).astype(np.float32)/255
 green=rgb[...,1]-np.maximum(rgb[...,0],rgb[...,2])
 alpha=np.clip(1-(green-.06)/.22,0,1)
 rgb[...,1]=np.minimum(rgb[...,1],np.maximum(rgb[...,0],rgb[...,2]))
 labels,count=ndimage.label(alpha>.5);sizes=ndimage.sum(np.ones_like(alpha),labels,range(1,count+1))
 alpha*=ndimage.binary_dilation(np.isin(labels,1+np.flatnonzero(sizes>=sizes.max()*.02)),iterations=2)
 ys,xs=np.nonzero(alpha>.02)
 src=np.dstack([rgb,alpha])[ys.min():ys.max()+1,xs.min():xs.max()+1]
 # Fit to the real frames: same height and shoulder width, feet on the same line, shoulders centred alike.
 shoulder=lambda rgba:span(rgba,.3)[1]-span(rgba,.3)[0]
 centre=lambda rgba:sum(span(rgba,.3))/2
 sy=lerp(height)/src.shape[0];sx=lerp(shoulder)/shoulder(src)
 crop=Image.fromarray((src*255).astype(np.uint8),'RGBA')
 crop=crop.resize((round(crop.width*sx),round(crop.height*sy)),Image.Resampling.LANCZOS)
 fitted=np.asarray(crop).astype(np.float32)/255
 out=Image.new('RGBA',(CELL,CELL));out.paste(crop,(round(lerp(centre)-centre(fitted)),FEET+1-crop.height),crop)
 rgba=np.asarray(out).astype(np.float32)/255
 mean,std=stats(rgba);ma,sa=stats(ref_a);mb,sb=stats(ref_b)
 rgba[...,:3]=np.clip((rgba[...,:3]-mean)/np.maximum(std,1e-3)*((1-t)*sa+t*sb)+(1-t)*ma+t*mb,0,1)
 return rgba

def save(rgba,index):
 Image.fromarray((np.clip(rgba,0,1)*255+.5).astype(np.uint8),'RGBA').save(FRAMES/f'03_{index:02}.png')

stand=load('01_00');idle=load('00_00')
lift=key('lift.jpg',stand,idle,.25);pass_front=key('pass_front.jpg',stand,idle,.5);lower_side=key('lower_side.jpg',stand,idle,.85)
frames=[load(f'01_{i:02}') for i in (6,5,4,3,2,1,0)]+[lift,lift,pass_front,pass_front,lower_side,lower_side]
for old in FRAMES.glob('03_*.png'):old.unlink()
for i,frame in enumerate(frames):save(frame,i)
print('Bram recover frames:',len(frames))
