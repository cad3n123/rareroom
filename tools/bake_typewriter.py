#!/usr/bin/env python3
"""
Bake the "typewriter" threshold treatment into the stamped/typed PNGs so the
browser never has to run the SVG #typewriter filter at runtime (which
re-rasterises — and re-pixelates — every time you zoom).

For each source image it:
  1. desaturates to grey,
  2. hard-thresholds to pure black / white (the same maths as the #typewriter
     SVG filter in index.html: grey' = clamp(slope*grey + intercept)),
  3. keys the white out to transparent (alpha = 1 - grey', times the original
     alpha so the transparent PNG background stays transparent),
  4. recolours the surviving ink to --ink instead of pure black.

Originals are copied ONCE into assets/img/_typewriter_src/ and are always used
as the source of truth, so you can re-bake with a different --intercept any time
without cumulative damage.

Usage:
    python3 tools/bake_typewriter.py                 # defaults (intercept -30.5)
    python3 tools/bake_typewriter.py --intercept -24.5
    python3 tools/bake_typewriter.py --ink 151110    # hex, no '#'
"""
import argparse
import os
import shutil

import numpy as np
from PIL import Image

# Paths are relative to the `site/` directory (this script lives in site/tools).
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_BACKUP = os.path.join(SITE, "assets", "img", "_typewriter_src")

# Every image that is stamped/typed text and should get the treatment.
IMAGES = [
    "assets/img/brand/home_transparent.png",
    "assets/img/brand/rareroom-title.png",
    "assets/img/brand/email-demos.png",
    "assets/img/brand/left-bracket.png",
    "assets/img/brand/right-bracket.png",
    "assets/img/artists/pollish-name.png",
    "assets/img/artists/kelsi-kee-name.png",
    # Scanned line-art brought in from the old site — the same threshold + white-
    # keying makes them crisp (no fuzzy grey halo) at any zoom.
    "assets/img/brand/horizontal-line.png",   # the short divider rule
    "assets/img/brand/about-nav.png",         # vertical side titles …
    "assets/img/brand/artists-nav.png",
    "assets/img/brand/contact-nav.png",
    "assets/img/brand/subscribe.png",         # SUBSCRIBE nav label (same serif set)
    "assets/img/brand/forward-arrow.png",     # studio carousel arrows
    "assets/img/brand/back-arrow.png",
    "assets/img/brand/x.png",                 # close X (studio lightbox + mobile menu)
]


def backup_path(rel):
    return os.path.join(SRC_BACKUP, rel.replace("/", "__"))


def ensure_backup(rel):
    """Copy the pristine original into the backup folder once."""
    dst = backup_path(rel)
    if not os.path.exists(dst):
        os.makedirs(SRC_BACKUP, exist_ok=True)
        shutil.copy2(os.path.join(SITE, rel), dst)
    return dst


def bake(rel, slope, intercept, ink):
    src = ensure_backup(rel)               # always start from the pristine copy
    im = Image.open(src).convert("RGBA")
    arr = np.asarray(im).astype(np.float32) / 255.0
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

    grey = 0.33 * r + 0.33 * g + 0.33 * b          # feColorMatrix desaturate
    t = np.clip(slope * grey + intercept, 0.0, 1.0)  # feComponentTransfer linear
    alpha = (1.0 - t) * a                            # key white out, keep orig alpha

    out = np.zeros_like(arr)
    out[..., 0] = ink[0] / 255.0
    out[..., 1] = ink[1] / 255.0
    out[..., 2] = ink[2] / 255.0
    out[..., 3] = alpha

    baked = Image.fromarray((out * 255.0 + 0.5).astype(np.uint8), "RGBA")
    dst = os.path.join(SITE, rel)
    baked.save(dst)
    kept = int((alpha > 0.5).sum())
    print(f"  baked {rel}  ({im.size[0]}x{im.size[1]}, {kept:,} ink px)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slope", type=float, default=50.0)
    ap.add_argument("--intercept", type=float, default=-30.5,
                    help="threshold knob (matches the #typewriter SVG filter)")
    ap.add_argument("--ink", default="151110", help="ink colour hex, no '#'")
    args = ap.parse_args()

    ink = tuple(int(args.ink[i:i + 2], 16) for i in (0, 2, 4))
    t = (0.5 - args.intercept) / args.slope
    print(f"Baking typewriter treatment  slope={args.slope} intercept={args.intercept} "
          f"(threshold≈{t:.2f})  ink=#{args.ink}")
    for rel in IMAGES:
        if os.path.exists(os.path.join(SITE, rel)) or os.path.exists(backup_path(rel)):
            bake(rel, args.slope, args.intercept, ink)
        else:
            print(f"  SKIP (missing) {rel}")
    print("Done.")


if __name__ == "__main__":
    main()
