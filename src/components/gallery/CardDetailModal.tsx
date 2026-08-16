import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { SavedCard, CardSnapshot, CardTag } from '@/types/card';
import { TAG_COLORS } from '@/types/card';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { displayCardName, downloadBlob, sanitizeCardNameForFilename } from '@/lib/exportUtils';
import { exportCardPng, usePrintReady } from '@/lib/useCardExport';
import { useAuthUid } from '@/lib/auth';
import { deleteCard } from '@/lib/galleryService';
import { isMeaningfullyUpdated } from '@/lib/publishUtils';

export const MODAL_CONTAINER_CLASS = 'flex flex-col md:flex-row gap-4 md:gap-7 items-center mx-4 pointer-events-none max-h-[90vh] overflow-y-auto md:overflow-visible';
export const MODAL_CARD_CLASS = 'h-[60vh] md:h-[80vh]';
export const MODAL_DETAILS_CLASS = 'bg-navy-900 w-full md:w-80 pointer-events-auto border-gold flex flex-col';

interface CardDetailModalProps {
  card: SavedCard;
  onClose: () => void;
  onDeleted?: () => void;
}

function savedCardToSnapshot(card: SavedCard): CardSnapshot {
  const { id, thumbnailUrl, creatorName, tags, remixedFrom, remixedFromName, createdAt, updatedAt, ...snapshot } = card;
  return snapshot;
}

export function CardDetailModal({ card, onClose, onDeleted }: CardDetailModalProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const uid = useAuthUid();
  const isOwner = !!card.ownerUid && card.ownerUid === uid;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const [printReady, setPrintReady] = usePrintReady();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, go: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

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

  function handleCardMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - y) * 30,
      ry: (x - 0.5) * 30,
      gx: x * 100,
      gy: y * 100,
      go: 0.3,
    });
  }

  function handleCardMouseEnter() {
    setHovering(true);
  }

  function handleCardMouseLeave() {
    setHovering(false);
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, go: 0 });
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      {/* Modal */}
      <div className={MODAL_CONTAINER_CLASS}>
        {/* Card */}
        <div
          style={{ perspective: '800px' }}
          className="shrink-0 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onMouseMove={card.thumbnailUrl ? handleCardMouseMove : undefined}
            onMouseEnter={card.thumbnailUrl ? handleCardMouseEnter : undefined}
            onMouseLeave={card.thumbnailUrl ? handleCardMouseLeave : undefined}
            className={MODAL_CARD_CLASS}
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hovering ? 1.05 : 1})`,
              transformStyle: 'preserve-3d',
              transition: hovering
                ? 'transform 0.15s ease-out'
                : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              position: 'relative',
              cursor: 'default',
              aspectRatio: '238/333',
            }}
          >
            {/* Skeleton placeholder */}
            {!imgLoaded && (
              <div className="card-thumb-round absolute inset-0 bg-navy-800 animate-pulse" />
            )}
            {card.thumbnailUrl ? (
              <img
                src={card.thumbnailUrl}
                alt={card.cardName}
                onLoad={() => setImgLoaded(true)}
                className="card-thumb-round border border-navy-600"
                style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none', opacity: imgLoaded ? 1 : 0, boxShadow: '0 34px 66px rgba(0,0,0,.72)' }}
              />
            ) : (
              <div className="card-thumb-round absolute inset-0 flex items-center justify-center text-gray-400 bg-navy-800">
                No preview
              </div>
            )}
            {/* Glare overlay */}
            {imgLoaded && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'calc(4.31% + 1px) / calc(3.08% + 1px)',
                  background: `radial-gradient(farthest-corner circle at ${tilt.gx}% ${tilt.gy}%, hsla(0,0%,100%,0.8) 10%, hsla(0,0%,100%,0.65) 20%, hsla(0,0%,0%,0.5) 90%)`,
                  opacity: tilt.go,
                  mixBlendMode: 'overlay',
                  transition: hovering
                    ? 'opacity 0.15s ease-out'
                    : 'opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </div>

        {/* Details panel */}
        <div
          className={`relative ${MODAL_DETAILS_CLASS}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-5 pt-4.5 pb-4 border-b border-navy-600">
            <button
              onClick={onClose}
              className="absolute top-2.5 right-3 text-gold-400 hover:text-white transition-colors text-xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <span className="block text-[10px] uppercase tracking-[.18em] text-gold-500 mb-1.75 mr-6.5">
              {card.cardType}
            </span>
            <h2
              className="font-title font-normal text-[22px] leading-[1.1] m-0 mr-5"
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
                {card.tags.map((tag) => {
                  const colors = TAG_COLORS[tag as CardTag];
                  return (
                    <span key={tag} className={`text-[11px] px-2 py-0.75 ${colors.bg} ${colors.text}`}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
            <span className="text-[13px] text-gray-400 leading-normal">
              {card.creatorName ? (
                <>Created by <span className="text-white font-semibold">{card.creatorName}</span> on </>
              ) : 'Created on '}
              {card.createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              {isMeaningfullyUpdated(card.createdAt, card.updatedAt) && (
                <> · updated {card.updatedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</>
              )}
            </span>
            {card.remixedFrom && (
              <span className="text-[13px] text-gray-400 leading-normal">
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
              <span className="text-[13px] leading-normal">
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
                className="w-full mb-2.5 py-3 bg-green-600 hover:bg-green-500 text-white text-[15px] font-bold transition-colors border-gold"
              >
                Edit this Card
              </button>
            )}
            <button
              onClick={handleRemix}
              className="w-full py-3 text-navy-990 text-[15px] font-bold transition-[filter] hover:brightness-110"
              style={{
                background: 'linear-gradient(180deg, var(--color-gold-300), var(--color-gold-500) 55%, var(--color-gold-600)) padding-box, linear-gradient(180deg, var(--color-gold-100), var(--color-gold-600)) border-box',
                border: '1px solid transparent',
              }}
            >
              Remix this Card
            </button>
          </div>

          {/* Download bar */}
          <div className="mt-auto px-5 pt-3.5 pb-4 border-t border-navy-600 bg-navy-950 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[.14em] text-gold-500">Download</span>
              <span className="inline-flex items-center gap-2">
                <span className="text-xs text-gray-400">Print Ready</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={printReady}
                  aria-label="Print Ready"
                  onClick={() => setPrintReady(!printReady)}
                  className={`relative inline-flex h-4.75 w-8.5 items-center rounded-full transition-colors ${
                    printReady ? 'bg-green-500' : 'bg-navy-600'
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
                className="flex-1 py-2.25 bg-green-600 hover:bg-green-500 disabled:bg-navy-800 disabled:text-gold-500 text-white font-semibold transition-colors text-[13px] border-gold"
              >
                {exporting ? 'Exporting...' : 'PNG'}
              </button>
              <button
                onClick={handleExportJson}
                className="flex-1 py-2.25 bg-navy-700 hover:bg-navy-600 text-white transition-colors text-[13px] border-gold"
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
        />
      </div>
    </div>
  );
}
