"""Empacota os quadros da conferência Three.js em uma prévia GIF desacelerada."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[1]
info=json.loads((ROOT.parent/'review/v2/warrior-motion/result.json').read_text(encoding='utf-8'))
frames=[]
for i,path in enumerate(sorted(Path(info['frames']).glob('*.png'))):
    im=Image.open(path).convert('RGB');draw=ImageDraw.Draw(im)
    label='Combo de três cortes' if i<60 else 'Estocada' if i<84 else 'Golpe de escudo' if i<108 else 'Caminhada'
    draw.rectangle((0,0,560,34),fill=(25,34,37));draw.text((14,9),label+' | prévia lenta',fill=(240,228,205));frames.append(im.quantize(colors=128))
if not frames:raise RuntimeError('Execute primeiro node v2/tests/warrior-motion-browser-check.cjs.')
frames[0].save(ROOT/'previews/warrior_motion.gif',save_all=True,append_images=frames[1:],duration=42,loop=0,optimize=False)
print('Prévia animada salva em blender/previews/warrior_motion.gif')
