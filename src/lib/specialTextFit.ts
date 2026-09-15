export const SPECIAL_TEXT_FONT_STEP = 0.5;
export const SPECIAL_TEXT_MIN_FONT = 5;
export const SPECIAL_TEXT_EXTRA_HEIGHT = 18;

export interface SpecialTextAdjust {
  shrink: number;
  pitch: number;
  spacing: number;
  nudge: number;
}

export interface SpecialTextBase {
  top: number;
  height: number;
  font: number;
}

export function specialTextPitch(font: number, pitchAdj: number): number {
  return Math.max(4, font + 1 + pitchAdj * 0.5);
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

  const height = Math.max(base.height, measure());
  el.style.height = `${height}px`;
  el.style.top = `${bottom - height}px`;
  el.style.transform = adj.nudge !== 0 ? `translateY(${adj.nudge}px)` : '';
}
