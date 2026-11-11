"""Prancha e GIF do repouso em três vistas, após mage_hero_t_review.py -- --idle."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'frames/mage_idle'
OUT = ROOT / 'previews/mage_idle'
OUT.mkdir(parents=True, exist_ok=True)
views = [('front', 'Frente'), ('right', 'Perfil'), ('iso', 'No jogo')]
frames = {v: [Image.open(p).convert('RGB') for p in sorted(SOURCE.glob(f'idle_{v}_*.png'))] for v, _ in views}
assert all(len(fs) == 16 for fs in frames.values()), 'Renderize as três vistas completas.'
animation = []
# O último quadro repete o primeiro para auditoria; o GIF não duplica essa pausa.
for i in range(15):
    canvas = Image.new('RGB', (960, 344), (24, 27, 34))
    draw = ImageDraw.Draw(canvas)
    for col, (view, label) in enumerate(views):
        canvas.paste(frames[view][i], (col*320, 24))
        draw.text((col*320+8, 6), label, fill='white')
    animation.append(canvas.quantize(colors=128, dither=Image.Dither.NONE))
animation[0].save(OUT/'idle.gif', save_all=True, append_images=animation[1:], duration=[267,267,266]*5, loop=0)
poses = Image.new('RGB', (320*4, 344*3), (24, 27, 34))
draw = ImageDraw.Draw(poses)
for row, (view, label) in enumerate(views):
    for col, index in enumerate([0, 4, 8, 12]):
        x, y = col*320, row*344
        poses.paste(frames[view][index], (x, y+24))
        draw.text((x+8, y+6), f'{label} / quadro {1+index*8}', fill='white')
poses.save(OUT/'poses.png')
print(OUT)
