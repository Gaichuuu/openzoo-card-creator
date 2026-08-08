import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCardStore } from '@/lib/store';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { EditorSidebar, type EditorSidebarHandle } from './EditorSidebar';
import { InfoPanel } from './InfoPanel';
import { SiteHeader } from '@/components/SiteHeader';
import { useIsMobile } from '@/lib/useIsMobile';
import { displayCardName } from '@/lib/exportUtils';

type MobileTab = 'editor' | 'preview' | 'help';

const TAB_ORDER: MobileTab[] = ['editor', 'preview', 'help'];
const SWIPE_MIN_X = 60;
const DRAG_LOCK_PX = 10;

export function CardEditor() {
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const layoutType = useCardStore((s) => s.layoutType);
  const cardData = useCardStore((s) => s.cardData);
  const cardName = useCardStore((s) => s.cardName);
  const cardType = useCardStore((s) => s.cardType);
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const [dragDx, setDragDx] = useState(0);
  const sidebarRef = useRef<EditorSidebarHandle>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragAxisRef = useRef<'h' | 'v' | null>(null);
  const isMobile = useIsMobile();

  const tabIndex = TAB_ORDER.indexOf(mobileTab);

  const handleClear = () => sidebarRef.current?.confirmClear();

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      stageRef.current?.requestFullscreen();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    dragAxisRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = e.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (!dragAxisRef.current) {
      if (Math.abs(dx) > DRAG_LOCK_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
        dragAxisRef.current = 'h';
      } else if (Math.abs(dy) > DRAG_LOCK_PX) {
        dragAxisRef.current = 'v';
      }
    }
    if (dragAxisRef.current !== 'h') return;
    const atEdge = (tabIndex === 0 && dx > 0) || (tabIndex === TAB_ORDER.length - 1 && dx < 0);
    setDragDx(atEdge ? dx / 3 : dx);
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    const wasHorizontal = dragAxisRef.current === 'h';
    dragAxisRef.current = null;
    if (!wasHorizontal) return;
    if (Math.abs(dragDx) >= SWIPE_MIN_X) {
      const next = tabIndex + (dragDx < 0 ? 1 : -1);
      if (next >= 0 && next < TAB_ORDER.length) {
        setMobileTab(TAB_ORDER[next]);
      }
    }
    setDragDx(0);
  };

  const tabs: { key: MobileTab; label: string }[] = [
    { key: 'editor', label: 'Editor' },
    { key: 'preview', label: 'Preview' },
    { key: 'help', label: 'Help' },
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

      {isMobile ? (
        /* Sliding tab */
        <div
          className="flex-1 min-h-0 overflow-hidden"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex h-full"
            style={{
              transform: `translateX(calc(${-tabIndex * 100}% + ${dragDx}px))`,
              transition: dragDx === 0 ? 'transform 250ms ease-out' : 'none',
            }}
          >
            <div className="w-full shrink-0 h-full flex flex-col min-h-0">
              <EditorSidebar cardRef={cardRef} ref={sidebarRef} />
            </div>
            <div className="w-full shrink-0 h-full flex items-center justify-center bg-navy-990 overflow-auto p-4">
              <CardRenderer
                ref={cardRef}
                layoutType={layoutType}
                cardData={cardData}
                scale={1.5}
              />
            </div>
            <div className="w-full shrink-0 h-full flex min-h-0 overflow-hidden">
              <InfoPanel searchable />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Editor rail */}
          <div className="flex flex-col flex-none min-h-0">
            <EditorSidebar cardRef={cardRef} ref={sidebarRef} />
          </div>

          {/* Reference panel */}
          <div className="flex overflow-hidden">
            <InfoPanel collapsible />
          </div>

          {/* Card stage */}
          <div
            ref={stageRef}
            className="relative flex flex-1 items-center justify-center bg-navy-990 overflow-auto p-7"
          >
            <CardRenderer
              ref={cardRef}
              layoutType={layoutType}
              cardData={cardData}
              scale={2}
            />
            <div className="flex absolute right-3.5 top-3.5 gap-2">
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
      )}
    </div>
  );
}
