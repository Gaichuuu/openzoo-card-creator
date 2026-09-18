interface Bitmap { data: Uint8ClampedArray | number[]; width: number; height: number }

export interface PixelBox { x: number; y: number; w: number; h: number }

const isFill = (r: number, g: number, b: number) =>
  Math.abs(r - 155) < 14 && Math.abs(g - 180) < 14 && Math.abs(b - 216) < 14;
const isWhite = (r: number, g: number, b: number) => r > 245 && g > 245 && b > 245;

export function measurePillBias(bmp: Bitmap, box: PixelBox, margin: number): number | null {
  const { data, width, height } = bmp;
  const x0 = Math.max(0, box.x);
  const x1 = Math.min(width, box.x + box.w);
  const y0 = Math.max(0, box.y);
  const y1 = Math.min(height, box.y + box.h);
  const at = (x: number, y: number) => (y * width + x) * 4;
  const countRow = (y: number, from: number, to: number, test: typeof isFill) => {
    let n = 0;
    for (let x = from; x < to; x++) {
      const i = at(x, y);
      if (test(data[i], data[i + 1], data[i + 2]) && ++n >= 3) return true;
    }
    return false;
  };

  let fillTop = -1;
  let fillBot = -1;
  for (let y = y0; y < y1; y++) {
    if (!countRow(y, x0, x1, isFill)) continue;
    if (fillTop < 0) fillTop = y;
    fillBot = y;
  }
  if (fillTop < 0) return null;

  const mid = Math.floor((fillTop + fillBot) / 2);
  let fx0 = -1;
  let fx1 = -1;
  for (let x = x0; x < x1; x++) {
    const i = at(x, mid);
    if (!isFill(data[i], data[i + 1], data[i + 2])) continue;
    if (fx0 < 0) fx0 = x;
    fx1 = x + 1;
  }

  let inkTop = -1;
  let inkBot = -1;
  for (let y = Math.max(y0, fillTop - margin); y <= Math.min(y1 - 1, fillBot + margin); y++) {
    if (!countRow(y, fx0, fx1, isWhite)) continue;
    if (inkTop < 0) inkTop = y;
    inkBot = y;
  }
  if (inkTop < 0) return null;

  return ((inkTop - fillTop) - (fillBot - inkBot)) / 2;
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
    const bias = measurePillBias(bmp, box, pixelRatio);
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
