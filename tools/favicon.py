#!/usr/bin/env python3
"""
Draw the favicon: the site's helix, with I and A sitting in the two
openings the crossing makes.

    python3 tools/favicon.py

Writes favicon-16.png, favicon-32.png and apple-touch-icon.png into the
repo root, overwriting what's there. Needs Pillow (`pip install pillow`)
and Georgia, which ships with macOS.

Two things are load-bearing:

  * The artwork differs by size. A serif I and A cannot survive inside a
    16px tile that also holds two crossing strands - they become two grey
    smudges and make the mark less legible, not more. So 16px is the
    helix alone and the letters arrive at 32px, which is what a retina
    display shows anyway.

  * Strokes are drawn by stamping discs along the path rather than with
    ImageDraw.line(). PIL has no round line caps, and its `joint="curve"`
    leaves visible artefacts on a tight curve. Stamping gives clean round
    ends for free. Everything is drawn 10x oversized and downsampled.
"""

import math
import os
import struct
from PIL import Image, ImageDraw, ImageFont

# Warmed off the site palette. Cosy is a temperature, not a brightness:
# the site's --ink is faintly blue, this ground is faintly brown at the
# same darkness, and the strands are softened from full teal and rust.
GROUND = (31, 26, 23)
CREAM = (245, 236, 224)
BLUE = (108, 154, 173)
CLAY = (201, 138, 99)

FONT = "/System/Library/Fonts/Supplemental/Georgia.ttf"
OVERSAMPLE = 10

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def stroke(draw, points, colour, width):
    """A thick stroke with round ends, stamped disc by disc."""
    r = width / 2
    for x, y in points:
        draw.ellipse([x - r, y - r, x + r, y + r], fill=colour)


def helix(draw, S):
    """Two strands crossing once, which is what makes the two openings."""
    amp = S * 0.255
    width = S * 0.085
    y0, y1 = S * 0.09, S * 0.91
    for phase, colour in ((0, BLUE), (math.pi, CLAY)):
        points = []
        for i in range(600):
            y = y0 + (y1 - y0) * i / 599
            t = phase + math.pi * 1.6 * ((y - y0) / (y1 - y0) - 0.5)
            points.append((S / 2 + amp * math.sin(t), y))
        stroke(draw, points, colour, width)


def letter(draw, char, S, centre_y):
    font = ImageFont.truetype(FONT, int(S * 0.36))
    l, t, r, b = draw.textbbox((0, 0), char, font=font)
    draw.text(
        (S / 2 - (r + l) / 2, S * centre_y - (b + t) / 2),
        char, font=font, fill=CREAM,
        # a ground-coloured halo, so a letter stays clean where it meets a strand
        stroke_width=int(S * 0.028), stroke_fill=GROUND,
    )


def render(size, letters=True):
    S = size * OVERSAMPLE
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.24), fill=GROUND)
    helix(d, S)
    if letters:
        letter(d, "I", S, 0.275)
        letter(d, "A", S, 0.725)
    return img.resize((size, size), Image.LANCZOS)


def write_ico(path, images):
    """
    Multi-resolution .ico, written by hand for two reasons.

    Pillow's ICO writer downsamples one source image for every size,
    which would put the lettered 32px artwork into the 16px slot - the
    exact thing the per-size artwork exists to avoid.

    And the entries must be classic BMP/DIB, not embedded PNGs. An .ico
    may legally hold either, and Chromium reads both, but WebKit's
    decoder does not handle PNG-compressed entries - so a PNG-in-ICO
    favicon loads everywhere except Safari, which then falls back to its
    grey first-letter placeholder.

    A DIB entry is a BITMAPINFOHEADER whose height is doubled to cover
    the colour data plus a 1-bit mask, then bottom-up BGRA rows, then
    that mask (all zeroes here, since the alpha channel carries the
    transparency).
    """
    blobs = []
    for im in images:
        im = im.convert("RGBA")
        w, h = im.size
        px = im.load()

        rows = []
        for y in range(h - 1, -1, -1):          # DIB rows run bottom-up
            row = bytearray()
            for x in range(w):
                r, g, b, a = px[x, y]
                row += bytes((b, g, r, a))      # BGRA, not RGBA
            rows.append(bytes(row))
        xor = b"".join(rows)

        mask_stride = ((w + 31) // 32) * 4      # 1bpp, padded to 4 bytes
        and_mask = b"\x00" * (mask_stride * h)

        header = struct.pack(
            "<IiiHHIIiiII",
            40, w, h * 2, 1, 32, 0, len(xor) + len(and_mask), 0, 0, 0, 0,
        )
        blobs.append(header + xor + and_mask)

    offset = 6 + 16 * len(blobs)
    out = struct.pack("<HHH", 0, 1, len(blobs))
    entries = b""
    for im, blob in zip(images, blobs):
        w = im.width if im.width < 256 else 0
        h = im.height if im.height < 256 else 0
        entries += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(blob), offset)
        offset += len(blob)

    with open(path, "wb") as f:
        f.write(out + entries + b"".join(blobs))


if __name__ == "__main__":
    for name, size, letters in (
        ("favicon-16.png", 16, False),
        ("favicon-32.png", 32, True),
        ("apple-touch-icon.png", 180, True),
    ):
        path = os.path.join(ROOT, name)
        render(size, letters).save(path)
        print("wrote", name)

    # Safari asks for /favicon.ico before it reads the <link> tags, and
    # on a 404 falls back to its grey first-letter placeholder. So ship
    # a real one - in BMP form, see write_ico.
    write_ico(
        os.path.join(ROOT, "favicon.ico"),
        [render(16, letters=False), render(32), render(48)],
    )
    print("wrote favicon.ico")
