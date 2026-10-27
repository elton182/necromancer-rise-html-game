"""Empacota e valida os quadros do Lote 1 low-poly e atualiza somente os registros SPR.load pretendidos.

Execute na raiz, depois de blender/scripts/lowpoly_cast.py:
  python3 blender/scripts/pack_lowpoly_cast.py [--only=zombie,earcher,bram] [--no-embed]

Saídas: blender/spritesheets/lowpoly_<id>_sheet.webp/.json, blender/previews/lowpoly_lote1_comparison.png
e blender/spritesheets/lowpoly_validation.json. A primeira incorporação guarda o HTML anterior em blender/backups/.
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops, ImageDraw
import json, re, base64, sys, io, shutil
HERE = Path(__file__).resolve().parent; BLENDER = HERE.parent; ROOT = BLENDER.parent
HTML = ROOT / 'necromancer-canvas.html'; BACKUP = BLENDER / 'backups' / 'necromancer-canvas.before-lowpoly-lote1.html'
KEYS = {'zombie': 'zombie', 'earcher': 'earcher', 'bram': 'smith'}
DRAW_SCALE = {'zombie': 1.05, 'earcher': 1.05 * .85 * 1.3, 'bram': 1.05 * 1.05}
# drawSprite reads attack/walk rows for any actor; Bram never walks or fights, so they alias his own clips.
ALIASES = {'bram': {'attack': 'talk', 'walk': 'idle'}}
# Real engine timings (necromancer-canvas.html / scripts). Damage is applied when `swing` starts.
COMBAT = {
 'zombie': [
  {'animation': 'attack_primary', 'row': 'attack', 'duration': .5, 'impact_time': 0, 'recovery_time': .5, 'damage_event': 'primary_hit',
   'range': 'm.atkR (corpo a corpo, ~1,5 u)', 'damage_type': 'físico', 'cooldown': 1.2, 'vfx': 'nenhum', 'interruptible': False, 'directions': 8, 'cancelable': False},
  {'animation': 'attack_secondary', 'row': 'attack_secondary', 'ability': 'Mordida Pútrida', 'duration': .5, 'impact_time': 0, 'recovery_time': .5,
   'damage_event': 'minion_ability', 'range': 'alcance corpo a corpo do zumbi', 'damage_type': '150% + 35% de lentidão por 3 s', 'cooldown': 7,
   'vfx': "burst '#9dbf68'", 'interruptible': False, 'directions': 8, 'cancelable': False, 'selector': 'swing>0 e _abilityCd recém-reiniciado'},
  {'animation': 'spawn', 'row': 'spawn', 'duration': .6, 'selector': 'ref.spawn>0'},
  {'animation': 'hurt', 'row': 'hurt', 'duration': .22, 'selector': 'aumento de ref.hit'},
  {'animation': 'death', 'row': 'death', 'duration': .8, 'selector': 'deadT/0,8; morto mantém o último quadro'}],
 'earcher': [
  {'animation': 'attack_primary', 'row': 'attack', 'duration': .28, 'impact_time': 0, 'recovery_time': .28, 'damage_event': 'projectile_spawn',
   'range': 7.5, 'damage_type': 'físico (flecha 12 u/s)', 'cooldown': 1.9, 'vfx': 'flecha', 'interruptible': False, 'directions': 8, 'cancelable': False},
  {'animation': 'cast', 'row': 'windup', 'ability': 'Tiro forte', 'duration': .65, 'impact_time': .65, 'recovery_time': .93, 'damage_event': 'power_shot_spawn',
   'range': 12, 'damage_type': 'físico 1,9× (flecha 18 u/s, direção fixa)', 'cooldown': 5, 'vfx': 'linha de aviso do motor', 'interruptible': 'morte limpa e.ability',
   'directions': 8, 'cancelable': False, 'selector': "e.ability.phase==='windup'; duração lida de MOB_ABILITIES['Arqueiro'].windup"},
  {'animation': 'hurt', 'row': 'hurt', 'duration': .22, 'selector': 'aumento de ref.hit'},
  {'animation': 'death', 'row': 'death', 'duration': .8, 'selector': 'deadT/0,8'}],
 'bram': [
  {'animation': 'talk', 'row': 'talk', 'selector': 'VIL.open===id (attacking:true no drawHubProp)'},
  {'animation': 'idle_variation', 'row': 'idle_variation', 'duration': 1.6, 'selector': 'parado, a cada 9–15 s'}],
}
selected = next((a.split('=', 1)[1].split(',') for a in sys.argv if a.startswith('--only=')), list(KEYS))
embed = '--no-embed' not in sys.argv
html = HTML.read_text(encoding='utf-8')

def record(text, key):
 m = re.search(r"^SPR\.load\('" + key + r"',(\{.*?\}),'([A-Za-z0-9+/=]+)'\);$", text, re.M)
 if not m: raise ValueError('SPR.load ausente ou fora do formato de uma linha: ' + key)
 return json.loads(m.group(1)), Image.open(io.BytesIO(base64.b64decode(m.group(2)))).convert('RGBA')

def outlined(im):
 ink = Image.new('RGBA', im.size, (35, 33, 33, 255)); ink.putalpha(im.getchannel('A').filter(ImageFilter.MaxFilter(3)))
 return Image.alpha_composite(ink, im)

before_html = BACKUP.read_text(encoding='utf-8') if BACKUP.exists() else html
validation = json.loads((BLENDER / 'spritesheets' / 'lowpoly_validation.json').read_text()) if (BLENDER / 'spritesheets' / 'lowpoly_validation.json').exists() else {}
sheets = {}
for ident in selected:
 folder = BLENDER / 'frames' / f'lowpoly_{ident}'; meta = json.loads((folder / 'render.json').read_text())
 master = meta['cell']; spec = meta['contract']; C = spec['cell']; anims = meta['anims']
 cols = max(a['n'] for a in anims.values()); rows = 8 * len(anims)
 if cols * C > 16383 or rows * C > 16383: raise ValueError(f'Atlas acima do limite WebP: {ident}')
 sheet = Image.new('RGBA', (cols * C, rows * C)); checked = 0; feet = {}
 for name, a in anims.items():
  for di in range(8):
   first = None; moved = False
   for fi in range(a['n']):
    with Image.open(folder / f'{a["row"] + di:02}_{fi:02}.png') as im:
     im = im.convert('RGBA'); box = im.getchannel('A').getbbox()
     if not box or box[0] < 2 or box[1] < 2 or box[2] > master - 2 or box[3] > master - 2: raise ValueError(f'Quadro vazio/recortado: {ident}/{name}/{di}/{fi}: {box}')
     if first is None: first = im.copy()
     elif ImageChops.difference(first, im).getbbox(): moved = True
     tile = outlined(im).resize((C, C), Image.Resampling.LANCZOS); sheet.paste(tile, (fi * C, (a['row'] + di) * C)); checked += 1
     if name == 'idle' and fi == 0: feet[di] = tile.getchannel('A').getbbox()[3]
   if a['n'] > 1 and not moved: raise ValueError(f'Animação estática: {ident}/{name}/{di}')
 runtime = {'cell': C, 'ppu': spec['ppu'], 'anchorX': C / 2, 'anchorY': spec['anchor'], 'dirs': 8, 'source': 'blender/scripts/lowpoly_cast.py',
            'anims': {k: {'n': v['n'], 'fps': v['fps'], 'loop': v['loop'], 'row': v['row']} for k, v in anims.items()}}
 for alias, target in ALIASES.get(ident, {}).items(): runtime['anims'][alias] = dict(runtime['anims'][target])
 out = BLENDER / 'spritesheets' / f'lowpoly_{ident}_sheet.webp'; sheet.save(out, quality=90, method=6)
 spread = max(feet.values()) - min(feet.values())
 report = {'key': KEYS[ident], 'frames': checked, 'atlasSize': list(sheet.size), 'decodedBytes': sheet.width * sheet.height * 4, 'webpBytes': out.stat().st_size,
           'idleFootBottomByDirection': feet, 'idleFootSpreadPx': spread, 'model': meta.get('model')}
 (BLENDER / 'spritesheets' / f'lowpoly_{ident}_sheet.json').write_text(json.dumps({'runtime': runtime, 'combat': COMBAT[ident], 'drawScale': DRAW_SCALE[ident], 'validation': report}, indent=1, ensure_ascii=False))
 validation[ident] = report; sheets[ident] = (runtime, out)
 if embed:
  if not BACKUP.exists(): BACKUP.parent.mkdir(exist_ok=True); shutil.copyfile(HTML, BACKUP)
  line = f"SPR.load('{KEYS[ident]}'," + json.dumps(runtime, separators=(',', ':'), ensure_ascii=False) + ",'" + base64.b64encode(out.read_bytes()).decode() + "');"
  html, n = re.subn(r"^SPR\.load\('" + KEYS[ident] + r"',[^\n]+$", lambda _: line, html, flags=re.M)
  if n != 1: raise ValueError((ident, n))
 print(ident, json.dumps(report))
if embed: HTML.write_text(html, encoding='utf-8')
(BLENDER / 'spritesheets' / 'lowpoly_validation.json').write_text(json.dumps(validation, indent=1, ensure_ascii=False))

# Before/after at in-game relative size (64 px per world unit) on dark and light ground.
PX = 64; bands = []
for ident in selected:
 old_meta, old_img = record(before_html, KEYS[ident]); new_meta = sheets[ident][0]; new_img = Image.open(sheets[ident][1]).convert('RGBA')
 def cell(meta, img, anim, di, fi):
  a = meta['anims'][anim]; C = meta['cell']; di = di if meta['dirs'] == 8 else 0; fi = min(fi, a['n'] - 1) if fi >= 0 else a['n'] - 1
  k = PX / meta['ppu'] * DRAW_SCALE[ident]; t = img.crop((fi * C, (a['row'] + di) * C, (fi + 1) * C, (a['row'] + di + 1) * C))
  return t.resize((max(1, round(C * k)), max(1, round(C * k))), Image.Resampling.LANCZOS), meta['anchorX'] * k, meta['anchorY'] * k
 def strip(meta, img, label):
  third = 'attack'
  picks = [('idle', d, 0) for d in range(8)] + [(third, 1, 0), (third, 1, 3), ('death', 1, -1)] if 'death' in meta['anims'] else [('idle', d, 0) for d in range(8)] + [(third, 1, 0), (third, 1, 4), ('idle_variation' if 'idle_variation' in meta['anims'] else 'idle', 1, 4)]
  W = 180; H = 210; out = Image.new('RGBA', (W * len(picks), H * 2 + 18), (0, 0, 0, 0)); d = ImageDraw.Draw(out)
  d.rectangle([0, 0, out.width, 18], fill=(20, 20, 24, 255)); d.text((4, 3), f'{ident} — {label}', fill=(240, 236, 220, 255))
  for bg_i, bg in enumerate([(43, 42, 48, 255), (185, 180, 166, 255)]):
   d.rectangle([0, 18 + bg_i * H, out.width, 18 + (bg_i + 1) * H], fill=bg)
   for i, (anim, di, fi) in enumerate(picks):
    if anim not in meta['anims']: continue
    t, ax, ay = cell(meta, img, anim, di, fi); fx, fy = i * W + W / 2, 18 + bg_i * H + H - 22
    sh = Image.new('RGBA', out.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse([fx - 22, fy - 7, fx + 22, fy + 7], fill=(0, 0, 0, 90)); out.alpha_composite(sh)
    out.alpha_composite(t, (round(fx - ax), round(fy - ay)))
  return out
 bands += [strip(old_meta, old_img, 'antes'), strip(new_meta, new_img, 'depois')]
W = max(b.width for b in bands); comparison = Image.new('RGBA', (W, sum(b.height for b in bands)), (20, 20, 24, 255)); y = 0
for b in bands: comparison.alpha_composite(b, (0, y)); y += b.height
comparison.save(BLENDER / 'previews' / 'lowpoly_lote1_comparison.png'); print('comparison', comparison.size)
