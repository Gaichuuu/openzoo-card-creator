import { useLayoutEffect, useRef, useState } from 'react';
import type { HoloSettings } from '@/types/card';
import { BLEED, CARD_H, CARD_W } from '@/lib/cardDims';
import { useFoil } from '@/lib/holo/foilImage';
import { REVERSE_RECT, intersectRects } from '@/lib/holo/holoAreas';
import type { ArtAndBookmark } from '@/lib/artRect';

interface Offset { left: number; top: number }

interface HoloLayerProps {
  holo: HoloSettings;
  zIndex?: number;
  wholeCard?: boolean;
  cornerRadius?: number;
  clipPath?: string;
  ground?: boolean;
}

export function HoloLayer({ holo, zIndex, wholeCard = false, cornerRadius, clipPath, ground = false }: HoloLayerProps) {
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
      className={['oz-holo', wholeCard && 'oz-holo-card', ground && 'oz-holo-ground'].filter(Boolean).join(' ')}
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
      }}
    />
  );
}

interface Rect { left: number; top: number; width: number; height: number }

const cw = (r: Rect) => `M${r.left} ${r.top}H${r.left + r.width}V${r.top + r.height}H${r.left}Z`;
const ccw = (r: Rect) => `M${r.left} ${r.top}V${r.top + r.height}H${r.left + r.width}V${r.top}Z`;

export function ReverseFoilLayer({ holo, includeArt, art, bookmark }: { holo: HoloSettings; includeArt: boolean } & ArtAndBookmark) {

  let path = cw(REVERSE_RECT);
  if (!includeArt && art) {
    path += ccw(art);
    const overlap = bookmark && intersectRects(bookmark, art);
    if (overlap) path += cw(overlap);
  }
  return (includeArt || art) ? <HoloLayer holo={holo} zIndex={1} clipPath={`path(nonzero, '${path}')`} ground /> : null;
}
