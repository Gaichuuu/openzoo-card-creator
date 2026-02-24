import { useRef } from 'react';
import { useCardStore } from '@/lib/store';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { EditorSidebar } from './EditorSidebar';
import { InfoPanel } from './InfoPanel';

export function CardEditor() {
  const cardRef = useRef<HTMLDivElement>(null);
  const layoutType = useCardStore((s) => s.layoutType);
  const cardData = useCardStore((s) => s.cardData);

  return (
    <div className="flex h-screen">
      <EditorSidebar cardRef={cardRef} />
      <InfoPanel />

      <div className="flex-1 relative flex items-center justify-center bg-navy-950 overflow-auto p-8">
        <CardRenderer
          ref={cardRef}
          layoutType={layoutType}
          cardData={cardData}
          scale={2}
        />
      </div>
    </div>
  );
}
