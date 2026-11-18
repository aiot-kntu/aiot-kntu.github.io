"""Build the intelli-things logo set from one set of measurements.

Run from the repo root:  python3 scripts/brand/build-logo.py
Needs Node (for scripts/brand/outline-text.mjs). Then run build-icons.py
to refresh the PNG/ICO icons and the social image.

Writes:
  brand/logo/*.svg                       every colour and layout variant
  public/logo.svg, public/logo-mark.svg  stacked lockup and icon for the site
  public/favicon.svg                     heavier icon that follows the colour scheme
  src/content/settings/logo-paths.json   the header logo, drawn by LogoMorphIntro

Geometry is in pixels of the reference board (brand concept image), with the
globe centre at 0,0. Every number below was measured from that image.
"""
import json
import math
import subprocess
from pathlib import Path

NAVY, TEAL = "#0F3B82", "#00B894"
FONTS = Path("brand/fonts")
MEDIUM, REGULAR = str(FONTS / "Geist-Medium.otf"), str(FONTS / "Geist-Regular.otf")


def num(v: float) -> str:
    return f"{v:.2f}".rstrip("0").rstrip(".")


# ── Mark geometry ───────────────────────────────────────────────────────────
class Geometry:
    def __init__(self, heavy: bool = False):
        # `heavy` is the favicon cut: thicker strokes and nodes, wider gaps,
        # one wifi arc fewer, so it still reads at 16-32 px.
        self.sw = 12 if heavy else 5.6        # stroke width
        self.R = 126.5                          # outer ring radius
        self.gap = 18 if heavy else 12.5        # ring gap each side of a node (deg)
        self.node_tb, self.node_side = 123.8, 128.0
        self.r_tb, self.r_side = (22, 21) if heavy else (14, 13)
        self.mer_end = 98 if heavy else 108     # meridian end, px above/below centre
        self.spoke_v = 88 if heavy else 98.3
        self.spoke_h = (-96, -67) if heavy else (-103, -67)
        # wifi arcs centred on the top node: (radius, half-angle)
        self.wifi = [(42, 30), (64, 32)] if heavy else [(24, 26), (36, 29), (51, 33)]

    # angle measured from 12 o'clock, clockwise
    @staticmethod
    def pol(r, deg, cy=0.0):
        a = math.radians(deg)
        return r * math.sin(a), cy - r * math.cos(a)

    def arc(self, r, a0, a1, cy=0.0):
        x0, y0 = self.pol(r, a0, cy)
        x1, y1 = self.pol(r, a1, cy)
        return f"M{num(x0)} {num(y0)}A{num(r)} {num(r)} 0 0 1 {num(x1)} {num(y1)}"

    @property
    def ring(self):
        g = self.gap
        return "".join(self.arc(self.R, q + g, q + 90 - g) for q in (0, 90, 180, 270))

    def meridian(self, side: int) -> str:
        """One lens-shaped meridian as two cubic Béziers. side=+1 right, -1 left.
        It is an arc of a circle of radius 147 whose centre sits 72.5 px across
        the axis, so the meridian bulges to 74.5 px at the equator."""
        r, cx = 147.0, -72.5 * side
        top = math.degrees(math.asin(self.mer_end / r))   # angle above the equator
        pts = []
        def p(deg):  # point on the circle, deg above (+) / below (-) the equator
            a = math.radians(deg)
            return cx + side * r * math.cos(a), -r * math.sin(a)
        def tangent(deg):
            a = math.radians(deg)
            return -side * math.sin(a), -math.cos(a)  # derivative wrt angle, scaled later
        d = ""
        for a0, a1 in ((top, 0.0), (0.0, -top)):
            k = 4 / 3 * math.tan(math.radians(abs(a1 - a0)) / 4) * r
            (x0, y0), (x3, y3) = p(a0), p(a1)
            t0, t1 = tangent(a0), tangent(a1)
            # moving from a0 down to a1 means decreasing angle: flip the tangent
            x1, y1 = x0 - t0[0] * k, y0 - t0[1] * k
            x2, y2 = x3 + t1[0] * k, y3 + t1[1] * k
            if not d:
                d = f"M{num(x0)} {num(y0)}"
            d += f"C{num(x1)} {num(y1)} {num(x2)} {num(y2)} {num(x3)} {num(y3)}"
        return d

    @property
    def spokes(self):
        a, b = self.spoke_h
        v = self.spoke_v
        return f"M{num(a)} 0H{num(b)}M{num(-b)} 0H{num(-a)}M0 {num(-v)}V{num(v)}"

    def wifi_arc(self, i):
        r, half = self.wifi[i]
        return self.arc(r, -half, half, -self.node_tb)

    # Four-point star: cubic control points fitted to the reference profile.
    star = ("M0 -54C14.8 -14.4 14.4 -14.8 54 0C14.4 14.8 14.8 14.4 0 54"
            "C-14.8 14.4 -14.4 14.8 -54 0C-14.4 -14.8 -14.8 -14.4 0 -54Z")

    def nodes(self):
        t, s = self.node_tb, self.node_side
        return [(0, -t, self.r_tb), (0, t, self.r_tb), (-s, 0, self.r_side), (s, 0, self.r_side)]


