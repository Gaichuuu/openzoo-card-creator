import { describe, it, expect } from 'vitest';
import {
  HOLO_PATTERNS, HOLO_STRENGTH_DEFAULT, HOLO_ANGLE_DEFAULT,
  sanitizeHolo, isHoloActive,
} from '@/lib/holo/holoSettings';

describe('sanitizeHolo', () => {
  it('rejects non-objects and unknown patterns', () => {
    expect(sanitizeHolo(null)).toBeNull();
    expect(sanitizeHolo('sand')).toBeNull();
    expect(sanitizeHolo({ pattern: 'glitter', strength: 50, angle: 10 })).toBeNull();
  });
  it('keeps only known fields', () => {
    expect(sanitizeHolo({ pattern: 'sand', strength: 50, angle: 10, extra: 1 })).toEqual({ pattern: 'sand', strength: 50, angle: 10 });
  });
  it('clamps out-of-range values', () => {
    expect(sanitizeHolo({ pattern: 'sand', strength: 250, angle: -5 })).toEqual({ pattern: 'sand', strength: 100, angle: 0 });
  });
  it('falls back to defaults for non-finite values', () => {
    expect(sanitizeHolo({ pattern: 'sand', strength: NaN, angle: 'x' })).toEqual({ pattern: 'sand', strength: HOLO_STRENGTH_DEFAULT, angle: HOLO_ANGLE_DEFAULT });
  });
  it('rounds to integers then clamps', () => {
    expect(sanitizeHolo({ pattern: 'sand', strength: 33.7, angle: 400.2 })).toEqual({ pattern: 'sand', strength: 34, angle: 359 });
  });
});

describe('isHoloActive', () => {
  it('is false for null, undefined and zero strength', () => {
    expect(isHoloActive(null)).toBe(false);
    expect(isHoloActive(undefined)).toBe(false);
    expect(isHoloActive({ pattern: 'sand', strength: 0, angle: 0 })).toBe(false);
  });
  it('is true for any positive strength', () => {
    expect(isHoloActive({ pattern: 'sand', strength: 1, angle: 0 })).toBe(true);
  });
});

describe('HOLO_PATTERNS', () => {
  it('lists patterns in display order', () => {
    expect(HOLO_PATTERNS.map(p => p.id)).toEqual(['rainbow', 'sand', 'streaks', 'diamond', 'bubbles', 'shards', 'stars']);
  });
});
