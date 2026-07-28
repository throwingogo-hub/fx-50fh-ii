#!/usr/bin/env python3
"""Read the calculator's own 5x7 letterforms off a photograph of its screen.

The product photograph in assets/ shows the unit displaying "17:Doppler", which
is ten characters of its real dot-matrix font. This prints them as row pictures
in the form js/font.js stores, so the hand-authored table can be checked against
the hardware rather than against a generic 5x7 set.

The grid below was solved from the photo: the ink of a glyph known to start at
column 0 fixes the origin, and the spacing of the two 'p's fixes the pitch.

    python3 tools/extract-font.py path/to/shell.png

Needs pillow and numpy, neither of which the calculator itself uses.
"""

import sys
from PIL import Image
import numpy as np

# glass geometry, in the 846 x 1710 space of assets/fx-50fh-ii.png
CELL_X0, CELL_PITCH, DOT_W = 156.2, 33.70, 6.05
ROW_Y0, DOT_H = 310.5, 8.9
TEXT = "17:Doppler"
INK = 140          # a dot counts as lit below this mean luminance


def main(path):
    a = np.asarray(Image.open(path).convert("L")).astype(int)
    for i, ch in enumerate(TEXT):
        rows = []
        for r in range(7):
            line = ""
            for c in range(5):
                cx = int(CELL_X0 + i * CELL_PITCH + c * DOT_W + DOT_W / 2)
                cy = int(ROW_Y0 + r * DOT_H + DOT_H / 2)
                patch = a[cy - 2:cy + 3, cx - 1:cx + 2]
                line += "#" if patch.mean() < INK else "."
            rows.append(line)
        pretty = ", ".join(f"'{r}'" for r in rows)
        print(f"  '{ch}': [{pretty}],")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "assets/fx-50fh-ii.png")
