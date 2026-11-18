"""Build favicons, touch icons and the social preview image.

Run from the repo root, after build-logo.py:  python3 scripts/brand/build-icons.py
Needs `rsvg-convert` (brew install librsvg). Writes into public/.

Small icons use brand/logo/favicon-color.svg, the heavier cut of the mark;
touch icons use the full-weight icon. public/favicon.svg itself is written by
build-logo.py because it follows the browser's colour scheme.
"""
import re
import struct
import subprocess
from pathlib import Path

PUBLIC, BRAND = Path("public"), Path("brand/logo")
PAPER = "#FFFFFF"


def placed(file: str, width: int, height: int | None = None, inset: float = 0) -> str:
    """The SVG `file` fitted, centred, into a width×height box (square if no
    height), leaving `inset` of the box's width and height empty on each side."""
    height = height or width
    src = (BRAND / file).read_text()
    x, y, w, h = (float(v) for v in re.search(r'viewBox="([^"]+)"', src).group(1).split())
    inner = re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", src, flags=re.S)
    k = min(width * (1 - 2 * inset) / w, height * (1 - 2 * inset) / h)
    tx = (width - w * k) / 2 - x * k
    ty = (height - h * k) / 2 - y * k
    return f'<g transform="translate({tx:.3f} {ty:.3f}) scale({k:.4f})">{inner}</g>'


def svg(size: int, body: str, extra: str = "") -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 {size} {size}">{extra}{body}</svg>'
    )


def png(svg_text: str, out: Path, width: int, height: int | None = None) -> bytes:
    args = ["rsvg-convert", "-w", str(width)]
    if height:
        args += ["-h", str(height)]
    data = subprocess.run(args, input=svg_text.encode(), capture_output=True, check=True).stdout
    out.write_bytes(data)
    return data


def ico(pngs: list[tuple[int, bytes]], out: Path) -> None:
    """Pack PNG images into one .ico (PNG-in-ICO is supported everywhere)."""
    header = struct.pack("<HHH", 0, 1, len(pngs))
    entries, offset, blobs = b"", 6 + 16 * len(pngs), b""
    for size, data in pngs:
        entries += struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
        blobs += data
    out.write_bytes(header + entries + blobs)


# 1. favicon.ico for browsers and crawlers that ignore SVG icons.
tmp = Path("/tmp/aiot-icons"); tmp.mkdir(exist_ok=True)
ico([(n, png(svg(n, placed("favicon-color.svg", n)), tmp / f"{n}.png", n)) for n in (16, 32, 48)], PUBLIC / "favicon.ico")

# 2. Touch and manifest icons: colour mark on a solid white square, padded,
#    because iOS and Android crop their own rounded shape.
for name, size in (("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
    tile = f'<rect width="{size}" height="{size}" fill="{PAPER}"/>'
    png(svg(size, tile + placed("icon-color.svg", size, inset=0.14)), PUBLIC / name, size)

# 3. Social preview (1200×630): the horizontal lockup, centred, with the university.
og = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">'
    f'<rect width="1200" height="630" fill="{PAPER}"/>'
    f'<g transform="translate(0 -40)">{placed("logo-horizontal.svg", 1200, 630, inset=0.1)}</g>'
    '<text x="600" y="560" text-anchor="middle" font-family="Geist, Helvetica Neue, Helvetica, Arial" '
    'font-size="26" fill="#0F3B82" opacity=".75">K. N. Toosi University of Technology</text>'
    "</svg>"
)
png(og, PUBLIC / "og-image.png", 1200, 630)
print("wrote", ", ".join(sorted(p.name for p in PUBLIC.iterdir() if p.is_file())))
