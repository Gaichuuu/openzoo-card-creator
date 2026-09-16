import { getFitMode } from '@/lib/fitMode';
import { usesCeilDescent } from '@/lib/fontBackend';

export interface BrowserInfo {
  engine: 'Blink' | 'WebKit' | 'Gecko' | 'Other';
  browser: string;
  version: string;
  platform: string;
  mobile: boolean;
}

const BROWSERS: [string, RegExp][] = [
  ['Edge', /\bEdgi?O?S?\/(\d+)/],
  ['Opera', /\bOPR\/(\d+)/],
  ['Samsung', /\bSamsungBrowser\/(\d+)/],
  ['Firefox', /\b(?:Firefox|FxiOS)\/(\d+)/],
  ['Chrome', /\b(?:Chrome|CriOS)\/(\d+)/],
  ['Safari', /\bVersion\/(\d+)(?=.*\bSafari\b)/],
];

const PLATFORMS: [string, RegExp][] = [
  ['iOS', /\b(?:iPhone|iPad|iPod)\b/],
  ['Android', /\bAndroid\b/],
  ['Windows', /\bWindows\b/],
  ['macOS', /\bMac OS X\b|\bMacintosh\b/],
  ['Linux', /\bLinux\b|\bX11\b/],
];

export function parseBrowser(ua: string): BrowserInfo {
  let browser = 'Other';
  let version = '';
  for (const [name, re] of BROWSERS) {
    const m = ua.match(re);
    if (m) { browser = name; version = m[1]; break; }
  }

  let platform = 'Other';
  for (const [name, re] of PLATFORMS) {
    if (re.test(ua)) { platform = name; break; }
  }

  let engine: BrowserInfo['engine'];
  if (platform === 'iOS' || browser === 'Safari') engine = 'WebKit';
  else if (browser === 'Firefox') engine = 'Gecko';
  else if (browser === 'Other') engine = 'Other';
  else engine = 'Blink';

  return {
    engine,
    browser,
    version,
    platform,
    mobile: /\bMobi\b|\bAndroid\b|\b(?:iPhone|iPod)\b/.test(ua),
  };
}

export interface ZoneHealth {
  ink: number;
  halo: number;
  stem: number;
}

interface Bitmap { data: Uint8ClampedArray | number[]; width: number; height: number }

const DARK = 100;
const LIGHT = 230;

export function measureZoneHealth(bmp: Bitmap): ZoneHealth | null {
  const { data, width, height } = bmp;
  const at = (x: number, y: number) => (y * width + x) * 4;
  const isDark = (x: number, y: number) => {
    const i = at(x, y);
    return data[i] < DARK && data[i + 1] < DARK && data[i + 2] < DARK;
  };
  const isLight = (x: number, y: number) => {
    const i = at(x, y);
    return data[i] > LIGHT && data[i + 1] > LIGHT && data[i + 2] > LIGHT;
  };

  const touchesDark = (x: number, y: number): boolean => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (isDark(nx, ny)) return true;
      }
    }
    return false;
  };

  let dark = 0;
  let halo = 0;
  const runs: number[] = [];
  for (let y = 0; y < height; y++) {
    let run = 0;
    for (let x = 0; x < width; x++) {
      if (isDark(x, y)) {
        dark++;
        run++;
        continue;
      }
      if (run > 0) { runs.push(run); run = 0; }
      if (isLight(x, y) && touchesDark(x, y)) halo++;
    }
    if (run > 0) runs.push(run);
  }
  if (dark < 20) return null;

  runs.sort((a, b) => a - b);
  return {
    ink: +(dark / (width * height)).toFixed(4),
    halo: +(halo / dark).toFixed(3),
    stem: runs.length ? runs[Math.floor(runs.length / 2)] : 0,
  };
}

const FONT_CHECKS: [string, string, boolean][] = [
  ['garamond', '9px "EB Garamond"', true],
  ['archivo', '9px "Archivo Black"', true],
  ['garamond-i?', 'italic 9px "EB Garamond"', false],
  ['garamond-b?', 'bold 9px "EB Garamond"', false],
];

export interface ClientDiagnostics extends BrowserInfo {
  appVersion: string;
  dpr: number;
  viewport: string;
  fit: string;
  ceilDescent: boolean;
  fontsMissing: string[];
  mainFont?: number;
  mainPitch?: number;
  pillFont?: number;
  health?: ZoneHealth;
}

const MAIN_SELECTOR = '[data-zone-key="MainText"],[data-zone-key="MainTextBox"]';

export const COPYRIGHT_SELECTOR = '[data-zone-key="Copyright"]';

export function exportZoneRect(
  cardEl: HTMLElement,
  selector: string,
  exportWidth: number,
): { x: number; y: number; w: number; h: number } | null {
  const zone = cardEl.querySelector(selector) as HTMLElement | null;
  if (!zone) return null;
  const root = cardEl.getBoundingClientRect();
  const r = zone.getBoundingClientRect();
  if (!(root.width > 0) || !(r.width > 0) || !(r.height > 0)) return null;
  const s = exportWidth / root.width;
  return {
    x: Math.max(0, Math.round((r.left - root.left) * s)),
    y: Math.max(0, Math.round((r.top - root.top) * s)),
    w: Math.round(r.width * s),
    h: Math.round(r.height * s),
  };
}

export function collectClientDiagnostics(cardEl: HTMLElement | null): ClientDiagnostics {
  const out: ClientDiagnostics = {
    ...parseBrowser(navigator.userAgent),
    appVersion: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '',
    dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    fit: getFitMode(),
    ceilDescent: usesCeilDescent(),
    fontsMissing: [],
  };

  try {
    out.fontsMissing = FONT_CHECKS
      .filter(([, spec]) => !document.fonts.check(spec))
      .map(([name]) => name);
  } catch {
    out.fontsMissing = ['unknown'];
  }

  if (cardEl) {
    const main = cardEl.querySelector(MAIN_SELECTOR) as HTMLElement | null;
    if (main) {
      const cs = getComputedStyle(main);
      out.mainFont = parseFloat(cs.fontSize);
      out.mainPitch = parseFloat(cs.lineHeight);
    }
    const pill = cardEl.querySelector('[data-oz-pill]') as HTMLElement | null;
    if (pill) out.pillFont = parseFloat(getComputedStyle(pill).fontSize);
  }

  return out;
}
