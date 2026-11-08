"""Empacota as molduras dos orbes renderizadas por hud_orb_frame.py para o HUD da v2.

Para cada lado: mede o furo do aro (onde fica o vidro desenhado em CSS), apaga o que
sobrou do relevo dentro dele, corta a margem vazia, reduz e grava WebP.

Saídas em assets/hud/ (o build da v2 embute as duas imagens no CSS):
  orb-frame-left.webp, orb-frame-right.webp
  orb-frame.json   centro e raio do furo, em fração da imagem, para alinhar o vidro

Uso (raiz do projeto): python blender/scripts/pack_hud_orb_frame.py
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

BLENDER = Path(__file__).resolve().parents[1]
FRAMES = BLENDER / "frames" / "hud_orb_frame"
OUT = BLENDER.parent / "assets" / "hud"
WIDTH = 560          # largura final: ~2x o tamanho exibido no HUD
FEATHER = 1.5        # suavização da borda do furo, em pixels do render


def bronze(px):
    """Pixel do aro de bronze (não a parede interna cinza, que fica sem luz)."""
    r, g, b, a = px
    return a > 128 and r - b > 45 and r > 70


def keep_largest(img):
    """Descarta lascas soltas do relevo: mantém só o maior bloco opaco conectado."""
    small = img.getchannel("A").resize((img.width // 4, img.height // 4), Image.BILINEAR)
    w, h = small.size
    data = small.load()
    label = [[0] * w for _ in range(h)]
    sizes = {}
    current = 0
    for y in range(h):
        for x in range(w):
            if data[x, y] > 20 and not label[y][x]:
                current += 1
                stack = [(x, y)]
                label[y][x] = current
                count = 0
                while stack:
                    cx, cy = stack.pop()
                    count += 1
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and not label[ny][nx] and data[nx, ny] > 20:
                            label[ny][nx] = current
                            stack.append((nx, ny))
                sizes[current] = count
    biggest = max(sizes, key=sizes.get)
    keep = Image.new("L", (w, h), 0)
    kp = keep.load()
    for y in range(h):
        for x in range(w):
            if label[y][x] == biggest:
                kp[x, y] = 255
    keep = keep.resize(img.size, Image.NEAREST).filter(ImageFilter.MaxFilter(9))
    img.putalpha(Image.composite(img.getchannel("A"), Image.new("L", img.size, 0), keep))
    return len(sizes) - 1


def hole(img):
    """Distância do centro até o primeiro pixel de bronze, em raios da metade de cima.

    A metade de baixo tem uma placa escura do relevo dentro do aro; o furo é medido em
    cima e ajustado como círculo (mínimos quadrados) para tolerar o aro irregular."""
    pixels = img.load()
    w, h = img.size
    cx, cy = w / 2, h / 2
    points = []
    for step in range(0, 181, 4):
        a = math.radians(180 + step)        # 180°..360°: metade de cima na imagem
        dx, dy = math.cos(a), math.sin(a)
        for r in range(40, int(w / 2)):
            x, y = int(cx + dx * r), int(cy + dy * r)
            if bronze(pixels[x, y]):
                points.append((x + .5, y + .5))
                break
    # Ajuste algébrico de círculo: x² + y² + D x + E y + F = 0
    n = len(points)
    sx = sum(p[0] for p in points); sy = sum(p[1] for p in points)
    sxx = sum(p[0] ** 2 for p in points); syy = sum(p[1] ** 2 for p in points); sxy = sum(p[0] * p[1] for p in points)
    sz = [p[0] ** 2 + p[1] ** 2 for p in points]
    szx = sum(z * p[0] for z, p in zip(sz, points)); szy = sum(z * p[1] for z, p in zip(sz, points)); szs = sum(sz)
    m = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, n]]
    v = [-szx, -szy, -szs]

    def det(a):
        return (a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
                + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]))
    d0 = det(m)
    sol = []
    for i in range(3):
        mi = [row[:] for row in m]
        for r in range(3):
            mi[r][i] = v[r]
        sol.append(det(mi) / d0)
    D, E, F = sol
    hx, hy = -D / 2, -E / 2
    radius = math.sqrt(hx * hx + hy * hy - F)
    return hx, hy, radius, n


def pack(name):
    img = Image.open(FRAMES / (name + ".png")).convert("RGBA")
    dropped = keep_largest(img)
    hx, hy, radius, samples = hole(img)
    # Apaga o miolo e a parede interna cinza: tudo até a borda do bronze, com borda suave.
    scale = 4
    mask = Image.new("L", (img.width * scale, img.height * scale), 255)
    r = (radius + 1) * scale
    ImageDraw.Draw(mask).ellipse((hx * scale - r, hy * scale - r, hx * scale + r, hy * scale + r), fill=0)
    mask = mask.resize(img.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(FEATHER / 2))
    alpha = Image.composite(img.getchannel("A"), Image.new("L", img.size, 0), mask)
    img.putalpha(alpha)
    # Corta a margem vazia (com folga) e reduz.
    left, top, right, bottom = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    pad = 6
    box = (max(0, left - pad), max(0, top - pad), min(img.width, right + pad), min(img.height, bottom + pad))
    img = img.crop(box)
    k = WIDTH / img.width
    img = img.resize((WIDTH, round(img.height * k)), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / ("orb-frame-" + name + ".webp")
    img.save(path, "WEBP", quality=88, method=6)
    return path, {
        "width": img.width, "height": img.height,
        "holeX": round((hx - box[0]) / (box[2] - box[0]), 4),
        "holeY": round((hy - box[1]) / (box[3] - box[1]), 4),
        "holeRadius": round(radius / (box[2] - box[0]), 4),  # fração da largura
        "samples": samples,
        "droppedFragments": dropped,
    }


def main():
    meta = {}
    for name in ("left", "right"):
        path, info = pack(name)
        meta[name] = info
        print(path.relative_to(BLENDER.parent), path.stat().st_size, "bytes", info)
    (OUT / "orb-frame.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")


main()
