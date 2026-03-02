import { describe, it, expect } from 'vitest';
import { resolveBanner } from '@/lib/bannerResolver';

describe('resolveBanner', () => {
  describe('null/missing primary', () => {
    it('returns NeutralBanner.png when no cardType', () => {
      expect(resolveBanner(null, null)).toBe('NeutralBanner.png');
    });

    it('returns NeutralBanner.png for Beastie', () => {
      expect(resolveBanner(null, null, 'Beastie')).toBe('NeutralBanner.png');
    });

    it('returns NeutralBanner.png for Token', () => {
      expect(resolveBanner(null, null, 'Token')).toBe('NeutralBanner.png');
    });

    it('returns NeutralAltBanner.png for Spell', () => {
      expect(resolveBanner(null, null, 'Spell')).toBe('NeutralAltBanner.png');
    });

    it('returns NeutralAltBanner.png for Aura', () => {
      expect(resolveBanner(null, null, 'Aura')).toBe('NeutralAltBanner.png');
    });
  });

  describe('Neutral primary', () => {
    it('returns NeutralBanner.png for Beastie', () => {
      expect(resolveBanner('Neutral', null, 'Beastie')).toBe('NeutralBanner.png');
    });

    it('returns NeutralAltBanner.png for Aura', () => {
      expect(resolveBanner('Neutral', null, 'Aura')).toBe('NeutralAltBanner.png');
    });
  });

  describe('single element', () => {
    it('returns element banner when no secondary', () => {
      expect(resolveBanner('Flame', null)).toBe('FlameBanner.png');
    });

    it('returns element banner when secondary matches primary', () => {
      expect(resolveBanner('Water', 'Water')).toBe('WaterBanner.png');
    });

    it('returns element banner when secondary is Neutral', () => {
      expect(resolveBanner('Forest', 'Neutral')).toBe('ForestBanner.png');
    });
  });

  describe('dual element', () => {
    it('returns combined banner', () => {
      expect(resolveBanner('Flame', 'Frost')).toBe('FlameFrostBanner.png');
    });

    it('returns combined banner (different combo)', () => {
      expect(resolveBanner('Dark', 'Light')).toBe('DarkLightBanner.png');
    });

    it('preserves primary-secondary order', () => {
      expect(resolveBanner('Water', 'Earth')).toBe('WaterEarthBanner.png');
    });
  });
});
