import { CARD_W } from './cardDims';

export interface ArtRect { top: number; left: number; width: number; height: number }

export const ART_ZONE_SELECTOR = '[data-zone-key="CardArt"], [data-zone-key="Art"]';

export function measureArtRect(root: HTMLElement, scale: number): ArtRect | null {
  return measureZoneRect(root, ART_ZONE_SELECTOR, scale);
}

export function measureZoneRect(root: HTMLElement, selector: string, scale: number): ArtRect | null {
  const zone = root.querySelector(selector);
  if (!zone) return null;
  const cardBox = root.getBoundingClientRect();
  const zoneBox = zone.getBoundingClientRect();
  const s = scale || 1;
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

export interface ArtAndBookmark { art: ArtRect | null; bookmark: ArtRect | null }

export function measureArtAndBookmark(root: HTMLElement): ArtAndBookmark {
  const scale = root.getBoundingClientRect().width / CARD_W;
  if (!scale) return { art: null, bookmark: null };
  return { art: measureArtRect(root, scale), bookmark: measureZoneRect(root, BOOKMARK_SELECTOR, scale) };
}
