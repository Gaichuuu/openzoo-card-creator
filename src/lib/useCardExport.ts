import { useState } from 'react';
import { useCardStore } from '@/lib/store';
import { PRINT_READY_KEY, downloadDataUrl, sanitizeCardNameForFilename, exportStandardPng, exportPrintReadyPng } from '@/lib/exportUtils';

export { PRINT_READY_KEY };

export function usePrintReady(): [boolean, (v: boolean) => void] {
  const [printReady, setState] = useState(() => localStorage.getItem(PRINT_READY_KEY) === '1');
  const setPrintReady = (v: boolean) => {
    setState(v);
    localStorage.setItem(PRINT_READY_KEY, v ? '1' : '0');
  };
  return [printReady, setPrintReady];
}

interface ExportCardOptions {
  printReady?: boolean;
  cardName?: string;
  borderless?: boolean;
  cardArtUrl?: string | null;
  crossOrigin?: boolean;
}

export async function exportCardPng(card: HTMLDivElement | null, options: ExportCardOptions = {}) {
  if (!card) return;
  const store = useCardStore.getState();
  const {
    printReady = localStorage.getItem(PRINT_READY_KEY) === '1',
    cardName = store.cardName,
    borderless = store.borderless,
    cardArtUrl = store.cardArtUrl,
    crossOrigin,
  } = options;
  const filename = sanitizeCardNameForFilename(cardName);

  try {
    card.classList.add('card-exporting');
    if (printReady) {
      const dataUrl = await exportPrintReadyPng(card, borderless, cardArtUrl, crossOrigin);
      downloadDataUrl(dataUrl, `${filename}-print.png`);
    } else {
      const dataUrl = await exportStandardPng(card, borderless);
      downloadDataUrl(dataUrl, `${filename}.png`);
    }
  } catch (err) {
    console.error('Export failed:', err);
  } finally {
    card.classList.remove('card-exporting');
  }
}
