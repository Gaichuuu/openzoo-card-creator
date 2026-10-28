interface Bitmap { data: Uint8ClampedArray | number[]; width: number; height: number }

export interface PixelBox { x: number; y: number; w: number; h: number }

type RGB = readonly number[];
type PixelTest = (r: number, g: number, b: number) => boolean;

export interface PillPalette { fill: RGB[]; text: RGB; border: RGB }

export const DEFAULT_PILL_COLORS = { fill: [155, 180, 216], text: [255, 255, 255] };

const FILL_TOL = 14;
const INK_TOL = 11;
const AMBIGUOUS = 2 * FILL_TOL;

const chebyshevRgb = (r: number, g: number, b: number, ref: RGB) =>
  Math.max(Math.abs(r - ref[0]), Math.abs(g - ref[1]), Math.abs(b - ref[2]));
const chebyshev = (c: RGB, ref: RGB) => chebyshevRgb(c[0], c[1], c[2], ref);

const isFill: PixelTest = (r, g, b) => chebyshevRgb(r, g, b, DEFAULT_PILL_COLORS.fill) < FILL_TOL;
const isWhite: PixelTest = (r, g, b) => r > 245 && g > 245 && b > 245;

interface PathSegment { a: RGB; d: [number, number, number]; len: number }

function pathSegments(stops: RGB[]): PathSegment[] {
  return stops.slice(1).map((s, k) => {
    const a = stops[k];
    const d: [number, number, number] = [s[0] - a[0], s[1] - a[1], s[2] - a[2]];
    return { a, d, len: d[0] * d[0] + d[1] * d[1] + d[2] * d[2] };
  });
}

function pathDistance(r: number, g: number, b: number, stops: RGB[], segments: PathSegment[]): number {
  if (!segments.length) return chebyshevRgb(r, g, b, stops[0]);
  let best = Infinity;
  for (const { a, d, len } of segments) {
    const t = len ? Math.max(0, Math.min(1, (d[0] * (r - a[0]) + d[1] * (g - a[1]) + d[2] * (b - a[2])) / len)) : 0;
    const dist = Math.max(Math.abs(r - a[0] - d[0] * t), Math.abs(g - a[1] - d[1] * t), Math.abs(b - a[2] - d[2] * t));
    if (dist < best) best = dist;
  }
  return best;
}

export function measurePillBias(bmp: Bitmap, box: PixelBox, margin: number, palette?: PillPalette): number | null {
  let fillTest: PixelTest = isFill;
  let inkTest: PixelTest = isWhite;
  let borderIsInk = false;
  if (palette) {
    const { fill, text, border } = palette;
    const segments = pathSegments(fill);
    if (pathDistance(text[0], text[1], text[2], fill, segments) < AMBIGUOUS) return null;
    fillTest = (r, g, b) => pathDistance(r, g, b, fill, segments) < FILL_TOL;
    inkTest = (r, g, b) => chebyshevRgb(r, g, b, text) < INK_TOL;
    borderIsInk = chebyshev(border, text) < AMBIGUOUS;
    if (borderIsInk) margin = 0;
  }
  const { data, width, height } = bmp;
  const x0 = Math.max(0, box.x);
  const x1 = Math.min(width, box.x + box.w);
  const y0 = Math.max(0, box.y);
  const y1 = Math.min(height, box.y + box.h);
  const at = (x: number, y: number) => (y * width + x) * 4;
  const countRow = (y: number, from: number, to: number, test: PixelTest) => {
    let n = 0;
    for (let x = from; x < to; x++) {
      const i = at(x, y);
      if (test(data[i], data[i + 1], data[i + 2]) && ++n >= 3) return true;
    }
    return false;
  };

  let fillTop = -1;
  let fillBot = -1;
  if (palette) {
    const counts: number[] = [];
    for (let y = y0; y < y1; y++) {
      let n = 0;
      for (let x = x0; x < x1; x++) {
        const i = at(x, y);
        if (fillTest(data[i], data[i + 1], data[i + 2])) n++;
      }
      counts.push(n);
    }
    const gate = Math.max(3, Math.max(...counts) / 4);
    const first = counts.findIndex((n) => n >= gate);
    if (first >= 0) {
      fillTop = y0 + first;
      fillBot = y0 + counts.length - 1 - [...counts].reverse().findIndex((n) => n >= gate);
    }
  } else {
    for (let y = y0; y < y1; y++) {
      if (!countRow(y, x0, x1, fillTest)) continue;
      if (fillTop < 0) fillTop = y;
      fillBot = y;
    }
  }
  if (fillTop < 0) return null;

  const mid = Math.floor((fillTop + fillBot) / 2);
  let fx0 = -1;
  let fx1 = -1;
  for (let x = x0; x < x1; x++) {
    const i = at(x, mid);
    if (!fillTest(data[i], data[i + 1], data[i + 2])) continue;
    if (fx0 < 0) fx0 = x;
    fx1 = x + 1;
  }

  if (borderIsInk) {
    const cap = Math.floor((fillBot - fillTop) / 2);
    fx0 += cap;
    fx1 -= cap;
  }

  let inkTop = -1;
  let inkBot = -1;
  for (let y = Math.max(y0, fillTop - margin); y <= Math.min(y1 - 1, fillBot + margin); y++) {
    if (!countRow(y, fx0, fx1, inkTest)) continue;
    if (inkTop < 0) inkTop = y;
    inkBot = y;
  }
  if (inkTop < 0) return null;

  return ((inkTop - fillTop) - (fillBot - inkBot)) / 2;
}

