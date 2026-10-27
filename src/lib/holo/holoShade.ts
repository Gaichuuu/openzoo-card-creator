import type { HoloSettings } from '@/types/card';

export const FOIL_BASE = 200;
export const FOIL_FLOOR = 95;

const FLOOR = FOIL_FLOOR;
const BAND = 420;
const SATURATION = 0.85;
const UNIFORM_SATURATION = 0.6;
const DIAGONAL = Math.PI / 4;
const SHEEN_SPAN = 0.55;
const SHEEN_POWER = 2;
const SHAPE_LO = 0.5;
const GLINT_WEIGHT = 0.6;
const UNIFORM_LO = 0.8;

export function foilKey(h: HoloSettings): string {
  return `${h.pattern}:${h.angle}`;
}

function hueChannel(n: number, h6: number, sat: number): number {
  const k = (n + h6) % 6;
  const t = Math.min(k, 4 - k, 1);
  return 1 - sat * (t > 0 ? t : 0);
}

export function shadeFoil(
  mask: Uint8ClampedArray,
  out: Uint8ClampedArray,
  w: number,
  h: number,
  angle: number,
  uniform: boolean,
): void {
  const a = (angle * Math.PI) / 180;
  const ca = Math.cos(a + DIAGONAL);
  const sa = Math.sin(a + DIAGONAL);
  const turn = angle / 360;
  const sat = uniform ? UNIFORM_SATURATION : SATURATION;
  const colTerm = new Float32Array(w);
  for (let x = 0; x < w; x++) colTerm[x] = (x * ca) / BAND;
  const sheenCol = new Float32Array(w);
  for (let x = 0; x < w; x++) sheenCol[x] = (x * Math.cos(a)) / (w * SHEEN_SPAN * 2 || 1);

  for (let y = 0; y < h; y++) {
    const rowPhase = (y * sa) / BAND + turn;
    const rowSheen = (y * Math.sin(a)) / (h * SHEEN_SPAN * 2 || 1) + turn;
    let i = y * w * 4;
    for (let x = 0; x < w; x++, i += 4) {
      const cov = uniform ? 1 : mask[i + 3] / 255;
      if (cov === 0) {
        out[i] = FOIL_BASE;
        out[i + 1] = FOIL_BASE;
        out[i + 2] = FOIL_BASE;
        out[i + 3] = 255;
        continue;
      }
      const glint = uniform ? 1 : mask[i] / 255;
      const hueOff = uniform ? 0 : mask[i + 1] / 255;
      let hue = (colTerm[x] + rowPhase + hueOff) % 1;
      if (hue < 0) hue += 1;
      const h6 = hue * 6;
      const sheen = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * (sheenCol[x] + rowSheen)), SHEEN_POWER);
      const lum = uniform
        ? UNIFORM_LO + (1 - UNIFORM_LO) * sheen
        : SHAPE_LO + (1 - SHAPE_LO) * (GLINT_WEIGHT * glint + (1 - GLINT_WEIGHT) * sheen);
      // Channels span FLOOR..255, so a dim shape keeps its hue instead of clamping to gray.
      const base = FOIL_BASE * (1 - cov);
      const k = (255 - FLOOR) * lum * cov;
      const f = FLOOR * cov;
      const r = base + f + hueChannel(5, h6, sat) * k;
      const g = base + f + hueChannel(3, h6, sat) * k;
      const b = base + f + hueChannel(1, h6, sat) * k;
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = 255;
    }
  }
}
