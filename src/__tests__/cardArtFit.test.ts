import { describe, it, expect } from 'vitest';
import { computeArtDrawRect, artZoomScale } from '@/lib/cardArtFit';

const BOX_W = 238;
const BOX_H = 333;

describe('artZoomScale', () => {
  it('is 1 at zoom 0 so existing cards are untouched', () => {
    expect(artZoomScale(0)).toBe(1);
  });

  it('maps 100 to 2x', () => {
    expect(artZoomScale(100)).toBe(2);
    expect(artZoomScale(50)).toBe(1.5);
  });
});

describe('computeArtDrawRect', () => {
  it('centres a cover fit at zoom 0 with no offset, matching the old behaviour', () => {
    const r = computeArtDrawRect(1000, 500, BOX_W, BOX_H);
    const cover = Math.max(BOX_W / 1000, BOX_H / 500);
    expect(r.dw).toBeCloseTo(1000 * cover, 6);
    expect(r.dh).toBeCloseTo(500 * cover, 6);
    expect(r.dx).toBeCloseTo((BOX_W - r.dw) / 2, 6);
    expect(r.dy).toBeCloseTo((BOX_H - r.dh) / 2, 6);
  });

  it('never leaves a gap, for either source orientation at any zoom', () => {
    for (const [w, h] of [[1000, 500], [500, 1000], [800, 800]]) {
      for (const zoom of [0, 5, 50, 100]) {
        for (const pos of [-50, -25, 0, 25, 50]) {
          const r = computeArtDrawRect(w, h, BOX_W, BOX_H, pos, pos, zoom);
          expect(r.dw).toBeGreaterThanOrEqual(BOX_W - 1e-9);
          expect(r.dh).toBeGreaterThanOrEqual(BOX_H - 1e-9);
          expect(r.dx).toBeLessThanOrEqual(1e-9);
          expect(r.dy).toBeLessThanOrEqual(1e-9);
          expect(r.dx + r.dw).toBeGreaterThanOrEqual(BOX_W - 1e-9);
          expect(r.dy + r.dh).toBeGreaterThanOrEqual(BOX_H - 1e-9);
        }
      }
    }
  });

  it('scales the drawn size by the zoom factor', () => {
    const base = computeArtDrawRect(1000, 500, BOX_W, BOX_H);
    const zoomed = computeArtDrawRect(1000, 500, BOX_W, BOX_H, 0, 0, 100);
    expect(zoomed.dw).toBeCloseTo(base.dw * 2, 6);
    expect(zoomed.dh).toBeCloseTo(base.dh * 2, 6);
  });

  it('pins the correct edge at the extremes of the position range', () => {
    const left = computeArtDrawRect(1000, 500, BOX_W, BOX_H, -50, -50, 50);
    expect(left.dx).toBeCloseTo(0, 6);
    expect(left.dy).toBeCloseTo(0, 6);

    const right = computeArtDrawRect(1000, 500, BOX_W, BOX_H, 50, 50, 50);
    expect(right.dx + right.dw).toBeCloseTo(BOX_W, 6);
    expect(right.dy + right.dh).toBeCloseTo(BOX_H, 6);
  });

  it('degrades safely on a zero-sized source', () => {
    const r = computeArtDrawRect(0, 0, BOX_W, BOX_H, 10, 10, 50);
    for (const v of [r.dx, r.dy, r.dw, r.dh]) expect(Number.isFinite(v)).toBe(true);
    expect(r.dw).toBe(BOX_W);
    expect(r.dh).toBe(BOX_H);
  });
});
