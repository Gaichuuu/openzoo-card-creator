import { describe, expect, it } from 'vitest';
import { generateShapes, type HoloShape } from '@/lib/holo/holoShapes';
import type { HoloPatternId } from '@/types/card';

const W = 264;
const H = 359;
const PATTERNS: HoloPatternId[] = ['rainbow', 'sand', 'streaks', 'diamond', 'bubbles', 'shards', 'stars'];
const TEXTURED = PATTERNS.filter((p) => p !== 'rainbow');

function anchor(s: HoloShape): [number, number] {
  if (s.kind === 'poly') return [s.pts[0], s.pts[1]];
  if (s.kind === 'dash') return [s.x1, s.y1];
  return [s.x, s.y];
}

describe('generateShapes', () => {
  it.each(PATTERNS)('%s is deterministic', (p) => {
    expect(generateShapes(p, W, H)).toEqual(generateShapes(p, W, H));
  });

  it('different seeds differ for sand', () => {
    expect(generateShapes('sand', W, H, 1)).not.toEqual(generateShapes('sand', W, H, 2));
  });

  it('rainbow is empty', () => {
    expect(generateShapes('rainbow', W, H)).toEqual([]);
  });

  it.each(TEXTURED)('%s has at least 200 shapes in range with hue/glint in [0,1]', (p) => {
    const shapes = generateShapes(p, W, H);
    expect(shapes.length).toBeGreaterThanOrEqual(200);
    for (const s of shapes) {
      expect(s.hue).toBeGreaterThanOrEqual(0);
      expect(s.hue).toBeLessThanOrEqual(1);
      expect(s.glint).toBeGreaterThanOrEqual(0);
      expect(s.glint).toBeLessThanOrEqual(1);
      const [x, y] = anchor(s);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(W);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(H);
    }
  });

  it('streaks all run one direction at 33 deg up and to the right', () => {
    for (const s of generateShapes('streaks', W, H)) {
      if (s.kind !== 'dash') throw new Error('expected dash');
      const deg = (Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180) / Math.PI;
      const ok = Math.abs(deg + 33) < 1 || Math.abs(deg - 147) < 1;
      expect(ok).toBe(true);
    }
  });

  it.each(TEXTURED)('%s puts no shape anchor exactly on the far edges', (p) => {
    for (const s of generateShapes(p, W, H)) {
      const [x, y] = anchor(s);
      expect(x).not.toBe(W);
      expect(y).not.toBe(H);
    }
  });

  it('diamond lattice lines share one hue and are never edge slivers', () => {
    const lines = generateShapes('diamond', W, H).filter((s) => s.kind === 'poly');
    expect(lines.length).toBeGreaterThan(20);
    for (const s of lines) {
      if (s.kind !== 'poly') continue;
      expect(s.hue).toBe(lines[0].hue);
      const len = Math.hypot(s.pts[2] - s.pts[0], s.pts[3] - s.pts[1]);
      expect(len).toBeGreaterThan(2);
    }
  });
});
