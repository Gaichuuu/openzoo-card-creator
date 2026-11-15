import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { SavedCard, CardSnapshot } from '@/types/card';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { CardBackBackdrop } from '@/components/CardBackBackdrop';
import { displayCardName, downloadBlob, sanitizeCardNameForFilename } from '@/lib/exportUtils';
import { exportCardPng, usePrintReady } from '@/lib/useCardExport';
import { useAuthUid } from '@/lib/auth';
import { deleteCard } from '@/lib/galleryService';
import { isMeaningfullyUpdated } from '@/lib/publishUtils';
import { sanitizeCustomStyle, sanitizePopOutUrl } from '@/lib/customStyle';
import { sanitizeHolo } from '@/lib/holo/holoSettings';
import { gridThumbOf } from '@/lib/gridThumb';
import { preloadItalicFonts } from '@/lib/preloadItalics';
import { flightEase, clearCardOrigin, flightTransform, isOnScreen, peekCardOrigin, setTileLifted } from '@/lib/cardFlight';
import { TiltCard } from './TiltCard';

export const MODAL_CONTAINER_CLASS = 'relative flex flex-col md:flex-row gap-4 md:gap-7 items-center mx-4 pointer-events-none max-h-[90vh] overflow-y-auto md:overflow-visible';
export const MODAL_CARD_CLASS = 'h-[60vh] md:h-[80vh]';
export const MODAL_DETAILS_CLASS = 'bg-navy-900 bg-panel-v w-full md:w-82.5 pointer-events-auto border border-gold-600 shadow-[0_26px_60px_rgba(0,0,0,.6)] flex flex-col';

interface CardDetailModalProps {
  card: SavedCard;
  onClose: () => void;
  onDeleted?: () => void;
}

function savedCardToSnapshot(card: SavedCard): CardSnapshot {
  const { id, thumbnailUrl, gridThumbUrl, creatorName, tags, remixedFrom, remixedFromName, createdAt, updatedAt, ...snapshot } = card;
  return snapshot;
}

const CLOSE_FALLBACK_MS = 1000;

