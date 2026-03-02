import { useState } from 'react';
import { useCardStore } from '@/lib/store';
import { downloadDataUrl, exportStandardPng, exportPrintReadyPng } from '@/lib/exportUtils';

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
        const cardArtUrl = useCardStore.getState().cardArtUrl;
        const dataUrl = await exportPrintReadyPng(cardRef.current, borderless, cardArtUrl);
        downloadDataUrl(dataUrl, `${filename}-print.png`);
      } else {
        const dataUrl = await exportStandardPng(cardRef.current, borderless);
        downloadDataUrl(dataUrl, `${filename}.png`);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      cardRef.current?.classList.remove('card-exporting');
    }
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
