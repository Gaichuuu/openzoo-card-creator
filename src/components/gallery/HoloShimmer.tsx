import type { CSSProperties } from 'react';
import type { HoloSettings } from '@/types/card';
import type { ArtRect } from '@/lib/artRect';
import { BLEED, CARD_H, CARD_W } from '@/lib/cardDims';
import { useFoil } from '@/lib/holo/foilImage';

interface Tilt { gx: number; gy: number; go: number }

interface HoloShimmerProps {
  holo: HoloSettings;
  rects: ArtRect[] | null;
  popOutUrl: string | null;
  tilt: Tilt;
}

const RAINBOW = 'repeating-linear-gradient(115deg, hsl(0,100%,60%) 0%, hsl(55,100%,60%) 4%, hsl(120,100%,60%) 8%, hsl(190,100%,60%) 12%, hsl(260,100%,65%) 16%, hsl(320,100%,60%) 20%, hsl(360,100%,60%) 24%)';
const SHIMMER_GAIN = 0.9;
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

export function HoloShimmer({ holo, rects, popOutUrl, tilt }: HoloShimmerProps) {
  const foil = useFoil(holo);
  if (!foil) return null;
  const list = rects ?? [FULL_CARD];
  return (
    <>
      {list.map((rect) => (
        <ShimmerRect
          key={`${rect.left},${rect.top},${rect.width},${rect.height}`}
          rect={rect}
          maskUrl={foil.maskUrl}
          popOutUrl={popOutUrl}
          strength={holo.strength}
          tilt={tilt}
        />
      ))}
    </>
  );
}

interface ShimmerRectProps {
  rect: ArtRect;
  maskUrl: string | null;
  popOutUrl: string | null;
  strength: number;
  tilt: Tilt;
}

function ShimmerRect({ rect, maskUrl, popOutUrl, strength, tilt }: ShimmerRectProps) {
  const images: string[] = [];
  const sizes: string[] = [];
  const positions: string[] = [];
  if (maskUrl) {
    const a = anchor(rect, -BLEED, -BLEED, CARD_W + 2 * BLEED, CARD_H + 2 * BLEED);
    images.push(`url('${maskUrl}')`);
    sizes.push(a.size);
    positions.push(a.position);
  } else if (popOutUrl) {
    images.push('linear-gradient(#000, #000)');
    sizes.push('100% 100%');
    positions.push('0% 0%');
  }
  if (popOutUrl) {
    const a = anchor(rect, 0, 0, CARD_W, CARD_H);
    images.push(`url('${popOutUrl}')`);
    sizes.push(a.size);
    positions.push(a.position);
  }

  const rainbow = anchor(rect, -2 * CARD_W * tilt.gx / 100, -2 * CARD_H * tilt.gy / 100, 3 * CARD_W, 3 * CARD_H);

  const mask: CSSProperties = images.length === 0 ? {} : {
    maskImage: images.join(', '),
    maskSize: sizes.join(', '),
    maskPosition: positions.join(', '),
    maskRepeat: 'no-repeat',
    maskComposite: images.length > 1 ? 'subtract' : undefined,
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
        backgroundImage: RAINBOW,
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
