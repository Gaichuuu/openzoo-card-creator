import type { HoloPatternId } from '@/types/card';
import { BLEED, CARD_H, CARD_W } from '@/lib/cardDims';
import { generateShapes, type HoloShape } from './holoShapes';
import { shadeFoil } from './holoShade';

export const FOIL_RATIO = 4;
const FOIL_W = CARD_W + 2 * BLEED;
const FOIL_H = CARD_H + 2 * BLEED;
const PX_W = FOIL_W * FOIL_RATIO;
const PX_H = FOIL_H * FOIL_RATIO;
const MAX_MASKS = 2;

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type AnyContext = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export interface FoilBlobs {
  foil: Blob;
  mask: Blob | null;
}

interface FoilMask {
  data: Uint8ClampedArray | null;
  blob: Blob | null;
}

const masks = new Map<HoloPatternId, Promise<FoilMask>>();

function makeCanvas(): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(PX_W, PX_H);
  const c = document.createElement('canvas');
  c.width = PX_W;
  c.height = PX_H;
  return c;
}

function context(c: AnyCanvas): AnyContext {
  const ctx = c.getContext('2d') as AnyContext | null;
  if (!ctx) throw new Error('foil: no 2d context');
  return ctx;
}

function toPng(c: AnyCanvas): Promise<Blob> {
  if ('convertToBlob' in c) return c.convertToBlob({ type: 'image/png' });
  return new Promise((resolve, reject) => {
    c.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('foil toBlob failed'))), 'image/png');
  });
}

function drawShape(ctx: AnyContext, s: HoloShape): void {
  const color = `rgba(${Math.round(s.glint * 255)}, ${Math.round(s.hue * 255)}, 0, 1)`;
  ctx.fillStyle = color;
  ctx.beginPath();
  switch (s.kind) {
    case 'dot':
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      return;
    case 'poly':
      ctx.moveTo(s.pts[0], s.pts[1]);
      for (let i = 2; i < s.pts.length; i += 2) ctx.lineTo(s.pts[i], s.pts[i + 1]);
      ctx.closePath();
      ctx.fill();
      return;
    case 'dash':
      ctx.strokeStyle = color;
      ctx.lineWidth = s.w;
      ctx.lineCap = 'round';
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      return;
    case 'star': {
      const inner = s.r * (s.points === 4 ? 0.3 : 0.45);
      const n = s.points * 2;
      for (let i = 0; i < n; i++) {
        const a = (i * Math.PI) / s.points - Math.PI / 2;
        const rad = i % 2 === 0 ? s.r : inner;
        const x = s.x + Math.cos(a) * rad;
        const y = s.y + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

async function buildMask(pattern: HoloPatternId): Promise<FoilMask> {
  const shapes = generateShapes(pattern, FOIL_W, FOIL_H);
  if (shapes.length === 0) return { data: null, blob: null };
  const canvas = makeCanvas();
  const ctx = context(canvas);
  ctx.scale(FOIL_RATIO, FOIL_RATIO);
  for (const s of shapes) drawShape(ctx, s);
  const data = ctx.getImageData(0, 0, PX_W, PX_H).data;
  return { data, blob: await toPng(canvas) };
}

function ensureMask(pattern: HoloPatternId): Promise<FoilMask> {
  const hit = masks.get(pattern);
  if (hit) {
    masks.delete(pattern);
    masks.set(pattern, hit);
    return hit;
  }
  const p = buildMask(pattern);
  masks.set(pattern, p);
  p.catch(() => masks.delete(pattern));
  while (masks.size > MAX_MASKS) {
    const oldest = masks.keys().next().value;
    if (oldest === undefined) break;
    masks.delete(oldest);
  }
  return p;
}

export async function buildFoilBlobs(pattern: HoloPatternId, angle: number): Promise<FoilBlobs> {
  const mask = await ensureMask(pattern);
  const canvas = makeCanvas();
  const ctx = context(canvas);
  const img = ctx.createImageData(PX_W, PX_H);
  shadeFoil(mask.data ?? new Uint8ClampedArray(0), img.data, PX_W, PX_H, angle, mask.data === null);
  ctx.putImageData(img, 0, 0);
  return { foil: await toPng(canvas), mask: mask.blob };
}
