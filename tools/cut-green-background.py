#!/usr/bin/env python3
"""Cut the border-connected green field without altering subject RGB values."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


def is_green(pixel: tuple[int, int, int]) -> bool:
    red, green, blue = pixel
    return green >= 20 and green - max(red, blue) >= 8


def cut_background(source_path: Path, output_path: Path) -> None:
    source = Image.open(source_path).convert("RGB")
    width, height = source.size
    source_pixels = source.load()
    background = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        offset = y * width + x
        if not background[offset] and is_green(source_pixels[x, y]):
            background[offset] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    output = Image.new("RGBA", source.size)
    output_pixels = output.load()
    removed = 0
    for y in range(height):
        for x in range(width):
            is_background = bool(background[y * width + x])
            removed += is_background
            output_pixels[x, y] = (
                (0, 0, 0, 0)
                if is_background
                else (*source_pixels[x, y], 255)
            )

    output.save(output_path)
    print(f"Wrote {output_path}")
    print(f"Transparent pixels: {removed}/{width * height}")
    print("Partially transparent pixels: 0")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    cut_background(args.input, args.output)


if __name__ == "__main__":
    main()
