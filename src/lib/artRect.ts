import { CARD_W } from './cardDims';

export interface ArtRect { top: number; left: number; width: number; height: number }

export const ART_ZONE_SELECTOR = '[data-zone-key="CardArt"], [data-zone-key="Art"]';

export function measureArtRect(root: HTMLElement, scale: number): ArtRect | null {
  return measureZoneRect(root, ART_ZONE_SELECTOR, scale);
}

export function measureZoneRect(root: HTMLElement, selector: string, scale: number): ArtRect | null {
  const zone = root.querySelector(selector);
  if (!zone || getComputedStyle(zone).display === 'none') return null;
  const cardBox = root.getBoundingClientRect();
  const zoneBox = zone.getBoundingClientRect();
  const s = scale || 1;
  if (zoneBox.width === 0 || zoneBox.height === 0) return null;
  return {
    top: (zoneBox.top - cardBox.top) / s,
    left: (zoneBox.left - cardBox.left) / s,
    width: zoneBox.width / s,
    height: zoneBox.height / s,
  };
}

export function sameArtRect(a: ArtRect | null, b: ArtRect | null): boolean {
  if (!a || !b) return a === b;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

export const BOOKMARK_SELECTOR = '[data-zone-key="Banner"]';

export const EFFECT_BOX_SELECTOR = '[data-zone-key="MainTextBox"], [data-zone-key="Aura/Terra Text Box"]';
export const INFO_BAR_SELECTOR = '[data-zone-key="CryptidInfoBar"]';
export const SET_ICON_SELECTOR = '[data-zone-key="SetSymbol"]';

export interface ArtAndBookmark {
  art: ArtRect | null;
  bookmark: ArtRect | null;
  effect: ArtRect | null;
  infoBar: ArtRect | null;
  setIcon: ArtRect | null;
}

export const NO_RECTS: ArtAndBookmark = { art: null, bookmark: null, effect: null, infoBar: null, setIcon: null };

export function measureArtAndBookmark(root: HTMLElement): ArtAndBookmark {
  const scale = root.getBoundingClientRect().width / CARD_W;
  if (!scale) return NO_RECTS;
  return {
    art: measureArtRect(root, scale),
    bookmark: measureZoneRect(root, BOOKMARK_SELECTOR, scale),
    effect: measureZoneRect(root, EFFECT_BOX_SELECTOR, scale),
    infoBar: measureZoneRect(root, INFO_BAR_SELECTOR, scale),
    setIcon: measureZoneRect(root, SET_ICON_SELECTOR, scale),
  };
}

export function sameRects(a: ArtAndBookmark, b: ArtAndBookmark): boolean {
  return sameArtRect(a.art, b.art) && sameArtRect(a.bookmark, b.bookmark) && sameArtRect(a.effect, b.effect)
    && sameArtRect(a.infoBar, b.infoBar) && sameArtRect(a.setIcon, b.setIcon);
}
