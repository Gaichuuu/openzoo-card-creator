import { useLayoutEffect, useRef, useState } from 'react';
import { ART_ZONE_SELECTOR, EFFECT_BOX_SELECTOR, NO_RECTS, measureArtAndBookmark, sameRects, type ArtAndBookmark } from '@/lib/artRect';

const EMPTY = NO_RECTS;

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
    let moved: MutationObserver | null = null;
    const attach = () => {
      const root = resolve.current();
      if (!root) {
        raf = requestAnimationFrame(attach);
        return;
      }
      const measure = () => {
        const next = measureArtAndBookmark(root);
        setRects((prev) => (sameRects(prev, next) ? prev : next));
      };
      measure();
      const zones = [ART_ZONE_SELECTOR, EFFECT_BOX_SELECTOR].map((sel) => root.querySelector(sel)).filter((z) => z !== null);
      if (zones.length > 0 && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(measure);
        for (const zone of zones) observer.observe(zone);
      }
      const effect = root.querySelector(EFFECT_BOX_SELECTOR);
      if (effect && typeof MutationObserver !== 'undefined') {
        moved = new MutationObserver(measure);
        moved.observe(effect, { attributes: true, attributeFilter: ['style'] });
      }
    };
    attach();
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      moved?.disconnect();
    };
  }, [active, key]);

  return active ? rects : EMPTY;
}
