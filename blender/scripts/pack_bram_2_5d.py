"""Fatia o atlas 2.5D do Bram fornecido pelo usuário e atualiza somente o registro SPR.load('smith').

Execute na raiz:
  python3 blender/scripts/pack_bram_2_5d.py [--no-embed]

Fonte: blender/spritesheets/bram_2_5d_source.png (14 colunas x 10 linhas, fundo transparente, grade irregular).
Cada linha tem 7 quadros virados para a direita da tela seguidos de 7 virados para a esquerda; nas vistas de
frente (linhas 0, 3 e 7) a linha inteira é uma só animação, reduzida para 7 quadros.
Saídas: blender/spritesheets/bram_2_5d_sheet.webp/.json e blender/previews/bram_2_5d_comparison.png.
A primeira incorporação guarda o HTML anterior em blender/backups/.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
import numpy as np, json, re, base64, sys, io, shutil

HERE = Path(__file__).resolve().parent; BLENDER = HERE.parent; ROOT = BLENDER.parent
HTML = ROOT / 'necromancer-canvas.html'; BACKUP = BLENDER / 'backups' / 'necromancer-canvas.before-bram-2-5d.html'
SOURCE = BLENDER / 'spritesheets' / 'bram_2_5d_source.png'; OUT = BLENDER / 'spritesheets' / 'bram_2_5d_sheet.webp'
COLS, ROWS, N = 14, 10, 7
# Mesma altura na tela do Bram anterior: 2,52 u (242 px a 96 px/u) para ~95 px de figura.
CELL, PPU, ANCHOR_X, ANCHOR_Y, FOOT_BELOW_ANCHOR = 144, 38, 72, 124, 6
DRAW_SCALE = 1.05 * 1.05
RIGHT, LEFT, ALL = range(0, 7), range(7, 14), range(0, 14, 2)
# Ordem do runtime: 0 L, 1 SE, 2 S, 3 SO, 4 O, 5 NO, 6 N, 7 NE. Sem espelhamento: leste/oeste reutilizam as vistas laterais.
# O quadro 7 da linha 1 é uma virada de costas; o sudoeste parado usa a linha 6, que repete a pose sem a virada.
CLIPS = {
 'idle': {'fps': 2, 'loop': True, 'views': [(1, RIGHT), (1, RIGHT), (0, ALL), (6, LEFT), (6, LEFT), (2, LEFT), (2, RIGHT), (2, RIGHT)]},
 'talk': {'fps': 3, 'loop': True, 'views': [(8, RIGHT), (8, RIGHT), (7, ALL), (8, LEFT), (8, LEFT), (9, LEFT), (9, RIGHT), (9, RIGHT)]},
}
# drawSprite exige attack/walk; idle_variation permanece como alias do idle (sem bigorna no atlas).
ALIASES = {'attack': 'talk', 'walk': 'idle', 'idle_variation': 'idle'}
COMBAT = [{'animation': 'talk', 'row': 'talk', 'selector': 'VIL.open===id (attacking:true no drawHubProp)'}]

def runs(mask, min_len=4):
 out, start = [], None
 for i, on in enumerate(mask):
  if on and start is None: start = i
  if not on and start is not None: out.append((start, i)); start = None
 if start is not None: out.append((start, len(mask)))
 return [r for r in out if r[1] - r[0] >= min_len]

def slice_frames(img):
 alpha = np.asarray(img.getchannel('A')).astype(int); H, W = alpha.shape
 profile = (alpha > 8).sum(1); pitch = (np.nonzero(profile)[0][-1] + 1) / ROWS; cuts = [0]
 for r in range(1, ROWS):
  lo = round(r * pitch) - 15; cuts.append(lo + int(profile[lo:lo + 30].argmin()))
 cuts.append(H); frames = {}
 for r in range(ROWS):
  band = alpha[cuts[r]:cuts[r + 1]]; found = runs((band > 128).any(0))
  if len(found) != COLS: raise ValueError(f'Linha {r}: {len(found)} figuras, esperado {COLS}')
  xs = [0] + [(found[i][1] + found[i + 1][0]) // 2 for i in range(COLS - 1)] + [W]
  for c in range(COLS): frames[r, c] = img.crop((xs[c], cuts[r], xs[c + 1], cuts[r + 1]))
 return frames

def contact(tile):
 """Pés (ou pés + toco da bigorna, estáticos dentro da linha): base e centro das 10 linhas inferiores."""
 a = np.asarray(tile.getchannel('A')) > 128; ys, xs = np.where(a); bottom = ys.max()
 return float(xs[ys >= bottom - 10].mean()), int(bottom)

def upper_center(tile):
 a = np.asarray(tile.getchannel('A')) > 128; ys, xs = np.where(a); top, bottom = ys.min(), ys.max()
 band = (ys >= top + .12 * (bottom - top)) & (ys <= top + .45 * (bottom - top))
 return float(np.median(xs[band]))

def place(tile, cx, bottom, dx=0.0):
 cell = Image.new('RGBA', (CELL, CELL)); x = round(ANCHOR_X + dx - cx); y = ANCHOR_Y + FOOT_BELOW_ANCHOR - bottom
 cell.alpha_composite(tile, (max(0, x), max(0, y)), (max(0, -x), max(0, -y))); return cell

src = Image.open(SOURCE).convert('RGBA'); frames = slice_frames(src)
idle_rows = {view: CLIPS['idle']['views'][di] for di, view in enumerate(CLIPS['idle']['views'])}
sheet = Image.new('RGBA', (N * CELL, 8 * len(CLIPS) * CELL)); runtime_anims = {}; feet = {}; checked = 0
for ci, (name, clip) in enumerate(CLIPS.items()):
 row0 = ci * 8; runtime_anims[name] = {'n': N, 'fps': clip['fps'], 'loop': clip['loop'], 'row': row0}
 for di, (src_row, cols) in enumerate(clip['views']):
  picks = [frames[src_row, c] for c in cols]
  first = None; moved = False
  for fi, tile in enumerate(picks):
   cx, bottom = contact(tile); cell = place(tile, cx, bottom)
   box = cell.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
   if not box or box[0] < 2 or box[1] < 2 or box[2] > CELL - 2 or box[3] > CELL - 2: raise ValueError(f'Quadro vazio/recortado: {name}/{di}/{fi}: {box}')
   src_px = int((np.asarray(tile.getchannel('A')) > 8).sum()); cell_px = int((np.asarray(cell.getchannel('A')) > 8).sum())
   if cell_px != src_px: raise ValueError(f'Quadro perdeu pixels ao posicionar: {name}/{di}/{fi}')
   if first is None: first = cell
   elif ImageChops.difference(first, cell).getbbox(): moved = True
   sheet.alpha_composite(cell, (fi * CELL, (row0 + di) * CELL)); checked += 1
   if name == 'idle' and fi == 0: feet[di] = box[3]
  if not moved: raise ValueError(f'Animação estática: {name}/{di}')
for alias, target in ALIASES.items(): runtime_anims[alias] = dict(runtime_anims[target])
runtime = {'cell': CELL, 'ppu': PPU, 'anchorX': ANCHOR_X, 'anchorY': ANCHOR_Y, 'dirs': 8, 'source': 'blender/scripts/pack_bram_2_5d.py', 'anims': runtime_anims}
sheet.save(OUT, quality=92, method=6)
report = {'key': 'smith', 'source': str(SOURCE.relative_to(ROOT)), 'frames': checked, 'atlasSize': list(sheet.size), 'decodedBytes': sheet.width * sheet.height * 4,
          'webpBytes': OUT.stat().st_size, 'idleFootBottomByDirection': feet,
          'views': {k: [[r, list(c)[0], list(c)[-1], list(c)[1] - list(c)[0]] for r, c in v['views']] for k, v in CLIPS.items()}}
OUT.with_suffix('.json').write_text(json.dumps({'runtime': runtime, 'combat': COMBAT, 'drawScale': DRAW_SCALE, 'validation': report}, indent=1, ensure_ascii=False))
print(json.dumps(report))

html = HTML.read_text(encoding='utf-8')
def record(text, key):
 m = re.search(r"^SPR\.load\('" + key + r"',(\{.*?\}),'([A-Za-z0-9+/=]+)'\);$", text, re.M)
 if not m: raise ValueError('SPR.load ausente ou fora do formato de uma linha: ' + key)
 return json.loads(m.group(1)), Image.open(io.BytesIO(base64.b64decode(m.group(2)))).convert('RGBA')
before_meta, before_img = record(BACKUP.read_text(encoding='utf-8') if BACKUP.exists() else html, 'smith')
if '--no-embed' not in sys.argv:
 if not BACKUP.exists(): BACKUP.parent.mkdir(exist_ok=True); shutil.copyfile(HTML, BACKUP)
 line = "SPR.load('smith'," + json.dumps(runtime, separators=(',', ':'), ensure_ascii=False) + ",'" + base64.b64encode(OUT.read_bytes()).decode() + "');"
 html, n = re.subn(r"^SPR\.load\('smith',[^\n]+$", lambda _: line, html, flags=re.M)
 if n != 1: raise ValueError(('smith', n))
 HTML.write_text(html, encoding='utf-8')

# Antes/depois no tamanho relativo do jogo (64 px por unidade), fundo escuro e claro.
PX = 64
def tile_of(meta, img, anim, di, fi):
 a = meta['anims'][anim]; C = meta['cell']; k = PX / meta['ppu'] * DRAW_SCALE
 t = img.crop((fi * C, (a['row'] + di) * C, (fi + 1) * C, (a['row'] + di + 1) * C))
 return t.resize((round(C * k), round(C * k)), Image.Resampling.LANCZOS), meta['anchorX'] * k, meta['anchorY'] * k
def strip(meta, img, label):
 picks = [('idle', d, 0) for d in range(8)] + [('talk', 1, 3), ('talk', 1, 5), ('idle', 1, 4)]
 W, H = 180, 210; out = Image.new('RGBA', (W * len(picks), H * 2 + 18)); d = ImageDraw.Draw(out)
 d.rectangle([0, 0, out.width, 18], fill=(20, 20, 24, 255)); d.text((4, 3), f'bram — {label}', fill=(240, 236, 220, 255))
 for bg_i, bg in enumerate([(43, 42, 48, 255), (185, 180, 166, 255)]):
  d.rectangle([0, 18 + bg_i * H, out.width, 18 + (bg_i + 1) * H], fill=bg)
  for i, (anim, di, fi) in enumerate(picks):
   t, ax, ay = tile_of(meta, img, anim, di, min(fi, meta['anims'][anim]['n'] - 1)); fx, fy = i * W + W / 2, 18 + bg_i * H + H - 22
   sh = Image.new('RGBA', out.size); ImageDraw.Draw(sh).ellipse([fx - 22, fy - 7, fx + 22, fy + 7], fill=(0, 0, 0, 90)); out.alpha_composite(sh)
   out.alpha_composite(t, (round(fx - ax), round(fy - ay)))
 return out
bands = [strip(before_meta, before_img, 'antes'), strip(runtime, sheet, 'depois')]
comparison = Image.new('RGBA', (max(b.width for b in bands), sum(b.height for b in bands)), (20, 20, 24, 255)); y = 0
for b in bands: comparison.alpha_composite(b, (0, y)); y += b.height
comparison.save(BLENDER / 'previews' / 'bram_2_5d_comparison.png'); print('comparison', comparison.size)
