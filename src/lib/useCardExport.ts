import { useCardStore } from '@/lib/store';
import { BLEED, CARD_H, CARD_W, PRINT_READY_KEY, downloadBlob, downloadDataUrl, sanitizeCardNameForFilename, exportStandardPng, exportPrintReadyPng, exportWhiteInkMask, withHoloLayerStyle, type ArtFraming } from '@/lib/exportUtils';
import { DEFAULT_EXPORT_DPI, cssPxToMm, parseExportDpi, pixelRatioForDpi, wrapPngInSvg, type ExportDpi, type ExportFormat } from '@/lib/printFile';
import { readLocalStorage } from '@/lib/safeStorage';
import { useLocalStorageState } from '@/lib/useLocalStorageState';
import { applyBackendClass } from './fontBackend';
import { prepareHoloExport } from './holo/holoExport';
import type { GradientDef, HoloSettings } from '@/types/card';

const parseFlag = (raw: string | null) => raw === '1';
const serializeFlag = (v: boolean) => (v ? '1' : '0');

export function usePrintReady(): [boolean, (v: boolean) => void] {
  return useLocalStorageState(PRINT_READY_KEY, parseFlag, serializeFlag);
}

export function useExportFormat(): [ExportFormat, (v: ExportFormat) => void] {
  return useLocalStorageState<ExportFormat>('openzoo-export-format', (raw) => (raw === 'svg' ? 'svg' : 'png'), (v) => v);
}

export function useExportDpi(): [ExportDpi, (v: ExportDpi) => void] {
  return useLocalStorageState('openzoo-export-dpi', parseExportDpi, String);
}

export function useWhiteInkMask(): [boolean, (v: boolean) => void] {
  return useLocalStorageState('openzoo-export-white-mask', parseFlag, serializeFlag);
}

export function useExportHoloFoil(): [boolean, (v: boolean) => void] {
  return useLocalStorageState('openzoo-export-holo-foil', (raw) => raw !== '0', serializeFlag);
}

export function useWhiteInkMaskInvert(): [boolean, (v: boolean) => void] {
  return useLocalStorageState('openzoo-export-white-mask-invert', parseFlag, serializeFlag);
}

export interface WhiteInkMaskOptions {
  invert: boolean;
}

interface ExportCardOptions {
  printReady?: boolean;
  cardName?: string;
  borderless?: boolean;
  cardArtUrl?: string | null;
  crossOrigin?: boolean;
  artFraming?: ArtFraming;
  borderGradient?: GradientDef | null;
  holo?: HoloSettings | null;
  format?: ExportFormat;
  dpi?: ExportDpi;
  whiteInkMask?: WhiteInkMaskOptions | null;
  includeFoil?: boolean;
}

function downloadImage(pngDataUrl: string, format: ExportFormat, pixelRatio: number, printReady: boolean, filename: string) {
  if (format === 'png') {
    downloadDataUrl(pngDataUrl, `${filename}.png`);
    return;
  }
  const w = CARD_W + (printReady ? 2 * BLEED : 0);
  const h = CARD_H + (printReady ? 2 * BLEED : 0);
  const svg = wrapPngInSvg(pngDataUrl, w * pixelRatio, h * pixelRatio, cssPxToMm(w), cssPxToMm(h));
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${filename}.svg`);
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
    borderGradient = store.customStyle?.borderGradient ?? null,
    holo = store.holo,
    format = 'png',
    dpi = DEFAULT_EXPORT_DPI,
    whiteInkMask = null,
    includeFoil = true,
  } = options;
  const pixelRatio = pixelRatioForDpi(dpi);
  const filename = sanitizeCardNameForFilename(cardName) + (printReady ? '-print' : '');

  try {
    await withExportState(card, holo, async () => {
      const render = () => (printReady
        ? exportPrintReadyPng(card, borderless, cardArtUrl, crossOrigin, artFraming, borderGradient, includeFoil ? holo : null, pixelRatio)
        : exportStandardPng(card, borderless, pixelRatio));
      const dataUrl = includeFoil ? await render() : await withHoloLayerStyle(card, { display: 'none' }, render);
      downloadImage(dataUrl, format, pixelRatio, printReady, filename);
      if (whiteInkMask) {
        const maskUrl = await exportWhiteInkMask(card, printReady, borderless, whiteInkMask.invert, pixelRatio);
        downloadImage(maskUrl, format, pixelRatio, printReady, `${filename}-white-mask`);
      }
    });
  } catch (err) {
    console.error('Export failed:', err);
  }
}

export async function withExportState<T>(card: HTMLElement, holo: HoloSettings | null | undefined, render: () => Promise<T>): Promise<T> {
  card.classList.add('card-exporting');
  applyBackendClass(card);
  let undoHolo = () => {};
  try {
    undoHolo = await prepareHoloExport(card, holo);
    return await render();
  } finally {
    undoHolo();
    card.classList.remove('card-exporting');
  }
}
