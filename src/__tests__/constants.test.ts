import { describe, it, expect } from 'vitest';
import {
  hexToRgba,
  resolveArtBorderStyle,
  resolveBgOverlayStyle,
  computeStrongAgainst,
  AURA_COLORS,
} from '@/data/constants';

describe('hexToRgba', () => {
  it('converts white', () => {
    expect(hexToRgba('#FFFFFF', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('converts black with fractional alpha', () => {
    expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('converts a color hex', () => {
    expect(hexToRgba('#2780DD', 0.65)).toBe('rgba(39, 128, 221, 0.65)');
  });

  it('converts with alpha 0', () => {
    expect(hexToRgba('#FF0000', 0)).toBe('rgba(255, 0, 0, 0)');
  });
});

describe('resolveArtBorderStyle', () => {
  it('returns empty string for null primary', () => {
    expect(resolveArtBorderStyle(null, null)).toBe('');
  });

  it('returns solid rgba for single element', () => {
    expect(resolveArtBorderStyle('Water', null)).toBe(AURA_COLORS.Water.artBorderRgba);
  });

  it('returns solid rgba when secondary matches primary', () => {
    expect(resolveArtBorderStyle('Flame', 'Flame')).toBe(AURA_COLORS.Flame.artBorderRgba);
  });

  it('returns solid rgba when secondary is Neutral', () => {
    expect(resolveArtBorderStyle('Forest', 'Neutral')).toBe(AURA_COLORS.Forest.artBorderRgba);
  });

  it('returns rainbow gradient for Light solo', () => {
    const result = resolveArtBorderStyle('Light', null);
    expect(result).toContain('linear-gradient');
    expect(result).toContain('#8F00FF');
  });

  it('returns rainbow gradient for Light + Neutral', () => {
    const result = resolveArtBorderStyle('Light', 'Neutral');
    expect(result).toContain('linear-gradient');
    expect(result).toContain('#8F00FF');
  });

  it('returns rainbow gradient for Light + Light', () => {
    const result = resolveArtBorderStyle('Light', 'Light');
    expect(result).toContain('#8F00FF');
  });

  it('returns dual gradient for Light + Dark (not rainbow)', () => {
    const result = resolveArtBorderStyle('Light', 'Dark');
    expect(result).toContain('linear-gradient(90deg');
    expect(result).toContain(AURA_COLORS.Light.artBorderRgba);
    expect(result).toContain(AURA_COLORS.Dark.artBorderRgba);
  });

  it('returns dual gradient for two elements', () => {
    const result = resolveArtBorderStyle('Flame', 'Frost');
    expect(result).toContain('linear-gradient(90deg');
    expect(result).toContain(AURA_COLORS.Flame.artBorderRgba);
    expect(result).toContain(AURA_COLORS.Frost.artBorderRgba);
  });
});

describe('resolveBgOverlayStyle', () => {
  it('returns empty for null primary', () => {
    expect(resolveBgOverlayStyle(null, null)).toBe('');
  });

  it('returns solid overlay for single element', () => {
    expect(resolveBgOverlayStyle('Forest', null)).toBe(AURA_COLORS.Forest.bgOverlayRgba);
  });

  it('returns solid overlay when secondary matches primary', () => {
    expect(resolveBgOverlayStyle('Water', 'Water')).toBe(AURA_COLORS.Water.bgOverlayRgba);
  });

  it('returns gradient for dual element', () => {
    const result = resolveBgOverlayStyle('Earth', 'Lightning');
    expect(result).toContain('linear-gradient(90deg');
    expect(result).toContain(AURA_COLORS.Earth.bgOverlayRgba);
    expect(result).toContain(AURA_COLORS.Lightning.bgOverlayRgba);
  });
});

describe('computeStrongAgainst', () => {
  it('returns empty for null primary', () => {
    expect(computeStrongAgainst(null, null)).toEqual([]);
  });

  it('returns empty for Neutral', () => {
    expect(computeStrongAgainst('Neutral', null)).toEqual([]);
  });

  it('returns strengths for Water', () => {
    expect(computeStrongAgainst('Water', null)).toEqual(['Flame', 'Earth']);
  });

  it('returns strengths for single-strength element', () => {
    expect(computeStrongAgainst('Forest', null)).toEqual(['Water']);
  });

  it('returns Dark strengths', () => {
    expect(computeStrongAgainst('Dark', null)).toEqual(['Spirit', 'Light']);
  });

  it('ignores secondary when same as primary', () => {
    expect(computeStrongAgainst('Water', 'Water')).toEqual(['Flame', 'Earth']);
  });

  it('merges dual-element strengths without duplicates', () => {
    const result = computeStrongAgainst('Dark', 'Spirit');
    expect(result).toEqual(['Spirit', 'Light', 'Dark']);
  });

  it('caps at 4 elements', () => {
    const result = computeStrongAgainst('Water', 'Dark');
    expect(result).toHaveLength(4);
    expect(result).toEqual(['Flame', 'Earth', 'Spirit', 'Light']);
  });

  it('ignores Neutral secondary', () => {
    expect(computeStrongAgainst('Water', 'Neutral')).toEqual(['Flame', 'Earth']);
  });
});
