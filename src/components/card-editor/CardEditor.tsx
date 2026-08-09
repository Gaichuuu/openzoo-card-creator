import { useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { EditorSidebar } from './EditorSidebar';
import { InfoPanel } from './InfoPanel';
import { SiteHeader } from '@/components/SiteHeader';
import { useIsMobile } from '@/lib/useIsMobile';

type MobileTab = 'editor' | 'preview' | 'help';

const TAB_ORDER: MobileTab[] = ['editor', 'preview', 'help'];
const SWIPE_MIN_X = 60;
const DRAG_LOCK_PX = 10;
const TRACK_TRANSITION = 'transform 250ms ease-out';

const baseTransform = (index: number) => `translateX(${-index * 100}%)`;

export function CardEditor() {
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const layoutType = useCardStore((s) => s.layoutType);
  const cardData = useCardStore((s) => s.cardData);
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragAxisRef = useRef<'h' | 'v' | null>(null);
  const dragDxRef = useRef(0);
  const isMobile = useIsMobile();

  const tabIndex = TAB_ORDER.indexOf(mobileTab);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      stageRef.current?.requestFullscreen();
    }
  };

  const setTrackDrag = (dx: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = 'none';
    track.style.transform = `translateX(calc(${-tabIndex * 100}% + ${dx}px))`;
  };

  const settleTrack = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transition = TRACK_TRANSITION;
    track.style.transform = baseTransform(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    dragAxisRef.current = null;
    dragDxRef.current = 0;
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
    const d = atEdge ? dx / 3 : dx;
    dragDxRef.current = d;
    setTrackDrag(d);
  };

  const finishDrag = (commit: boolean) => {
    touchStartRef.current = null;
    const wasHorizontal = dragAxisRef.current === 'h';
    dragAxisRef.current = null;
    const dx = dragDxRef.current;
    dragDxRef.current = 0;
    let nextIndex = tabIndex;
    if (wasHorizontal && commit && Math.abs(dx) >= SWIPE_MIN_X) {
      const next = tabIndex + (dx < 0 ? 1 : -1);
      if (next >= 0 && next < TAB_ORDER.length) nextIndex = next;
    }
    settleTrack(nextIndex);
    if (nextIndex !== tabIndex) setMobileTab(TAB_ORDER[nextIndex]);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length > 0) return;
    finishDrag(true);
  };

  const handleTouchCancel = () => finishDrag(false);

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
      <div className="shrink-0">
        <SiteHeader />
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

      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={isMobile ? { touchAction: 'pan-y' } : undefined}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        onTouchCancel={isMobile ? handleTouchCancel : undefined}
      >
        <div
          ref={trackRef}
          className="flex h-full"
          style={isMobile ? { transform: baseTransform(tabIndex), transition: TRACK_TRANSITION } : undefined}
        >
          {/* Editor rail */}
          <div className={isMobile ? 'w-full shrink-0 h-full flex flex-col min-h-0' : 'flex flex-col flex-none min-h-0'}>
            <EditorSidebar cardRef={cardRef} />
          </div>

          {/* Reference panel */}
          {!isMobile && (
            <div className="flex overflow-hidden">
              <InfoPanel collapsible />
            </div>
          )}

          {/* Card stage */}
          <div
            ref={stageRef}
            className={isMobile
              ? 'w-full shrink-0 h-full flex items-center justify-center bg-navy-990 overflow-auto px-2 py-4'
              : 'relative flex flex-1 items-center justify-center bg-navy-990 overflow-auto p-7'}
          >
            <CardRenderer
              ref={cardRef}
              layoutType={layoutType}
              cardData={cardData}
              scale={isMobile ? 1.5 : 2}
            />
            {!isMobile && (
              <div className="flex absolute right-3.5 top-3.5 gap-2">
                <button
                  onClick={toggleFullscreen}
                  title="Full screen"
                  className="w-8 h-8 flex items-center justify-center bg-navy-900/90 border border-navy-600 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {fullscreenIcon}
                </button>
              </div>
            )}
          </div>

          {/* Help tab*/}
          {isMobile && (
            <div className="w-full shrink-0 h-full flex min-h-0 overflow-hidden">
              <InfoPanel searchable />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
