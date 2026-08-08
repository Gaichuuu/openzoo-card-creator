import { describe, it, expect } from 'vitest';
import { isCustomIconValue } from '@/lib/customIconUtils';

describe('isCustomIconValue', () => {
  it('detects data URLs', () => {
    expect(isCustomIconValue('data:image/png;base64,iVBOR')).toBe(true);
  });

  it('detects https URLs', () => {
    expect(isCustomIconValue('https://firebasestorage.googleapis.com/v0/b/x/o/y.png')).toBe(true);
  });

  it('rejects bare filenames', () => {
    expect(isCustomIconValue('Flame.png')).toBe(false);
    expect(isCustomIconValue('OZLegacyGold.png')).toBe(false);
  });

  it('rejects Dextrous folder paths', () => {
    expect(isCustomIconValue('OpenZoo Traits/Fleet.png')).toBe(false);
    expect(isCustomIconValue('OpenZoo Terra/Cave.png')).toBe(false);
  });

  it('rejects empty and nullish values', () => {
    expect(isCustomIconValue('')).toBe(false);
    expect(isCustomIconValue(null)).toBe(false);
    expect(isCustomIconValue(undefined)).toBe(false);
  });
});
