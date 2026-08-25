import { describe, it, expect } from 'vitest';
import { classifyDescent, idealDescentPx } from '@/lib/fontBackend';

const MACOS_DPR2: [number, number][] = [[6, 2], [7, 2], [9, 2.5], [12, 3.5], [13, 4], [19, 5.5]];
const ANDROID_DPR2625: [number, number][] = [
  [6, 1.905], [7, 2.286], [9, 3.048], [12, 3.81], [13, 4.19], [19, 5.714],
];

const verdictsFor = (rows: [number, number][], dpr: number) =>
  rows
    .map(([size, css]) => classifyDescent(Math.round(css * dpr), idealDescentPx(size, dpr)))
    .filter((v): v is 'ceil' | 'round' => v !== null);

describe('classifyDescent', () => {
  it('reads macOS Chrome at dpr 2 as rounding the descent', () => {
    const v = verdictsFor(MACOS_DPR2, 2);
    expect(v.length).toBeGreaterThanOrEqual(3);
    expect(v.every((x) => x === 'round')).toBe(true);
  });

  it('reads Android Chrome at dpr 2.625 as ceiling the descent', () => {
    const v = verdictsFor(ANDROID_DPR2625, 2.625);
    expect(v.length).toBeGreaterThanOrEqual(3);
    expect(v.every((x) => x === 'ceil')).toBe(true);
  });

  it('abstains at sizes where both rules agree', () => {
    expect(classifyDescent(5, idealDescentPx(8, 2))).toBeNull();
  });

  it('abstains when the measurement matches neither rule', () => {
    expect(classifyDescent(99, idealDescentPx(9, 2))).toBeNull();
  });
});
