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

export function applyRung(el: HTMLElement, rung: FitCandidate, pitchAdjust: number, spacingAdjust: number): void {
  const spacing = `${spacingAdjust * 0.01}em`;
  each(el, MAIN_SELECTOR, (node) => {
    node.style.fontSize = `${rung.main.font}px`;
    node.style.lineHeight = `${rung.main.pitch + pitchAdjust * 0.5}px`;
    node.style.letterSpacing = spacing;
  });
  each(el, EFFECT_SELECTOR, (node) => {
    node.style.fontSize = `${rung.effect.font}px`;
    node.style.lineHeight = `${rung.effect.pitch + pitchAdjust * 0.5}px`;
    node.style.letterSpacing = spacing;
  });
  each(el, ATTACK_SELECTOR, (node) => {
    node.style.lineHeight = `${rung.attack.pitch}px`;
  });
  each(el, ATTACK_NAME_SELECTOR, (node) => {
    node.style.fontSize = `${rung.attack.name}px`;
  });
  each(el, ATKDMG_SELECTOR, (node) => {
    node.style.fontSize = `${rung.attack.dmg}px`;
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

export function snapInlineImages(el: HTMLElement): void {
  snapAll(
    Array.from(el.querySelectorAll('img')) as HTMLImageElement[],
    [['height', 'ozImgBase', 'ozImgQ']],
    computed,
    (v) => Math.max(1, Math.round(v)),
  );
}
