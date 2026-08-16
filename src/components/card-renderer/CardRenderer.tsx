import { forwardRef, useCallback, useLayoutEffect, useState } from 'react';
import type { LayoutType } from '@/types/layout';
import type { CardData, CardFitSettings } from '@/types/card';
import { LAYOUTS } from '@/data/layouts';
import { useCardStore } from '@/lib/store';
import { CARD_W, CARD_H } from '@/lib/exportUtils';
import { computeTextBoxReserve } from '@/lib/textBoxReserve';
import { ZoneRenderer } from './ZoneRenderer';

interface CardRendererProps {
  layoutType: LayoutType;
  cardData: CardData;
  scale?: number;
  borderlessOverride?: boolean;
  artNeededOverride?: boolean;
  fitOverrides?: CardFitSettings;
}

interface ArtRect { top: number; left: number; width: number; height: number }

export const CardRenderer = forwardRef<HTMLDivElement, CardRendererProps>(
  ({ layoutType, cardData, scale = 2, borderlessOverride, artNeededOverride, fitOverrides }, ref) => {
    const storeBorderless = useCardStore((s) => s.borderless);
    const storeArtNeeded = useCardStore((s) => s.artNeeded);
    const artNeeded = artNeededOverride ?? storeArtNeeded;
    const borderless = borderlessOverride ?? storeBorderless;
    const layout = LAYOUTS[layoutType];
    const [artRect, setArtRect] = useState<ArtRect | null>(null);
    const [innerEl, setInnerEl] = useState<HTMLDivElement | null>(null);

    const innerRef = useCallback((node: HTMLDivElement | null) => {
      setInnerEl(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }, [ref]);

    useLayoutEffect(() => {
      if (!innerEl || !artNeeded) { setArtRect(null); return; }
      const zone = innerEl.querySelector('[data-zone-key="CardArt"], [data-zone-key="Art"]') as HTMLElement | null;
      if (!zone) { setArtRect(null); return; }
      const cardBox = innerEl.getBoundingClientRect();
      const zoneBox = zone.getBoundingClientRect();
      const s = scale || 1;
      setArtRect({
        top: (zoneBox.top - cardBox.top) / s,
        left: (zoneBox.left - cardBox.left) / s,
        width: zoneBox.width / s,
        height: zoneBox.height / s,
      });
    }, [innerEl, artNeeded, layoutType, scale]);

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
          className={borderless ? 'card-borderless' : undefined}
          style={{
            width: `${CARD_W}px`,
            height: `${CARD_H}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: borderless ? '0' : '10px',
          }}
        >
          <ZoneRenderer zone={layout.rootZone} cardData={cardData} borderless={borderless} textBoxReserve={textBoxReserve} fitOverrides={fitOverrides} />
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
        </div>
      </div>
    );
  }
);

CardRenderer.displayName = 'CardRenderer';
