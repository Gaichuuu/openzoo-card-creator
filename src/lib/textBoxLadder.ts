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

const FONTS = [9, 8.5, 8, 7.5, 7, 6.5] as const;
const PITCH_MAX = 8;
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

function buildCandidates(): FitCandidate[] {
  const out: FitCandidate[] = [];
  for (const font of FONTS) {
    for (const pitch of pitchRange(font)) {
      for (const attack of ATTACK_TIERS) {
        out.push({
          main: { font, pitch },
          effect: { font: Math.max(5.5, font - 1), pitch: Math.min(9, pitch + 1) },
          attack,
        });
      }
    }
  }
  return out;
}

export const FIT_CANDIDATES: readonly FitCandidate[] = buildCandidates();

export const TIERS_PER_CELL = ATTACK_TIERS.length;

export function pickCandidate(fits: (candidate: FitCandidate, index: number) => boolean): number {
  for (let first = 0; first < FIT_CANDIDATES.length; first += TIERS_PER_CELL) {
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

export function centerPillText(el: HTMLElement, scale: number): void {
  if (!(scale > 0)) return;
  const root = (el.closest('[data-oz-card-root]') as HTMLElement | null) ?? el;
  const rootTop = root.getBoundingClientRect().top;
  for (const pill of Array.from(el.querySelectorAll('[data-oz-pill]')) as HTMLElement[]) {
    const item = pill.firstElementChild as HTMLElement | null;
    if (!item) continue;
    const fill = (item.lastElementChild as HTMLElement | null) ?? item;
    const cs = getComputedStyle(pill);
    const fs = parseFloat(cs.fontSize);
    const lhOld = parseFloat(cs.lineHeight);
    let pt = parseFloat(cs.paddingTop) || 0;
    let pb = parseFloat(cs.paddingBottom) || 0;
    const bt = parseFloat(cs.borderTopWidth) || 0;
    const bb = parseFloat(cs.borderBottomWidth) || 0;
    if (!(fs > 0) || !(lhOld > 0)) continue;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const m = ctx.measureText((pill.textContent || 'X').toUpperCase());
    const ascF = Math.round(m.fontBoundingBoxAscent);
    const descF = Math.round(m.fontBoundingBoxDescent);
    if (!(ascF > 0)) continue;

    const lh = ascF + descF - 2;
    const dLh = lh - lhOld;
    if (dLh > 0 && pt >= dLh) pt -= dLh;
    else if (dLh > 0 && pb >= dLh) pb -= dLh;
    else if (dLh < 0) pt -= dLh;
    pill.style.lineHeight = `${lh}px`;
    pill.style.paddingTop = `${pt}px`;
    pill.style.paddingBottom = `${pb}px`;
    pill.dataset.ozGridQLh = pill.style.lineHeight;
    pill.dataset.ozGridQPt = pill.style.paddingTop;
    pill.dataset.ozGridQPb = pill.style.paddingBottom;

    item.style.transform = '';
    const marker = document.createElement('span');
    marker.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;border:0';
    fill.appendChild(marker);
    const pillRect = pill.getBoundingClientRect();
    const markerAbs = (marker.getBoundingClientRect().top - rootTop) / scale;
    marker.remove();
    if (!(pillRect.height > 0)) continue;

    const entry = PILL_PAINT[fs.toFixed(2)];
    if (entry?.target !== undefined) {
      const prevTop = parseFloat(pill.style.top) || 0;
      let d = entry.target - (markerAbs - Math.floor(markerAbs));
      d -= Math.round(d);
      if (Math.abs(d) > 0.01) {
        pill.style.position = 'relative';
        pill.style.top = `${(prevTop + d).toFixed(3)}px`;
      }
    }

    const paintedInkCenter = markerAbs + (entry?.baselineOffset ?? 0)
      - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    const pillCenter = (pillRect.top - rootTop) / scale + (bt + pt + lh + pb + bb) / 2;
    const shift = pillCenter - paintedInkCenter;
    item.style.transform = Math.abs(shift) > 0.01 ? `translateY(${shift.toFixed(3)}px)` : '';
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
