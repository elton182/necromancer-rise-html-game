"""Conservative, non-generative enhancement of the existing story panels.

Run from the repository root: python scripts/enhance_story.py
Requires Pillow. Originals are never overwritten. Enhanced WebP files are also
embedded in the game, preserving support for opening the single HTML offline.
"""
from pathlib import Path
import base64
import hashlib
import io
import json
import re

from PIL import Image, ImageFilter, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets/story/manifest.json"
GAME = ROOT / "necromancer-canvas.html"
SCALE = 3
PATTERN = re.compile(r"\{title:'([^']+)',src:'data:image/webp;base64,([^']+)'", re.ASCII)


def main():
    entries = json.loads(MANIFEST.read_text(encoding="utf-8"))
    enhanced_dir = ROOT / "assets/story/enhanced"
    enhanced_dir.mkdir(parents=True, exist_ok=True)
    replacements = {}
    for entry in entries:
        original = ROOT / entry["original"]
        original_bytes = original.read_bytes()
        with Image.open(io.BytesIO(original_bytes)) as image:
            # Mild edge contrast at native resolution, before interpolation.
            # No denoising, recoloring, cropping, generative detail or re-lettering.
            image.load()
            restored = image.filter(ImageFilter.UnsharpMask(radius=0.6, percent=55, threshold=3))
            output = restored.resize((image.width * SCALE, image.height * SCALE), Image.Resampling.LANCZOS)
            destination = enhanced_dir / original.name
            # High quality encoding avoids a ~70 MiB HTML download from lossless
            # interpolated pixels. Originals remain available byte-for-byte.
            output.save(destination, format="WEBP", quality=97, method=6)
            with Image.open(destination) as check:
                assert check.size == output.size
                difference = ImageStat.Stat(ImageChops.difference(check.convert("RGB"), output.convert("RGB")))
                mean_error = sum(difference.mean) / 3
                assert mean_error < 2, "Unexpected encoding degradation"
            entry.update({
                "enhanced": destination.relative_to(ROOT).as_posix(),
                "original_size": [image.width, image.height],
                "enhanced_size": list(output.size),
                "original_sha256": hashlib.sha256(original_bytes).hexdigest(),
                "enhanced_sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
                "mean_encoding_error_0_255": round(mean_error, 4),
                "method": "UnsharpMask(radius=0.6, percent=55, threshold=3), Lanczos 3x, WebP quality 97",
            })
            replacements[entry["title"]] = base64.b64encode(destination.read_bytes()).decode("ascii")
            print(f'{entry["index"]:02}: {image.width}x{image.height} -> {output.width}x{output.height}', flush=True)

    source = GAME.read_text(encoding="utf-8")
    titles = [match.group(1) for match in PATTERN.finditer(source)]
    assert len(titles) == len(entries) and set(titles) == set(replacements), "Unexpected story panel list"
    source, count = PATTERN.subn(lambda match: "{title:'" + match.group(1) + "',src:'data:image/webp;base64," + replacements[match.group(1)] + "'", source)
    assert count == len(entries)
    GAME.write_text(source, encoding="utf-8")
    MANIFEST.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum((ROOT / entry["enhanced"]).stat().st_size for entry in entries)
    print(f"Verified and embedded {count} panels; enhanced images: {total / 1024 / 1024:.1f} MiB", flush=True)


if __name__ == "__main__":
    main()
