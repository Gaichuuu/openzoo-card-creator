import type { HoloArea, HoloSettings } from '@/types/card';
import type { LayoutType } from '@/types/layout';
import { CARD_H, CARD_W } from '@/lib/cardDims';

export const HOLO_AREAS: readonly { id: HoloArea; label: string }[] = [
  { id: 'art', label: 'Art box' },
  { id: 'border', label: 'Card border' },
  { id: 'reverse', label: 'Reverse foil' },
  { id: 'card', label: 'Entire card' },
];

const ORDER = HOLO_AREAS.map((a) => a.id);
const DEFAULT_AREAS: HoloArea[] = ['art'];

const LEGACY_REVERSE = ['background', 'textBox'];

export function sanitizeHoloAreas(v: unknown): HoloArea[] | null {
  if (!Array.isArray(v)) return null;
  const ids = v.map((id) => (LEGACY_REVERSE.includes(id) ? 'reverse' : id));
  const picked = ORDER.filter((id) => ids.includes(id));
  if (picked.includes('card')) return ['card'];
  if (picked.length === 0 || (picked.length === 1 && picked[0] === 'art')) return null;
  return picked;
}

export function holoAreasOf(h: HoloSettings): HoloArea[] {
  return h.areas ?? DEFAULT_AREAS;
}

export function availableHoloAreas(layoutType: LayoutType, borderless: boolean): HoloArea[] {
  return ORDER.filter((id) => {
    if (borderless && id === 'border') return false;
    if ((borderless || layoutType === 'Terra') && id === 'reverse') return false;
    return true;
  });
}

export function visibleHoloAreas(h: HoloSettings, layoutType: LayoutType, borderless: boolean): HoloArea[] {
  const available = availableHoloAreas(layoutType, borderless);
  const shown = holoAreasOf(h).filter((id) => available.includes(id));
  return shown.length > 0 ? shown : DEFAULT_AREAS;
}

export function effectiveHoloAreas(h: HoloSettings | null | undefined, layoutType: LayoutType, borderless: boolean): HoloArea[] {
  if (!h || h.strength <= 0) return [];
  return visibleHoloAreas(h, layoutType, borderless);
}

export function toggleHoloArea(h: HoloSettings, id: HoloArea, on: boolean, layoutType: LayoutType, borderless: boolean): HoloArea[] {
  if (id === 'card') return on ? ['card'] : DEFAULT_AREAS;
  const available = availableHoloAreas(layoutType, borderless);
  const visible = visibleHoloAreas(h, layoutType, borderless);
  const hidden = holoAreasOf(h).filter((a) => !available.includes(a));
  const next = on ? [...visible, id] : visible.filter((a) => a !== id);
  if (next.length === 0) return holoAreasOf(h);
  return ORDER.filter((a) => next.includes(a) || hidden.includes(a));
}

interface ZoneKeys { type: string; imageDataKey?: string; textDataKey?: string }

export function holoAreaOfZone(zone: ZoneKeys): HoloArea | null {
  if (zone.imageDataKey === 'CardArt' || zone.imageDataKey === 'Art') return 'art';
  if (zone.imageDataKey === 'CardBorder') return 'border';
  return null;
}

export const REVERSE_RECT = { left: 13, top: 13, width: 212, height: 307 } as const;

interface Rect { left: number; top: number; width: number; height: number }

const R = REVERSE_RECT;
const CARD = { width: CARD_W, height: CARD_H };

export const BORDER_STRIPS: readonly Rect[] = [
  { left: 0, top: 0, width: CARD.width, height: R.top },
  { left: 0, top: R.top + R.height, width: CARD.width, height: CARD.height - R.top - R.height },
  { left: 0, top: R.top, width: R.left, height: R.height },
  { left: R.left + R.width, top: R.top, width: CARD.width - R.left - R.width, height: R.height },
];

export function intersectRects(a: Rect, b: Rect): Rect | null {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  return right > left && bottom > top ? { left, top, width: right - left, height: bottom - top } : null;
}

export function subtractRect(a: Rect, b: Rect): Rect[] {
  const cut = intersectRects(a, b);
  if (!cut) return [{ ...a }];
  const right = a.left + a.width;
  const bottom = a.top + a.height;
  return [
    { left: a.left, top: a.top, width: a.width, height: cut.top - a.top },
    { left: a.left, top: cut.top + cut.height, width: a.width, height: bottom - cut.top - cut.height },
    { left: a.left, top: cut.top, width: cut.left - a.left, height: cut.height },
    { left: cut.left + cut.width, top: cut.top, width: right - cut.left - cut.width, height: cut.height },
  ].filter((r) => r.width > 0 && r.height > 0);
}

export function shimmerRegions(areas: readonly HoloArea[], art: Rect | null, borderless: boolean, bookmark: Rect | null = null): Rect[] | null {
  if (areas.includes('card')) return null;
  if (borderless && areas.includes('art')) {
    return bookmark ? subtractRect({ left: 0, top: 0, width: CARD.width, height: CARD.height }, bookmark) : null;
  }
  const out: Rect[] = [];
  if (areas.includes('border')) out.push(...BORDER_STRIPS);
  if (areas.includes('reverse')) {
    if (areas.includes('art') || !art) {
      out.push({ ...R });
    } else {
      out.push(...subtractRect({ ...R }, art));
      const overlap = bookmark && intersectRects(bookmark, art);
      if (overlap) out.push(overlap);
    }
  } else if (areas.includes('art') && art) {
    out.push(...(bookmark ? subtractRect(art, bookmark) : [{ ...art }]));
  }
  return out.filter((r) => r.width > 0 && r.height > 0);
}