def circle_path(x, y, r):
    return f"M{num(x - r)} {num(y)}a{num(r)} {num(r)} 0 1 0 {num(2 * r)} 0a{num(r)} {num(r)} 0 1 0 {num(-2 * r)} 0Z"


def mark(c: dict, g: Geometry) -> str:
    """c: colours for ring, accent (meridians, spokes, nodes, inner wifi), wifi (outer arc), star."""
    inner_wifi = "".join(g.wifi_arc(i) for i in range(len(g.wifi) - 1))
    nodes = "".join(f'<circle cx="{num(x)}" cy="{num(y)}" r="{num(r)}"/>' for x, y, r in g.nodes())
    return (
        f'<g fill="none" stroke-width="{num(g.sw)}" stroke-linecap="round">'
        f'<path d="{g.ring}" stroke="{c["ring"]}"/>'
        f'<path d="{g.meridian(-1)}{g.meridian(1)}{g.spokes}{inner_wifi}" stroke="{c["accent"]}"/>'
        f'<path d="{g.wifi_arc(len(g.wifi) - 1)}" stroke="{c["wifi"]}"/></g>'
        f'<path d="{g.star}" fill="{c["star"]}"/>'
        f'<g fill="{c["accent"]}">{nodes}</g>'
    )


# ── Type, outlined so no font has to be installed ──────────────────────────
def outline(runs: list[dict]) -> list:
    out = subprocess.run(["node", "scripts/brand/outline-text.mjs"], input=json.dumps(runs).encode(),
                         capture_output=True, check=True).stdout
    return json.loads(out)


# Sizes and tracking were calibrated against the reference wordmark.
STACKED_RUNS = [
    dict(text="intelli-things", font=MEDIUM, size=96, spacing=-5, x=-253, y=226, perGlyph=True),
    dict(text="THE INTELLIGENCE OF THINGS LAB", font=REGULAR, size=18, spacing=6.6, x=-245, y=269),
    dict(text="AT KNTU", font=REGULAR, size=18, spacing=9.7, x=-65, y=304),
]
RULES = "M-245 298H-105M102 298H245"
HORIZONTAL_RUNS = [
    dict(text="intelli-things", font=MEDIUM, size=96, spacing=-3.4, x=178, y=2),
    dict(text="THE INTELLIGENCE OF THINGS LAB · KNTU", font=REGULAR, size=17.5, spacing=5.2, x=182, y=50),
]
word_glyphs, tagline, at_kntu = outline(STACKED_RUNS)
h_word, h_tag = outline(HORIZONTAL_RUNS)


def stacked_text(ink: str) -> str:
    return (f'<path d="{"".join(word_glyphs)}{tagline}{at_kntu}" fill="{ink}"/>'
            f'<path d="{RULES}" stroke="{ink}" stroke-width="1.3" opacity=".7"/>')


def horizontal_text(ink: str) -> str:
    return f'<path d="{h_word}{h_tag}" fill="{ink}"/>'


