const STROKE_COLOR_DECL = /(?<![a-z-])stroke-color: [^;"]*;?/g;
const HAS_STROKE_COLOR = /(?<![a-z-])stroke-color: /;

const PILL_TAG = /<span [^>]*data-oz-pill=""[^>]*>/g;
const BOX_SHADOW_DECL = /(?<![a-z-])box-shadow: [^;"]*/;

export function isWebKitClone(svgText: string): boolean {
  return HAS_STROKE_COLOR.test(svgText);
}

export function fixWebKitClone(svgText: string): string {
  if (!isWebKitClone(svgText)) return svgText;
  return svgText
    .replace(STROKE_COLOR_DECL, '')
    .replace(PILL_TAG, (tag) => tag.replace(BOX_SHADOW_DECL, 'box-shadow: none'));
}
