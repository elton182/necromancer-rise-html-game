"""Empacota os frames do check de navegador em uma prévia animada do idle."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
frames = []
for source in sorted((ROOT / 'frames/campaign_npcs_idle').glob('*.png')):
    with Image.open(source) as image:
        frames.append(image.convert('RGB').resize((960, 320), Image.Resampling.LANCZOS))
if len(frames) != 72:
    raise RuntimeError('Execute primeiro v2/tests/campaign-npcs-tripo-browser-check.cjs (72 frames).')
output = ROOT / 'previews/campaign_npcs_tripo/idle.gif'
frames[0].save(output, save_all=True, append_images=frames[1:], duration=167, loop=0)
print(output)
