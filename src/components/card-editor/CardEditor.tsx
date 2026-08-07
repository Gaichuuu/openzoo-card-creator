import { useDeferredValue, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCardStore } from '@/lib/store';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { EditorSidebar } from './EditorSidebar';
import { InfoPanel } from './InfoPanel';
import { SiteHeader } from '@/components/SiteHeader';
import { useIsMobile } from '@/lib/useIsMobile';
import { displayCardName } from '@/lib/exportUtils';

type MobileTab = 'editor' | 'help' | 'preview';

export function CardEditor() {
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layoutType = useCardStore((s) => s.layoutType);
  const cardData = useCardStore((s) => s.cardData);
  const cardName = useCardStore((s) => s.cardName);
  const cardType = useCardStore((s) => s.cardType);
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const [clearSignal, setClearSignal] = useState(0);
  const isMobile = useIsMobile();
  const peekLayoutType = useDeferredValue(layoutType);
  const peekCardData = useDeferredValue(cardData);

  const handleClear = () => setClearSignal((n) => n + 1);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      stageRef.current?.requestFullscreen();
    }
  };

  const tabs: { key: MobileTab; label: string }[] = [
    { key: 'editor', label: 'Editor' },
    { key: 'help', label: 'Help' },
    { key: 'preview', label: 'Preview' },
  ];

  const fullscreenIcon = (
    <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" />
    </svg>
  );

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <div className="hidden md:block shrink-0">
        <SiteHeader />
      </div>

      {/* Mobile title row */}
      <div className="flex md:hidden items-center gap-1 px-1 py-1.5 bg-navy-950 shrink-0">
        <Link to="/" className="w-11 h-11 flex items-center justify-center text-gray-400 text-2xl" aria-label="Back to home">
          ‹
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-white truncate">{displayCardName(cardName) || 'Untitled card'}</div>
          <div className="text-[11px] text-gray-500">{cardType}</div>
        </div>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 mr-1 text-xs text-gold-400 border border-navy-600 shrink-0"
        >
          Clear
        </button>
      </div>

      {/* Mobile tab bar */}
      <div className="flex md:hidden h-12 border-b border-navy-600 bg-navy-900 shrink-0">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMobileTab(key)}
            className={`flex-1 text-sm font-semibold transition-colors ${
              mobileTab === key
                ? 'text-gold-400 border-b-2 border-gold-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Editor rail */}
        <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} md:flex flex-col flex-1 md:flex-none min-h-0`}>
          {/* Peek strip */}
          {isMobile && (
            <button
              onClick={() => setMobileTab('preview')}
              className="flex items-center gap-3.5 px-4 py-2.5 bg-navy-990 border-b border-navy-700 shrink-0 text-left"
              aria-label="Open full-size preview"
            >
              <span className="shrink-0 overflow-hidden" style={{ width: '110px', height: '153px' }}>
                <CardRenderer layoutType={peekLayoutType} cardData={peekCardData} scale={0.46} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-gray-300">Live preview</span>
                <span className="block text-[11px] text-gray-500">Updates as you edit. Tap for full size.</span>
              </span>
              <span aria-hidden="true" className="w-11 h-11 flex items-center justify-center border border-navy-600 text-gray-400 shrink-0">
                {fullscreenIcon}
              </span>
            </button>
          )}
          <EditorSidebar cardRef={cardRef} clearSignal={clearSignal} />
        </div>

        {/* Reference panel */}
        {!isMobile && (
          <div className="flex overflow-hidden">
            <InfoPanel collapsible />
          </div>
        )}

        {/* Help tab */}
        {isMobile && (
          <div className={`${mobileTab === 'help' ? 'flex' : 'hidden'} overflow-hidden min-h-0`}>
            <InfoPanel searchable />
          </div>
        )}

        {/* Card stage */}
        <div
          ref={stageRef}
          className={`${mobileTab === 'preview' ? 'relative' : 'absolute -left-2499.75'} md:relative md:left-0 flex flex-1 items-center justify-center bg-navy-990 overflow-auto p-4 md:p-7`}
        >
          <CardRenderer
            ref={cardRef}
            layoutType={layoutType}
            cardData={cardData}
            scale={isMobile ? 1.5 : 2}
          />
          <div className="hidden md:flex absolute right-3.5 top-3.5 gap-2">
            <button
              onClick={toggleFullscreen}
              title="Full screen"
              className="w-8 h-8 flex items-center justify-center bg-navy-900/90 border border-navy-600 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              {fullscreenIcon}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
