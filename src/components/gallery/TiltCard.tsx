import { useMemo, useState, type RefObject } from 'react';
import type { HoloSettings } from '@/types/card';
import type { LayoutType } from '@/types/layout';
import { isHoloActive } from '@/lib/holo/holoSettings';
import { useArtAndBookmark } from '@/lib/holo/useArtAndBookmark';
import { effectiveHoloAreas, shimmerRegions } from '@/lib/holo/holoAreas';
import { HoloShimmer } from './HoloShimmer';

const REST = { rx: 0, ry: 0, gx: 50, gy: 50, go: 0 };

function tiltAt(x: number, y: number) {
  return { rx: (0.5 - y) * 30, ry: (x - 0.5) * 30, gx: x * 100, gy: y * 100, go: 0.3 };
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
}

export function TiltCard({ thumbnailUrl, alt, className, holo, layoutType, borderless, popOutUrl, measureRoot, measureKey, glare: glareProp, pointer }: TiltCardProps) {
  const holoActive = isHoloActive(holo);
  const glare = glareProp ?? (holoActive ? 0 : 1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mouseTilt, setTilt] = useState(REST);
  const [mouseHovering, setHovering] = useState(false);
  const driven = pointer !== undefined;
  const tilt = driven ? (pointer ? tiltAt(pointer.x, pointer.y) : REST) : mouseTilt;
  const hovering = driven ? pointer !== null : mouseHovering;

  const shimmerAreas = useMemo(
    () => effectiveHoloAreas(holo, layoutType, borderless),
    [holo, layoutType, borderless],
  );
  const needsArt = shimmerAreas.includes('art') || shimmerAreas.includes('reverse');
  const { art: artRect, bookmark: bookmarkRect } = useArtAndBookmark(() => measureRoot.current, needsArt, measureKey);
  const shimmerRegion = useMemo(
    () => shimmerRegions(shimmerAreas, artRect, borderless, bookmarkRect),
    [shimmerAreas, artRect, borderless, bookmarkRect],
  );

  function handleCardMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (driven) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt(tiltAt((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height));
  }

  function handleCardMouseEnter() {
    if (!driven) setHovering(true);
  }

  function handleCardMouseLeave() {
    if (driven) return;
    setHovering(false);
    setTilt(REST);
  }

  return (
    <div
      onMouseMove={thumbnailUrl ? handleCardMouseMove : undefined}
      onMouseEnter={thumbnailUrl ? handleCardMouseEnter : undefined}
      onMouseLeave={thumbnailUrl ? handleCardMouseLeave : undefined}
      className={className}
      style={{
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hovering ? 1.05 : 1})`,
        transformStyle: 'preserve-3d',
        transition: hovering
          ? 'transform 0.15s ease-out'
          : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        position: 'relative',
        cursor: 'default',
        aspectRatio: '238/333',
      }}
    >
      {/* Skeleton placeholder */}
      {!imgLoaded && (
        <div className="card-thumb-round absolute inset-0 bg-navy-800 animate-pulse" />
      )}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          onLoad={() => setImgLoaded(true)}
          className="card-thumb-round border border-navy-600"
          style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none', opacity: imgLoaded ? 1 : 0, boxShadow: '0 34px 66px rgba(0,0,0,.72)' }}
        />
      ) : (
        <div className="card-thumb-round absolute inset-0 flex items-center justify-center text-gray-400 bg-navy-800">
          No preview
        </div>
      )}
      {/* Glare overlay */}
      {imgLoaded && glare > 0 && (
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
      {holoActive && imgLoaded && shimmerAreas.length > 0 && (shimmerRegion === null || shimmerRegion.length > 0) && (
        <div className="card-thumb-round" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <HoloShimmer
            holo={holo}
            rects={shimmerRegion}
            popOutUrl={shimmerAreas.includes('card') ? null : popOutUrl}
            tilt={tilt}
          />
        </div>
      )}
    </div>
  );
}