const RGBA_RE = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/g;

function parseRgbas(css: string): { rgb: number[]; alpha: number }[] {
  return Array.from(css.matchAll(RGBA_RE), (m) => ({ rgb: [+m[1], +m[2], +m[3]], alpha: m[4] === undefined ? 1 : +m[4] }));
}

interface PillComputed { backgroundColor: string; backgroundImage: string; color: string; borderTopColor: string }

export function resolvePillPalette(cs: PillComputed, sampleFill: () => RGB | null): PillPalette | null | undefined {
  const [bg] = parseRgbas(cs.backgroundColor);
  const [text] = parseRgbas(cs.color);
  const [border] = parseRgbas(cs.borderTopColor);
  if (!bg || !text || !border) return null;
  const stops = cs.backgroundImage === 'none' ? [] : parseRgbas(cs.backgroundImage);
  const same = (a: RGB, b: RGB) => a.every((v, i) => v === b[i]);
  const defaultColors = !stops.length && bg.alpha === 1 && same(bg.rgb, DEFAULT_PILL_COLORS.fill) && same(text.rgb, DEFAULT_PILL_COLORS.text);
  if (defaultColors && chebyshev(border.rgb, text.rgb) >= AMBIGUOUS) return undefined;
  let fill: RGB[];
  if (stops.length) fill = stops.map((s) => s.rgb);
  else if (bg.alpha === 1) fill = [bg.rgb];
  else {
    const sampled = sampleFill();
    if (!sampled) return null;
    fill = [sampled];
  }
  return { fill, text: text.rgb, border: border.rgb };
}

export function pillExportShift(bias: number, pixelRatio: number): number {
  return bias === 0 ? 0 : -bias / pixelRatio;
}

const TRANSLATE_Y = /^translateY\((-?[\d.]+)px\)$/;

export function correctPillsForExport(cardEl: HTMLElement, bmp: Bitmap, pixelRatio: number): () => void {
  const pills = Array.from(cardEl.querySelectorAll('[data-oz-pill]')) as HTMLElement[];
  const root = cardEl.getBoundingClientRect();
  if (!pills.length || !(root.width > 0)) return () => {};
  const s = bmp.width / root.width;
  const undo: (() => void)[] = [];
  for (const pill of pills) {
    const item = pill.firstElementChild as HTMLElement | null;
    const r = pill.getBoundingClientRect();
    if (!item || !(r.width > 0)) continue;
    const box = {
      x: Math.round((r.left - root.left) * s),
      y: Math.round((r.top - root.top) * s) - 2 * pixelRatio,
      w: Math.round(r.width * s),
      h: Math.round(r.height * s) + 4 * pixelRatio,
    };
    const palette = resolvePillPalette(getComputedStyle(pill), () => {
      const x = Math.round((r.left - root.left) * s + 1.4 * pixelRatio);
      const y = Math.round((r.top - root.top + r.height / 2) * s);
      if (x < 0 || y < 0 || x >= bmp.width || y >= bmp.height) return null;
      const i = (y * bmp.width + x) * 4;
      return [bmp.data[i], bmp.data[i + 1], bmp.data[i + 2]];
    });
    if (palette === null) continue;
    const bias = measurePillBias(bmp, box, pixelRatio, palette);
    const shift = bias === null ? 0 : pillExportShift(bias, pixelRatio);
    if (shift === 0) continue;
    const prev = item.style.transform;
    const base = prev ? Number(TRANSLATE_Y.exec(prev)?.[1]) : 0;
    if (Number.isNaN(base)) continue;
    item.style.transform = `translateY(${(base + shift).toFixed(3)}px)`;
    const written = item.style.transform;
    undo.push(() => {
      if (item.style.transform === written) item.style.transform = prev;
    });
  }
  return () => undo.forEach((fn) => fn());
}
