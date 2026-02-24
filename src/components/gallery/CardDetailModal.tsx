import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import type { SavedCard, CardSnapshot, CardTag } from '@/types/card';
import { TAG_COLORS } from '@/types/card';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { CARD_W, CARD_H, BLEED, downloadDataUrl } from '@/lib/exportUtils';

interface CardDetailModalProps {
  card: SavedCard;
  onClose: () => void;
}

function savedCardToSnapshot(card: SavedCard): CardSnapshot {
  return {
    cardType: card.cardType,
    layoutType: card.layoutType,
    cardData: card.cardData,
    cardName: card.cardName,
    tribe: card.tribe,
    spellbookLimit: card.spellbookLimit,
    primaryElement: card.primaryElement,
    secondaryElement: card.secondaryElement,
    traits: card.traits,
    terras: card.terras,
    strongAgainst: card.strongAgainst,
    cardArtUrl: card.cardArtUrl,
    effectBlocks: card.effectBlocks,
    locale: card.locale,
    borderless: card.borderless,
  };
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const navigate = useNavigate();
  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [printReady, setPrintReady] = useState(() => localStorage.getItem('openzoo-print-ready') === '1');

  // 3D tilt state
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, go: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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
      // Wait for images to load in the hidden renderer
      await new Promise((r) => setTimeout(r, 500));
      hiddenCardRef.current.classList.add('card-exporting');
      const filename = (card.cardName || 'openzoo-card').replace(/\\n/g, ' ');
      const isBorderless = !!card.borderless;

      if (!printReady) {
        // Regular PNG export
        const dataUrl = await toPng(hiddenCardRef.current, {
          pixelRatio: 4,
          quality: 1,
          width: CARD_W,
          height: CARD_H,
          style: { transform: 'none', borderRadius: isBorderless ? '0' : undefined },
        });
        downloadDataUrl(dataUrl, `${filename}.png`);
      } else if (isBorderless) {
        const pr = 4;
        const bPx = BLEED * pr;
        const printW = (CARD_W + 2 * BLEED) * pr;
        const printH = (CARD_H + 2 * BLEED) * pr;

        const canvas = document.createElement('canvas');
        canvas.width = printW;
        canvas.height = printH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (card.cardArtUrl) {
          const artImg = new Image();
          artImg.crossOrigin = 'anonymous';
          artImg.src = card.cardArtUrl;
          await new Promise<void>((res, rej) => { artImg.onload = () => res(); artImg.onerror = rej; });
          const aw = artImg.naturalWidth;
          const ah = artImg.naturalHeight;
          const scale = Math.max(printW / aw, printH / ah);
          const dw = aw * scale;
          const dh = ah * scale;
          ctx.drawImage(artImg, (printW - dw) / 2, (printH - dh) / 2, dw, dh);
        } else {
          const grad = ctx.createLinearGradient(0, 0, 0, printH);
          grad.addColorStop(0, 'rgb(100,100,100)');
          grad.addColorStop(1, 'rgb(60,60,60)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, printW, printH);
        }

        const cardDataUrl = await toPng(hiddenCardRef.current, {
          pixelRatio: pr,
          quality: 1,
          width: CARD_W,
          height: CARD_H,
          style: { transform: 'none', borderRadius: '0' },
          filter: (node) => {
            if (node instanceof HTMLElement) {
              const key = node.getAttribute('data-zone-key');
              if (key === 'CardArt' || key === 'Art'
                || key === 'CardBackground' || key === 'BackgroundColor'
                || key === 'ArtBorder' || key === 'BottomBar'
                || key === 'CryptidInfoBar') return false;
            }
            return true;
          },
        });
        const cardImg = new Image();
        cardImg.src = cardDataUrl;
        await new Promise<void>((r, e) => { cardImg.onload = () => r(); cardImg.onerror = e; });
        ctx.drawImage(cardImg, bPx, bPx);

        downloadDataUrl(canvas.toDataURL('image/png'), `${filename}-print.png`);
      } else {
        const rootZone = hiddenCardRef.current.firstElementChild as HTMLElement | null;
        const borderColor = rootZone
          ? getComputedStyle(rootZone).backgroundColor
          : 'rgb(221, 12, 34)';

        const cardDataUrl = await toPng(hiddenCardRef.current, {
          pixelRatio: 4,
          quality: 1,
          width: CARD_W,
          height: CARD_H,
          style: { transform: 'none', borderRadius: '0' },
        });

        const pr = 4;
        const canvas = document.createElement('canvas');
        canvas.width = (CARD_W + 2 * BLEED) * pr;
        canvas.height = (CARD_H + 2 * BLEED) * pr;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        img.src = cardDataUrl;
        await new Promise<void>((r, e) => { img.onload = () => r(); img.onerror = e; });
        ctx.drawImage(img, BLEED * pr, BLEED * pr, CARD_W * pr, CARD_H * pr);

        downloadDataUrl(canvas.toDataURL('image/png'), `${filename}-print.png`);
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
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${(card.cardName || 'openzoo-card').replace(/\\n/g, ' ')}.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      {/* Free-floating flex: 3D card + details panel side by side */}
      <div className="flex gap-6 items-start mx-4 pointer-events-none">
        {/* 3D Card */}
        <div
          style={{ perspective: '800px' }}
          className="shrink-0 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {card.thumbnailUrl ? (
            <div
              onMouseMove={handleCardMouseMove}
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
              style={{
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hovering ? 1.05 : 1})`,
                transformStyle: 'preserve-3d',
                transition: hovering
                  ? 'transform 0.15s ease-out'
                  : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                position: 'relative',
                cursor: 'default',
              }}
            >
              <img
                src={card.thumbnailUrl}
                alt={card.cardName}
                className="border border-navy-600 rounded-3xl"
                style={{ display: 'block', maxHeight: '80vh', width: 'auto', pointerEvents: 'none' }}
              />
              {/* Glare overlay */}
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
            </div>
          ) : (
            <div className="w-64 h-90 flex items-center justify-center text-gray-400 bg-navy-800 rounded-3xl">
              No preview
            </div>
          )}
        </div>

        {/* Details panel */}
        <div
          className="relative bg-navy-900 p-5 w-72 space-y-4 pointer-events-auto border-gold"
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

          {card.creatorName && (
            <div className="text-sm text-gold-400">
              Created by <span className="text-gray-300">{card.creatorName}</span>
            </div>
          )}

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

      {/* Hidden card renderer for PNG export */}
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
