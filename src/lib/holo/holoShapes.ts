import type { HoloPatternId } from '@/types/card';

export type HoloShape =
  | { kind: 'dot'; x: number; y: number; r: number; hue: number; glint: number }
  | { kind: 'poly'; pts: number[]; hue: number; glint: number }
  | { kind: 'dash'; x1: number; y1: number; x2: number; y2: number; w: number; hue: number; glint: number }
  | { kind: 'star'; x: number; y: number; r: number; points: 4 | 5 | 6 | 8; hue: number; glint: number };

type Rand = () => number;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEFAULT_SEEDS: Record<HoloPatternId, number> = {
  rainbow: 1,
  sand: 0x5a4d01,
  streaks: 0x57e402,
  diamond: 0xd1a403,
  bubbles: 0xb0b504,
  shards: 0x5ba705,
  stars: 0x57a606,
};

const range = (rand: Rand, lo: number, hi: number) => lo + rand() * (hi - lo);

const hueOf = (rand: Rand, spread: number) => rand() * spread;

function jitterGrid(
  rand: Rand, width: number, height: number, cell: number, keep: number,
  emit: (x: number, y: number) => void,
): void {
  for (let cy = 0; cy < height; cy += cell) {
    for (let cx = 0; cx < width; cx += cell) {
      if (rand() > keep) continue;
      const x = cx + rand() * cell;
      const y = cy + rand() * cell;
      if (x <= width && y <= height) emit(x, y);
    }
  }
}

function scatter(
  rand: Rand, width: number, height: number, n: number, emit: (x: number, y: number) => void,
): void {
  for (let i = 0; i < n; i++) emit(rand() * width, rand() * height);
}

function clipSegment(
  x1: number, y1: number, x2: number, y2: number, width: number, height: number, pad: number,
): [number, number, number, number] | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const edges: [number, number][] = [
    [-dx, x1 - pad], [dx, width - pad - x1], [-dy, y1 - pad], [dy, height - pad - y1],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 >= t1) return null;
  }
  return [x1 + dx * t0, y1 + dy * t0, x1 + dx * t1, y1 + dy * t1];
}

function sand(width: number, height: number, rand: Rand, density = 1, spread = 0.25, scale = 1): HoloShape[] {
  const out: HoloShape[] = [];
  jitterGrid(rand, width, height, scale, 0.8 * density, (x, y) => {
    out.push({ kind: 'dot', x, y, r: range(rand, 0.3, 0.55) * scale, hue: hueOf(rand, spread), glint: rand() });
  });
  return out;
}

function streaks(width: number, height: number, rand: Rand): HoloShape[] {
  const out: HoloShape[] = [];
  const ang = (33 * Math.PI) / 180;
  const ux = Math.cos(ang);
  const uy = -Math.sin(ang);
  jitterGrid(rand, width, height, 3.9, 0.9, (x, y) => {
    const half = range(rand, 4.5, 16.5) / 2;
    const w = range(rand, 0.9, 1.4);
    const hue = hueOf(rand, 0.4);
    const glint = rand();
    if (x < half * ux || x > width - half * ux || y < half * -uy || y > height - half * -uy) return;
    out.push({
      kind: 'dash',
      x1: x - ux * half, y1: y - uy * half,
      x2: x + ux * half, y2: y + uy * half,
      w, hue, glint,
    });
  });
  return out;
}

function diamond(width: number, height: number, rand: Rand): HoloShape[] {
  const out: HoloShape[] = [];
  const cell = 48;
  const lw = 2.2;
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    const c = clipSegment(x1, y1, x2, y2, width, height, lw / 2);
    if (!c) return;
    const [ax, ay, bx, by] = c;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < lw) return;
    const nx = (-(by - ay) / len) * (lw / 2);
    const ny = ((bx - ax) / len) * (lw / 2);
    out.push({ kind: 'poly', pts: [ax + nx, ay + ny, bx + nx, by + ny, bx - nx, by - ny, ax - nx, ay - ny], hue: 0, glint: 1 });
  };
  const span = width + height;
  for (let c = -height; c <= width; c += cell) line(c, 0, c + span, span);
  for (let c = 0; c <= span; c += cell) line(c, 0, c - span, span);
  out.push(...sand(width, height, rand, 0.5, 0.5));
  return out;
}

