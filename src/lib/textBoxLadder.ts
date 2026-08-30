export interface RungMetrics {
  font: number;
  pitch: number;
}

export interface AttackMetrics {
  name: number;
  dmg: number;
  pitch: number;
}

export interface FitCandidate {
  main: RungMetrics;
  effect: RungMetrics;
  attack: AttackMetrics;
}

const FONTS = [11, 10.5, 10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5] as const;
const PITCH_MAX = 10;

export const BASE_FONT_INDEX = FONTS.indexOf(9);
const PITCH_MIN = 5;

const ATTACK_TIERS: readonly AttackMetrics[] = [
  { name: 10, dmg: 12, pitch: 13 },
  { name: 9, dmg: 11, pitch: 12 },
  { name: 8.5, dmg: 10, pitch: 11 },
];

function pitchRange(font: number): number[] {
  const hi = Math.min(PITCH_MAX, font - 1);
  const lo = Math.max(PITCH_MIN, font - 3);
  const out: number[] = [];
  for (let p = hi; p >= lo; p -= 0.5) out.push(p);
  return out;
}

function buildCandidates(): { list: FitCandidate[]; starts: number[] } {
  const out: FitCandidate[] = [];
  const starts: number[] = [];
  for (const font of FONTS) {
    starts.push(out.length);
    for (const pitch of pitchRange(font)) {
      for (const attack of ATTACK_TIERS) {
        out.push({
          main: { font, pitch },
          effect: {
            font: Math.max(5.5, font - 1),
            pitch: Math.max(PITCH_MIN, pitch - 1),
          },
          attack,
        });
      }
    }
  }
  return { list: out, starts };
}

const BUILT = buildCandidates();

export const FIT_CANDIDATES: readonly FitCandidate[] = BUILT.list;

export const FONT_STARTS: readonly number[] = BUILT.starts;

export const BASE_INDEX = BUILT.starts[BASE_FONT_INDEX];

export const TIERS_PER_CELL = ATTACK_TIERS.length;

export function pickCandidate(
  fits: (candidate: FitCandidate, index: number) => boolean,
  start: number = BASE_INDEX,
): number {
  for (let first = start; first < FIT_CANDIDATES.length; first += TIERS_PER_CELL) {
    const last = first + TIERS_PER_CELL - 1;
    if (!fits(FIT_CANDIDATES[last], last)) continue;
    for (let i = first; i < last; i++) {
      if (fits(FIT_CANDIDATES[i], i)) return i;
    }
    return last;
  }
  return FIT_CANDIDATES.length - 1;
}

const MAIN_SELECTOR = '[data-zone-key="MainTextBox"],[data-zone-key="MainText"]';
const EFFECT_SELECTOR = '[data-zone-key="AttackEffect"],[data-zone-key="AttackEffect 1"]';
const ATTACK_SELECTOR = '[data-zone-key="Attack"],[data-zone-key="Attack 1"]';
const ATTACK_NAME_SELECTOR = '[data-zone-key="Attack Name"],[data-zone-key="Attack Name 1"]';
const ATKDMG_SELECTOR = '[data-zone-key="ATKDMG"],[data-zone-key="ATKDMG 1"]';
const ADV_SELECTOR = '[data-zone-key^="AuraAdvantage"]';

const ADV_BASE_DMG = ATTACK_TIERS[0].dmg;
const ADV_TRIM = 0.8;

function each(el: HTMLElement, selector: string, fn: (node: HTMLElement) => void): void {
  for (const node of Array.from(el.querySelectorAll(selector)) as HTMLElement[]) fn(node);
}

export interface RungAdjust {
  pitch: number;
  spacing: number;
  attackName: number;
}

