import { describe, it, expect } from 'vitest';
import { cssPxToMm, edgeShowsFoil, parseExportDpi, pixelRatioForDpi, whiteInkMaskPixels, wrapPngInSvg } from '@/lib/printFile';
import { BLEED, CARD_H, CARD_W } from '@/lib/cardDims';

const px = (...rgba: number[]) => new Uint8ClampedArray(rgba);

describe('print file sizing', () => {
  it('maps the card to its physical size', () => {
    expect(cssPxToMm(CARD_W)).toBeCloseTo(62.97, 2);
    expect(cssPxToMm(CARD_H)).toBeCloseTo(88.11, 2);
    expect(cssPxToMm(BLEED)).toBeCloseTo(3.44, 2);
  });
  it('turns each DPI into a whole pixel ratio', () => {
    expect([384, 768, 1152].map((d) => pixelRatioForDpi(parseExportDpi(String(d))))).toEqual([4, 8, 12]);
  });
  it('falls back to 384 dpi for unknown values', () => {
    expect(parseExportDpi(null)).toBe(384);
    expect(parseExportDpi('300')).toBe(384);
  });
});

describe('wrapPngInSvg', () => {
  it('sets the size in mm and keeps the raster pixel size as the viewBox', () => {
    const svg = wrapPngInSvg('data:image/png;base64,AA', 952, 1332, 62.9666, 88.1063);
    expect(svg).toContain('width="62.967mm" height="88.106mm" viewBox="0 0 952 1332"');
    expect(svg).toContain('<image width="952" height="1332" href="data:image/png;base64,AA"');
  });
});

describe('whiteInkMaskPixels', () => {
  const on = px(
    10, 20, 30, 255, // card pixel, no foil
    0, 0, 0, 255, // foil
    40, 40, 40, 0, // outside the rounded corner
    100, 100, 100, 255, // text antialiased over foil, mostly covered
    60, 60, 60, 90, // antialiased corner edge
  );
  const off = px(
    10, 20, 30, 255,
    255, 255, 255, 255,
    40, 40, 40, 0,
    150, 150, 150, 255,
    60, 60, 60, 90,
  );
  it('puts black ink everywhere on the card except the foil', () => {
    expect(Array.from(whiteInkMaskPixels(on, off, false).slice(0, 16))).toEqual([
      0, 0, 0, 255,
      255, 255, 255, 255,
      255, 255, 255, 0,
      0, 0, 0, 255,
    ]);
  });
  it('keeps the card alpha, so the rounded corners stay transparent', () => {
    expect(Array.from(whiteInkMaskPixels(on, off, false).slice(16, 20))).toEqual([0, 0, 0, 90]);
  });
  it('fills the corners for print bleed with the edge state, opaque', () => {
    expect(Array.from(whiteInkMaskPixels(on, off, false, 'ink').slice(8, 12))).toEqual([0, 0, 0, 255]);
    expect(Array.from(whiteInkMaskPixels(on, off, false, 'foil').slice(8, 12))).toEqual([255, 255, 255, 255]);
    expect(Array.from(whiteInkMaskPixels(on, off, false, 'foil').slice(16, 20))).toEqual([255, 255, 255, 255]);
    expect(Array.from(whiteInkMaskPixels(on, off, false, 'ink').slice(0, 4))).toEqual([0, 0, 0, 255]);
  });
  it('reads the corner state from the middle of the top edge', () => {
    expect(edgeShowsFoil(on, off, 3)).toBe(true);
    expect(edgeShowsFoil(on, off, 1)).toBe(false);
  });
  it('inverts polarity on request', () => {
    expect(Array.from(whiteInkMaskPixels(on, off, true).slice(0, 8))).toEqual([255, 255, 255, 255, 0, 0, 0, 255]);
  });
});
