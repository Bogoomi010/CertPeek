"""Compose the README hero image from two app screenshots.

usage: python docs/compose-hero.py <upload.jpg> <details.jpg> [--light]

Both screenshots are scaled to the same height, given rounded corners and a
soft shadow, and placed side by side on a dark (default) or light background.
Output: docs/assets/hero.png
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

up_path, info_path = sys.argv[1], sys.argv[2]
light = "--light" in sys.argv
BG, SHADOW = ("#F3F4F5", 46) if light else ("#0F1115", 140)
H, PAD, GAP, R = 480, 36, 28, 18

up = Image.open(up_path).convert("RGB")
info = Image.open(info_path).convert("RGB")
info = info.crop((0, 0, info.width - 14, info.height))  # drop the webview scrollbar
info = info.resize((round(info.width * H / info.height), H), Image.LANCZOS)
up = up.resize((round(up.width * H / up.height), H), Image.LANCZOS)

canvas = Image.new("RGB", (PAD + up.width + GAP + info.width + PAD, H + 2 * PAD), BG)


def card(img: Image.Image, x: int, y: int) -> None:
    sh = Image.new("RGBA", (img.width + 40, img.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((20, 26, img.width + 20, img.height + 26), R, fill=(0, 0, 0, SHADOW))
    canvas.paste(sh.filter(ImageFilter.GaussianBlur(14)), (x - 20, y - 20), sh)
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width - 1, img.height - 1), R, fill=255)
    canvas.paste(img, (x, y), mask)


card(up, PAD, PAD)
card(info, PAD + up.width + GAP, PAD)
out = Path(__file__).resolve().parent / "assets" / "hero.png"
canvas.save(out, optimize=True)
print(out, canvas.size)
