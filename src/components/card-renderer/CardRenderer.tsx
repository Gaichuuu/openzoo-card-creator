import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { LayoutType } from '@/types/layout';
import type { CardData, CardFitSettings, CustomStyle, HoloSettings } from '@/types/card';
import { effectiveHoloAreas } from '@/lib/holo/holoAreas';
import { HoloLayer, ReverseFoilLayer } from './HoloLayer';
import { LAYOUTS } from '@/data/layouts';
import { useCardStore } from '@/lib/store';
import { CARD_W, CARD_H } from '@/lib/exportUtils';
import { computeTextBoxReserve } from '@/lib/textBoxReserve';
import { usesCeilDescent } from '@/lib/fontBackend';
import { customPillVars, resolveBackgroundTexture, resolveCustomStyle } from '@/lib/customStyle';
import { useArtAndBookmark } from '@/lib/holo/useArtAndBookmark';
import { ZoneRenderer } from './ZoneRenderer';

interface CardRendererProps {
  layoutType: LayoutType;
  cardData: CardData;
  scale?: number;
  borderlessOverride?: boolean;
  artNeededOverride?: boolean;
  fitOverrides?: CardFitSettings;
  customStyleOverride?: CustomStyle | null;
  popOutOverride?: string | null;
  holoOverride?: HoloSettings | null;
}

function dumpEnabled(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('ozdump');
  } catch {
    return false;
  }
}

export const CardRenderer = forwardRef<HTMLDivElement, CardRendererProps>(
  ({ layoutType, cardData, scale = 2, borderlessOverride, artNeededOverride, fitOverrides, customStyleOverride, popOutOverride, holoOverride }, ref) => {
    const storeBorderless = useCardStore((s) => s.borderless);
    const storeArtNeeded = useCardStore((s) => s.artNeeded);
    const storeCustomStyle = useCardStore((s) => s.customStyle);
    const storePopOut = useCardStore((s) => s.popOutUrl);
    const storeHolo = useCardStore((s) => s.holo);
    const artNeeded = artNeededOverride ?? storeArtNeeded;
    const borderless = borderlessOverride ?? storeBorderless;
    const customStyle = customStyleOverride === undefined ? storeCustomStyle : customStyleOverride;
    const popOutUrl = popOutOverride === undefined ? storePopOut : popOutOverride;
    const holo = holoOverride === undefined ? storeHolo : holoOverride;
    const holoAreas = useMemo(() => effectiveHoloAreas(holo, layoutType, borderless), [holo, layoutType, borderless]);
    const reverseFoil = holoAreas.includes('reverse');
    const zoneHoloAreas = useMemo(
      () => (reverseFoil ? holoAreas.filter((a) => a !== 'art') : holoAreas),
      [holoAreas, reverseFoil],
    );
    const backgroundTexture = customStyle ? resolveBackgroundTexture(layoutType, cardData) : null;
    const custom = useMemo(
      () => resolveCustomStyle(customStyle, layoutType, borderless, backgroundTexture),
      [customStyle, layoutType, borderless, backgroundTexture],
    );
    const pillVars = useMemo(() => customPillVars(custom?.style), [custom]);
    const layout = LAYOUTS[layoutType];
    const [innerEl, setInnerEl] = useState<HTMLDivElement | null>(null);

    const innerRef = useCallback((node: HTMLDivElement | null) => {
      setInnerEl(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }, [ref]);

    const [fontsTick, setFontsTick] = useState(0);
    useEffect(() => {
      if (typeof document.fonts === 'undefined') return;
      let cancelled = false;
      document.fonts.ready.then(() => { if (!cancelled) setFontsTick((t) => t + 1); });
      return () => { cancelled = true; };
    }, []);

    useLayoutEffect(() => {
      void fontsTick;
      if (!innerEl) return;
      innerEl.classList.toggle('oz-ceil-descent', usesCeilDescent());
      if (dumpEnabled()) {
        void import('@/lib/baselineDump').then((m) => m.dumpBaselines(innerEl, scale));
      }
    });

    const { art, bookmark } = useArtAndBookmark(() => innerEl, artNeeded || reverseFoil, layoutType);
    const artRect = artNeeded ? art : null;

    if (!layout) return <div>Unknown layout: {layoutType}</div>;

    const textBoxReserve = computeTextBoxReserve(layoutType, cardData, borderless);

    return (
      <div
        style={{
          width: `${CARD_W * scale}px`,
          height: `${CARD_H * scale}px`,
          flexShrink: 0,
          borderRadius: borderless ? '0' : `${10 * scale}px`,
          boxShadow: borderless ? undefined : '0 0 0 1px rgb(55, 65, 81)',
        }}
      >
        <div
          ref={innerRef}
          data-oz-card-root=""
          className={[borderless && 'card-borderless', reverseFoil && 'oz-holo-reverse'].filter(Boolean).join(' ') || undefined}
          style={{
            width: `${CARD_W}px`,
            height: `${CARD_H}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: borderless ? '0' : '10px',
            ...pillVars,
          }}
        >
          <ZoneRenderer zone={layout.rootZone} cardData={cardData} borderless={borderless} textBoxReserve={textBoxReserve} fitOverrides={fitOverrides} custom={custom} holo={holo} holoAreas={zoneHoloAreas} />
          {holo && reverseFoil && <ReverseFoilLayer holo={holo} includeArt={holoAreas.includes('art')} art={art} bookmark={bookmark} />}
          {artNeeded && artRect && (
            <div className="art-needed-overlay" style={{
              position: 'absolute',
              top: artRect.top,
              left: artRect.left,
              width: artRect.width,
              height: artRect.height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 50,
            }}>
              <span style={{
                fontFamily: 'Arial Black, Arial, sans-serif',
                fontSize: '24px',
                fontWeight: 900,
                color: 'white',
                textShadow: '0 0 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
                textAlign: 'center',
                lineHeight: 1.3,
              }}>
                CARD<br />ART<br />NEEDED
              </span>
            </div>
          )}
          {popOutUrl && (
            <div className="oz-popout" style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url('${popOutUrl}')`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              pointerEvents: 'none',
              zIndex: 60,
            }} />
          )}
          {holo && holoAreas.includes('card') && <HoloLayer holo={holo} zIndex={61} wholeCard cornerRadius={borderless ? undefined : 10} />}
        </div>
      </div>
    );
  }
);

CardRenderer.displayName = 'CardRenderer';
