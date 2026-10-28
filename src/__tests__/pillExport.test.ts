import { describe, it, expect } from 'vitest';
import { measurePillBias, pillExportShift, resolvePillPalette, DEFAULT_PILL_COLORS } from '@/lib/pillExport';

const CREAM = [250, 244, 228];
const FILL = [155, 180, 216];
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

type Paint = number[] | ((x: number) => number[]);

function pill(fillTop: number, fillBot: number, inkTop: number, inkBot: number, fill: Paint = FILL, ink = WHITE, border = BLACK, caps = false) {
  const width = 40;
  const height = 40;
  const data = new Uint8ClampedArray(width * height * 4);
  const put = (x: number, y: number, c: number[]) => {
    const i = (y * width + x) * 4;
    data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let c = CREAM;
      if (x >= 4 && x <= 35 && (y === fillTop - 1 || y === fillBot + 1)) c = border;
      if (x >= 4 && x <= 35 && y >= fillTop && y <= fillBot) c = typeof fill === 'function' ? fill(x) : fill;
      if (caps && y >= fillTop && y <= fillBot && (x === 4 || x === 35 || ((x <= 6 || x >= 33) && (y <= fillTop + 2 || y >= fillBot - 2)))) c = border;
      if (x >= 12 && x <= 27 && (y === inkTop - 1 || y === inkBot + 1)) c = BLACK;
      if (x >= 12 && x <= 27 && y >= inkTop && y <= inkBot) c = ink;
      put(x, y, c);
    }
  }
  return { data, width, height };
}

const BOX = { x: 0, y: 0, w: 40, h: 40 };

describe('measurePillBias', () => {
  it('reads zero for centred text', () => {
    expect(measurePillBias(pill(10, 29, 15, 24), BOX, 4)).toBe(0);
  });

  it('reads positive when the text sits low', () => {
    expect(measurePillBias(pill(10, 29, 16, 25), BOX, 4)).toBe(1);
  });

  it('reads negative when the text sits high', () => {
    expect(measurePillBias(pill(10, 29, 13, 22), BOX, 4)).toBe(-2);
  });

  it('counts ink that overflows the fill by up to the margin', () => {
    expect(measurePillBias(pill(10, 29, 18, 31), BOX, 4)).toBe(5);
  });

  it('ignores white pixels outside the fill band and margin', () => {
    const bmp = pill(10, 29, 15, 24);
    for (let x = 12; x <= 27; x++) {
      const i = (2 * bmp.width + x) * 4;
      bmp.data[i] = 255; bmp.data[i + 1] = 255; bmp.data[i + 2] = 255;
    }
    expect(measurePillBias(bmp, BOX, 4)).toBe(0);
  });

  it('only searches inside the given box', () => {
    const bmp = pill(10, 29, 16, 25);
    expect(measurePillBias(bmp, { x: 0, y: 0, w: 40, h: 8 }, 4)).toBeNull();
  });

  it('returns null when there is no pill fill', () => {
    const bmp = pill(10, 29, 15, 24);
    for (let i = 0; i < bmp.data.length; i += 4) {
      bmp.data[i] = CREAM[0]; bmp.data[i + 1] = CREAM[1]; bmp.data[i + 2] = CREAM[2];
    }
    expect(measurePillBias(bmp, BOX, 4)).toBeNull();
  });

  it('returns null when the fill has no text in it', () => {
    const bmp = pill(10, 29, 15, 24);
    for (let y = 14; y <= 25; y++) {
      for (let x = 12; x <= 27; x++) {
        const i = (y * bmp.width + x) * 4;
        bmp.data[i] = FILL[0]; bmp.data[i + 1] = FILL[1]; bmp.data[i + 2] = FILL[2];
      }
    }
    expect(measurePillBias(bmp, BOX, 4)).toBeNull();
  });
});

