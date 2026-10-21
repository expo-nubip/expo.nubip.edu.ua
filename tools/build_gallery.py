#!/usr/bin/env python3
"""Автообробка фото галереї.
Бере всі зображення з images/gallery/, вирівнює орієнтацію, зменшує довшу сторону
до MAX_SIDE, стискає, прибирає EXIF (геолокацію), перейменовує у зручні імена
і записує images/gallery/gallery.json (список для каруселі)."""
import json, os, re, sys
from PIL import Image, ImageOps

FOLDER = sys.argv[1] if len(sys.argv) > 1 else "images/gallery"
MAX_SIDE = 1600
QUALITY = 82
SRC = (".jpg", ".jpeg", ".png", ".webp", ".heic", ".avif", ".tif", ".tiff", ".bmp")

try:
    import pillow_heif; pillow_heif.register_heif_opener()
except Exception:
    pass

names = sorted(f for f in os.listdir(FOLDER) if f.lower().endswith(SRC + (".gif",)) and not f.startswith("."))
result = []
for f in names:
    path = os.path.join(FOLDER, f)
    stem, ext = os.path.splitext(f)
    if ext.lower() == ".gif":
        result.append(f); continue
    try:
        im = Image.open(path)
        im = ImageOps.exif_transpose(im)
        w, h = im.size
        safe0 = re.sub(r"[^\w\-]+", "-", stem, flags=re.U).strip("-") or "photo"
        already = ext == ".jpg" and safe0 == stem and max(w, h) <= MAX_SIDE and getattr(im, "_getexif", lambda: None)() is None
        if already:
            result.append(f); continue
        if im.mode not in ("RGB",):
            bg = Image.new("RGB", im.size, (255, 255, 255))
            im = im.convert("RGBA"); bg.paste(im, mask=im.split()[-1]); im = bg
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        safe = re.sub(r"[^\w\-]+", "-", stem, flags=re.U).strip("-") or "photo"
        out = safe + ".jpg"
        im.save(os.path.join(FOLDER, out), "JPEG", quality=QUALITY, optimize=True, progressive=True)
        if out != f:
            os.remove(path)
        result.append(out)
        print(f"{f} -> {out} {im.size}")
    except Exception as e:
        print("пропущено", f, e, file=sys.stderr)

result = sorted(set(result))
with open(os.path.join(FOLDER, "gallery.json"), "w", encoding="utf-8") as fh:
    json.dump(result, fh, ensure_ascii=False, indent=1)
print("У галереї:", len(result))