export function applyRung(el: HTMLElement, rung: FitCandidate, adjust: RungAdjust): void {
  const spacing = `${adjust.spacing * 0.01}em`;
  each(el, MAIN_SELECTOR, (node) => {
    node.style.fontSize = `${rung.main.font}px`;
    node.style.lineHeight = `${rung.main.pitch + adjust.pitch * 0.5}px`;
    node.style.letterSpacing = spacing;
  });
  each(el, EFFECT_SELECTOR, (node) => {
    node.style.fontSize = `${rung.effect.font}px`;
    node.style.lineHeight = `${rung.effect.pitch + adjust.pitch * 0.5}px`;
    node.style.letterSpacing = spacing;
  });
  each(el, ATTACK_SELECTOR, (node) => {
    node.style.lineHeight = `${rung.attack.pitch}px`;
  });
  each(el, ATTACK_NAME_SELECTOR, (node) => {
    node.style.fontSize = `${rung.attack.name + adjust.attackName * 0.5}px`;
  });
  each(el, ATKDMG_SELECTOR, (node) => {
    node.style.fontSize = `${rung.attack.dmg + adjust.attackName * 0.5}px`;
  });
  const advScale = ((rung.attack.dmg + adjust.attackName * 0.5) / ADV_BASE_DMG) * ADV_TRIM;
  each(el, ADV_SELECTOR, (node) => {
    if (node.dataset.ozAdvW === undefined) {
      node.dataset.ozAdvW = String(parseFloat(node.style.width) || node.offsetWidth);
      node.dataset.ozAdvH = String(parseFloat(node.style.height) || node.offsetHeight);
    }
    const w = Number(node.dataset.ozAdvW) * advScale;
    const h = Number(node.dataset.ozAdvH) * advScale;
    node.style.width = `${Math.round(w * 2) / 2}px`;
    node.style.height = `${Math.round(h * 2) / 2}px`;
    node.style.flexShrink = '0';
  });
}

const PITCH_GRID = 0.5;

export const SNAP_PROPS = [
  ['lineHeight', 'Lh'],
  ['paddingTop', 'Pt'],
  ['paddingBottom', 'Pb'],
  ['borderTopWidth', 'Bt'],
  ['borderBottomWidth', 'Bb'],
] as const;

export type SnapProp = typeof SNAP_PROPS[number][0];

const GRID_PROPS = SNAP_PROPS.map(
  ([prop, k]) => [prop, `ozGrid${k}`, `ozGridQ${k}`] as [SnapProp, string, string],
);

type SnapSpec = readonly [string, string, string];

function snapAll<T extends HTMLElement>(
  nodes: T[],
  specs: readonly SnapSpec[],
  read: (node: T, prop: string) => number,
  round: (value: number) => number,
): void {
  const style = (node: T) => node.style as unknown as Record<string, string>;
  for (const node of nodes) {
    for (const [prop, baseKey, writtenKey] of specs) {
      const written = node.dataset[writtenKey];
      if (written === undefined || style(node)[prop] !== written) {
        node.dataset[baseKey] = style(node)[prop];
      }
      style(node)[prop] = node.dataset[baseKey] ?? '';
    }
  }
  const values = nodes.map((node) => specs.map(([prop]) => read(node, prop)));
  nodes.forEach((node, i) => {
    specs.forEach(([prop, , writtenKey], j) => {
      const value = values[i][j];
      if (!(value > 0) || isNaN(value)) return;
      const snapped = round(value);
      if (!(snapped > 0)) return;
      const px = `${snapped}px`;
      style(node)[prop] = px;
      node.dataset[writtenKey] = px;
    });
  });
}

const computed = (node: HTMLElement, prop: string) =>
  parseFloat((getComputedStyle(node) as unknown as Record<string, string>)[prop]);

export function snapPitchGrid(el: HTMLElement): void {
  snapAll(
    Array.from(el.querySelectorAll('[data-zone-id],[data-oz-pill]')) as HTMLElement[],
    GRID_PROPS,
    computed,
    (v) => Math.round(v / PITCH_GRID) * PITCH_GRID,
  );
}

export function snapChildHeights(el: HTMLElement, scale: number): void {
  if (!(scale > 0)) return;
  snapAll(
    Array.from(el.children) as HTMLElement[],
    [['height', 'ozGridH', 'ozGridQH']],
    (node) => node.getBoundingClientRect().height / scale,
    Math.ceil,
  );
}

interface PillPaintEntry { target?: number; baselineOffset: number }
const PILL_PAINT: Record<string, PillPaintEntry> = {
  '6.30': { target: 0.53, baselineOffset: 0.47 },
  '5.95': { baselineOffset: -0.031 },
  '5.60': { target: 0.81, baselineOffset: 0.484 },
  '5.25': { target: 0.70, baselineOffset: 0.468 },
  '4.90': { target: 0.83, baselineOffset: 0.47 },
  '4.55': { baselineOffset: -0.016 },
};

