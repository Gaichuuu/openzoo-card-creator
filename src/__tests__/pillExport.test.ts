import { describe, it, expect } from 'vitest';
import { measurePillBias } from '@/lib/pillExport';

const CREAM = [250, 244, 228];
const FILL = [155, 180, 216];
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

function pill(fillTop: number, fillBot: number, inkTop: number, inkBot: number) {
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
      if (x >= 4 && x <= 35 && y >= fillTop && y <= fillBot) c = FILL;
      if (x >= 12 && x <= 27 && (y === inkTop - 1 || y === inkBot + 1)) c = BLACK;
      if (x >= 12 && x <= 27 && y >= inkTop && y <= inkBot) c = WHITE;
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
