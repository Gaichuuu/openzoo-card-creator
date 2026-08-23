import { getFontEmbedCSS } from './exportUtils';

export const PROBE_PAIRS: readonly PairSpec[] = [
  { label: 'effect', font: 9, lh: 8.5, weight: 400, italic: false },
  { label: 'attackEffect', font: 8, lh: 7.5, weight: 400, italic: false },
  { label: 'metadata', font: 7, lh: 8, weight: 700, italic: false },
  { label: 'strongAgainst', font: 5, lh: 5.5, weight: 400, italic: false },
  { label: 'flavor', font: 6, lh: 5.7, weight: 400, italic: true },
  { label: 'atkdmg', font: 14, lh: 15.5, weight: 700, italic: false },
  { label: 'attackName', font: 12, lh: 13, weight: 700, italic: false },
  { label: 'copyright', font: 8, lh: 8.8, weight: 400, italic: false },
];

export interface PairSpec {
  label: string;
  font: number;
  lh: number;
  weight: number;
  italic: boolean;
}

const REFERENCE_BASELINES: readonly number[] = [27, 27, 27, 19, 19, 51, 43, 31];

const NUDGE_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

const ROW_H = 20;
const PROBE_W = 60;
const PROBE_SCALE = 4;
const DARK_CUTOFF = 140;

let cached: Promise<number> | null = null;

function buildProbeSvg(fontCss: string, nudge: number): string {
  const h = ROW_H * PROBE_PAIRS.length;
  const rows = PROBE_PAIRS.map((p, i) => {
    const style = `position:absolute;top:${i * ROW_H + i * 0.125}px;left:0;width:${PROBE_W}px;`
      + `height:${p.lh}px;line-height:${p.lh}px;display:flex;align-items:center`;
    const span = `font:${p.italic ? 'italic ' : ''}${p.weight} ${p.font}px 'EB Garamond',serif;`
      + (nudge ? `translate:0 ${nudge}px` : '');
    return `<div style="${style}"><span style="${span}">HEH</span></div>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PROBE_W}" height="${h}">`
    + `<foreignObject x="0" y="0" width="100%" height="100%">`
    + `<div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${PROBE_W}px;`
    + `height:${h}px;background:#fff;color:#000;margin:0;padding:0">`
    + `<style>${fontCss}</style>${rows}</div></foreignObject></svg>`;
}

function rasterize(svg: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PROBE_W * PROBE_SCALE;
      canvas.height = ROW_H * PROBE_PAIRS.length * PROBE_SCALE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('no 2d context'));
        return;
      }
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = () => reject(new Error('baseline probe failed to rasterize'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function readBaselines(data: ImageData): number[] {
  const w = data.width;
  const rowPx = ROW_H * PROBE_SCALE;
  return PROBE_PAIRS.map((_, i) => {
    let found = -1;
    for (let y = rowPx - 1; y >= 0; y--) {
      const abs = i * rowPx + y;
      let ink = 0;
      for (let x = 0; x < w; x++) {
        const o = (abs * w + x) * 4;
        if (Math.min(data.data[o], data.data[o + 1], data.data[o + 2]) < DARK_CUTOFF) ink++;
      }
      if (ink >= 2) { found = y; break; }
    }
    return found;
  });
}

export async function measureBaselines(nudge: number): Promise<number[]> {
  const fontCss = await getFontEmbedCSS();
  return readBaselines(await rasterize(buildProbeSvg(fontCss, nudge)));
}

export function baselineError(measured: readonly number[]): number {
  return measured.reduce((sum, v, i) => {
    const ref = REFERENCE_BASELINES[i];
    return sum + (v < 0 || ref === undefined ? 0 : Math.abs(v - ref));
  }, 0);
}

export function pickNudge(errorByNudge: readonly number[]): number {
  let best = 0;
  let bestErr = Infinity;
  for (let i = 0; i < errorByNudge.length; i++) {
    if (errorByNudge[i] < bestErr - 1e-9) {
      bestErr = errorByNudge[i];
      best = NUDGE_STEPS[i] ?? 0;
    }
  }
  return best;
}

async function calibrate(): Promise<number> {
  const errors: number[] = [];
  for (const nudge of NUDGE_STEPS) {
    const err = baselineError(await measureBaselines(nudge));
    errors.push(err);
    if (nudge === 0 && err === 0) return 0;
  }
  return pickNudge(errors);
}

export function getBaselineNudge(): Promise<number> {
  if (!cached) cached = calibrate().catch(() => 0);
  return cached;
}

export function resetBaselineCalibration(): void {
  cached = null;
}
