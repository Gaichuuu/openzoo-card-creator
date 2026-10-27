import type { CSSProperties } from 'react';
import type { CardData, CustomColorKey, CustomStyle, GradientDef, TextColorKey } from '@/types/card';
import type { LayoutType, Zone } from '@/types/layout';
import { LAYOUTS, ZONE_ID_MAPS, getImageZoneId } from '@/data/layouts';
import { resolveImagePath } from '@/lib/imagePathResolver';
import { analyseShadowStack, entersBorderlessTextScope } from '@/lib/outlineUtils';
import { INLINE_CLASS_OUTLINES, PILL_VARS } from '@/data/inlineClasses';

type ZoneType = Zone['type'];

interface StyleItemBase {
  label: string;
  gradient?: true;
  alpha?: true;
  outline?: true;
}

export type StyleItem = StyleItemBase & (
  | { key: Exclude<CustomColorKey, TextColorKey>; group: 'box' }
  | { key: TextColorKey; group: 'text' }
);

export const CUSTOM_STYLE_ITEMS: readonly StyleItem[] = [
  { key: 'border', label: 'Border', group: 'box', gradient: true },
  { key: 'spellbookBar', label: 'Spellbook bar', group: 'box', alpha: true },
  { key: 'artFrame', label: 'Art frame', group: 'box', alpha: true },
  { key: 'effectBox', label: 'Effect box', group: 'box', alpha: true },
  { key: 'boostBar', label: 'Boost bar', group: 'box', alpha: true },
  { key: 'backgroundTint', label: 'Background', group: 'box', alpha: true },
  { key: 'divider', label: 'Divider line', group: 'box', alpha: true },
  { key: 'bottomBar', label: 'Bottom bar', group: 'box', alpha: true },
  { key: 'pillFill', label: 'Power pill fill', group: 'box', gradient: true, alpha: true },
  { key: 'pillBorder', label: 'Power pill border', group: 'box' },
  { key: 'cardName', label: 'Card name', group: 'text', gradient: true, outline: true },
  { key: 'typeLine', label: 'Type line', group: 'text', outline: true },
  { key: 'spellbookText', label: 'Spellbook text', group: 'text', outline: true },
  { key: 'effectText', label: 'Effect text', group: 'text', outline: true },
  { key: 'attackName', label: 'Attack name', group: 'text', outline: true },
  { key: 'boostText', label: 'Boost text', group: 'text', outline: true },
  { key: 'bottomBarText', label: 'Bottom bar text', group: 'text' },
  { key: 'credits', label: 'Copyright / Artist', group: 'text', outline: true },
  { key: 'pillText', label: 'Power pill text', group: 'text', outline: true },
];

export const STYLE_ITEM_INLINE_CLASS: Partial<Record<CustomColorKey, string>> = {
  pillFill: 'Power',
  pillBorder: 'Power',
  pillText: 'Power',
};

export const GRADIENT_FIELDS = {
  border: 'borderGradient',
  cardName: 'nameGradient',
  pillFill: 'pillGradient',
} as const satisfies Partial<Record<CustomColorKey, keyof CustomStyle>>;

export type GradientTarget = keyof typeof GRADIENT_FIELDS;

export const STYLE_ITEM_ZONES: Record<CustomColorKey, readonly string[]> = {
  border: ['CardBorder'],
  spellbookBar: ['SpellbookLimit'],
  artFrame: ['ArtBorder'],
  effectBox: ['MainTextBox', 'Aura/Terra Text Box', 'Aura/Terra Text Box 1'],
  boostBar: ['Boost 1', 'Boost 2'],
  backgroundTint: ['BackgroundColor'],
  divider: ['AttackDivider'],
  bottomBar: ['BottomBar'],
  cardName: ['CardName'],
  typeLine: ['TypesTribes'],
  spellbookText: ['SpellbookLimit'],
  effectText: ['MainTextBox', 'MainText', 'AttackEffect', 'AttackEffect 1', 'Aura/Terra Text Box', 'Aura/Terra Text Box 1'],
  attackName: ['Attack Name', 'Attack Name 1'],
  boostText: ['Boost 1', 'Boost 2'],
  bottomBarText: ['FlavorText', 'StrongAgainst'],
  credits: ['Artist', 'Copyright'],
  pillFill: [],
  pillBorder: [],
  pillText: [],
};

const HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const NUM = '\\d{1,3}(?:\\.\\d+)?';
const RGB_RE = new RegExp(`^rgb\\(\\s*${NUM}\\s*,\\s*${NUM}\\s*,\\s*${NUM}\\s*\\)$`, 'i');
const RGBA_RE = new RegExp(`^rgba\\(\\s*${NUM}\\s*,\\s*${NUM}\\s*,\\s*${NUM}\\s*,\\s*\\d*\\.?\\d+\\s*\\)$`, 'i');

export function isSafeColor(value: string): boolean {
  if (typeof value !== 'string') return false;
  return HEX_RE.test(value) || RGB_RE.test(value) || RGBA_RE.test(value);
}

const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toHex2 = (n: number) => clampByte(n).toString(16).padStart(2, '0');

interface Rgba { r: number; g: number; b: number; alpha: number }

function parseRgba(value: string): Rgba | null {
  if (!isSafeColor(value)) return null;
  let r: number, g: number, b: number, a = 1;
  if (value.startsWith('#')) {
    let h = value.slice(1);
    if (h.length <= 4) h = h.split('').map(c => c + c).join('');
    [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    if (h.length === 8) a = parseInt(h.slice(6, 8), 16) / 255;
  } else {
    const nums = value.slice(value.indexOf('(') + 1, -1).split(',').map(Number);
    [r, g, b] = nums;
    if (nums.length === 4) a = nums[3];
  }
  const alpha = Math.round(Math.max(0, Math.min(1, a)) * 100) / 100;
  return { r: clampByte(r), g: clampByte(g), b: clampByte(b), alpha };
}

export function parseColor(value: string): { hex: string; alpha: number } | null {
  const c = parseRgba(value);
  return c ? { hex: `#${toHex2(c.r)}${toHex2(c.g)}${toHex2(c.b)}`, alpha: c.alpha } : null;
}

export function gradientCss(g: GradientDef): string {
  const last = g.stops.length - 1;
  const stops = g.stops.map((c, i) => `${c} ${(i / last) * 100}%`);
  return `linear-gradient(${g.angle}deg, ${stops.join(', ')})`;
}

const COLOR_KEYS = new Set<string>(CUSTOM_STYLE_ITEMS.map(i => i.key));
export const TEXT_KEYS: readonly TextColorKey[] = CUSTOM_STYLE_ITEMS.flatMap(i => (i.group === 'text' ? [i.key] : []));

export const GRADIENT_MIN_STOPS = 2;
export const GRADIENT_MAX_STOPS = 8;
const OUTLINE_KEYS = new Set<string>(TEXT_KEYS);

function sanitizeColorMap<K extends string>(raw: unknown, allowed: Set<string>): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (allowed.has(k) && typeof v === 'string' && isSafeColor(v)) out[k as K] = v;
  }
  return out;
}

function sanitizeGradient(raw: unknown): GradientDef | null {
  if (!raw || typeof raw !== 'object') return null;
  const { angle, stops } = raw as { angle?: unknown; stops?: unknown };
  if (typeof angle !== 'number' || !Number.isFinite(angle)) return null;
  if (!Array.isArray(stops) || stops.length < GRADIENT_MIN_STOPS || stops.length > GRADIENT_MAX_STOPS) return null;
  if (!stops.every(s => typeof s === 'string' && isSafeColor(s))) return null;
  const wrapped = ((Math.round(angle) % 360) + 360) % 360;
  const opaque = (stops as string[]).map((s) => {
    const c = parseColor(s);
    return c && c.alpha < 1 ? c.hex : s;
  });
  return { angle: wrapped, stops: opaque };
}

