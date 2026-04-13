import { useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { EditorSidebar } from './EditorSidebar';
import { InfoPanel } from './InfoPanel';
import { useIsMobile } from '@/lib/useIsMobile';

type MobileTab = 'editor' | 'help' | 'preview';

export function CardEditor() {
  const cardRef = useRef<HTMLDivElement>(null);
  const layoutType = useCardStore((s) => s.layoutType);
  const cardData = useCardStore((s) => s.cardData);
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const isMobile = useIsMobile();

  const tabs: { key: MobileTab; label: string }[] = [
    { key: 'editor', label: 'Editor' },
    { key: 'help', label: 'Help' },
    { key: 'preview', label: 'Preview' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-dvh">
      {/* Mobile tab bar */}
      <div className="flex md:hidden border-b border-navy-600 bg-navy-900 shrink-0">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMobileTab(key)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mobileTab === key
                ? 'text-gold-400 border-b-2 border-gold-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Editor sidebar */}
      <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} md:flex flex-1 md:flex-none overflow-hidden`}>
        <EditorSidebar cardRef={cardRef} />
      </div>

      {/* InfoPanel */}
      <div className={`${mobileTab === 'help' ? 'flex' : 'hidden'} md:flex overflow-hidden`}>
        <InfoPanel />
      </div>

      {/* Card preview */}
      <div className={`${mobileTab === 'preview' ? 'relative' : 'absolute -left-2499.75'} md:relative md:left-0 flex flex-1 items-center justify-center bg-navy-950 overflow-auto p-4 md:p-8`}>
        <CardRenderer
          ref={cardRef}
          layoutType={layoutType}
          cardData={cardData}
          scale={isMobile ? 1.5 : 2}
        />
      </div>
    </div>
  );
}
