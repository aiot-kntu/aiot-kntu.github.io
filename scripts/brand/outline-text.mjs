// Turn text into SVG path data so the logo never depends on installed fonts.
// Reads a JSON array of runs on stdin:
//   [{ "text": "...", "font": "path/to.otf", "size": 96, "x": 0, "y": 0, "spacing": 0, "perGlyph": false }]
// and prints, for each run, either one path string or a list of per-glyph strings.
// Used by scripts/brand/build-logo.py.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// fontkitten ships with Astro (astro -> fontace -> fontkitten); find it there.
const fromAstro = createRequire(createRequire(import.meta.url).resolve('astro/package.json'));
const fromFontace = createRequire(fromAstro.resolve('fontace'));
const { create } = await import(pathToFileURL(fromFontace.resolve('fontkitten')).href);

const fonts = new Map();
const font = (file) => {
  if (!fonts.has(file)) fonts.set(file, create(readFileSync(file)));
  return fonts.get(file);
};

const round = (n) => Number(n.toFixed(2));

function glyphPath(glyph, scale, x, y) {
  // Font units are y-up; flip into SVG space and place on the baseline.
  return glyph.path.toSVG().replace(/(-?\d*\.?\d+(?:e-?\d+)?)\s*[, ]?\s*(-?\d*\.?\d+(?:e-?\d+)?)/g,
    (_, gx, gy) => `${round(x + Number(gx) * scale)} ${round(y - Number(gy) * scale)}`);
}

const runs = JSON.parse(readFileSync(0, 'utf8'));
const out = runs.map(({ text, font: file, size, x = 0, y = 0, spacing = 0, perGlyph = false }) => {
  const f = font(file);
  const scale = size / f.unitsPerEm;
  let pen = x;
  const glyphs = [];
  for (const glyph of f.glyphsForString(text)) {
    const d = glyphPath(glyph, scale, pen, y);
    if (d) glyphs.push(d);
    pen += glyph.advanceWidth * scale + spacing;
  }
  return perGlyph ? glyphs : glyphs.join('');
});
process.stdout.write(JSON.stringify(out));
