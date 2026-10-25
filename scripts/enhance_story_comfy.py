"""AI-assisted high definition story panels via a local ComfyUI (Z-Image Turbo).

Run from the repository root with ComfyUI listening on 127.0.0.1:8188:
    python scripts/enhance_story_comfy.py              # all panels, embeds in HTML
    python scripts/enhance_story_comfy.py --only 1 10 --preview DIR
    python scripts/enhance_story_comfy.py --reuse-enhanced   # only recompose captions
Each original is upscaled 2x (Lanczos), refined by Z-Image Turbo img2img with low
denoise so composition and faces are kept, then resized to exactly 3x to match the
game's expected dimensions. The model may rewrite letters, so the caption boxes and
speech bubbles listed in the manifest (`text_boxes`, original pixels) are restored
from the conservative non-generative upscale. Originals are never overwritten.
"""
from pathlib import Path
import argparse
import base64
import hashlib
import io
import json
import time
import urllib.request
import uuid

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageStat

from enhance_story import GAME, MANIFEST, PATTERN, ROOT, SCALE

SERVER = "http://127.0.0.1:8188"
DIFFUSION_SCALE = 2
CAPTION_FEATHER = 6
PROMPT = (
    "{title}. High resolution dark fantasy anime illustration, crisp clean line art, "
    "sharp fine details, detailed textures, painterly lighting. Parchment caption box "
    "with sharp, perfectly legible black serif lettering in Portuguese, unchanged text."
)


def request(path, data=None, headers=None):
    req = urllib.request.Request(SERVER + path, data=data, headers=headers or {})
    with urllib.request.urlopen(req, timeout=600) as response:
        return response.read()


def upload(image, name):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    boundary = uuid.uuid4().hex
    body = (
        f'--{boundary}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n'
        f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + buffer.getvalue() + f"\r\n--{boundary}--\r\n".encode()
    result = json.loads(request("/upload/image", body, {"Content-Type": f"multipart/form-data; boundary={boundary}"}))
    return result["name"]


def workflow(image_name, prompt, denoise, seed):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "z_image_turbo_bf16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "4": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 3}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": prompt}},
        "6": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["5", 0]}},
        "7": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "8": {"class_type": "VAEEncodeTiled", "inputs": {"pixels": ["7", 0], "vae": ["3", 0], "tile_size": 1024, "overlap": 64, "temporal_size": 64, "temporal_overlap": 8}},
        "9": {"class_type": "KSampler", "inputs": {
            "model": ["4", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["8", 0],
            "seed": seed, "steps": 8, "cfg": 1.0, "sampler_name": "res_multistep", "scheduler": "simple", "denoise": denoise}},
        "10": {"class_type": "VAEDecodeTiled", "inputs": {"samples": ["9", 0], "vae": ["3", 0], "tile_size": 1024, "overlap": 64, "temporal_size": 64, "temporal_overlap": 8}},
        "11": {"class_type": "SaveImage", "inputs": {"images": ["10", 0], "filename_prefix": "necromancer-story"}},
    }


def run(graph):
    prompt_id = json.loads(request("/prompt", json.dumps({"prompt": graph}).encode(), {"Content-Type": "application/json"}))["prompt_id"]
    while True:
        history = json.loads(request(f"/history/{prompt_id}")).get(prompt_id)
        if history:
            if history["status"].get("status_str") == "error":
                raise RuntimeError(json.dumps(history["status"], ensure_ascii=False))
            output = history["outputs"]["11"]["images"][0]
            query = f"/view?filename={output['filename']}&subfolder={output['subfolder']}&type={output['type']}"
            return Image.open(io.BytesIO(request(query))).convert("RGB")
        time.sleep(2)