let pillMeasureCtx: CanvasRenderingContext2D | null = null;

interface PillPass {
  pill: HTMLElement;
  item: HTMLElement;
  marker: HTMLElement;
  fs: number;
  inkOff: number;
  markerAbs: number;
  pillRect: DOMRect;
}

export function centerPillText(el: HTMLElement, scale: number): void {
  if (!(scale > 0)) return;
  pillMeasureCtx ??= document.createElement('canvas').getContext('2d');
  const ctx = pillMeasureCtx;
  if (!ctx) return;
  const root = (el.closest('[data-oz-card-root]') as HTMLElement | null) ?? el;

  const passes: PillPass[] = [];
  for (const pill of Array.from(el.querySelectorAll('[data-oz-pill]')) as HTMLElement[]) {
    const item = pill.firstElementChild as HTMLElement | null;
    if (!item) continue;
    const fill = (item.lastElementChild as HTMLElement | null) ?? item;
    const cs = getComputedStyle(pill);
    const fs = parseFloat(cs.fontSize);
    const lhOld = parseFloat(cs.lineHeight);
    let pt = parseFloat(cs.paddingTop) || 0;
    let pb = parseFloat(cs.paddingBottom) || 0;
    if (!(fs > 0) || !(lhOld > 0)) continue;

    ctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const m = ctx.measureText((pill.textContent || 'X').toUpperCase());
    let ascF = Math.round(m.fontBoundingBoxAscent);
    let descF = Math.round(m.fontBoundingBoxDescent);
    if (!Number.isFinite(ascF) || !Number.isFinite(descF) || !(ascF > 0)) {
      ascF = Math.round(fs * 0.95);
      descF = Math.round(fs * 0.25);
    }

    const lh = ascF + descF - 2;
    const dLh = lh - lhOld;
    if (dLh > 0) {
      const fromPt = Math.min(pt, dLh);
      pt -= fromPt;
      pb = Math.max(0, pb - (dLh - fromPt));
    } else if (dLh < 0) {
      pt -= dLh;
    }
    pill.style.lineHeight = `${lh}px`;
    pill.style.paddingTop = `${pt}px`;
    pill.style.paddingBottom = `${pb}px`;
    pill.dataset.ozGridQLh = pill.style.lineHeight;
    pill.dataset.ozGridQPt = pill.style.paddingTop;
    pill.dataset.ozGridQPb = pill.style.paddingBottom;
    pill.style.position = '';
    pill.style.top = '';
    item.style.transform = '';

    const marker = document.createElement('span');
    marker.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;border:0';
    fill.appendChild(marker);
    const inkOff = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    passes.push({ pill, item, marker, fs, inkOff: Number.isFinite(inkOff) ? inkOff : (0.667 * fs) / 2, markerAbs: 0, pillRect: new DOMRect() });
  }
  if (!passes.length) return;

  const rootTop = root.getBoundingClientRect().top;
  for (const p of passes) {
    p.pillRect = p.pill.getBoundingClientRect();
    p.markerAbs = (p.marker.getBoundingClientRect().top - rootTop) / scale;
  }

  for (const p of passes) {
    p.marker.remove();
    if (!(p.pillRect.height > 0)) continue;
    const entry = PILL_PAINT[p.fs.toFixed(2)];
    if (entry?.target !== undefined) {
      let d = entry.target - (p.markerAbs - Math.floor(p.markerAbs));
      d -= Math.round(d);
      if (Math.abs(d) > 0.01) {
        p.pill.style.position = 'relative';
        p.pill.style.top = `${d.toFixed(3)}px`;
      }
    }
    const paintedInkCenter = p.markerAbs + (entry?.baselineOffset ?? 0) - p.inkOff;
    const pillCenter = (p.pillRect.top - rootTop + p.pillRect.height / 2) / scale;
    const shift = pillCenter - paintedInkCenter;
    p.item.style.transform = Math.abs(shift) > 0.01 ? `translateY(${shift.toFixed(3)}px)` : '';
  }
}

export function snapInlineImages(el: HTMLElement): void {
  snapAll(
    Array.from(el.querySelectorAll('img')) as HTMLImageElement[],
    [['height', 'ozImgBase', 'ozImgQ']],
    computed,
    (v) => Math.max(1, Math.round(v)),
  );
}
