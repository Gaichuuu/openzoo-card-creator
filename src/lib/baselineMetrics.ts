interface EmMetrics {
  ascent: number;
  descent: number;
  upem: number;
}

const EM_METRICS: Record<string, EmMetrics> = {
  'EB Garamond': { ascent: 1007, descent: 298, upem: 1000 },
  'Archivo Black': { ascent: 878, descent: 210, upem: 1000 },
};

export interface FontBox {
  ascent: number;
  descent: number;
}

export function computeDelta(dev: FontBox, ref: FontBox): number {
  const delta = (ref.ascent - dev.ascent)
    + ((dev.ascent + dev.descent) - (ref.ascent + ref.descent)) / 2;
  return Math.abs(delta) < 0.01 ? 0 : delta;
}

export function referenceBox(family: string, size: number): FontBox | null {
  const em = EM_METRICS[family];
  if (!em) return null;
  return {
    ascent: Math.round((em.ascent * size) / em.upem),
    descent: Math.round((em.descent * size) / em.upem),
  };
}

export function primaryFamily(stack: string): string | null {
  for (const part of stack.split(',')) {
    const name = part.trim().replace(/^["']|["']$/g, '');
    if (EM_METRICS[name]) return name;
  }
  return null;
}

function measureBox(family: string, weight: string, style: string, size: number): FontBox | null {
  const outer = document.createElement('span');
  outer.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;'
    + `font-family:'${family}';font-weight:${weight};font-style:${style};`
    + `font-size:${size}px;line-height:normal`;
  outer.textContent = 'Hxg';
  const strut = document.createElement('span');
  strut.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  outer.appendChild(strut);
  document.body.appendChild(outer);
  const box = outer.getBoundingClientRect();
  const base = strut.getBoundingClientRect();
  outer.remove();
  if (!box.height) return null;
  return { ascent: base.top - box.top, descent: box.bottom - base.top };
}

const deltaCache = new Map<string, number>();

function deltaFor(family: string, weight: string, style: string, size: number): number {
  const key = `${family}|${weight}|${style}|${size}`;
  const hit = deltaCache.get(key);
  if (hit !== undefined) return hit;
  const ref = referenceBox(family, size);
  const dev = measureBox(family, weight, style, size);
  const delta = ref && dev ? computeDelta(dev, ref) : 0;
  if (document.fonts.status === 'loaded') deltaCache.set(key, delta);
  return delta;
}

let reported = false;
let deviceMatches: boolean | null = null;

const SURVEY_VARIANTS: [string, string, string][] = [
  ['EB Garamond', '400', 'normal'],
  ['EB Garamond', '700', 'normal'],
  ['EB Garamond', '400', 'italic'],
  ['EB Garamond', '700', 'italic'],
  ['Archivo Black', '400', 'normal'],
];

function deviceMatchesReference(): boolean {
  if (deviceMatches !== null) return deviceMatches;
  if (document.fonts.status !== 'loaded') return false;
  let clean = true;
  for (const [family, weight, style] of SURVEY_VARIANTS) {
    for (let size = 4; size <= 20; size += 0.5) {
      if (deltaFor(family, weight, style, size) !== 0) { clean = false; break; }
    }
    if (!clean) break;
  }
  deviceMatches = clean;
  return clean;
}

export function pinTextBaselines(root: HTMLElement): void {
  if (deviceMatchesReference()) return;
  const nodes = Array.from(root.querySelectorAll('[data-oz-text]')) as HTMLElement[];
  if (!nodes.length) return;
  const deltas = nodes.map((el) => {
    const cs = getComputedStyle(el);
    const family = primaryFamily(cs.fontFamily);
    if (!family) return 0;
    return deltaFor(family, cs.fontWeight, cs.fontStyle, parseFloat(cs.fontSize));
  });
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    const delta = deltas[i];
    if (delta) {
      el.style.position = 'relative';
      el.style.top = `${delta}px`;
    } else if (el.style.top) {
      el.style.top = '';
      el.style.position = '';
    }
  }
  if (!reported && deltas.some((d) => d !== 0)) {
    reported = true;
    const seen = new Map<string, number>();
    nodes.forEach((el, i) => {
      if (!deltas[i]) return;
      const cs = getComputedStyle(el);
      seen.set(`${cs.fontSize}/${cs.fontWeight}/${cs.fontStyle}`, deltas[i]);
    });
    console.info('[openzoo] baseline correction applied:', Object.fromEntries(seen));
  }
}
