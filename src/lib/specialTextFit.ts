export const SPECIAL_TEXT_FONT_STEP = 0.5;
export const SPECIAL_TEXT_MIN_FONT = 5;
export const SPECIAL_TEXT_EXTRA_HEIGHT = 18;

export interface SpecialTextAdjust {
  shrink: number;
  pitch: number;
  spacing: number;
  nudge: number;
  nudgeByTop?: boolean;
}

export interface SpecialTextBase {
  top: number;
  height: number;
  font: number;
}

export function specialTextPitch(font: number, pitchAdj: number): number {
  return Math.max(4, font + 1 + pitchAdj * 0.5);
}

export function artWindowHeight(baseHeight: number, grow: number): number {
  return baseHeight - Math.max(0, grow);
}

const ART_WINDOW_KEYS = ['ArtBorder', 'CardArt'];

function fitArtWindowToText(el: HTMLElement, grow: number): void {
  const root = el.closest('[data-oz-card-root]');
  if (!root || root.classList.contains('card-borderless')) return;
  for (const key of ART_WINDOW_KEYS) {
    const zone = root.querySelector<HTMLElement>(`[data-zone-key="${key}"]`);
    if (!zone) continue;
    if (zone.dataset.ozGrowH === undefined || zone.style.height !== zone.dataset.ozGrowH) {
      zone.dataset.ozBaseH = zone.style.height;
    }
    const base = parseFloat(zone.dataset.ozBaseH ?? '');
    if (!base) continue;
    zone.style.height = `${artWindowHeight(base, grow)}px`;
    zone.dataset.ozGrowH = zone.style.height;
  }
}

export function restoreArtWindow(root: ParentNode | null): void {
  if (!root) return;
  for (const zone of root.querySelectorAll<HTMLElement>('[data-oz-grow-h]')) {
    if (zone.style.height === zone.dataset.ozGrowH) zone.style.height = zone.dataset.ozBaseH ?? '';
    delete zone.dataset.ozGrowH;
    delete zone.dataset.ozBaseH;
  }
}

export function pickSpecialTextFont(baseFont: number, shrink: number, fits: (font: number) => boolean): number {
  const steps = Math.round(shrink / 5);
  let font = baseFont + Math.max(0, -steps) * SPECIAL_TEXT_FONT_STEP;
  while (font > SPECIAL_TEXT_MIN_FONT && !fits(font)) font -= SPECIAL_TEXT_FONT_STEP;
  return Math.max(SPECIAL_TEXT_MIN_FONT, font - Math.max(0, steps) * SPECIAL_TEXT_FONT_STEP);
}

export function fitSpecialTextBox(el: HTMLElement, base: SpecialTextBase, adj: SpecialTextAdjust): void {
  const bottom = base.top + base.height;
  const maxHeight = base.height + SPECIAL_TEXT_EXTRA_HEIGHT;
  el.style.transform = '';
  el.style.top = `${base.top}px`;
  el.style.height = 'auto';
  el.style.letterSpacing = `${adj.spacing * 0.01}em`;
  const scale = el.offsetWidth ? el.getBoundingClientRect().width / el.offsetWidth : 1;

  const apply = (font: number) => {
    el.style.fontSize = `${font}px`;
    el.style.lineHeight = `${specialTextPitch(font, adj.pitch)}px`;
  };
  const measure = () => Math.ceil(el.getBoundingClientRect().height / scale - 0.01);

  const font = pickSpecialTextFont(base.font, adj.shrink, (f) => {
    apply(f);
    return measure() <= maxHeight;
  });
  apply(font);

  const height = Math.min(maxHeight, Math.max(base.height, measure()));
  el.style.height = `${height}px`;
  const nudgeByTop = adj.nudge !== 0 && !!adj.nudgeByTop;
  el.style.top = `${bottom - height + (nudgeByTop ? adj.nudge : 0)}px`;
  el.style.transform = adj.nudge !== 0 && !nudgeByTop ? `translateY(${adj.nudge}px)` : '';
  fitArtWindowToText(el, height - base.height - Math.min(0, adj.nudge));
}
