import { describe, it, expect } from 'vitest';
import { parseBrowser, measureZoneHealth } from '@/lib/clientDiagnostics';

const UA = {
  macChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  iosChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0.6261.89 Mobile/15E148 Safari/604.1',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
  edgeAndroid: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.0.0',
  edgeIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 EdgiOS/121.0.0.0 Mobile/15E148 Safari/604.1',
  edgeLegacy: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.19041',
};

describe('parseBrowser', () => {
  it('reads Chrome on macOS', () => {
    expect(parseBrowser(UA.macChrome)).toEqual({
      engine: 'Blink', browser: 'Chrome', version: '152', platform: 'macOS', mobile: false,
    });
  });

  it('reads Safari on macOS', () => {
    const r = parseBrowser(UA.macSafari);
    expect(r.browser).toBe('Safari');
    expect(r.version).toBe('17');
    expect(r.engine).toBe('WebKit');
  });

  it('calls iOS Chrome WebKit, not Blink', () => {
    const r = parseBrowser(UA.iosChrome);
    expect(r.browser).toBe('Chrome');
    expect(r.platform).toBe('iOS');
    expect(r.engine).toBe('WebKit');
    expect(r.mobile).toBe(true);
  });

  it('reads iOS Safari', () => {
    expect(parseBrowser(UA.iosSafari)).toMatchObject({
      engine: 'WebKit', browser: 'Safari', platform: 'iOS', mobile: true,
    });
  });

  it('prefers Android over the Linux token', () => {
    expect(parseBrowser(UA.androidChrome)).toMatchObject({
      engine: 'Blink', browser: 'Chrome', platform: 'Android', mobile: true,
    });
  });

  it('picks the fork over Chrome', () => {
    expect(parseBrowser(UA.samsung)).toMatchObject({ browser: 'Samsung', version: '23' });
    expect(parseBrowser(UA.edge)).toMatchObject({ browser: 'Edge', version: '151' });
  });

  it('recognises every Edge token, not just desktop Edg/', () => {
    expect(parseBrowser(UA.edgeAndroid)).toMatchObject({
      browser: 'Edge', version: '120', platform: 'Android', engine: 'Blink',
    });
    expect(parseBrowser(UA.edgeIos)).toMatchObject({
      browser: 'Edge', version: '121', platform: 'iOS', engine: 'WebKit',
    });
    expect(parseBrowser(UA.edgeLegacy)).toMatchObject({ browser: 'Edge', version: '18' });
  });

  it('reads Firefox as Gecko', () => {
    expect(parseBrowser(UA.firefox)).toMatchObject({
      engine: 'Gecko', browser: 'Firefox', version: '124', platform: 'Windows', mobile: false,
    });
  });

  it('degrades to Other rather than guessing', () => {
    expect(parseBrowser('some-crawler/1.0')).toMatchObject({
      engine: 'Other', browser: 'Other', version: '', platform: 'Other',
    });
  });
});

function bitmap(w: number, h: number, stem: number, halo: boolean, bg = [40, 120, 40]) {
  const data = new Uint8ClampedArray(w * h * 4);
  const x0 = Math.floor(w / 2) - Math.floor(stem / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const inStem = x >= x0 && x < x0 + stem;
      const adjacent = x === x0 - 1 || x === x0 + stem;
      const px = inStem ? [0, 0, 0] : (halo && adjacent ? [255, 255, 255] : bg);
      data[i] = px[0]; data[i + 1] = px[1]; data[i + 2] = px[2]; data[i + 3] = 255;
    }
  }
  return { data, width: w, height: h };
}

describe('measureZoneHealth', () => {
  it('measures stem thickness and finds the outline', () => {
    const r = measureZoneHealth(bitmap(20, 20, 3, true))!;
    expect(r.stem).toBe(3);
    expect(r.halo).toBeGreaterThan(0.5);
    expect(r.ink).toBeCloseTo(3 / 20, 2);
  });

  it('reports no halo when the outline is missing', () => {
    expect(measureZoneHealth(bitmap(20, 20, 3, false))!.halo).toBe(0);
  });

  it('does not count pale background as outline', () => {
    const r = measureZoneHealth(bitmap(20, 20, 2, false, [250, 250, 250]))!;
    expect(r.halo).toBeLessThan(1.6);
    expect(r.stem).toBe(2);
  });

  it('returns null when there is too little ink to judge', () => {
    expect(measureZoneHealth(bitmap(4, 4, 1, true))).toBeNull();
  });
});
