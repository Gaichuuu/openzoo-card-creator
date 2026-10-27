import { useLayoutEffect, useRef, useState } from 'react';
import { ART_ZONE_SELECTOR, measureArtAndBookmark, sameArtRect, type ArtAndBookmark } from '@/lib/artRect';

const EMPTY: ArtAndBookmark = { art: null, bookmark: null };

export function useArtAndBookmark(resolveRoot: () => HTMLElement | null, active: boolean, key?: unknown): ArtAndBookmark {
  const [rects, setRects] = useState<ArtAndBookmark>(EMPTY);
  const resolve = useRef(resolveRoot);
  useLayoutEffect(() => {
    resolve.current = resolveRoot;
  });

  useLayoutEffect(() => {
    if (!active) return;
    let raf = 0;
    let observer: ResizeObserver | null = null;
    const attach = () => {
      const root = resolve.current();
      if (!root) {
        raf = requestAnimationFrame(attach);
        return;
      }
      const measure = () => {
        const next = measureArtAndBookmark(root);
        setRects((prev) => (sameArtRect(prev.art, next.art) && sameArtRect(prev.bookmark, next.bookmark) ? prev : next));
      };
      measure();
      const zone = root.querySelector(ART_ZONE_SELECTOR);
      if (zone && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(measure);
        observer.observe(zone);
      }
    };
    attach();
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [active, key]);

  return active ? rects : EMPTY;
}
