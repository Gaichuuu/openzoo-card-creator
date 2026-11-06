import type { CSSProperties } from 'react';
import type { HoloSettings } from '@/types/card';
import type { ArtRect } from '@/lib/artRect';
import { BLEED, CARD_H, CARD_W } from '@/lib/cardDims';
import { useFoil } from '@/lib/holo/foilImage';
import { SHEEN_FLOOR, SHEEN_SWEEP, SHIMMER_GAIN, SHINE_BY_PATTERN } from '@/lib/holo/galleryFoilTuning';

interface Tilt { gx: number; gy: number; go: number }

interface HoloShimmerProps {
  holo: HoloSettings;
  rects: ArtRect[] | null;
  popOutUrl: string | null;
  popOutFoiled?: boolean;
  tilt: Tilt;
}

const rainbowImage = (angle: number) => `repeating-linear-gradient(${angle}deg, hsl(0,100%,60%) 0%, hsl(55,100%,60%) 4%, hsl(120,100%,60%) 8%, hsl(190,100%,60%) 12%, hsl(260,100%,65%) 16%, hsl(320,100%,60%) 20%, hsl(360,100%,60%) 24%)`;
const sheenImage = (angle: number) => `linear-gradient(${angle}deg, rgba(0,0,0,${SHEEN_FLOOR}) 40%, rgba(0,0,0,0.4) 44.5%, rgba(0,0,0,0.85) 48%, #000 50%, rgba(0,0,0,0.85) 52%, rgba(0,0,0,0.4) 55.5%, rgba(0,0,0,${SHEEN_FLOOR}) 60%)`;
const FULL_CARD: ArtRect = { top: 0, left: 0, width: CARD_W, height: CARD_H };

function pct(v: number): string {
  return `${Math.round(v * 10000) / 10000}%`;
}

function anchor(rect: ArtRect, x: number, y: number, imageW: number, imageH: number): { size: string; position: string } {
  const along = (offset: number, box: number, image: number) => (box === image ? 0 : (offset / (box - image)) * 100);
  return {
    size: `${pct((imageW / rect.width) * 100)} ${pct((imageH / rect.height) * 100)}`,
    position: `${pct(along(x - rect.left, rect.width, imageW))} ${pct(along(y - rect.top, rect.height, imageH))}`,
  };
}

export function HoloShimmer({ holo, rects, popOutUrl, popOutFoiled = false, tilt }: HoloShimmerProps) {
  const foil = useFoil(holo);
  if (!foil) return null;
  const list = rects ?? [FULL_CARD];
  const angle = SHINE_BY_PATTERN[holo.pattern].bandAngle;
  return (
    <>
      {list.map((rect) => (
        <ShimmerRect
          key={`${rect.left},${rect.top},${rect.width},${rect.height}`}
          rect={rect}
          maskUrl={foil.sparkleUrl}
          popOutUrl={popOutUrl}
          strength={holo.strength}
          angle={angle}
          tilt={tilt}
        />
      ))}
      {popOutFoiled && popOutUrl && (
        <ShimmerRect rect={FULL_CARD} maskUrl={foil.sparkleUrl} popOutUrl={popOutUrl} strength={holo.strength} angle={angle} tilt={tilt} insidePopOut />
      )}
    </>
  );
}

interface ShimmerRectProps {
  rect: ArtRect;
  maskUrl: string | null;
  popOutUrl: string | null;
  strength: number;
  angle: number;
  tilt: Tilt;
  insidePopOut?: boolean;
}

function ShimmerRect({ rect, maskUrl, popOutUrl, strength, angle, tilt, insidePopOut = false }: ShimmerRectProps) {
  const reflect = (g: number) => 0.5 - SHEEN_SWEEP * (g / 100 - 0.5) - 1.5;
  const sheen = anchor(rect, CARD_W * reflect(tilt.gx), CARD_H * reflect(tilt.gy), 3 * CARD_W, 3 * CARD_H);
  const layers = [{ image: sheenImage(angle), ...sheen }];
  if (maskUrl) layers.push({ image: `url('${maskUrl}')`, ...anchor(rect, -BLEED, -BLEED, CARD_W + 2 * BLEED, CARD_H + 2 * BLEED) });
  if (popOutUrl) layers.push({ image: `url('${popOutUrl}')`, ...anchor(rect, 0, 0, CARD_W, CARD_H) });
  const ops = layers.map((_, i) => {
    if (i === layers.length - 1) return 'add';
    if (popOutUrl && i === layers.length - 2) return insidePopOut ? 'intersect' : 'subtract';
    return 'intersect';
  });

  const rainbow = anchor(rect, -2 * CARD_W * tilt.gx / 100, -2 * CARD_H * tilt.gy / 100, 3 * CARD_W, 3 * CARD_H);

  const mask: CSSProperties = {
    maskImage: layers.map((l) => l.image).join(', '),
    maskSize: layers.map((l) => l.size).join(', '),
    maskPosition: layers.map((l) => l.position).join(', '),
    maskRepeat: 'no-repeat',
    maskComposite: ops.join(', '),
  };

  return (
    <div
      className="oz-holo-shimmer"
      style={{
        position: 'absolute',
        top: pct((rect.top / CARD_H) * 100),
        left: pct((rect.left / CARD_W) * 100),
        width: pct((rect.width / CARD_W) * 100),
        height: pct((rect.height / CARD_H) * 100),
        backgroundImage: rainbowImage(angle),
        backgroundSize: rainbow.size,
        backgroundPosition: rainbow.position,
        backgroundRepeat: 'no-repeat',
        mixBlendMode: 'soft-light',
        opacity: (tilt.go * SHIMMER_GAIN * strength) / 100,
        transition: tilt.go > 0 ? 'opacity 0.15s ease-out' : 'opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        pointerEvents: 'none',
        ...mask,
      }}
    />
  );
}
