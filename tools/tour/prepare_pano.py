#!/usr/bin/env python3
"""
Prepare a 360° panorama for the /visita tour.

Input: one equirectangular image (2:1, the format of every 360° camera and of
phone "photo sphere" modes). Output, in public/tour/:

  pano-2048.jpg            loaded first, so the tour starts quickly
  pano-4096.jpg            swapped in when the device can hold it
  poster-portrait.webp     first paint and no-WebGL fallback on phones
  poster-landscape.webp    the same on wide screens

The panorama stays in colour; the page grades it in the shader. The posters are
rendered here with the same projection and the same grade, so the swap from
poster to live panorama does not jump. GRADE, FOV and the projection below must
match src/scripts/tour.ts.

Usage (from the repository root, Python 3 with numpy and Pillow):

  python3 -I tools/tour/prepare_pano.py path/to/panorama.jpg --yaw -150

--yaw is the first stop's heading in degrees (src/config/tour.ts, first stop).
"""

import argparse
import math
import pathlib

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

# --- Shared with src/scripts/tour.ts -----------------------------------------
GRADE_GAIN = 0.78
GRADE_GAMMA = 1.2
FOV_H_DEG = 95.0  # horizontal field of view on wide screens
FOV_V_MIN_DEG = 60.0  # vertical field of view, clamped between these
FOV_V_MAX_DEG = 80.0
PORTRAIT_SHIFT = 0.2  # lens shift on tall screens: the subject sits above the cards


def tan_half_v(aspect: float) -> float:
    lo = math.tan(math.radians(FOV_V_MIN_DEG / 2))
    hi = math.tan(math.radians(FOV_V_MAX_DEG / 2))
    return min(max(math.tan(math.radians(FOV_H_DEG / 2)) / aspect, lo), hi)


def grade(rgb: np.ndarray) -> np.ndarray:
    """Monochrome, darker, a little more contrast: the site's films are black and white."""
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    out = GRADE_GAIN * np.power(np.clip(lum, 0.0, 1.0), GRADE_GAMMA)
    return np.repeat(out[..., None], 3, axis=-1)


def render(equi: np.ndarray, yaw_deg: float, pitch_deg: float, w: int, h: int) -> np.ndarray:
    """Rectilinear view of an equirectangular image (float32, HxWx3, 0..1)."""
    eh, ew, _ = equi.shape
    aspect = w / h
    t = tan_half_v(aspect)
    xs = (np.arange(w, dtype=np.float32) + 0.5) / w * 2 - 1
    ys = 1 - (np.arange(h, dtype=np.float32) + 0.5) / h * 2
    nx, ny = np.meshgrid(xs, ys)
    dx = nx * t * aspect
    dy = (ny - (PORTRAIT_SHIFT if aspect < 1 else 0.0)) * t
    dz = -np.ones_like(dx)
    n = np.sqrt(dx * dx + dy * dy + dz * dz)
    dx, dy, dz = dx / n, dy / n, dz / n

    p, y = math.radians(pitch_deg), math.radians(yaw_deg)
    cp, sp, cy, sy = math.cos(p), math.sin(p), math.cos(y), math.sin(y)
    dy, dz = dy * cp - dz * sp, dy * sp + dz * cp
    dx, dz = dx * cy - dz * sy, dx * sy + dz * cy

    u = 0.5 + np.arctan2(dx, -dz) / (2 * math.pi)
    v = 0.5 - np.arcsin(np.clip(dy, -1, 1)) / math.pi

    # Bilinear sample, wrapping horizontally like the texture's REPEAT mode.
    fx = u * ew - 0.5
    fy = np.clip(v * eh - 0.5, 0, eh - 1)
    x0 = np.floor(fx).astype(np.int64)
    y0 = np.floor(fy).astype(np.int64)
    ax = (fx - x0)[..., None]
    ay = (fy - y0)[..., None]
    x0 %= ew
    x1 = (x0 + 1) % ew
    y1 = np.minimum(y0 + 1, eh - 1)
    top = equi[y0, x0] * (1 - ax) + equi[y0, x1] * ax
    bot = equi[y1, x0] * (1 - ax) + equi[y1, x1] * ax
    return top * (1 - ay) + bot * ay


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('source', type=pathlib.Path, help='equirectangular panorama (2:1)')
    ap.add_argument('--yaw', type=float, default=0.0, help="first stop's heading, degrees")
    ap.add_argument('--pitch', type=float, default=0.0, help="first stop's pitch, degrees")
    ap.add_argument('--out', type=pathlib.Path, default=pathlib.Path('public/tour'))
    args = ap.parse_args()

    src = Image.open(args.source).convert('RGB')
    w, h = src.size
    if abs(w / h - 2) > 0.01:
        raise SystemExit(f'{args.source}: {w}x{h} is not 2:1, so it is not an equirectangular panorama')

    args.out.mkdir(parents=True, exist_ok=True)
    for size in (2048, 4096):
        img = src if w == size else src.resize((size, size // 2), Image.LANCZOS)
        path = args.out / f'pano-{size}.jpg'
        img.save(path, quality=82, optimize=True, progressive=True)
        print(f'{path}  {path.stat().st_size / 1e6:.2f} MB')

    equi = np.asarray(src.resize((4096, 2048), Image.LANCZOS) if w > 4096 else src, dtype=np.float32) / 255.0
    for name, (pw, ph) in {'portrait': (900, 1950), 'landscape': (1920, 1080)}.items():
        view = grade(render(equi, args.yaw, args.pitch, pw, ph))
        path = args.out / f'poster-{name}.webp'
        Image.fromarray(np.round(view * 255).astype(np.uint8)).save(path, quality=80, method=6)
        print(f'{path}  {path.stat().st_size / 1e3:.0f} kB')


if __name__ == '__main__':
    main()
