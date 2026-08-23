import { describe, it, expect } from 'vitest';
import { baselineError, pickNudge, PROBE_PAIRS } from '@/lib/baselineCalibration';

const REFERENCE = [27, 27, 27, 19, 19, 51, 43, 31];

describe('PROBE_PAIRS', () => {
  it('covers the sizes that disagreed between platforms', () => {
    const sizes = PROBE_PAIRS.map((p) => `${p.font}/${p.lh}`);
    expect(sizes).toContain('7/8');      // metadata bar
    expect(sizes).toContain('5/5.5');    // Strong Against
    expect(sizes).toContain('8/7.5');    // attack effect
    expect(sizes).toContain('14/15.5');  // ATKDMG
    expect(sizes).toContain('6/5.7');    // flavor
    expect(sizes).toContain('9/8.5');    // effect text
  });

  it('matches the length of the baked reference', () => {
    expect(baselineError(REFERENCE)).toBe(0);
  });
});

describe('baselineError', () => {
  it('is zero for the reference platform', () => {
    expect(baselineError(REFERENCE)).toBe(0);
  });

  it('sums the whole-pixel disagreement', () => {
    expect(baselineError(REFERENCE.map((v) => v - 4))).toBe(32);
  });

  it('grows with the size of the mismatch', () => {
    const near = baselineError(REFERENCE.map((v) => v - 1));
    const far = baselineError(REFERENCE.map((v) => v - 4));
    expect(far).toBeGreaterThan(near);
  });

  it('skips rows the probe could not read rather than scoring them as huge errors', () => {
    const withGap = [...REFERENCE];
    withGap[3] = -1;
    expect(baselineError(withGap)).toBe(0);
  });
});

describe('pickNudge', () => {
  it('keeps zero when the device already matches', () => {
    expect(pickNudge([0, 8, 16, 24, 32])).toBe(0);
  });

  it('picks the nudge with the lowest error', () => {
    expect(pickNudge([32, 24, 0, 8, 16])).toBe(0.5);
    expect(pickNudge([32, 24, 16, 8, 0])).toBe(1);
  });

  it('breaks ties toward the smaller nudge so it never moves text further than needed', () => {
    expect(pickNudge([4, 4, 4, 4, 4])).toBe(0);
    expect(pickNudge([8, 2, 2, 8, 8])).toBe(0.25);
  });
});
