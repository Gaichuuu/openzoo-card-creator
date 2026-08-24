import { getFontEmbedCSS, loadImage } from './exportUtils';

const PROBE_W = 130;
const PROBE_H = 30;
const PROBE_SCALE = 4;

const REFERENCE_INK = 6.8;

const TOLERANCE = 0.1;
const TRIAL_STROKE_PX = 0.12;
const MAX_STROKE_PX = 0.3;
const MIN_PLAUSIBLE_INK = 3;

let cached: Promise<number> | null = null;

function buildProbeSvg(fontCss: string, strokePx: number, smoothing: string): string {
  const stroke = strokePx > 0 ? `-webkit-text-stroke-width:${strokePx}px;` : '';
  const smooth = smoothing ? `-webkit-font-smoothing:${smoothing};` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PROBE_W}" height="${PROBE_H}">`
    + `<foreignObject x="0" y="0" width="100%" height="100%">`
    + `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${PROBE_W}px;height:${PROBE_H}px;`
    + `background:#fff;color:#000;margin:0;padding:0;${stroke}${smooth}">`
    + `<style>${fontCss}</style>`
    + `<div style="line-height:10px">`
    + `<span style="font:700 9px 'EB Garamond',serif">CONTRACT:</span>`
    + `<span style="font:400 9px 'EB Garamond',serif"> Pages named Growth</span></div>`
    + `<div style="line-height:7px">`
    + `<span style="font:italic 400 6px 'EB Garamond',serif">`
    + `&#8220;You are so young, and so naive. I envy that about you.&#8221;</span></div>`
    + `<div style="line-height:13px">`
    + `<span style="font:700 10px 'EB Garamond',serif">FOLIAGE</span>`
    + `<span style="font:700 12px 'EB Garamond',serif">10</span></div>`
    + `</div></foreignObject></svg>`;
}

async function rasterize(svg: string): Promise<ImageData> {
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const canvas = document.createElement('canvas');
  canvas.width = PROBE_W * PROBE_SCALE;
  canvas.height = PROBE_H * PROBE_SCALE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no 2d context');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

const DARK_CUTOFF = 110;

interface ProbeInk {
  mean: number;
  dark: number;
}

function measureInk(data: ImageData): ProbeInk {
  const { data: px } = data;
  const count = px.length / 4;
  let total = 0;
  let dark = 0;
  for (let i = 0; i < px.length; i += 4) {
    const lum = Math.min(px[i], px[i + 1], px[i + 2]);
    total += 255 - lum;
    if (lum < DARK_CUTOFF) dark++;
  }
  return { mean: total / count, dark: (dark / count) * 100 };
}

export async function measureProbe(strokePx: number, smoothing = ''): Promise<ProbeInk> {
  const fontCss = await getFontEmbedCSS();
  return measureInk(await rasterize(buildProbeSvg(fontCss, strokePx, smoothing)));
}

export function solveStroke(plain: number, trial: number, trialPx = TRIAL_STROKE_PX): number {
  if (!Number.isFinite(plain) || !Number.isFinite(trial)) return 0;
  if (plain < MIN_PLAUSIBLE_INK) return 0;
  if (plain >= REFERENCE_INK - TOLERANCE) return 0;
  const gainPerPx = (trial - plain) / trialPx;
  if (gainPerPx <= 0) return 0;
  const needed = (REFERENCE_INK - plain) / gainPerPx;
  return Math.min(MAX_STROKE_PX, Math.round(needed * 100) / 100);
}

async function calibrate(smoothing: string): Promise<number> {
  const plain = (await measureProbe(0, smoothing)).dark;
  if (plain < MIN_PLAUSIBLE_INK) {
    console.warn('[openzoo] text weight probe read no usable ink; skipping compensation');
    return 0;
  }
  if (plain >= REFERENCE_INK - TOLERANCE) return 0;
  const trial = (await measureProbe(TRIAL_STROKE_PX, smoothing)).dark;
  return solveStroke(plain, trial);
}

export async function applyTextStroke(el: HTMLElement): Promise<void> {
  const px = await getTextStrokePx(el);
  el.style.webkitTextStrokeWidth = px > 0 ? `${px}px` : '';
}

export function getTextStrokePx(sample?: HTMLElement | null): Promise<number> {
  if (!cached) {
    const smoothing = sample
      ? getComputedStyle(sample).getPropertyValue('-webkit-font-smoothing').trim()
      : '';
    cached = calibrate(smoothing).catch(() => 0);
  }
  return cached;
}
