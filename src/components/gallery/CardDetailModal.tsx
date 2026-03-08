import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SavedCard, CardSnapshot, CardTag } from '@/types/card';
import { TAG_COLORS } from '@/types/card';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { downloadDataUrl, downloadBlob, sanitizeCardNameForFilename, exportStandardPng, exportPrintReadyPng } from '@/lib/exportUtils';

export const MODAL_CONTAINER_CLASS = 'flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start mx-4 pointer-events-none max-h-[90vh] overflow-y-auto md:overflow-visible';
export const MODAL_CARD_CLASS = 'h-[60vh] md:h-[80vh]';
export const MODAL_DETAILS_CLASS = 'bg-navy-900 p-5 w-full md:w-72 space-y-4 pointer-events-auto border-gold';

interface CardDetailModalProps {
  card: SavedCard;
  onClose: () => void;
}

function savedCardToSnapshot(card: SavedCard): CardSnapshot {
  const { id, thumbnailUrl, creatorName, tags, remixedFrom, remixedFromName, createdAt, updatedAt, ...snapshot } = card;
  return snapshot;
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const navigate = useNavigate();
  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const [printReady, setPrintReady] = useState(() => localStorage.getItem('openzoo-print-ready') === '1');
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
    try {
      await new Promise((r) => setTimeout(r, 500));
      hiddenCardRef.current.classList.add('card-exporting');
      const filename = sanitizeCardNameForFilename(card.cardName);
      const isBorderless = !!card.borderless;

      if (printReady) {
        const dataUrl = await exportPrintReadyPng(hiddenCardRef.current, isBorderless, card.cardArtUrl, true);
        downloadDataUrl(dataUrl, `${filename}-print.png`);
      } else {
        const dataUrl = await exportStandardPng(hiddenCardRef.current, isBorderless);
        downloadDataUrl(dataUrl, `${filename}.png`);
      }
    } catch (err) {
      console.error('PNG export failed:', err);
    } finally {
      hiddenCardRef.current?.classList.remove('card-exporting');
      setExporting(false);
    }
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
              <div className="absolute inset-0 bg-navy-800 rounded-3xl animate-pulse" />
            )}
            {card.thumbnailUrl ? (
              <img
                src={card.thumbnailUrl}
                alt={card.cardName}
                onLoad={() => setImgLoaded(true)}
                className="border border-navy-600 rounded-3xl"
                style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none', opacity: imgLoaded ? 1 : 0 }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-navy-800 rounded-3xl">
                No preview
              </div>
            )}
            {/* Glare overlay */}
            {imgLoaded && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '24px',
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
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gold-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
          <div>
            <h2 className="text-lg font-bold text-white pr-6">{card.cardName.replace(/\\n/g, ' ')}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded bg-navy-700 text-gray-300">
                {card.cardType}
              </span>
              {card.primaryElement && (
                <span className="text-xs px-2 py-0.5 rounded bg-navy-700 text-gray-300">
                  {card.primaryElement}
                </span>
              )}
              {card.secondaryElement && (
                <span className="text-xs px-2 py-0.5 rounded bg-navy-700 text-gray-300">
                  {card.secondaryElement}
                </span>
              )}
              {card.tags.map((tag) => {
                const colors = TAG_COLORS[tag as CardTag];
                return (
                  <span key={tag} className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="text-sm text-gold-400">
            {card.creatorName ? (
              <>Created by <span className="text-white">{card.creatorName}</span> on </>
            ) : 'Created '}
            {card.createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>

          {card.remixedFrom && (
            <div className="text-xs text-gold-500">
              Remixed from {card.remixedFromName ? <span className="text-gold-400">{card.remixedFromName.replace(/\\n/g, ' ')}</span> : 'another card'}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleRemix}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors text-sm border-gold"
            >
              Remix this Card
            </button>
            <div className="flex items-center justify-end gap-2 cursor-pointer select-none">
              <span className="text-sm text-gray-300">Print Ready</span>
              <button
                type="button"
                role="switch"
                aria-checked={printReady}
                onClick={() => {
                  const next = !printReady;
                  setPrintReady(next);
                  localStorage.setItem('openzoo-print-ready', next ? '1' : '0');
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  printReady ? 'bg-green-500' : 'bg-navy-600'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    printReady ? 'translate-x-4.5' : 'translate-x-0.75'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={handleExportPng}
              disabled={exporting}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-navy-800 disabled:text-gold-500 text-white font-semibold transition-colors text-sm border-gold"
            >
              {exporting ? 'Exporting...' : (<><svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z"/><path d="M4 15a1 1 0 011 1h10a1 1 0 110 2H5a1 1 0 01-1-1v0a1 1 0 011-1z"/></svg>Export PNG</>)}
            </button>
            <button
              onClick={handleExportJson}
              className="w-full px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white transition-colors text-sm border-gold"
            >
              <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z"/><path d="M4 15a1 1 0 011 1h10a1 1 0 110 2H5a1 1 0 01-1-1v0a1 1 0 011-1z"/></svg>
              Export JSON
            </button>
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
        />
      </div>
    </div>
  );
}