def refine(original, title, denoise, seed):
    # Z-Image latents need dimensions divisible by 16.
    size = tuple(round(n * DIFFUSION_SCALE / 16) * 16 for n in original.size)
    name = upload(original.convert("RGB").resize(size, Image.Resampling.LANCZOS), f"story-{uuid.uuid4().hex}.png")
    refined = run(workflow(name, PROMPT.format(title=title), denoise, seed))
    return refined.resize((original.width * SCALE, original.height * SCALE), Image.Resampling.LANCZOS)


def restore_captions(original, refined, boxes):
    # Same conservative upscale as scripts/enhance_story.py, so lettering stays exact.
    faithful = original.convert("RGB").filter(ImageFilter.UnsharpMask(radius=0.6, percent=55, threshold=3))
    faithful = faithful.resize(refined.size, Image.Resampling.LANCZOS)
    mask = Image.new("L", refined.size, 0)
    draw = ImageDraw.Draw(mask)
    for x0, y0, x1, y1 in boxes:
        draw.rectangle([x0 * SCALE, y0 * SCALE, x1 * SCALE - 1, y1 * SCALE - 1], fill=255)
    return Image.composite(faithful, refined, mask.filter(ImageFilter.GaussianBlur(CAPTION_FEATHER)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", type=int, nargs="*", help="panel indexes to process")
    parser.add_argument("--denoise", type=float, default=0.3)
    parser.add_argument("--seed", type=int, default=20261024)
    parser.add_argument("--preview", type=Path, help="write PNGs here instead of updating the game")
    parser.add_argument("--reuse-enhanced", action="store_true", help="skip ComfyUI and recompose captions over the current enhanced files")
    args = parser.parse_args()

    entries = json.loads(MANIFEST.read_text(encoding="utf-8"))
    selected = [e for e in entries if not args.only or e["index"] in args.only]
    method = (f"Lanczos {DIFFUSION_SCALE}x + Z-Image Turbo img2img (ComfyUI, 8 steps, denoise {args.denoise}), Lanczos to {SCALE}x; "
              "text_boxes restored from UnsharpMask + Lanczos 3x; WebP quality 95")
    for entry in selected:
        original = ROOT / entry["original"]
        original_bytes = original.read_bytes()
        started = time.time()
        with Image.open(io.BytesIO(original_bytes)) as image:
            image.load()
            if args.reuse_enhanced:
                with Image.open(ROOT / entry["enhanced"]) as current:
                    refined = current.convert("RGB")
            else:
                refined = refine(image, entry["title"], args.denoise, args.seed + entry["index"])
            output = restore_captions(image, refined, entry["text_boxes"])
        if args.preview:
            args.preview.mkdir(parents=True, exist_ok=True)
            output.save(args.preview / f"{original.stem}.png")
        else:
            destination = ROOT / entry["enhanced"]
            output.save(destination, format="WEBP", quality=95, method=6)
            with Image.open(destination) as check:
                difference = ImageStat.Stat(ImageChops.difference(check.convert("RGB"), output))
                mean_error = sum(difference.mean) / 3
                assert mean_error < 2, "Unexpected encoding degradation"
            entry.update({
                "enhanced_size": list(output.size),
                "enhanced_sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
                "mean_encoding_error_0_255": round(mean_error, 4),
                "method": method,
            })
        print(f'{entry["index"]:02}: {output.width}x{output.height} in {time.time() - started:.0f}s', flush=True)

    if args.preview:
        return
    source = GAME.read_text(encoding="utf-8")
    images = {e["title"]: base64.b64encode((ROOT / e["enhanced"]).read_bytes()).decode("ascii") for e in entries}
    source, count = PATTERN.subn(lambda m: "{title:'" + m.group(1) + "',src:'data:image/webp;base64," + images[m.group(1)] + "'", source)
    assert count == len(entries)
    GAME.write_text(source, encoding="utf-8")
    MANIFEST.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum((ROOT / e["enhanced"]).stat().st_size for e in entries)
    print(f"Embedded {count} panels; enhanced images: {total / 1024 / 1024:.1f} MiB", flush=True)


if __name__ == "__main__":
    main()
