import type { HoloArea, HoloSettings } from '@/types/card';
import type { LayoutType } from '@/types/layout';
import { CARD_H, CARD_W } from '@/lib/cardDims';

export const HOLO_AREAS: readonly { id: HoloArea; label: string }[] = [
  { id: 'art', label: 'Art box' },
  { id: 'border', label: 'Card border' },
  { id: 'effectBox', label: 'Effect box' },
  { id: 'setIcon', label: 'Set icon' },
  { id: 'ground', label: 'Everything else' },
  { id: 'popout', label: 'Pop-out layer' },
  { id: 'card', label: 'Entire card' },
];

const ORDER = HOLO_AREAS.map((a) => a.id);
const DEFAULT_AREAS: HoloArea[] = ['art'];

export const REVERSE_PARTS: readonly HoloArea[] = ['effectBox', 'setIcon', 'ground'];

const LEGACY_REVERSE = ['reverse', 'background', 'textBox'];

export function sanitizeHoloAreas(v: unknown): HoloArea[] | null {
  if (!Array.isArray(v)) return null;
  const ids = v.flatMap((id) => (LEGACY_REVERSE.includes(id) ? REVERSE_PARTS : [id]));
  const picked = ORDER.filter((id) => ids.includes(id));
  if (picked.includes('card')) return ['card'];
  if (picked.length === 0 || (picked.length === 1 && picked[0] === 'art')) return null;
  return picked;
}

export function holoAreasOf(h: HoloSettings): HoloArea[] {
  return h.areas ?? DEFAULT_AREAS;
}

export function availableHoloAreas(layoutType: LayoutType, borderless: boolean, hasPopOut = false): HoloArea[] {
  return ORDER.filter((id) => {
    if (id === 'popout' && !hasPopOut) return false;
    if (borderless && id === 'border') return false;
    if ((borderless || layoutType === 'Terra') && REVERSE_PARTS.includes(id)) return false;
    return true;
  });
}

export function visibleHoloAreas(h: HoloSettings, layoutType: LayoutType, borderless: boolean, hasPopOut = false): HoloArea[] {
  const available = availableHoloAreas(layoutType, borderless, hasPopOut);
  const shown = holoAreasOf(h).filter((id) => available.includes(id));
  return shown.length > 0 ? shown : DEFAULT_AREAS;
}

export function effectiveHoloAreas(h: HoloSettings | null | undefined, layoutType: LayoutType, borderless: boolean, hasPopOut = false): HoloArea[] {
  if (!h || h.strength <= 0) return [];
  return visibleHoloAreas(h, layoutType, borderless, hasPopOut);
}

export function toggleHoloArea(h: HoloSettings, id: HoloArea, on: boolean, layoutType: LayoutType, borderless: boolean, hasPopOut = false): HoloArea[] {
  if (id === 'card') return on ? ['card'] : DEFAULT_AREAS;
  const available = availableHoloAreas(layoutType, borderless, hasPopOut);
  const visible = visibleHoloAreas(h, layoutType, borderless, hasPopOut);
  const hidden = holoAreasOf(h).filter((a) => !available.includes(a));
  const next = on ? [...visible, id] : visible.filter((a) => a !== id);
  if (next.length === 0) return holoAreasOf(h);
  return ORDER.filter((a) => next.includes(a) || hidden.includes(a));
}

interface ZoneKeys { type: string; imageDataKey?: string; textDataKey?: string }

export function holoAreaOfZone(zone: ZoneKeys): HoloArea | null {
  if (zone.imageDataKey === 'CardArt' || zone.imageDataKey === 'Art') return 'art';
  if (zone.imageDataKey === 'CardBorder') return 'border';
  if (zone.imageDataKey === 'SetSymbol') return 'setIcon';
  return null;
}

export function usesReverseLayer(areas: readonly HoloArea[]): boolean {
  return areas.includes('ground') || areas.includes('effectBox');
}

export const REVERSE_RECT = { left: 13, top: 13, width: 212, height: 307 } as const;

export interface Rect { left: number; top: number; width: number; height: number }

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

export function effectRegion(effect: Rect | null, infoBar: Rect | null): Rect[] {
  if (!effect) return [];
  return infoBar ? subtractRect(effect, infoBar) : [{ ...effect }];
}

const cw = (r: Rect) => `M${r.left} ${r.top}H${r.left + r.width}V${r.top + r.height}H${r.left}Z`;
const ccw = (r: Rect) => `M${r.left} ${r.top}V${r.top + r.height}H${r.left + r.width}V${r.top}Z`;

const WHOLE_CARD: Rect = { left: 0, top: 0, width: CARD_W, height: CARD_H };

export interface ReverseClipInput {
  areas: readonly HoloArea[];
  includeBorder: boolean;
  art: Rect | null;
  bookmark: Rect | null;
  effect: Rect[];
}

export function reverseClipPath({ areas, includeBorder, art, bookmark, effect }: ReverseClipInput): string | null {
  if (!areas.includes('ground')) return effect.length > 0 ? effect.map(cw).join('') : null;
  let path = cw(includeBorder ? WHOLE_CARD : REVERSE_RECT);
  if (!areas.includes('art')) {
    if (!art) return null;
    path += ccw(art);
    const overlap = bookmark && intersectRects(bookmark, art);
    if (overlap) path += cw(overlap);
  }
  if (!areas.includes('effectBox')) path += effect.map(ccw).join('');
  return path;
}

export interface ShimmerExtras { effect?: Rect[]; setIcon?: Rect | null }

const minusAll = (rects: Rect[], cuts: readonly Rect[]) =>
  cuts.reduce((acc, cut) => acc.flatMap((r) => subtractRect(r, cut)), rects);

export function shimmerRegions(areas: readonly HoloArea[], art: Rect | null, borderless: boolean, bookmark: Rect | null = null, extras: ShimmerExtras = {}): Rect[] | null {
  if (areas.includes('card')) return null;
  if (borderless && areas.includes('art')) {
    return bookmark ? subtractRect({ left: 0, top: 0, width: CARD.width, height: CARD.height }, bookmark) : null;
  }
  const out: Rect[] = [];
  if (areas.includes('border')) out.push(...BORDER_STRIPS);
  const effect = extras.effect ?? [];
  if (areas.includes('ground')) {
    const ground: Rect[] = [];
    if (areas.includes('art') || !art) {
      ground.push({ ...R });
    } else {
      ground.push(...subtractRect({ ...R }, art));
      const overlap = bookmark && intersectRects(bookmark, art);
      if (overlap) ground.push(overlap);
    }
    out.push(...(areas.includes('effectBox') ? ground : minusAll(ground, effect)));
  } else {
    if (areas.includes('art') && art) out.push(...(bookmark ? subtractRect(art, bookmark) : [{ ...art }]));
    if (areas.includes('effectBox')) out.push(...effect);
  }
  if (areas.includes('setIcon') && extras.setIcon) out.push(...minusAll([{ ...extras.setIcon }], out));
  return out.filter((r) => r.width > 0 && r.height > 0);
}
