import { forwardRef } from 'react';
import type { LayoutType } from '@/types/layout';
import type { CardData } from '@/types/card';
import { LAYOUTS } from '@/data/layouts';
import { useCardStore } from '@/lib/store';
import { ZoneRenderer } from './ZoneRenderer';

interface CardRendererProps {
  layoutType: LayoutType;
  cardData: CardData;
  scale?: number;
  borderlessOverride?: boolean;
}

/**
 * Renders an OpenZoo card from layout data and card data.
 *
 * The card is rendered at its native 238x333px size and scaled
 * via CSS transform for display. The ref can be used for PNG export.
 */
export const CardRenderer = forwardRef<HTMLDivElement, CardRendererProps>(
  ({ layoutType, cardData, scale = 2, borderlessOverride }, ref) => {
    const storeBorderless = useCardStore((s) => s.borderless);
    const borderless = borderlessOverride !== undefined ? borderlessOverride : storeBorderless;
    const layout = LAYOUTS[layoutType];
    if (!layout) return <div>Unknown layout: {layoutType}</div>;

    return (
      <div
        style={{
          width: `${238 * scale}px`,
          height: `${333 * scale}px`,
          flexShrink: 0,
          borderRadius: borderless ? '0' : `${10 * scale}px`,
          boxShadow: borderless ? undefined : '0 0 0 1px rgb(55, 65, 81)',
        }}
      >
        <div
          ref={ref}
          className={borderless ? 'card-borderless' : undefined}
          style={{
            width: '238px',
            height: '333px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: borderless ? '0' : '10px',
          }}
        >
          <ZoneRenderer zone={layout.rootZone} cardData={cardData} />
        </div>
      </div>
    );
  }
);

CardRenderer.displayName = 'CardRenderer';
