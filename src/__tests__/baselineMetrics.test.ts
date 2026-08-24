import { describe, it, expect } from 'vitest';
import { computeDelta, applicableDelta, referenceBox, primaryFamily } from '@/lib/baselineMetrics';

describe('referenceBox', () => {
  it('rounds the em metrics the way Blink builds a line box', () => {
    expect(referenceBox('EB Garamond', 5)).toEqual({ ascent: 5, descent: 1 });
    expect(referenceBox('EB Garamond', 7)).toEqual({ ascent: 7, descent: 2 });
    expect(referenceBox('EB Garamond', 8.5)).toEqual({ ascent: 9, descent: 3 });
    expect(referenceBox('EB Garamond', 9)).toEqual({ ascent: 9, descent: 3 });
    expect(referenceBox('EB Garamond', 10.5)).toEqual({ ascent: 11, descent: 3 });
    expect(referenceBox('EB Garamond', 14)).toEqual({ ascent: 14, descent: 4 });
    expect(referenceBox('EB Garamond', 19)).toEqual({ ascent: 19, descent: 6 });
  });

  it('knows the title face too, which CardName uses', () => {
    expect(referenceBox('Archivo Black', 10)).toEqual({ ascent: 9, descent: 2 });
  });

  it('returns null for a font it holds no metrics for', () => {
    expect(referenceBox('Comic Sans MS', 12)).toBeNull();
  });
});

describe('primaryFamily', () => {
  it('picks the first known family out of a computed stack', () => {
    expect(primaryFamily('"EB Garamond", Cambria, serif')).toBe('EB Garamond');
    expect(primaryFamily("'Archivo Black', sans-serif")).toBe('Archivo Black');
  });

  it('skips leading families it has no metrics for', () => {
    expect(primaryFamily('Helvetica, "EB Garamond", serif')).toBe('EB Garamond');
  });

  it('returns null when nothing in the stack is known', () => {
    expect(primaryFamily('system-ui, sans-serif')).toBeNull();
  });
});

describe('computeDelta', () => {
  it('leaves a device that matches the reference completely alone', () => {
    const box = { ascent: 7, descent: 2 };
    expect(computeDelta(box, box)).toBe(0);
  });

  it('gives back a whole pixel when the device rounds the ascent down', () => {
    expect(computeDelta({ ascent: 6, descent: 3 }, { ascent: 7, descent: 2 })).toBe(1);
  });

  it('gives back half a pixel when only the box height differs', () => {
    expect(computeDelta({ ascent: 7, descent: 3 }, { ascent: 7, descent: 2 })).toBe(0.5);
  });

  it('reports raw sub-pixel differences rather than clamping them', () => {
    expect(computeDelta({ ascent: 7.001, descent: 2 }, { ascent: 7, descent: 2 })).toBeCloseTo(-0.0005, 6);
  });

  it('is signed, so a device rounding the other way is pulled back up', () => {
    expect(computeDelta({ ascent: 8, descent: 1 }, { ascent: 7, descent: 2 })).toBe(-1);
  });


  it('does not depend on line-height (the term cancels)', () => {
    const dev = { ascent: 6, descent: 3 };
    const ref = { ascent: 7, descent: 2 };
    const baselineIn = (box: { ascent: number; descent: number }, lh: number) =>
      (lh - (box.ascent + box.descent)) / 2 + box.ascent;
    for (const lh of [5.5, 7.5, 8, 8.8, 13, 15.5]) {
      expect(baselineIn(dev, lh) + computeDelta(dev, ref)).toBeCloseTo(baselineIn(ref, lh), 10);
    }
  });
});

describe('applicableDelta', () => {
  it('applies a whole-pixel disagreement, the case this exists to fix', () => {
    expect(applicableDelta({ ascent: 6, descent: 3 }, { ascent: 7, descent: 2 })).toBe(1);
    expect(applicableDelta({ ascent: 8, descent: 1 }, { ascent: 7, descent: 2 })).toBe(-1);
  });

  it('declines a half-pixel one, which would knock pills off their pinned fraction', () => {
    expect(applicableDelta({ ascent: 7, descent: 3 }, { ascent: 7, descent: 2 })).toBe(0);
  });

  it('declines the sub-pixel noise a non-quantizing engine reports', () => {
    expect(applicableDelta({ ascent: 7.049, descent: 2.086 }, { ascent: 7, descent: 2 })).toBe(0);
    expect(applicableDelta({ ascent: 9.063, descent: 2.682 }, { ascent: 9, descent: 3 })).toBe(0);
  });

  it('leaves a matching device completely alone', () => {
    const box = { ascent: 7, descent: 2 };
    expect(applicableDelta(box, box)).toBe(0);
  });
});
