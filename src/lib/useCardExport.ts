import { useCardStore } from '@/lib/store';
import { PRINT_READY_KEY, downloadDataUrl, sanitizeCardNameForFilename, exportStandardPng, exportPrintReadyPng, type ArtFraming } from '@/lib/exportUtils';
import { readLocalStorage } from '@/lib/safeStorage';
import { useLocalStorageState } from '@/lib/useLocalStorageState';
import { applyTextStroke } from './textWeightCalibration';

export function usePrintReady(): [boolean, (v: boolean) => void] {
  return useLocalStorageState(PRINT_READY_KEY, (raw) => raw === '1', (v) => (v ? '1' : '0'));
}

interface ExportCardOptions {
  printReady?: boolean;
  cardName?: string;
  borderless?: boolean;
  cardArtUrl?: string | null;
  crossOrigin?: boolean;
  artFraming?: ArtFraming;
}

export async function exportCardPng(card: HTMLDivElement | null, options: ExportCardOptions = {}) {
  if (!card) return;
  const store = useCardStore.getState();
  const {
    printReady = readLocalStorage(PRINT_READY_KEY) === '1',
    cardName = store.cardName,
    borderless = store.borderless,
    cardArtUrl = store.cardArtUrl,
    crossOrigin,
    artFraming = {
      positionX: store.cardArtPositionX,
      positionY: store.cardArtPositionY,
      zoom: store.cardArtZoom,
    },
  } = options;
  const filename = sanitizeCardNameForFilename(cardName);

  try {
    card.classList.add('card-exporting');
    await applyTextStroke(card);
    if (printReady) {
      const dataUrl = await exportPrintReadyPng(card, borderless, cardArtUrl, crossOrigin, artFraming);
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