export function CardDetailModal({ card, onClose, onDeleted }: CardDetailModalProps) {
  preloadItalicFonts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const safeStyle = useMemo(() => sanitizeCustomStyle(card.customStyle), [card.customStyle]);
  const holo = useMemo(() => sanitizeHolo(card.holo), [card.holo]);
  const popOutUrl = useMemo(() => sanitizePopOutUrl(card.popOutUrl), [card.popOutUrl]);
  const foil3d = useMemo(
    () => (card.holoCardUrl && card.holoAreaUrl ? { card: card.holoCardUrl, area: card.holoAreaUrl } : null),
    [card.holoCardUrl, card.holoAreaUrl],
  );
  const uid = useAuthUid();
  const isOwner = !!card.ownerUid && card.ownerUid === uid;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const [printReady, setPrintReady] = usePrintReady();

  const [origin] = useState(() => ({ id: card.id, el: peekCardOrigin(card.id) }));
  const tile = origin.id === card.id ? origin.el : null;
  const backdropRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const entranceRef = useRef<Animation[]>([]);
  const closingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useLayoutEffect(() => {
    const el = origin.el;
    clearCardOrigin();
    if (!el) return;
    setTileLifted(el, true);
    const flight = flightRef.current;
    const container = containerRef.current;
    const anims: Animation[] = [];
    if (flight && container) {
      container.style.overflow = 'visible';
      const lift = flight.animate(
        [{ transform: flightTransform(el.getBoundingClientRect(), flight.getBoundingClientRect()) }, { transform: 'none' }],
        { duration: 460, easing: flightEase() },
      );
      const unclip = () => { if (!closingRef.current) container.style.overflow = ''; };
      lift.finished.then(unclip, unclip);
      anims.push(lift);
    }
    for (const node of [backdropRef.current, panelRef.current]) {
      if (node) anims.push(...node.getAnimations());
    }
    entranceRef.current = anims;
    return () => setTileLifted(el, false);
  }, [origin]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    entranceRef.current.forEach((a) => a.cancel());
    const flight = flightRef.current;
    const container = containerRef.current;
    const tileRect = tile?.isConnected ? tile.getBoundingClientRect() : null;
    const anims: Animation[] = [];
    const hold = { fill: 'forwards' as const };
    if (flight && container && tileRect && container.scrollTop === 0 && isOnScreen(tileRect)) {
      container.style.overflow = 'visible';
      anims.push(flight.animate(
        [{ transform: 'none' }, { transform: flightTransform(tileRect, flight.getBoundingClientRect()) }],
        { duration: 300, easing: 'cubic-bezier(.5, 0, .2, 1)', ...hold },
      ));
    } else if (flight) {
      anims.push(flight.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', ...hold }));
    }
    if (backdropRef.current) anims.push(backdropRef.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in', ...hold }));
    if (panelRef.current) anims.push(panelRef.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in', ...hold }));
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(fallback);
      if (mountedRef.current) onClose();
    };
    const fallback = setTimeout(finish, CLOSE_FALLBACK_MS);
    Promise.all(anims.map((a) => a.finished)).catch(() => {}).finally(finish);
  }, [tile, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') requestClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [requestClose]);

  function handleRemix() {
    navigate(`/create?remix=${card.id}`);
  }

  function handleEdit() {
    navigate(`/create?edit=${card.id}`);
  }

  async function handleDelete() {
    if (!confirmingDelete) { setConfirmingDelete(true); return; }
    setDeleting(true);
    setDeleteError(false);
    try {
      await deleteCard(card.id);
      onDeleted?.();
    } catch {
      setDeleteError(true);
      setDeleting(false);
    }
  }

  function handleViewParent() {
    if (!card.remixedFrom) return;
    navigate({ pathname: `/gallery/${card.remixedFrom}`, search: searchParams.toString() });
  }

  async function handleExportPng() {
    if (!hiddenCardRef.current || exporting) return;
    setExporting(true);
    await new Promise((r) => setTimeout(r, 500)); // let the hidden renderer settle
    await exportCardPng(hiddenCardRef.current, {
      printReady,
      cardName: card.cardName,
      borderless: !!card.borderless,
      cardArtUrl: card.cardArtUrl,
      crossOrigin: true,
      artFraming: {
        positionX: card.cardArtPositionX ?? 0,
        positionY: card.cardArtPositionY ?? 0,
        zoom: card.cardArtZoom ?? 0,
      },
      borderGradient: safeStyle?.borderGradient ?? null,
      holo,
    });
    setExporting(false);
  }

  function handleExportJson() {
    const snapshot = savedCardToSnapshot(card);
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `${sanitizeCardNameForFilename(card.cardName)}.json`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={requestClose}
    >
      <div ref={backdropRef} className={`absolute inset-0 pointer-events-none ${tile ? 'oz-fade-in' : ''}`}>
        <CardBackBackdrop />
      </div>
      {/* Modal */}
      <div ref={containerRef} className={MODAL_CONTAINER_CLASS}>
        {/* Card */}
        <div
          ref={flightRef}
          style={{ perspective: '800px' }}
          className="shrink-0 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <TiltCard
            thumbnailUrl={card.thumbnailUrl}
            alt={card.cardName}
            className={MODAL_CARD_CLASS}
            holo={holo}
            layoutType={card.layoutType}
            borderless={!!card.borderless}
            popOutUrl={popOutUrl}
            measureRoot={hiddenCardRef}
            measureKey={card}
            foil3d={foil3d}
            placeholderUrl={tile ? gridThumbOf(card) : undefined}
          />
        </div>

        {/* Details panel */}
        <div
          ref={panelRef}
          className={`relative ${MODAL_DETAILS_CLASS} ${tile ? 'oz-panel-in [animation-delay:140ms]' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-5 pt-4.5 pb-4 border-b border-navy-600">
            <button
              onClick={requestClose}
              className="absolute top-2.5 right-3 text-gold-400 hover:text-gold-100 transition-colors text-[22px] leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <span className="block font-title text-[10px] uppercase tracking-[.18em] text-gold-500 mb-1.75 mr-6.5">
              {card.cardType}
            </span>
            <h2
              className="font-title font-normal text-[23px] leading-[1.1] m-0 mr-5"
              style={{
                backgroundImage: 'linear-gradient(180deg, #ffffff 20%, #d8d3c2 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {displayCardName(card.cardName)}
            </h2>
          </div>

          {/* Spec block */}
          <div className="px-5 py-4 flex flex-col gap-3">
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.25">
                {card.tags.map((tag) => (
                  <span key={tag} className="chip-selected text-xs px-2.25 py-0.75">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <span className="text-sm text-gray-400 leading-normal">
              {card.creatorName ? (
                <>Created by <span className="text-white font-semibold">{card.creatorName}</span> on </>
              ) : 'Created on '}
              {card.createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              {isMeaningfullyUpdated(card.createdAt, card.updatedAt) && (
                <> · updated {card.updatedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</>
              )}
            </span>
            {card.remixedFrom && (
              <span className="text-sm text-gray-400 leading-normal">
                Remixed from{' '}
                <button
                  onClick={handleViewParent}
                  className="text-gold-400 hover:text-gold-300 transition-colors"
                >
                  {card.remixedFromName ? displayCardName(card.remixedFromName) : 'another card'}
                </button>
              </span>
            )}
            {isOwner && (
              <span className="text-sm leading-normal">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`transition-colors cursor-pointer ${confirmingDelete ? 'text-red-400 font-semibold hover:text-red-300' : 'text-gray-500 hover:text-red-400'}`}
                >
                  {deleting ? 'Deleting…' : confirmingDelete ? 'Confirm permanent delete' : 'Delete this card'}
                </button>
                {confirmingDelete && !deleting && (
                  <button onClick={() => setConfirmingDelete(false)} className="ml-2 text-gray-500 hover:text-white cursor-pointer">
                    Cancel
                  </button>
                )}
                {deleteError && <span className="block text-red-400">Delete failed. Try again.</span>}
              </span>
            )}
          </div>

          {/* Primary action */}
          <div className="px-5 py-4.5">
            {isOwner && (
              <button
                onClick={handleEdit}
                className="btn-primary w-full mb-3 py-3.25 text-[13px] tracking-[.06em]"
              >
                Edit this Card
              </button>
            )}
            <button
              onClick={handleRemix}
              className="btn-gold w-full py-3.25 text-[13px] tracking-[.06em]"
            >
              Remix this Card
            </button>
          </div>

          {/* Download bar */}
          <div className="mt-auto px-5 pt-3.5 pb-4 border-t border-navy-600 bg-navy-950 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-title text-[10px] uppercase tracking-[.14em] text-gold-500">Download</span>
              <span className="inline-flex items-center gap-2">
                <span className="text-[13px] text-gray-400">Print Ready</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={printReady}
                  aria-label="Print Ready"
                  onClick={() => setPrintReady(!printReady)}
                  className={`relative inline-flex h-4.75 w-8.5 items-center rounded-full transition-colors ${
                    printReady ? 'bg-linear-to-b from-success-500 to-success-700' : 'bg-navy-600'
                  }`}
                >
                  <span
                    className={`inline-block h-3.25 w-3.25 rounded-full bg-white transition-transform ${
                      printReady ? 'translate-x-4.5' : 'translate-x-0.75'
                    }`}
                  />
                </button>
              </span>
            </div>
            <div className="flex gap-2.25">
              <button
                onClick={handleExportPng}
                disabled={exporting}
                className="btn-primary [--btn-bg:linear-gradient(180deg,#ff3a52,#a80a1c)] [--btn-drop:0px] flex-1 py-2.5 text-xs tracking-[.06em]"
              >
                {exporting ? 'Exporting...' : 'PNG'}
              </button>
              <button
                onClick={handleExportJson}
                className="btn-tertiary font-title uppercase flex-1 py-2.5 text-xs tracking-[.06em]"
              >
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <CardRenderer
          ref={hiddenCardRef}
          layoutType={card.layoutType}
          cardData={card.cardData}
          scale={1}
          borderlessOverride={!!card.borderless}
          artNeededOverride={!!card.artNeeded}
          fitOverrides={card}
          customStyleOverride={safeStyle}
          popOutOverride={popOutUrl}
          holoOverride={holo}
        />
      </div>
    </div>
  );
}