export function sanitizeCustomStyle(raw: unknown): CustomStyle | null {
  if (!raw || typeof raw !== 'object') return null;
  const src = raw as Record<string, unknown>;
  const out: CustomStyle = { colors: sanitizeColorMap<CustomColorKey>(src.colors, COLOR_KEYS) };
  const outlines = sanitizeColorMap<TextColorKey>(src.outlines, OUTLINE_KEYS);
  if (Object.keys(outlines).length > 0) out.outlines = outlines;
  for (const field of Object.values(GRADIENT_FIELDS)) {
    const g = sanitizeGradient(src[field]);
    if (g) out[field] = g;
  }
  return hasCustomStyle(out) ? out : null;
}

const URL_UNSAFE_RE = /['"()\\\s]/;

export function sanitizePopOutUrl(v: unknown): string | null {
  if (typeof v !== 'string' || URL_UNSAFE_RE.test(v)) return null;
  if (/^data:image\/svg/i.test(v)) return null;
  return v.startsWith('data:image/') || v.startsWith('https://') ? v : null;
}

export function hasCustomStyle(cs: CustomStyle | null | undefined): boolean {
  if (!cs) return false;
  return Object.keys(cs.colors).length > 0 || Object.keys(cs.outlines ?? {}).length > 0
    || Object.values(GRADIENT_FIELDS).some(f => !!cs[f]);
}

const backgroundCoversArt = (layoutType: LayoutType) => layoutType === 'Terra';

export function availableStyleItems(layoutType: LayoutType): CustomColorKey[] {
  const map = ZONE_ID_MAPS[layoutType] as Record<string, unknown>;
  return CUSTOM_STYLE_ITEMS.map(i => i.key).filter(key => {
    if (key === 'border' || STYLE_ITEM_INLINE_CLASS[key]) return true;
    if (key === 'backgroundTint' && backgroundCoversArt(layoutType)) return false;
    return STYLE_ITEM_ZONES[key].some(z => z in map);
  });
}

const round = (n: number) => Math.round(n * 1e9) / 1e9 + 0;

export function cssGradientLine(angleDeg: number, w: number, h: number): { x0: number; y0: number; x1: number; y1: number } {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const cx = w / 2;
  const cy = h / 2;
  return {
    x0: round(cx - dx * half),
    y0: round(cy - dy * half),
    x1: round(cx + dx * half),
    y1: round(cy + dy * half),
  };
}

export interface BackgroundArea { texture: string | null }

export interface ResolvedCustomStyle {
  style: CustomStyle;
  background: BackgroundArea | null;
}

const ZONES_BY_ID = new Map<LayoutType, Map<string, Zone>>();

function zoneById(layoutType: LayoutType, id: string): Zone | undefined {
  let byId = ZONES_BY_ID.get(layoutType);
  if (!byId) {
    const map = new Map<string, Zone>();
    const walk = (z: Zone) => { map.set(String(z.id), z); z.childZones.forEach(walk); };
    walk(LAYOUTS[layoutType].rootZone);
    ZONES_BY_ID.set(layoutType, map);
    byId = map;
  }
  return byId.get(id);
}

export function resolveBackgroundTexture(layoutType: LayoutType, cardData: CardData): string | null {
  const key = getImageZoneId(layoutType, 'CardBackground');
  if (!key) return null;
  const raw = cardData[key] || zoneById(layoutType, key.slice(1))?.image;
  return raw && raw !== 'default_image' ? resolveImagePath(raw) || null : null;
}

export function resolveCustomStyle(
  cs: CustomStyle | null | undefined,
  layoutType: LayoutType,
  borderless: boolean,
  backgroundTexture: string | null = null,
): ResolvedCustomStyle | null {
  if (!cs) return null;
  if (borderless && (cs.colors.border || cs.borderGradient)) {
    cs = { ...cs, colors: { ...cs.colors } };
    delete cs.colors.border;
    delete cs.borderGradient;
  }
  if (cs.colors.backgroundTint && backgroundCoversArt(layoutType)) {
    cs = { ...cs, colors: { ...cs.colors } };
    delete cs.colors.backgroundTint;
  }
  if (!hasCustomStyle(cs)) return null;
  const textured = 'CardBackground' in (ZONE_ID_MAPS[layoutType] as Record<string, unknown>);
  return { style: cs, background: textured ? { texture: backgroundTexture } : null };
}

export const BACKGROUND_INNER_SHADOW = 'inset 0 0 1px 3px rgba(0, 0, 0, 0.14)';

export const DEFAULT_BACKGROUND_TEXTURE = '/assets/BlankBackground.png';

export function backgroundAreaStyle(color: string, texture: string | null): CSSProperties {
  if (!texture) return { backgroundImage: 'none', backgroundColor: color, opacity: 1, boxShadow: BACKGROUND_INNER_SHADOW };
  const shadow = texture === DEFAULT_BACKGROUND_TEXTURE ? {} : { boxShadow: BACKGROUND_INNER_SHADOW };
  return {
    backgroundImage: `linear-gradient(${color}, ${color}), url('${texture}')`,
    backgroundBlendMode: 'multiply',
    backgroundColor: 'transparent',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: 1,
    ...shadow,
  };
}

const SOLID_BOX_KEYS = ['artFrame', 'effectBox', 'boostBar', 'bottomBar'] as const;

export function styleItemTargets(item: CustomColorKey, zoneKey: string, zoneType: ZoneType): boolean {
  if (!STYLE_ITEM_ZONES[item].includes(zoneKey)) return false;
  if (zoneKey !== 'MainTextBox') return true;
  if (item === 'effectBox') return zoneType === 'container';
  if (item === 'effectText') return zoneType === 'text';
  return true;
}

export function customZoneStyle(
  zoneKey: string,
  zoneType: ZoneType,
  cs: CustomStyle,
  base: CSSProperties,
  background: BackgroundArea | null = null,
): CSSProperties | null {
  const out: CSSProperties = {};
  let hit = false;
  const colors = cs.colors;

  if (zoneKey === 'CardBorder') {
    const g = cs.borderGradient;
    if (g) {
      Object.assign(out, { outlineStyle: 'none', backgroundImage: gradientCss(g), backgroundColor: 'transparent' });
      hit = true;
    } else if (colors.border) {
      Object.assign(out, { outlineColor: colors.border, backgroundColor: colors.border, backgroundImage: 'none' });
      hit = true;
    }
  }

  for (const key of SOLID_BOX_KEYS) {
    const c = colors[key];
    if (!c || !styleItemTargets(key, zoneKey, zoneType)) continue;
    Object.assign(out, { backgroundImage: 'none', backgroundColor: c });
    hit = true;
  }

  if (colors.backgroundTint && styleItemTargets('backgroundTint', zoneKey, zoneType)) {
    Object.assign(out, background
      ? backgroundAreaStyle(colors.backgroundTint, background.texture)
      : { backgroundImage: 'none', backgroundColor: colors.backgroundTint, opacity: 1 });
    hit = true;
  }

  if (colors.spellbookBar && styleItemTargets('spellbookBar', zoneKey, zoneType)) {
    Object.assign(out, { backgroundImage: 'none', backgroundColor: colors.spellbookBar, width: 'fit-content', paddingRight: '3px' });
    hit = true;
  }

  const bg = base.backgroundImage;
  if (colors.divider && styleItemTargets('divider', zoneKey, zoneType) && bg && bg !== 'none' && base.display !== 'none') {
    const c = colors.divider;
    out.backgroundImage = `linear-gradient(90deg, transparent 0%, ${c} 45%, ${c} 60%, transparent 100%)`;
    hit = true;
  }

  for (const key of TEXT_KEYS) {
    if (key === 'cardName' && cs.nameGradient) continue;
    const c = colors[key];
    if (!c || !styleItemTargets(key, zoneKey, zoneType)) continue;
    out.color = c;
    hit = true;
  }

  return hit ? out : null;
}

function luminance(color: string): number {
  const c = parseRgba(color);
  return c ? (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255 : 0;
}

const contrastFor = (lum: number): '#000000' | '#ffffff' => (lum > 0.5 ? '#000000' : '#ffffff');

const OUTLINE_ITEMS_CACHE = new Map<string, ReadonlySet<TextColorKey>>();

export function outlineItems(layoutType: LayoutType, borderless: boolean): ReadonlySet<TextColorKey> {
  const cacheKey = `${layoutType}|${borderless}`;
  const cached = OUTLINE_ITEMS_CACHE.get(cacheKey);
  if (cached) return cached;
  const found = new Set<TextColorKey>();
  const walk = (z: Zone, scoped: boolean) => {
    const inScope = scoped || (borderless && entersBorderlessTextScope(z));
    const key = z.imageDataKey || z.textDataKey;
    const stroked = !!analyseShadowStack(z.style.textShadow as string | undefined)
      || (inScope && (z.type === 'text' || !!z.textDataKey));
    if (key && stroked) {
      for (const item of TEXT_KEYS) if (styleItemTargets(item, key, z.type)) found.add(item);
    }
    z.childZones.forEach(c => walk(c, inScope));
  };
  walk(LAYOUTS[layoutType].rootZone, false);
  for (const item of TEXT_KEYS) {
    const cls = STYLE_ITEM_INLINE_CLASS[item];
    if (cls && INLINE_CLASS_OUTLINES[cls]) found.add(item);
  }
  OUTLINE_ITEMS_CACHE.set(cacheKey, found);
  return found;
}

export function contrastOutline(color: string): '#000000' | '#ffffff' {
  return contrastFor(luminance(color));
}

export function customTextOutline(zoneKey: string, zoneType: ZoneType, cs: CustomStyle): string | null {
  const item = TEXT_KEYS.find(k => styleItemTargets(k, zoneKey, zoneType));
  if (!item) return null;
  const explicit = cs.outlines?.[item];
  if (explicit) return explicit;
  if (item === 'cardName' && cs.nameGradient) {
    const stops = cs.nameGradient.stops;
    return contrastFor(stops.reduce((sum, c) => sum + luminance(c), 0) / stops.length);
  }
  const fill = cs.colors[item];
  return fill ? contrastOutline(fill) : null;
}

export function customNameFill(zoneKey: string, cs: CustomStyle): CSSProperties | null {
  if (zoneKey !== 'CardName' || !cs.nameGradient) return null;
  return {
    backgroundImage: gradientCss(cs.nameGradient),
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  };
}

export function customPillVars(cs: CustomStyle | null | undefined): Record<string, string> | null {
  if (!cs) return null;
  const out: Record<string, string> = {};
  if (cs.pillGradient) {
    out[PILL_VARS.fill] = 'transparent';
    out[PILL_VARS.fillImage] = gradientCss(cs.pillGradient);
  } else if (cs.colors.pillFill) {
    out[PILL_VARS.fill] = cs.colors.pillFill;
  }
  if (cs.colors.pillBorder) out[PILL_VARS.border] = cs.colors.pillBorder;
  const text = cs.colors.pillText;
  if (text) out[PILL_VARS.text] = text;
  const outline = cs.outlines?.pillText ?? (text ? contrastOutline(text) : null);
  if (outline) out[PILL_VARS.outline] = outline;
  return Object.keys(out).length > 0 ? out : null;
}
