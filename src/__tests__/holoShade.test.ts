import { describe, it, expect } from 'vitest';
import { shadeFoil, foilKey, FOIL_BASE, FOIL_FLOOR } from '@/lib/holo/holoShade';

const W = 8;
const H = 8;

function emptyMask(): Uint8ClampedArray {
  return new Uint8ClampedArray(W * H * 4);
}

function coveredMask(): Uint8ClampedArray {
  const m = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    if (i % 2 === 0) continue;
    m[i * 4] = 40 + (i * 37) % 215;
    m[i * 4 + 1] = (i * 91) % 256;
    m[i * 4 + 3] = 255;
  }
  return m;
}

function shade(mask: Uint8ClampedArray, angle: number, uniform: boolean): Uint8ClampedArray {
  const out = new Uint8ClampedArray(W * H * 4);
  shadeFoil(mask, out, W, H, angle, uniform);
  return out;
}

describe('shadeFoil', () => {
  it('paints an empty mask as the flat base gray', () => {
    const out = shade(emptyMask(), 30, false);
    for (let i = 0; i < W * H; i++) {
      expect([out[i * 4], out[i * 4 + 1], out[i * 4 + 2], out[i * 4 + 3]]).toEqual([FOIL_BASE, FOIL_BASE, FOIL_BASE, 255]);
    }
  });

  it('moves covered pixels with the angle and leaves uncovered ones alone', () => {
    const mask = coveredMask();
    const a = shade(mask, 20, false);
    const b = shade(mask, 200, false);
    let coveredChanged = false;
    for (let i = 0; i < W * H; i++) {
      const same = [0, 1, 2].every(c => a[i * 4 + c] === b[i * 4 + c]);
      if (mask[i * 4 + 3] === 0) expect(same).toBe(true);
      else if (!same) coveredChanged = true;
    }
    expect(coveredChanged).toBe(true);
  });

  it('is deterministic', () => {
    const mask = coveredMask();
    expect(Array.from(shade(mask, 77, false))).toEqual(Array.from(shade(mask, 77, false)));
  });

  it('colors a uniform foil with no mask', () => {
    let maxSpread = 0;
    let anyColored = false;
    for (let angle = 0; angle < 360; angle += 15) {
      const out = shade(emptyMask(), angle, true);
      for (let i = 0; i < W * H; i++) {
        const r = out[i * 4], g = out[i * 4 + 1], b = out[i * 4 + 2];
        maxSpread = Math.max(maxSpread, Math.max(r, g, b) - Math.min(r, g, b));
        if (r !== FOIL_BASE || g !== FOIL_BASE || b !== FOIL_BASE) anyColored = true;
      }
    }
    expect(anyColored).toBe(true);
    expect(maxSpread).toBeGreaterThan(60);
  });

  it('is opaque and never drops below the floor', () => {
    const floor = FOIL_FLOOR;
    for (const [mask, uniform] of [[coveredMask(), false], [emptyMask(), true]] as const) {
      for (let angle = 0; angle < 360; angle += 30) {
        const out = shade(mask, angle, uniform);
        for (let i = 0; i < W * H; i++) {
          expect(out[i * 4 + 3]).toBe(255);
          for (let c = 0; c < 3; c++) expect(out[i * 4 + c]).toBeGreaterThanOrEqual(floor);
        }
      }
    }
  });
});

describe('shadeFoil tuning', () => {
  function fullMask(glint: number, hue: number): Uint8ClampedArray {
    const m = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      m[i * 4] = glint;
      m[i * 4 + 1] = hue;
      m[i * 4 + 3] = 255;
    }
    return m;
  }

  it('keeps the hue of a dim covered shape instead of clamping it to gray', () => {
    for (let angle = 0; angle < 360; angle += 45) {
      const out = shade(fullMask(0, 0), angle, false);
      for (let i = 0; i < W * H; i++) {
        const r = out[i * 4], g = out[i * 4 + 1], b = out[i * 4 + 2];
        expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(50);
      }
    }
  });

  it('shines a plain rainbow evenly', () => {
    let lo = 255;
    let hi = 0;
    for (let angle = 0; angle < 360; angle += 15) {
      const out = shade(emptyMask(), angle, true);
      for (let i = 0; i < W * H; i++) {
        const peak = Math.max(out[i * 4], out[i * 4 + 1], out[i * 4 + 2]);
        lo = Math.min(lo, peak);
        hi = Math.max(hi, peak);
      }
    }
    expect(hi - lo).toBeLessThanOrEqual(45);
  });
});

describe('foilKey', () => {
  it('ignores strength and respects angle and pattern', () => {
    expect(foilKey({ pattern: 'sand', strength: 10, angle: 45 })).toBe(foilKey({ pattern: 'sand', strength: 90, angle: 45 }));
    expect(foilKey({ pattern: 'sand', strength: 10, angle: 45 })).not.toBe(foilKey({ pattern: 'sand', strength: 10, angle: 46 }));
    expect(foilKey({ pattern: 'sand', strength: 10, angle: 45 })).not.toBe(foilKey({ pattern: 'stars', strength: 10, angle: 45 }));
  });
});