function bubbles(width: number, height: number, rand: Rand): HoloShape[] {
  const out: HoloShape[] = [];
  const dot = (x: number, y: number, r: number, spread: number) =>
    out.push({ kind: 'dot', x, y, r, hue: hueOf(rand, spread), glint: 0.6 + 0.4 * rand() });
  scatter(rand, width, height, 180, (x, y) => dot(x, y, range(rand, 2.1, 3.6), 0.15));
  scatter(rand, width, height, 980, (x, y) => dot(x, y, range(rand, 0.7, 1.5), 0.3));
  scatter(rand, width, height, 5300, (x, y) => dot(x, y, range(rand, 0.45, 0.6), 0.4));
  for (let s = 0; s < 8; s++) {
    const cx = range(rand, 18, width - 18);
    const cy = range(rand, 18, height - 18);
    const rot = rand() * Math.PI * 2;
    for (let arm = 0; arm < 3; arm++) {
      for (let i = 1; i <= 16; i++) {
        const a = rot + (arm * Math.PI * 2) / 3 + i * 0.3;
        const rad = 1.2 + i * 0.525;
        dot(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, range(rand, 0.375, 0.75), 0.15);
      }
    }
  }
  return out;
}

function shards(width: number, height: number, rand: Rand): HoloShape[] {
  const out: HoloShape[] = [];
  jitterGrid(rand, width, height, 7.5, 0.95, (x, y) => {
    const size = range(rand, 4, 8.5);
    const rot = rand() * Math.PI * 2;
    const pts: number[] = [];
    for (let i = 0; i < 3; i++) {
      const a = rot + (i * Math.PI * 2) / 3 + range(rand, -0.45, 0.45);
      const rad = size * range(rand, 0.6, 1.2);
      pts.push(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    if (pts.some((v, i) => v < 0 || v > (i % 2 === 0 ? width : height))) return;
    out.push({ kind: 'poly', pts, hue: hueOf(rand, 0.55), glint: rand() });
  });
  return out;
}

function stars(width: number, height: number, rand: Rand): HoloShape[] {
  const out: HoloShape[] = [];
  scatter(rand, width, height, 350, (x, y) =>
    out.push({ kind: 'star', x, y, r: range(rand, 3.5, 8), points: 4, hue: hueOf(rand, 0.2), glint: 0.5 + 0.5 * rand() }));
  scatter(rand, width, height, 150, (x, y) =>
    out.push({
      kind: 'star', x, y, r: range(rand, 2.5, 4.5),
      points: rand() < 0.5 ? 6 : 8, hue: hueOf(rand, 0.2), glint: 0.5 + 0.5 * rand(),
    }));
  scatter(rand, width, height, 6000, (x, y) =>
    out.push({ kind: 'dot', x, y, r: 0.3, hue: hueOf(rand, 0.3), glint: rand() * 0.6 }));
  return out;
}

export function generateShapes(
  pattern: HoloPatternId, width: number, height: number, seed?: number,
): HoloShape[] {
  const rand = mulberry32(seed ?? DEFAULT_SEEDS[pattern]);
  switch (pattern) {
    case 'rainbow': return [];
    case 'sand': return sand(width, height, rand, 1, 0.25, 1.5);
    case 'streaks': return streaks(width, height, rand);
    case 'diamond': return diamond(width, height, rand);
    case 'bubbles': return bubbles(width, height, rand);
    case 'shards': return shards(width, height, rand);
    case 'stars': return stars(width, height, rand);
  }
}
