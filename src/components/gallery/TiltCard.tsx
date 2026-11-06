import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type RefObject } from 'react';
import type { HoloSettings } from '@/types/card';
import type { LayoutType } from '@/types/layout';
import type { Holo3dImages } from '@/lib/holo/holo3d';
import { isHoloActive } from '@/lib/holo/holoSettings';
import { useArtAndBookmark } from '@/lib/holo/useArtAndBookmark';
import { effectRegion, effectiveHoloAreas, shimmerRegions, usesReverseLayer } from '@/lib/holo/holoAreas';
import { FOIL_REVEAL_TIMEOUT_MS, MAX_TILT } from '@/lib/holo/galleryFoilTuning';
import { HoloShimmer } from './HoloShimmer';

const FoilCanvas = lazy(() => import('./FoilCanvas'));

const REST = { rx: 0, ry: 0, gx: 50, gy: 50, go: 0 };

function tiltAt(x: number, y: number) {
  return { rx: (0.5 - y) * 2 * MAX_TILT, ry: (x - 0.5) * 2 * MAX_TILT, gx: x * 100, gy: y * 100, go: 0.3 };
}

interface TiltCardProps {
  thumbnailUrl: string;
  alt: string;
  className?: string;
  holo: HoloSettings | null;
  layoutType: LayoutType;
  borderless: boolean;
  popOutUrl: string | null;
  measureRoot: RefObject<HTMLDivElement | null>;
  measureKey: unknown;
  glare?: number;
  pointer?: { x: number; y: number } | null;
  foil3d?: Holo3dImages | null;
}

export function TiltCard({ thumbnailUrl, alt, className, holo, layoutType, borderless, popOutUrl, measureRoot, measureKey, glare: glareProp, pointer, foil3d }: TiltCardProps) {
  const holoActive = isHoloActive(holo);
  const glare = glareProp ?? (holoActive ? 0 : 1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mouseTilt, setTilt] = useState(REST);
  const [mouseHovering, setHovering] = useState(false);
  const driven = pointer !== undefined;
  const tilt = driven ? (pointer ? tiltAt(pointer.x, pointer.y) : REST) : mouseTilt;
  const hovering = driven ? pointer !== null : mouseHovering;
  const [foilState, setFoilState] = useState<{ card: string; ok: boolean } | null>(null);
  const foilOk = foil3d && foilState?.card === foil3d.card ? foilState.ok : null;
  const use3d = holoActive && !!foil3d && foilOk !== false;
  const foilCard = foil3d?.card;
  const onFoilReady = useCallback((ok: boolean) => {
    if (foilCard) setFoilState({ card: foilCard, ok });
  }, [foilCard]);
  const [revealedCard, setRevealedCard] = useState<string | null>(null);
  const waiting3d = use3d && foilOk === null && revealedCard !== foilCard;
  useEffect(() => {
    if (!waiting3d || !foilCard) return;
    const id = setTimeout(() => setRevealedCard(foilCard), FOIL_REVEAL_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [waiting3d, foilCard]);
  const shown = imgLoaded && !waiting3d;

  const shimmerAreas = useMemo(
    () => effectiveHoloAreas(holo, layoutType, borderless, !!popOutUrl),
    [holo, layoutType, borderless, popOutUrl],
  );
  const needsArt = shimmerAreas.includes('art') || shimmerAreas.includes('setIcon') || usesReverseLayer(shimmerAreas);
  const rects = useArtAndBookmark(() => measureRoot.current, needsArt, measureKey);
  const shimmerRegion = useMemo(
    () => shimmerRegions(shimmerAreas, rects.art, borderless, rects.bookmark, { effect: effectRegion(rects.effect, rects.infoBar), setIcon: rects.setIcon }),
    [shimmerAreas, rects, borderless],
  );

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (driven) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    setHovering(true);
    setTilt(tiltAt(clamp((e.clientX - rect.left) / rect.width), clamp((e.clientY - rect.top) / rect.height)));
  }

  function handlePointerLeave() {
    if (driven) return;
    setHovering(false);
    setTilt(REST);
  }

  return (
    <div
      onPointerDown={thumbnailUrl ? handlePointerMove : undefined}
      onPointerMove={thumbnailUrl ? handlePointerMove : undefined}
      onPointerLeave={thumbnailUrl ? handlePointerLeave : undefined}
      onPointerCancel={thumbnailUrl ? handlePointerLeave : undefined}
      className={className}
      style={{
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hovering ? 1.05 : 1})`,
        transformStyle: 'preserve-3d',
        transition: hovering
          ? 'transform 0.15s ease-out'
          : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        position: 'relative',
        cursor: 'default',
        touchAction: thumbnailUrl && !driven ? 'none' : undefined,
        aspectRatio: '238/333',
      }}
    >
      {/* Skeleton placeholder */}
      {!shown && (
        <div className="card-thumb-round absolute inset-0 bg-navy-800 animate-pulse" />
      )}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          onLoad={() => setImgLoaded(true)}
          className="card-thumb-round border border-navy-600"
          style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none', opacity: shown ? 1 : 0, transition: 'opacity 0.2s ease-out', boxShadow: '0 34px 66px rgba(0,0,0,.72)' }}
        />
      ) : (
        <div className="card-thumb-round absolute inset-0 flex items-center justify-center text-gray-400 bg-navy-800">
          No preview
        </div>
      )}
      {/* Glare overlay */}
      {shown && glare > 0 && (
        <div
          className="card-thumb-round"
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(farthest-corner circle at ${tilt.gx}% ${tilt.gy}%, hsla(0,0%,100%,0.8) 10%, hsla(0,0%,100%,0.65) 20%, hsla(0,0%,0%,0.5) 90%)`,
            opacity: tilt.go * glare,
            mixBlendMode: 'overlay',
            transition: hovering
              ? 'opacity 0.15s ease-out'
              : 'opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
            pointerEvents: 'none',
          }}
        />
      )}
      {use3d && foil3d && (
        <Suspense fallback={null}>
          <FoilCanvas
            images={foil3d}
            holo={holo}
            layoutType={layoutType}
            borderless={borderless}
            rx={tilt.rx}
            ry={tilt.ry}
            hovering={hovering}
            glare={glare}
            onReady={onFoilReady}
          />
        </Suspense>
      )}
      {holoActive && shown && foilOk !== true && shimmerAreas.length > 0 && (shimmerRegion === null || shimmerRegion.length > 0 || shimmerAreas.includes('popout')) && (
        <div className="card-thumb-round" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <HoloShimmer
            holo={holo}
            rects={shimmerRegion}
            popOutUrl={shimmerAreas.includes('card') ? null : popOutUrl}
            popOutFoiled={shimmerAreas.includes('popout')}
            tilt={tilt}
          />
        </div>
      )}
    </div>
  );
}
