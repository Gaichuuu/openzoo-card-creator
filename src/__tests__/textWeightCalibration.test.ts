import { describe, it, expect } from 'vitest';
import { solveStroke } from '@/lib/textWeightCalibration';

const MACOS = 6.798;
const LIGHT = 5.853;
const LIGHT_TRIAL = 7.223; // same device with the 0.12px trial stroke

describe('solveStroke', () => {
  it('leaves the reference rasterizer alone', () => {
    expect(solveStroke(MACOS, 7.9)).toBe(0);
  });

  it('ignores a reading a hair under the reference', () => {
    expect(solveStroke(6.75, 8.1)).toBe(0);
  });

  it('lands on the measured optimum for a device without stem darkening', () => {
    const stroke = solveStroke(LIGHT, LIGHT_TRIAL);
    expect(stroke).toBeGreaterThanOrEqual(0.07);
    expect(stroke).toBeLessThanOrEqual(0.09);
  });

  it('compensates a lighter device more than a nearly-matching one', () => {
    const veryLight = solveStroke(5.0, 6.4);
    const nearlyThere = solveStroke(6.4, 7.8);
    expect(veryLight).toBeGreaterThan(nearlyThere);
  });

  it('gives up rather than guessing when the trial stroke gained nothing', () => {
    expect(solveStroke(LIGHT, LIGHT)).toBe(0);
    expect(solveStroke(LIGHT, LIGHT - 0.5)).toBe(0);
  });

  it('caps the stroke so a bad reading cannot smear the card', () => {
    expect(solveStroke(0.1, 0.2)).toBeLessThanOrEqual(0.3);
  });

  it('treats a failed measurement as no compensation', () => {
    expect(solveStroke(NaN, LIGHT_TRIAL)).toBe(0);
    expect(solveStroke(LIGHT, NaN)).toBe(0);
  });

  it('stays on the hundredth-of-a-pixel grid', () => {
    const stroke = solveStroke(LIGHT, LIGHT_TRIAL);
    expect(stroke * 100).toBe(Math.round(stroke * 100));
  });
});
