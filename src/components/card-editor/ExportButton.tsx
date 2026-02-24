import { useState } from 'react';
import { toPng } from 'html-to-image';
import { useCardStore } from '@/lib/store';
import { CARD_W, CARD_H, BLEED, downloadDataUrl } from '@/lib/exportUtils';

interface ExportButtonProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export function ExportButton({ cardRef }: ExportButtonProps) {
  const cardName = useCardStore((s) => s.cardName);
  const borderless = useCardStore((s) => s.borderless);
  const [printReady, setPrintReady] = useState(() => localStorage.getItem('openzoo-print-ready') === '1');
  const filename = (cardName || 'openzoo-card').replace(/\\n/g, ' ');

  async function handleExport() {
    if (!cardRef.current) return;

    try {
      cardRef.current.classList.add('card-exporting');
      if (printReady) {
        await exportPrint(cardRef.current);
      } else {
        const dataUrl = await toPng(cardRef.current, {
          pixelRatio: 4,
          quality: 1,
          width: CARD_W,
          height: CARD_H,
          style: { transform: 'none', borderRadius: borderless ? '0' : undefined },
        });
        downloadDataUrl(dataUrl, `${filename}.png`);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      cardRef.current?.classList.remove('card-exporting');
    }
  }

  async function exportPrint(card: HTMLElement) {
    // Borderless: extend card art into the bleed area, no rounded corners
    if (borderless) {
      const pr = 4;
      const bPx = BLEED * pr;
      const printW = (CARD_W + 2 * BLEED) * pr;
      const printH = (CARD_H + 2 * BLEED) * pr;

      const canvas = document.createElement('canvas');
      canvas.width = printW;
      canvas.height = printH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill bleed with extended card art (cover + center on print canvas)
      const cardArtUrl = useCardStore.getState().cardArtUrl;
      if (cardArtUrl) {
        const artImg = new Image();
        artImg.src = cardArtUrl;
        await new Promise<void>((r, e) => { artImg.onload = () => r(); artImg.onerror = e; });
        const aw = artImg.naturalWidth;
        const ah = artImg.naturalHeight;
        const scale = Math.max(printW / aw, printH / ah);
        const dw = aw * scale;
        const dh = ah * scale;
        ctx.drawImage(artImg, (printW - dw) / 2, (printH - dh) / 2, dw, dh);
      } else {
        // No art — fill with gradient fallback
        const grad = ctx.createLinearGradient(0, 0, 0, printH);
        grad.addColorStop(0, 'rgb(100,100,100)');
        grad.addColorStop(1, 'rgb(60,60,60)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, printW, printH);
      }

      // Capture card WITHOUT art/background zones (transparent) so art
      // only comes from the extended layer — avoids double-image through
      // the semi-transparent text box
      const cardDataUrl = await toPng(card, {
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
      return;
    }

    // Read the border color from the root zone (CardBorder) background
    const rootZone = card.firstElementChild as HTMLElement | null;
    const borderColor = rootZone
      ? getComputedStyle(rootZone).backgroundColor
      : 'rgb(221, 12, 34)';

    // Capture card with square corners (style override on the captured element)
    const cardDataUrl = await toPng(card, {
      pixelRatio: 4,
      quality: 1,
      width: CARD_W,
      height: CARD_H,
      style: { transform: 'none', borderRadius: '0' },
    });

    // Composite onto a larger canvas with bleed area
    const pr = 4; // match pixelRatio
    const canvas = document.createElement('canvas');
    canvas.width = (CARD_W + 2 * BLEED) * pr;
    canvas.height = (CARD_H + 2 * BLEED) * pr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill bleed area with border color
    ctx.fillStyle = borderColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw card image centered in the bleed area
    const img = new Image();
    img.src = cardDataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });
    ctx.drawImage(img, BLEED * pr, BLEED * pr, CARD_W * pr, CARD_H * pr);

    downloadDataUrl(canvas.toDataURL('image/png'), `${filename}-print.png`);
  }

  return (
    <div className="space-y-2">
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
        onClick={handleExport}
        className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 transition-colors border-gold"
      >
        <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z"/><path d="M4 15a1 1 0 011 1h10a1 1 0 110 2H5a1 1 0 01-1-1v0a1 1 0 011-1z"/></svg>
        Export PNG
      </button>
    </div>
  );
}
