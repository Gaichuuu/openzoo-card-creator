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

export function applyRung(el: HTMLElement, rung: FitCandidate, pitchAdjust: number): void {
  each(el, MAIN_SELECTOR, (node) => {
    node.style.fontSize = `${rung.main.font}px`;
    node.style.lineHeight = `${rung.main.pitch + pitchAdjust * 0.5}px`;
  });
  each(el, EFFECT_SELECTOR, (node) => {
    node.style.fontSize = `${rung.effect.font}px`;
    node.style.lineHeight = `${rung.effect.pitch}px`;
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

const GRID_PROPS = [
  ['lineHeight', 'ozGridLh', 'ozGridQLh'],
  ['paddingTop', 'ozGridPt', 'ozGridQPt'],
  ['paddingBottom', 'ozGridPb', 'ozGridQPb'],
  ['borderTopWidth', 'ozGridBt', 'ozGridQBt'],
  ['borderBottomWidth', 'ozGridBb', 'ozGridQBb'],
] as const;

export function snapPitchGrid(el: HTMLElement): void {
  const nodes = Array.from(
    el.querySelectorAll('[data-zone-id],[data-oz-pill]'),
  ) as HTMLElement[];
  for (const node of nodes) {
    for (const [prop, baseKey, writtenKey] of GRID_PROPS) {
      const written = node.dataset[writtenKey];
      if (written === undefined || node.style[prop] !== written) {
        node.dataset[baseKey] = node.style[prop];
      }
      node.style[prop] = node.dataset[baseKey] ?? '';
    }
  }
  const resolved = nodes.map((node) => {
    const cs = getComputedStyle(node);
    return GRID_PROPS.map(([prop]) => parseFloat(cs[prop]));
  });
  nodes.forEach((node, i) => {
    GRID_PROPS.forEach(([prop, , writtenKey], j) => {
      const value = resolved[i][j];
      if (isNaN(value) || value <= 0) return;
      const snapped = Math.round(value / PITCH_GRID) * PITCH_GRID;
      if (snapped <= 0) return;
      const px = `${snapped}px`;
      node.style[prop] = px;
      node.dataset[writtenKey] = px;
    });
  });
}

export function snapChildHeights(el: HTMLElement, scale: number): void {
  if (!(scale > 0)) return;
  const kids = Array.from(el.children) as HTMLElement[];
  for (const kid of kids) {
    const written = kid.dataset.ozGridQH;
    if (written === undefined || kid.style.height !== written) {
      kid.dataset.ozGridH = kid.style.height;
    }
    kid.style.height = kid.dataset.ozGridH ?? '';
  }
  const heights = kids.map((kid) => kid.getBoundingClientRect().height / scale);
  kids.forEach((kid, i) => {
    const h = heights[i];
    if (!(h > 0)) return;
    const snapped = Math.ceil(h);
    if (Math.abs(snapped - h) < 0.001) return;
    const px = `${snapped}px`;
    kid.style.height = px;
    kid.dataset.ozGridQH = px;
  });
}

export function snapInlineImages(el: HTMLElement): void {
  const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
  for (const img of imgs) {
    const written = img.dataset.ozImgQ;
    if (written === undefined || img.style.height !== written) {
      img.dataset.ozImgBase = img.style.height;
    }
    img.style.height = img.dataset.ozImgBase ?? '';
  }
  const naturals = imgs.map((img) => parseFloat(getComputedStyle(img).height));
  imgs.forEach((img, i) => {
    const natural = naturals[i];
    if (!natural || isNaN(natural)) return;
    const snapped = `${Math.max(1, Math.round(natural))}px`;
    img.style.height = snapped;
    img.dataset.ozImgQ = snapped;
  });
}
