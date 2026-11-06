import { useLayoutEffect, useRef, useState } from 'react';
import type { HoloArea, HoloSettings } from '@/types/card';
import { BLEED, CARD_H, CARD_W } from '@/lib/cardDims';
import { useFoil } from '@/lib/holo/foilImage';
import { reverseClipPath, type Rect } from '@/lib/holo/holoAreas';
import type { ArtAndBookmark } from '@/lib/artRect';

interface Offset { left: number; top: number }

interface HoloLayerProps {
  holo: HoloSettings;
  zIndex?: number;
  wholeCard?: boolean;
  cornerRadius?: number;
  clipPath?: string;
  ground?: boolean;
  border?: boolean;
  maskUrl?: string;
  iconMask?: string;
}

export function HoloLayer({ holo, zIndex, wholeCard = false, cornerRadius, clipPath, ground = false, border = false, maskUrl, iconMask }: HoloLayerProps) {
  const foil = useFoil(holo);
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<Offset | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const zone = el?.parentElement;
    const root = el?.closest('[data-oz-card-root]');
    if (!el || !zone || !root) return;
    const measure = () => {
      const r = root.getBoundingClientRect();
      const z = el.getBoundingClientRect();
      const k = r.width / CARD_W;
      if (!k) return;
      const left = (z.left - r.left) / k;
      const top = (z.top - r.top) / k;
      setOffset((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(zone);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={['oz-holo', wholeCard && 'oz-holo-card', ground && 'oz-holo-ground', border && 'oz-holo-border', maskUrl && 'oz-holo-popout', iconMask && 'oz-holo-seticon'].filter(Boolean).join(' ')}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: cornerRadius,
        clipPath,
        pointerEvents: 'none',
        zIndex,
        mixBlendMode: 'multiply',
        opacity: holo.strength / 100,
        backgroundImage: foil ? `url('${foil.url}')` : undefined,
        backgroundSize: `${CARD_W + 2 * BLEED}px ${CARD_H + 2 * BLEED}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: offset ? `${-(offset.left + BLEED)}px ${-(offset.top + BLEED)}px` : undefined,
        maskImage: maskUrl ? `url('${maskUrl}')` : iconMask ? `url('${iconMask}')` : undefined,
        maskSize: maskUrl ? '100% 100%' : iconMask ? 'contain' : undefined,
        maskPosition: iconMask ? 'center' : undefined,
        maskRepeat: maskUrl || iconMask ? 'no-repeat' : undefined,
      }}
    />
  );
}

interface ReverseFoilProps extends Pick<ArtAndBookmark, 'art' | 'bookmark'> {
  holo: HoloSettings;
  areas: readonly HoloArea[];
  includeBorder: boolean;
  effect: Rect[];
}

export function ReverseFoilLayer({ holo, areas, includeBorder, art, bookmark, effect }: ReverseFoilProps) {
  const path = reverseClipPath({ areas, includeBorder, art, bookmark, effect });
  return path
    ? <HoloLayer holo={holo} zIndex={1} clipPath={`path(nonzero, '${path}')`} ground border={includeBorder} cornerRadius={includeBorder ? 10 : undefined} />
    : null;
}
