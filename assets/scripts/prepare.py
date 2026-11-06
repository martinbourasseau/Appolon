"""
Préparation des images sources d'Apollon.

Usage :  python3 -I assets/scripts/prepare.py <source> <sortie.webp> <mode> [options]

Modes
  copy        : simple conversion WebP (tableaux plein cadre)
  white       : détourage d'un fond blanc
  checker     : suppression d'un damier de « fausse transparence » incrusté
Options
  --erode N   : rogne N px de bord après détourage (supprime liserés et halos)
  --largest   : ne garde que la plus grande forme (supprime traces isolées)
  --holes N   : rend transparents les fonds enfermés de plus de N px
                (entre les pattes, dans une arche…)

Le détourage automatique reste PROVISOIRE : un PNG à transparence réelle
fourni par Martin le remplacera toujours.
"""

import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def keep_largest(mask: np.ndarray) -> np.ndarray:
    lab, n = ndimage.label(mask)
    if n <= 1:
        return mask
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    return lab == (int(np.argmax(sizes)) + 1)


def from_border(bg: np.ndarray) -> np.ndarray:
    """Pixels de fond reliés au bord de l'image (évite de trouer le sujet)."""
    lab, _ = ndimage.label(bg)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    edge = edge[edge > 0]
    return np.isin(lab, edge)


def main():
    src, out, mode = sys.argv[1:4]
    args = sys.argv[4:]
    erode = int(args[args.index("--erode") + 1]) if "--erode" in args else 0
    largest = "--largest" in args
    holes = int(args[args.index("--holes") + 1]) if "--holes" in args else 0

    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.int16)

    if mode == "copy":
        im.save(out, "WEBP", quality=90, method=6)
        print(out, im.size)
        return

    if mode == "white":
        bg = a.min(axis=2) > 238
    elif mode == "checker":
        sat = a.max(axis=2) - a.min(axis=2)
        bg = (sat < 14) & (a.min(axis=2) > 196)
    else:
        raise SystemExit(f"mode inconnu : {mode}")

    cand = ndimage.binary_opening(bg, iterations=1)
    bg = from_border(cand)
    if holes:
        lab, n = ndimage.label(cand & ~bg)
        if n:
            sizes = ndimage.sum(cand, lab, range(1, n + 1))
            big = [i + 1 for i, v in enumerate(sizes) if v > holes]
            bg |= np.isin(lab, big)
    subject = ~bg
    if largest:
        subject = keep_largest(subject)
    if erode:
        subject = ndimage.binary_erosion(subject, iterations=erode)

    alpha = Image.fromarray((subject * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    rgba = im.copy()
    rgba.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 16 else 0).getbbox()
    rgba = rgba.crop(box)
    rgba.save(out, "WEBP", quality=90, method=6)
    print(out, rgba.size)


if __name__ == "__main__":
    main()
