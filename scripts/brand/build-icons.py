"""Build favicons, touch icons and the social preview image.

Run from the repo root:  python3 scripts/brand/build-icons.py
Needs `rsvg-convert` (brew install librsvg). Writes into public/.

The favicon is option A from the Figma board "Favicon — proposals":
the globe ring, one meridian and the two antennas, with strokes about
three times heavier than the full logo so they survive at 16px.
"""
import re
import struct
import subprocess
from pathlib import Path

PUBLIC = Path("public")
INK, PAPER = "#09090B", "#FFFFFF"
DARK_INK = "#FAFAFA"

# Mark geometry, in the logo's own units (globe centre 99,99, radius 80).
SCALE, TOP, STROKE, DOT, MERIDIAN_RX = 0.4, 6, 6, 6, 42


def mark(size: int, ink_class: bool = False, color: str = INK, inset: float = 0) -> str:
    """The mark drawn inside a size×size box; `inset` shrinks it toward the centre."""
    s = SCALE * (1 - 2 * inset)
    tx = 50 - 99 * s
    ty = TOP * (1 - 2 * inset) + 100 * inset + 25 * s
    sw = STROKE / SCALE
    dot = DOT / SCALE
    stroke = 'class="i"' if ink_class else f'stroke="{color}"'
    fill = 'class="d"' if ink_class else f'fill="{color}"'
    return (
        f'<g transform="scale({size / 100}) translate({tx:.3f} {ty:.3f}) scale({s:.4f})">'
        f'<g {stroke} stroke-width="{sw:.2f}" fill="none">'
        f'<circle cx="99" cy="99" r="80"/>'
        f'<ellipse cx="99" cy="99" rx="{MERIDIAN_RX}" ry="80"/>'
        f'<path d="M18.7 99V-14M179.3 99V-14" stroke-linecap="round"/></g>'
        f'<circle {fill} cx="18.7" cy="-18" r="{dot:.2f}"/>'
        f'<circle {fill} cx="179.3" cy="-18" r="{dot:.2f}"/></g>'
    )


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


# 1. favicon.svg follows the browser's colour scheme.
style = (
    f"<style>.i{{stroke:{INK}}}.d{{fill:{INK}}}"
    f"@media (prefers-color-scheme:dark){{.i{{stroke:{DARK_INK}}}.d{{fill:{DARK_INK}}}}}</style>"
)
(PUBLIC / "favicon.svg").write_text(svg(100, mark(100, ink_class=True), style) + "\n")

# 2. favicon.ico for browsers and crawlers that ignore SVG icons.
tmp = Path("/tmp/aiot-icons"); tmp.mkdir(exist_ok=True)
ico([(n, png(svg(n, mark(n)), tmp / f"{n}.png", n)) for n in (16, 32, 48)], PUBLIC / "favicon.ico")

# 3. Touch and manifest icons: ink mark on a solid white square, padded,
#    because iOS and Android crop their own rounded shape.
for name, size in (("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
    tile = f'<rect width="{size}" height="{size}" fill="{PAPER}"/>'
    png(svg(size, tile + mark(size, inset=0.14)), PUBLIC / name, size)

# 4. Social preview (1200×630): the full logo lockup, centred, with the lab's name.
logo = (PUBLIC / "logo.svg").read_text()
view = [float(v) for v in re.search(r'viewBox="([^"]+)"', logo).group(1).split()]
inner = re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", logo, flags=re.S)
lockup_h = 300
k = lockup_h / view[3]
lx = (1200 - view[2] * k) / 2 - view[0] * k
ly = 90 - view[1] * k
og = (
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">'
    f'<rect width="1200" height="630" fill="{PAPER}"/>'
    f'<g fill="none" transform="translate({lx:.2f} {ly:.2f}) scale({k:.4f})">{inner}</g>'
    f'<text x="600" y="500" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial" '
    f'font-size="40" font-weight="500" fill="{INK}" letter-spacing="-0.5">The Intelligence of Things Lab</text>'
    f'<text x="600" y="548" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial" '
    f'font-size="24" fill="#71717A">K. N. Toosi University of Technology</text>'
    "</svg>"
)
png(og, PUBLIC / "og-image.png", 1200, 630)
print("wrote", ", ".join(sorted(p.name for p in PUBLIC.iterdir() if p.is_file())))
