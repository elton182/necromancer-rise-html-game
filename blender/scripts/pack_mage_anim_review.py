"""Prancha da revisão de animação do mago: quadros-chave × quatro vistas, com Pillow.

Depois de: blender --background blender/models/mage_hero_t.blend --python blender/scripts/mage_hero_t_review.py -- --combat
Uso: python blender/scripts/pack_mage_anim_review.py   (grava em previews/mage_anim_review/)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'frames/mage_anim_review'
OUT=ROOT/'previews/mage_anim_review'
OUT.mkdir(parents=True,exist_ok=True)
VIEWS=['front','right','back','iso']
LABEL={'cast':{1:'descanso',5:'preparação',8:'IMPACTO (disparo)',12:'recuperação',16:'fim'},
       'cast_up':{1:'descanso',8:'erguer',15:'IMPACTO (marca)',19:'recuperação',22:'fim'},
       'dodge':{1:'início',4:'recolher',8:'abaixado',13:'levantar',16:'fim'},
       'death':{1:'início',8:'desequilíbrio',15:'queda',22:'chão',31:'pose final'}}
size=220
try:FONT=ImageFont.truetype('arial.ttf',13)
except OSError:FONT=ImageFont.load_default()
def sheet(clips,name):
    rows=[(c,v) for c in clips for v in VIEWS]
    cols=max(len(sorted(SOURCE.glob(f'{c}_iso_*.png'))) for c in clips)
    img=Image.new('RGB',(size*cols+70,(size+22)*len(rows)),(24,27,34));d=ImageDraw.Draw(img)
    for r,(clip,view) in enumerate(rows):
        y=r*(size+22);d.text((6,y+size//2),f'{clip}\n{view}',fill='white',font=FONT)
        for c,path in enumerate(sorted(SOURCE.glob(f'{clip}_{view}_*.png'))):
            f=int(path.stem.rsplit('_',1)[1])
            img.paste(Image.open(path).convert('RGB').resize((size,size)),(70+c*size,y+22))
            d.text((70+c*size+6,y+5),f'f{f} {LABEL.get(clip,{}).get(f,"")}',fill=(255,220,120) if 'IMPACTO' in LABEL.get(clip,{}).get(f,'') else 'white',font=FONT)
    img.save(OUT/name);print(OUT/name)
sheet(['cast','cast_up'],'combat_poses.png')
sheet(['dodge','death'],'dodge_death_poses.png')
sheet(['idle','walk','strafe_left','strafe_right'],'locomotion_poses.png')
