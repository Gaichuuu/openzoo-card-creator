import { describe, it, expect } from 'vitest';
import { resolveImagePath } from '@/lib/imagePathResolver';

describe('resolveImagePath', () => {
  describe('passthrough cases', () => {
    it('returns empty string for empty input', () => {
      expect(resolveImagePath('')).toBe('');
    });

    it('returns empty string for default_image', () => {
      expect(resolveImagePath('default_image')).toBe('');
    });

    it('passes through data: URLs', () => {
      const url = 'data:image/png;base64,abc123';
      expect(resolveImagePath(url)).toBe(url);
    });

    it('passes through blob: URLs', () => {
      const url = 'blob:http://localhost/abc-def';
      expect(resolveImagePath(url)).toBe(url);
    });

    it('passes through allowed Firebase Storage URLs', () => {
      const url = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/img.png';
      expect(resolveImagePath(url)).toBe(url);
    });

    it('passes through storage.googleapis.com URLs', () => {
      const url = 'https://storage.googleapis.com/bucket/img.png';
      expect(resolveImagePath(url)).toBe(url);
    });

    it('blocks arbitrary external URLs', () => {
      expect(resolveImagePath('https://evil.com/tracker.png')).toBe('');
      expect(resolveImagePath('https://example.com/img.png')).toBe('');
      expect(resolveImagePath('http://malicious.site/x.png')).toBe('');
    });

    it('passes through /assets/ paths', () => {
      const path = '/assets/Banners/FlameBanner.png';
      expect(resolveImagePath(path)).toBe(path);
    });
  });

  describe('folder mappings', () => {
    it('maps OpenZoo Aura/', () => {
      expect(resolveImagePath('OpenZoo Aura/Water.png')).toBe('/assets/AuraSymbols/Water.png');
    });

    it('maps OpenZoo Terra/', () => {
      expect(resolveImagePath('OpenZoo Terra/Cave.png')).toBe('/assets/TerraNoGlow/Cave.png');
    });

    it('maps OpenZoo Traits/', () => {
      expect(resolveImagePath('OpenZoo Traits/Fleet.png')).toBe('/assets/TraitsNoGlow/Fleet.png');
    });

    it('maps OpenZoo Status Effects/', () => {
      expect(resolveImagePath('OpenZoo Status Effects/Burn.png')).toBe('/assets/StatusEffects/Burn.png');
    });

    it('maps OpenZoo Banners/', () => {
      expect(resolveImagePath('OpenZoo Banners/FlameBanner.png')).toBe('/assets/Banners/FlameBanner.png');
    });

    it('maps OpenZoo Set Symbols/', () => {
      expect(resolveImagePath('OpenZoo Set Symbols/Promo.png')).toBe('/assets/SetSymbols/Promo.png');
    });

    it('maps StatusEffect Symbols/', () => {
      expect(resolveImagePath('StatusEffect Symbols/Frozen.png')).toBe('/assets/StatusEffects/Frozen.png');
    });

    it('maps OpenZoo Cost Boxes/', () => {
      expect(resolveImagePath('OpenZoo Cost Boxes/CostBox.png')).toBe('/assets/AuraSymbols/CostBox.png');
    });
  });

  describe('bare filename heuristics', () => {
    it('detects banner filenames', () => {
      expect(resolveImagePath('FlameBanner.png')).toBe('/assets/Banners/FlameBanner.png');
    });

    it('detects element filenames', () => {
      expect(resolveImagePath('Water.png')).toBe('/assets/AuraSymbols/Water.png');
    });

    it('detects Special.png as aura symbol', () => {
      expect(resolveImagePath('Special.png')).toBe('/assets/AuraSymbols/Special.png');
    });

    it('detects OZLegacy set symbols', () => {
      expect(resolveImagePath('OZLegacyBronze.png')).toBe('/assets/SetSymbols/OZLegacyBronze.png');
    });

    it('detects MetaPoo set symbol', () => {
      expect(resolveImagePath('MetaPoo.png')).toBe('/assets/SetSymbols/MetaPoo.png');
    });

    it('detects Promo set symbol', () => {
      expect(resolveImagePath('Promo.png')).toBe('/assets/SetSymbols/Promo.png');
    });
  });

  describe('fallback', () => {
    it('falls back to /assets/ for unknown filenames', () => {
      expect(resolveImagePath('SomeImage.png')).toBe('/assets/SomeImage.png');
    });
  });
});
