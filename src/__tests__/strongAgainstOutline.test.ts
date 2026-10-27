import { describe, it, expect } from 'vitest';
import type { CSSProperties } from 'react';
import { applyStrokeOutline, cssStrokeToOutline, STRONG_AGAINST_STROKE_EM } from '@/lib/outlineUtils';
import { LAYOUTS } from '@/data/layouts';
import type { Zone } from '@/types/layout';

function findZone(zone: Zone, key: string): Zone | null {
  if (zone.imageDataKey === key || zone.textDataKey === key) return zone;
  for (const child of zone.childZones) {
    const hit = findZone(child, key);
    if (hit) return hit;
  }
  return null;
}

describe('Strong Against +20 outline', () => {
  it('matches the Terra bonus stroke width from the layout data', () => {
    const terra = findZone(LAYOUTS.BasicAttackMain.rootZone, 'Terra1LP');
    const outline = applyStrokeOutline(terra!.style as CSSProperties).outline;
    expect(outline).not.toBeNull();
    expect(parseFloat(STRONG_AGAINST_STROKE_EM)).toBeCloseTo(parseFloat(outline!.WebkitTextStrokeWidth), 3);
  });

  it('turns a -webkit-text-stroke shorthand into a behind-the-fill outline, keeping its colour', () => {
    const { style, outline } = cssStrokeToOutline({ color: 'red', WebkitTextStroke: '0.5px white' } as CSSProperties)!;
    expect(style).toEqual({ color: 'red' });
    expect(outline).toEqual({ WebkitTextStrokeWidth: STRONG_AGAINST_STROKE_EM, WebkitTextStrokeColor: 'white', paintOrder: 'stroke fill' });
  });

  it('returns null when there is no stroke shorthand', () => {
    expect(cssStrokeToOutline({ color: 'red' })).toBeNull();
  });
});
