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

interface ProbeSpec {
  family: string;
  weight: string;
  style: string;
  size: number;
}

export function computeDelta(dev: FontBox, ref: FontBox): number {
  return (ref.ascent - dev.ascent)
    + ((dev.ascent + dev.descent) - (ref.ascent + ref.descent)) / 2;
}

const WHOLE_PX_SLACK = 0.1;

export function applicableDelta(dev: FontBox, ref: FontBox): number {
  const raw = computeDelta(dev, ref);
  const whole = Math.round(raw);
  if (whole === 0) return 0;
  return Math.abs(raw - whole) <= WHOLE_PX_SLACK ? whole : 0;
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

function specKey(s: ProbeSpec): string {
  return `${s.family}|${s.weight}|${s.style}|${s.size}`;
}

function faceReady(s: ProbeSpec): boolean {
  try {
    return document.fonts.check(`${s.style} ${s.weight} ${s.size}px "${s.family}"`);
  } catch {
    return false;
  }
}

function measureBoxes(specs: ProbeSpec[]): (FontBox | null)[] {
  if (!specs.length) return [];
  const frag = document.createDocumentFragment();
  const outers: HTMLElement[] = [];
  const struts: HTMLElement[] = [];
  for (const s of specs) {
    const outer = document.createElement('span');
    outer.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;'
      + `font-family:"${s.family}";font-weight:${s.weight};font-style:${s.style};`
      + `font-size:${s.size}px;line-height:normal`;
    outer.textContent = 'Hxg';
    const strut = document.createElement('span');
    strut.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    outer.appendChild(strut);
    frag.appendChild(outer);
    outers.push(outer);
    struts.push(strut);
  }
  document.body.appendChild(frag);
  const boxes = outers.map((outer, i) => {
    const box = outer.getBoundingClientRect();
    const base = struts[i].getBoundingClientRect();
    return box.height ? { ascent: base.top - box.top, descent: box.bottom - base.top } : null;
  });
  for (const outer of outers) outer.remove();
  return boxes;
}

const CACHE_CAP = 400;
const deltaCache = new Map<string, number>();

function deltasFor(specs: ProbeSpec[]): number[] {
  const pending: ProbeSpec[] = [];
  const seen = new Set<string>();
  for (const s of specs) {
    const key = specKey(s);
    if (deltaCache.has(key) || seen.has(key)) continue;
    if (!referenceBox(s.family, s.size) || !faceReady(s)) continue;
    seen.add(key);
    pending.push(s);
  }
  if (pending.length) {
    const boxes = measureBoxes(pending);
    if (deltaCache.size > CACHE_CAP) deltaCache.clear();
    pending.forEach((s, i) => {
      const dev = boxes[i];
      const ref = referenceBox(s.family, s.size);
      if (dev && ref) deltaCache.set(specKey(s), applicableDelta(dev, ref));
    });
  }
  return specs.map((s) => deltaCache.get(specKey(s)) ?? 0);
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

const SURVEY_MIN = 4;
const SURVEY_MAX = 20;

function deviceMatchesReference(): boolean {
  if (deviceMatches !== null) return deviceMatches;
  const specs: ProbeSpec[] = [];
  for (const [family, weight, style] of SURVEY_VARIANTS) {
    for (let size = SURVEY_MIN; size <= SURVEY_MAX; size += 0.5) {
      specs.push({ family, weight, style, size });
    }
  }
  const ready = SURVEY_VARIANTS.every(([family, weight, style]) =>
    faceReady({ family, weight, style, size: 12 }));
  if (!ready) return false;
  const clean = deltasFor(specs).every((d) => d === 0);
  deviceMatches = clean;
  return clean;
}

export function pinTextBaselines(root: HTMLElement): void {
  try {
    if (typeof document.fonts === 'undefined') return;
    if (deviceMatchesReference()) return;
    const nodes = Array.from(root.querySelectorAll('[data-oz-text]')) as HTMLElement[];
    if (!nodes.length) return;

    const specs = nodes.map((el) => {
      const cs = getComputedStyle(el);
      const family = primaryFamily(cs.fontFamily);
      return family
        ? { family, weight: cs.fontWeight, style: cs.fontStyle, size: parseFloat(cs.fontSize) }
        : null;
    });
    const deltas = deltasFor(specs.map((s) => s ?? { family: '', weight: '', style: '', size: 0 }));

    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const top = deltas[i] ? `${deltas[i]}px` : '';
      if (el.style.top === top) continue;
      el.style.top = top;
      el.style.position = top ? 'relative' : '';
    }

    if (!reported) {
      const applied = new Map<string, number>();
      specs.forEach((s, i) => {
        if (s && deltas[i]) applied.set(`${s.size}px/${s.weight}/${s.style}`, deltas[i]);
      });
      if (applied.size) {
        reported = true;
        console.info('[openzoo] baseline correction applied:', Object.fromEntries(applied));
      }
    }
  } catch (err) {
    console.warn('[openzoo] baseline correction skipped:', err);
  }
}
