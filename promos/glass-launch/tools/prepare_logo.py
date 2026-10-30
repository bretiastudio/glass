#!/usr/bin/env python3
"""Working copies of the BRETÌA logo for the end card. The master file is never modified.

    python3 -I tools/prepare_logo.py "assets/Logo 3D BRETÌA con Mascotte Blu.png" [out_dir]

Writes, next to the comp's expected paths:
  assets/bretia-logo.png       the original artwork, unchanged in colour and proportion, on transparency:
                               if the master already has an alpha channel it is only trimmed; if it sits on white,
                               only the white connected to the image border is removed (the white inside the
                               letters is enclosed by their black outline and stays), with the edge un-mixed from
                               white so no halo shows on the dark end card.
  assets/bretia-logo-mono.png  the secondary study: the same pixels in the GLASS greys, the original blue kept.
"""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ASSETS = os.path.join(os.path.dirname(HERE), 'assets')


def transparent(rgba):
    rgb = rgba[..., :3].astype(np.float32); a = rgba[..., 3].astype(np.float32) / 255
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    if border.mean() < 0.5:                                    # already cut out
        return rgb, a
    white = (rgb.min(-1) > 232) & (rgb.max(-1) - rgb.min(-1) < 18)
    lab, _ = ndimage.label(white)
    edge_labels = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); edge_labels = edge_labels[edge_labels > 0]
    bg = np.isin(lab, edge_labels)
    band = ndimage.binary_dilation(bg, iterations=3) & ~bg     # the anti-aliased rim between the artwork and the white
    alpha = np.where(bg, 0.0, 1.0)
    # colour-to-alpha against white, on the rim only: c = a·fg + (1 − a)·255
    ca = (255 - rgb).max(-1) / 255
    fg = np.where(ca[..., None] > 1e-3, (rgb - 255 * (1 - ca[..., None])) / np.maximum(ca[..., None], 1e-3), 0)
    alpha = np.where(band, ca, alpha)
    rgb = np.where(band[..., None], np.clip(fg, 0, 255), rgb)
    return rgb, alpha


def trim(rgb, a, margin=0.02):
    ys, xs = np.where(a > 0.02)
    m = int(margin * max(rgb.shape[:2]))
    y0, y1 = max(0, ys.min() - m), min(a.shape[0], ys.max() + m + 1); x0, x1 = max(0, xs.min() - m), min(a.shape[1], xs.max() + m + 1)
    return rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]


def mono(rgb):
    r, g, b = [rgb[..., i] / 255 for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / np.maximum(mx, 1e-6)
    hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
    blue = (hue > 200) & (hue < 255) & (sat > 0.35)
    grey = (0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2])[..., None].repeat(3, -1)
    keep = ndimage.binary_dilation(blue, iterations=1)[..., None]
    return np.where(keep, rgb, grey)


def save(rgb, a, path):
    Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).round().astype(np.uint8), 'RGBA').save(path, optimize=True)
    print('wrote', path)


def main(master, out=ASSETS):
    rgba = np.asarray(Image.open(master).convert('RGBA'))
    rgb, a = trim(*transparent(rgba))
    save(rgb, a, os.path.join(out, 'bretia-logo.png'))
    save(mono(rgb), a, os.path.join(out, 'bretia-logo-mono.png'))


main(sys.argv[1], *sys.argv[2:3])
