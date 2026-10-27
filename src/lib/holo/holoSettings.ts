import type { HoloPatternId, HoloSettings } from '@/types/card';
import { sanitizeHoloAreas } from './holoAreas';

export const HOLO_PATTERNS: readonly { id: HoloPatternId; label: string }[] = [
  { id: 'rainbow', label: 'Rainbow' },
  { id: 'sand', label: 'Sand' },
  { id: 'streaks', label: 'Shimmer' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'bubbles', label: 'Cosmos' },
  { id: 'shards', label: 'Cracked Ice' },
  { id: 'stars', label: 'Starlight' },
];

export const HOLO_STRENGTH_MIN = 0;
export const HOLO_STRENGTH_MAX = 100;
export const HOLO_STRENGTH_DEFAULT = 80;
export const HOLO_ANGLE_MIN = 0;
export const HOLO_ANGLE_MAX = 359;
export const HOLO_ANGLE_DEFAULT = 30;

const PATTERN_IDS = new Set<string>(HOLO_PATTERNS.map(p => p.id));

function clampRounded(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, Math.round(v)));
}

export function sanitizeHolo(v: unknown): HoloSettings | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.pattern !== 'string' || !PATTERN_IDS.has(o.pattern)) return null;
  const areas = sanitizeHoloAreas(o.areas);
  return {
    pattern: o.pattern as HoloPatternId,
    strength: clampRounded(o.strength, HOLO_STRENGTH_MIN, HOLO_STRENGTH_MAX, HOLO_STRENGTH_DEFAULT),
    angle: clampRounded(o.angle, HOLO_ANGLE_MIN, HOLO_ANGLE_MAX, HOLO_ANGLE_DEFAULT),
    ...(areas ? { areas } : {}),
  };
}

export function isHoloActive(h: HoloSettings | null | undefined): h is HoloSettings {
  return !!h && h.strength > 0;
}
