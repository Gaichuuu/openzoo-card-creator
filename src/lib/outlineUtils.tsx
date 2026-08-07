import type { CSSProperties, ReactNode } from 'react';
import { StrokedText } from '@/components/card-renderer/StrokedText';

export interface ShadowStackInfo {
  radius: number;
  color: string;
}

export function wrapOutline(node: ReactNode, outline: OutlineStyle | null): ReactNode {
  return outline ? <StrokedText outline={outline}>{node}</StrokedText> : node;
}

export interface OutlineStyle {
  WebkitTextStrokeWidth: string;
  WebkitTextStrokeColor: string;
  paintOrder: 'stroke fill';
}

const SHADOW_STACK_CACHE = new Map<string, ShadowStackInfo | null>();

export function analyseShadowStack(textShadow: string | undefined): ShadowStackInfo | null {
  if (!textShadow || textShadow.length < 200) return null;
  if (SHADOW_STACK_CACHE.has(textShadow)) return SHADOW_STACK_CACHE.get(textShadow)!;
  const info = analyseShadowStackUncached(textShadow);
  SHADOW_STACK_CACHE.set(textShadow, info);
  return info;
}

function analyseShadowStackUncached(textShadow: string): ShadowStackInfo | null {
  const stops = textShadow.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
  if (stops.length < 8) return null;

  let radius = 0;
  let color: string | null = null;
  for (const stop of stops) {
    const col = (stop.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i) || [])[0];
    const nums = (stop.replace(/rgba?\([^)]*\)/i, '').match(/-?[\d.]+em/g) || []).map(parseFloat);
    if (nums.length < 2) return null;
    const r = Math.sqrt(nums[0] * nums[0] + nums[1] * nums[1]);
    radius = Math.max(radius, r);
    if (col && !color) color = col;
    if (col && color && col !== color) return null;
  }
  if (!radius || !color) return null;
  return { radius, color };
}

function colorAlpha(color: string | undefined): number | null {
  if (!color) return null;
  if (color === 'transparent') return 0;
  const m = color.match(/^rgba?\(([^)]*)\)$/i);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => s.trim());
  return parts.length === 4 ? parseFloat(parts[3]) : 1;
}

const TRANSPARENT_SHADOW_CACHE = new Map<string, boolean>();

function isFullyTransparentShadow(shadow: string): boolean {
  const cached = TRANSPARENT_SHADOW_CACHE.get(shadow);
  if (cached !== undefined) return cached;
  const stops = shadow.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);
  const result = stops.length > 0 && stops.every((stop) => {
    const col = (stop.match(/rgba?\([^)]*\)/i) || [])[0];
    return colorAlpha(col) === 0;
  });
  TRANSPARENT_SHADOW_CACHE.set(shadow, result);
  return result;
}

export function stripInvisibleOutlines(style: CSSProperties): void {
  const raw = style as Record<string, unknown>;
  const width = raw.WebkitTextStrokeWidth as string | undefined;
  const color = raw.WebkitTextStrokeColor as string | undefined;
  if (width !== undefined || color !== undefined) {
    const zeroWidth = width !== undefined && parseFloat(width) === 0;
    if (zeroWidth || colorAlpha(color) === 0) {
      delete raw.WebkitTextStrokeWidth;
      delete raw.WebkitTextStrokeColor;
    }
  }
  const shadow = raw.textShadow as string | undefined;
  if (shadow && shadow !== 'none' && isFullyTransparentShadow(shadow)) {
    delete raw.textShadow;
  }
}

export function applyStrokeOutline(style: CSSProperties): { style: CSSProperties; outline: OutlineStyle | null } {
  const info = analyseShadowStack(style.textShadow as string | undefined);
  if (!info) return { style, outline: null };
  return {
    style: { ...style, textShadow: 'none' },
    outline: {
      WebkitTextStrokeWidth: `${(info.radius * 2.2).toFixed(4)}em`,
      WebkitTextStrokeColor: info.color,
      paintOrder: 'stroke fill',
    },
  };
}
