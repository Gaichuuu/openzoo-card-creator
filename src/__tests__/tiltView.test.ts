import { describe, it, expect } from 'vitest';
import { tiltView, sheenCenter, tiltPointer, FOIL_LIGHT } from '@/lib/holo/tiltView';
import { SHEEN_SWEEP } from '@/lib/holo/galleryFoilTuning';

const close = (a: readonly number[], b: readonly number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));

describe('tiltView', () => {
  it('is the straight-on view and the 3D light when flat', () => {
    const t = tiltView(0, 0);
    close(t.view, [0, 0, 1]);
    const n = Math.hypot(...FOIL_LIGHT);
    close(t.light, FOIL_LIGHT.map((v) => v / n));
  });

  it('sees the card from its left when the right edge turns away (rotateY)', () => {
    close(tiltView(0, 90).view, [-1, 0, 0]);
  });

  it('sees the card from below when the bottom edge comes forward (rotateX)', () => {
    close(tiltView(90, 0).view, [0, -1, 0]);
  });

  it('keeps unit vectors', () => {
    const t = tiltView(12, -9);
    expect(Math.hypot(...t.view)).toBeCloseTo(1, 6);
    expect(Math.hypot(...t.light)).toBeCloseTo(1, 6);
  });
});

describe('sheenCenter', () => {
  it('sits in the middle when flat', () => {
    close(sheenCenter(0, 0), [0.5, 0.5]);
  });

  it('slides opposite the pointer by SHEEN_SWEEP', () => {
    close(sheenCenter(0, 15), [0.5 - SHEEN_SWEEP / 2, 0.5]);
    close(sheenCenter(15, 0), [0.5, 0.5 - SHEEN_SWEEP / 2]);
  });
});

describe('tiltPointer', () => {
  it('maps full tilt to the card edges (uv, y up)', () => {
    close(tiltPointer(0, 0), [0.5, 0.5]);
    close(tiltPointer(0, 15), [1, 0.5]);
    close(tiltPointer(15, 0), [0.5, 1]);
  });
});