def svg(vb, body, bg=None, extra=""):
    x, y, w, h = vb
    b = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{w * 0.05:.0f}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" '
            f'width="{w}" height="{h}">{extra}{b}{body}</svg>\n')


def palette(ring, accent=None, wifi=None, star=None):
    return dict(ring=ring, accent=accent or ring, wifi=wifi or ring, star=star or ring)


COLOUR = palette(NAVY, TEAL)
NAVY_ONLY = palette(NAVY)
BLACK = palette("#111")
WHITE = palette("#fff")
REVERSED_COLOUR = palette("#fff", TEAL)

STACKED = (-280, -212, 560, 550)
ICON = (-150, -195, 300, 345)
HORIZONTAL = (-165, -200, 890, 355)
FAVICON = (-175, -199, 350, 350)

std, heavy = Geometry(), Geometry(heavy=True)
brand = Path("brand/logo")
brand.mkdir(parents=True, exist_ok=True)
files = {
    "icon-color.svg": svg(ICON, mark(COLOUR, std)),
    "icon-navy.svg": svg(ICON, mark(NAVY_ONLY, std)),
    "icon-mono.svg": svg(ICON, mark(palette("currentColor"), std)),
    "favicon-color.svg": svg(FAVICON, mark(COLOUR, heavy)),
    "logo-color.svg": svg(STACKED, mark(COLOUR, std) + stacked_text(NAVY)),
    "logo-navy.svg": svg(STACKED, mark(NAVY_ONLY, std) + stacked_text(NAVY)),
    "logo-black.svg": svg(STACKED, mark(BLACK, std) + stacked_text("#111")),
    "logo-reversed.svg": svg(STACKED, mark(WHITE, std) + stacked_text("#fff"), bg="#1C1C1E"),
    "logo-reversed-color.svg": svg(STACKED, mark(REVERSED_COLOUR, std) + stacked_text("#fff"), bg=NAVY),
    "logo-horizontal.svg": svg(HORIZONTAL, mark(COLOUR, std) + horizontal_text(NAVY)),
}
for name, content in files.items():
    (brand / name).write_text(content)

public = Path("public")
(public / "logo.svg").write_text(files["logo-color.svg"])
(public / "logo-mark.svg").write_text(files["icon-color.svg"])

# favicon.svg: navy ring and star turn white on dark browser chrome.
scheme = ("<style>:root{--k:" + NAVY + ";--a:" + TEAL + "}"
          "@media (prefers-color-scheme:dark){:root{--k:#fff}}</style>")
(public / "favicon.svg").write_text(
    svg(FAVICON, mark(palette("var(--k)", "var(--a)"), heavy), extra=scheme))

# ── Header logo for LogoMorphIntro ──────────────────────────────────────────
# Colours are CSS variables (see logo-morph.css) so dark mode can swap them.
INK, ACCENT = "var(--logo-ink)", "var(--logo-accent)"
sw = num(std.sw)
stroke = lambda d, colour, **extra: {"d": d, "stroke": colour, "strokeWidth": sw,
                                    "strokeLinecap": "round", **extra}
fill = lambda d, colour: {"d": d, "fill": colour}
inner_wifi = "".join(std.wifi_arc(i) for i in range(len(std.wifi) - 1))
header = [
    stroke(std.ring, INK),
    stroke(std.meridian(-1), ACCENT),
    stroke(std.meridian(1), ACCENT),
    stroke(std.spokes, ACCENT),
    stroke(inner_wifi, ACCENT),
    stroke(std.wifi_arc(len(std.wifi) - 1), INK),
    {**stroke(RULES, INK), "strokeWidth": "1.3"},
    fill(std.star, INK),
    *[fill(circle_path(x, y, r), ACCENT) for x, y, r in std.nodes()],
    *[fill(d, INK) for d in word_glyphs],
    fill(tagline, INK),
    fill(at_kntu, INK),
]
Path("src/content/settings/logo-paths.json").write_text(json.dumps(header, indent=2) + "\n")
print("wrote", ", ".join(files), "+ public/logo.svg, logo-mark.svg, favicon.svg, logo-paths.json")