describe('custom pill colors', () => {
  const DARK = [34, 34, 34];
  const GOLD = [236, 203, 13];
  const G0 = [30, 58, 138];
  const G1 = [190, 24, 93];
  const lerp = (x: number) => { const t = (x - 4) / 31; return G0.map((c, i) => Math.round(c + (G1[i] - c) * t)); };
  const dark = { fill: [DARK], text: GOLD, border: GOLD };
  const gradient = { fill: [G0, G1], text: GOLD, border: BLACK };

  it('the default detector cannot read them', () => {
    expect(measurePillBias(pill(10, 29, 16, 25, DARK, GOLD), BOX, 4)).toBeNull();
  });

  it('reads a dark fill with gold text and a gold border, ignoring the border where it curves into the fill rows', () => {
    expect(measurePillBias(pill(10, 29, 15, 24, DARK, GOLD, GOLD, true), BOX, 4, dark)).toBe(0);
    expect(measurePillBias(pill(10, 29, 16, 25, DARK, GOLD, GOLD, true), BOX, 4, dark)).toBe(1);
    expect(measurePillBias(pill(10, 29, 13, 22, DARK, GOLD, GOLD, true), BOX, 4, dark)).toBe(-2);
  });

  it('classifies every pixel of a gradient fill by its distance to the stop path', () => {
    expect(measurePillBias(pill(10, 29, 15, 24, lerp, GOLD), BOX, 4, gradient)).toBe(0);
    expect(measurePillBias(pill(10, 29, 16, 25, lerp, GOLD), BOX, 4, gradient)).toBe(1);
    expect(measurePillBias(pill(10, 29, 18, 31, lerp, GOLD), BOX, 4, gradient)).toBe(5);
  });

  it('ignores neighbouring text whose antialiasing matches a dark or translucent fill', () => {
    const bmp = pill(10, 29, 16, 25, DARK, GOLD, BLACK, true);
    for (const y of [3, 34, 35]) {
      for (const x of [8, 15, 22, 30]) {
        const i = (y * bmp.width + x) * 4;
        bmp.data[i] = 34; bmp.data[i + 1] = 34; bmp.data[i + 2] = 34;
      }
    }
    expect(measurePillBias(bmp, BOX, 4, { fill: [DARK], text: GOLD, border: BLACK })).toBe(1);
  });

  it('keeps the full band when the glyph stroke hides the fill across whole rows', () => {
    const bmp = pill(10, 29, 16, 25, DARK, GOLD, BLACK, true);
    for (const y of [20, 21, 22]) {
      for (let x = 4; x <= 35; x++) {
        const i = (y * bmp.width + x) * 4;
        bmp.data[i] = 0; bmp.data[i + 1] = 0; bmp.data[i + 2] = 0;
      }
    }
    expect(measurePillBias(bmp, BOX, 4, { fill: [DARK], text: GOLD, border: BLACK })).toBe(1);
  });

  it('returns null when the text color lies on the fill path', () => {
    expect(measurePillBias(pill(10, 29, 16, 25, DARK, [40, 40, 40]), BOX, 4, { fill: [DARK], text: [40, 40, 40], border: BLACK })).toBeNull();
    expect(measurePillBias(pill(10, 29, 16, 25, lerp, [110, 41, 116]), BOX, 4, { fill: [G0, G1], text: [110, 41, 116], border: BLACK })).toBeNull();
  });

  it('reads a default pill with a white border through its palette', () => {
    const pal = resolvePillPalette({ backgroundColor: 'rgb(155, 180, 216)', backgroundImage: 'none', color: 'rgb(255, 255, 255)', borderTopColor: 'rgb(255, 255, 255)' }, () => null);
    expect(pal).toBeTruthy();
    const got = [[16, 25], [13, 22], [18, 27]].map(([t, b]) => measurePillBias(pill(10, 29, t, b, FILL, WHITE, WHITE), BOX, 4, pal ?? undefined));
    expect(got).toEqual([1, -2, 3]);
  });

  it('the default palette measures exactly like the default detector', () => {
    for (const [ft, fb, it_, ib] of [[10, 29, 16, 25], [10, 29, 13, 22], [10, 29, 15, 24], [10, 29, 18, 31]]) {
      const bmp = pill(ft, fb, it_, ib);
      expect(measurePillBias(bmp, BOX, 4, undefined)).toBe(measurePillBias(bmp, BOX, 4));
    }
  });
});

describe('resolvePillPalette', () => {
  const cs = (o: Partial<Record<'backgroundColor' | 'backgroundImage' | 'color' | 'borderTopColor', string>>) => ({
    backgroundColor: 'rgb(155, 180, 216)', backgroundImage: 'none', color: 'rgb(255, 255, 255)', borderTopColor: 'rgb(0, 0, 0)', ...o,
  });
  const noSample = () => null;

  it('is undefined for the default colors so the original detector runs', () => {
    expect(DEFAULT_PILL_COLORS).toEqual({ fill: [155, 180, 216], text: [255, 255, 255] });
    expect(resolvePillPalette(cs({}), noSample)).toBeUndefined();
    expect(resolvePillPalette(cs({ borderTopColor: 'rgb(236, 203, 13)' }), noSample)).toBeUndefined();
  });

  it('builds a palette for the default fill and text when the border could read as ink', () => {
    expect(resolvePillPalette(cs({ borderTopColor: 'rgb(255, 255, 255)' }), noSample))
      .toEqual({ fill: [[155, 180, 216]], text: [255, 255, 255], border: [255, 255, 255] });
  });

  it('reads a solid fill, text and border', () => {
    expect(resolvePillPalette(cs({ backgroundColor: 'rgb(34, 34, 34)', color: 'rgb(236, 203, 13)', borderTopColor: 'rgb(236, 203, 13)' }), noSample))
      .toEqual({ fill: [[34, 34, 34]], text: [236, 203, 13], border: [236, 203, 13] });
  });

  it('reads every gradient stop in order', () => {
    expect(resolvePillPalette(cs({
      backgroundColor: 'rgba(0, 0, 0, 0)',
      backgroundImage: 'linear-gradient(90deg, rgb(30, 58, 138) 0%, rgb(255, 255, 0) 50%, rgb(190, 24, 93) 100%)',
      color: 'rgb(236, 203, 13)',
    }), noSample)).toEqual({ fill: [[30, 58, 138], [255, 255, 0], [190, 24, 93]], text: [236, 203, 13], border: [0, 0, 0] });
  });

  it('samples a translucent fill from the raster, since it shows the box behind it', () => {
    expect(resolvePillPalette(cs({ backgroundColor: 'rgba(34, 34, 34, 0.5)' }), () => [140, 138, 131]))
      .toEqual({ fill: [[140, 138, 131]], text: [255, 255, 255], border: [0, 0, 0] });
    expect(resolvePillPalette(cs({ backgroundColor: 'rgba(34, 34, 34, 0.5)' }), noSample)).toBeNull();
  });

  it('is null when a color cannot be parsed', () => {
    expect(resolvePillPalette(cs({ color: 'currentcolor' }), noSample)).toBeNull();
  });
});

describe('pillExportShift', () => {
  it.each([
    // [bias in export px, pixel ratio, correction in card px]
    [0, 4, 0],
    [0.5, 4, -0.125],
    [-0.5, 4, 0.125],
    [2, 4, -0.5],
    [-3, 4, 0.75],
  ])('bias %s at %sx -> %s', (bias, ratio, want) => {
    expect(pillExportShift(bias, ratio)).toBe(want);
  });
});
