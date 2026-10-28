import { computeArtDrawRect } from './cardArtFit';
import { toSvg } from 'html-to-image';
import { correctPillsForExport } from './pillExport';
import { cssGradientLine } from './customStyle';
import type { GradientDef, HoloSettings } from '@/types/card';
import { isHoloActive } from './holo/holoSettings';
import { ensureFoil } from './holo/foilImage';
import { BLEED, CARD_H, CARD_W } from './cardDims';

type SvgOptions = NonNullable<Parameters<typeof toSvg>[1]>;
interface CardPngOptions extends SvgOptions {
  pixelRatio: number;
  width: number;
  height: number;
}

async function cardToCanvas(el: HTMLElement, opts: CardPngOptions): Promise<HTMLCanvasElement> {
  const marked: HTMLElement[] = [];
  for (const node of Array.from(el.querySelectorAll('div, span')) as HTMLElement[]) {
    const inlineW = node.style.width;
    if (inlineW !== '' && inlineW !== 'auto') continue;
    const cs = getComputedStyle(node);
    const collapse = cs.getPropertyValue('white-space-collapse') || cs.whiteSpace;
    if (collapse.includes('break-spaces')) {
      node.dataset.ozWauto = '1';
      marked.push(node);
    }
  }
  let svgDataUrl: string;
  try {
    svgDataUrl = await toSvg(el, opts);
  } finally {
    for (const node of marked) delete node.dataset.ozWauto;
  }
  const prefix = 'data:image/svg+xml;charset=utf-8,';
  const svgText = decodeURIComponent(svgDataUrl.slice(prefix.length));
  const fixed = svgText.replace(/<[a-z]+ [^>]*data-oz-wauto="1"[^>]*>/g, (tag) =>
    tag
      .replace(/(?<![a-z-])width: [\d.]+px/g, 'width: auto')
      .replace(/(?<![a-z-])inline-size: [\d.]+px/g, 'inline-size: auto'));
  const img = await loadImage(prefix + encodeURIComponent(fixed));
  const canvas = document.createElement('canvas');
  canvas.width = opts.width * opts.pixelRatio;
  canvas.height = opts.height * opts.pixelRatio;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const isWholeCardFoil = (node: Node) => node instanceof HTMLElement && node.classList.contains('oz-holo-card');

async function renderCard(el: HTMLElement, opts: CardPngOptions): Promise<string> {
  const warm = await cardToCanvas(el, opts);
  const wholeCardLayer = el.querySelector<HTMLElement>('.oz-holo-card');
  const measured = wholeCardLayer && (opts.filter?.(wholeCardLayer) ?? true)
    ? await cardToCanvas(el, { ...opts, filter: (n: HTMLElement) => !isWholeCardFoil(n) && (opts.filter?.(n) ?? true) })
    : warm;
  let undo = () => {};
  try {
    const ctx = measured.getContext('2d');
    if (ctx) undo = correctPillsForExport(el, ctx.getImageData(0, 0, measured.width, measured.height), opts.pixelRatio);
  } catch {
    // best-effort: never fail an export over the pill correction
  }
  try {
    return (await cardToCanvas(el, opts)).toDataURL('image/png');
  } finally {
    undo();
  }
}

export { BLEED, CARD_H, CARD_W };
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // must match Firebase Storage rules

export const PRINT_READY_KEY = 'openzoo-print-ready';
export const THUMBNAIL_JPEG_QUALITY = 0.85;

export function renderThumbnailPng(el: HTMLElement): Promise<string> {
  return exportStandardPng(el, false);
}

export function thumbnailCanvas(img: HTMLImageElement): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context');
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx };
}

export function thumbnailJpeg(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', THUMBNAIL_JPEG_QUALITY);
}

export function displayCardName(name: string): string {
  return name.replace(/\\n/g, ' ').replace(/\n/g, ' ');
}

const PIXEL_RATIO = 4;

const BACKGROUND_ZONE_KEYS = new Set([
  'CardArt', 'Art', 'CardBackground', 'BackgroundColor',
  'ArtBorder', 'BottomBar', 'CryptidInfoBar',
]);

const FONT_FACES = [
  { family: 'EB Garamond', style: 'normal', weight: 400, file: '/fonts/EBGaramond-Medium.ttf' },
  { family: 'EB Garamond', style: 'italic', weight: 400, file: '/fonts/EBGaramond-MediumItalic.ttf' },
  { family: 'EB Garamond', style: 'normal', weight: 700, file: '/fonts/EBGaramond-Bold.ttf' },
  { family: 'EB Garamond', style: 'italic', weight: 700, file: '/fonts/EBGaramond-BoldItalic.ttf' },
  { family: 'Archivo Black', style: 'normal', weight: 400, file: '/fonts/ArchivoBlack-Regular.ttf' },
];

let fontEmbedCSSCache: string | null = null;
let fontEmbedCSSPending: Promise<string> | null = null;

export async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

export function getFontEmbedCSS(): Promise<string> {
  if (fontEmbedCSSCache) return Promise.resolve(fontEmbedCSSCache);
  if (fontEmbedCSSPending) return fontEmbedCSSPending;
  fontEmbedCSSPending = Promise.all(FONT_FACES.map(async (f) => {
    const dataUrl = await fetchAsDataUrl(f.file);
    return `@font-face { font-family: '${f.family}'; font-style: ${f.style}; font-weight: ${f.weight}; src: url('${dataUrl}') format('truetype'); }`;
  })).then((rules) => {
    rules.push(
      "@font-face { font-family: 'Cambria'; src: local('Cambria'); }",
    );
    fontEmbedCSSCache = rules.join('\n');
    return fontEmbedCSSCache;
  }).finally(() => {
    fontEmbedCSSPending = null;
  });
  return fontEmbedCSSPending;
}

export function loadImage(src: string, crossOrigin?: boolean): Promise<HTMLImageElement> {
  const img = new Image();
  if (crossOrigin) img.crossOrigin = 'anonymous';
  img.src = src;
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function sanitizeCardNameForFilename(name: string): string {
  return displayCardName(name || 'openzoo-card')
    .replace(/[/\\:*?"<>|]/g, '_')
    .trim() || 'openzoo-card';
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  downloadBlob(dataUrlToBlob(dataUrl), filename);
}

export async function exportStandardPng(
  el: HTMLElement,
  borderless: boolean,
): Promise<string> {
  const [fontEmbedCSS] = await Promise.all([getFontEmbedCSS(), document.fonts.ready]);
  const opts = {
    pixelRatio: PIXEL_RATIO,
    quality: 1,
    width: CARD_W,
    height: CARD_H,
    fontEmbedCSS,
    style: { transform: 'none', borderRadius: borderless ? '0' : undefined },
  };
  return renderCard(el, opts);
}

export async function exportPrintReadyPng(
  el: HTMLElement,
  borderless: boolean,
  cardArtUrl: string | null,
  crossOrigin?: boolean,
  artFraming?: ArtFraming,
  borderGradient?: GradientDef | null,
  holo?: HoloSettings | null,
): Promise<string> {
  if (borderless) {
    return exportPrintBorderless(el, cardArtUrl, crossOrigin, artFraming, holo);
  }
  return exportPrintBordered(el, borderGradient, holo);
}

export interface ArtFraming {
  positionX?: number;
  positionY?: number;
  zoom?: number;
}

function extendEdgesToBleed(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  canvasW: number, canvasH: number,
): void {
  const left = Math.max(0, Math.ceil(x));
  const top = Math.max(0, Math.ceil(y));
  const right = Math.min(canvasW, Math.floor(x + w));
  const bottom = Math.min(canvasH, Math.floor(y + h));
  if (right <= left || bottom <= top) return;
  const src = ctx.canvas;
  if (left > 0) ctx.drawImage(src, left, top, 1, bottom - top, 0, top, left, bottom - top);
  if (right < canvasW) ctx.drawImage(src, right - 1, top, 1, bottom - top, right, top, canvasW - right, bottom - top);
  if (top > 0) ctx.drawImage(src, 0, top, canvasW, 1, 0, 0, canvasW, top);
  if (bottom < canvasH) ctx.drawImage(src, 0, bottom - 1, canvasW, 1, 0, bottom, canvasW, canvasH - bottom);
}

type FoilPlacement = 'art' | 'border' | 'card';

function foilOn(el: HTMLElement, holo: HoloSettings | null | undefined, where: FoilPlacement): holo is HoloSettings {
  if (!isHoloActive(holo)) return false;
  const selector = where === 'card' ? '.oz-holo-card'
    : where === 'border' ? '[data-zone-key="CardBorder"] > .oz-holo'
      : '[data-zone-key="CardArt"] > .oz-holo, [data-zone-key="Art"] > .oz-holo';
  return Array.from(el.querySelectorAll<HTMLElement>(selector)).some((layer) => layer.style.display !== 'none');
}

async function multiplyFoil(ctx: CanvasRenderingContext2D, holo: HoloSettings): Promise<void> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap((await ensureFoil(holo)).blob);
  } catch {
    return;
  }
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = holo.strength / 100;
  ctx.drawImage(bitmap, 0, 0, ctx.canvas.width, ctx.canvas.height);
  bitmap.close();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

async function exportPrintBorderless(
  el: HTMLElement,
  cardArtUrl: string | null,
  crossOrigin?: boolean,
  artFraming?: ArtFraming,
  holo?: HoloSettings | null,
): Promise<string> {
  const pr = PIXEL_RATIO;
  const bPx = BLEED * pr;
  const printW = (CARD_W + 2 * BLEED) * pr;
  const printH = (CARD_H + 2 * BLEED) * pr;

  const canvas = document.createElement('canvas');
  canvas.width = printW;
  canvas.height = printH;
  const ctx = canvas.getContext('2d')!;

  if (cardArtUrl) {
    const artImg = await loadImage(cardArtUrl, crossOrigin);
    const { dx, dy, dw, dh } = computeArtDrawRect(
      artImg.naturalWidth, artImg.naturalHeight, CARD_W * pr, CARD_H * pr,
      artFraming?.positionX ?? 0, artFraming?.positionY ?? 0, artFraming?.zoom ?? 0,
    );
    ctx.drawImage(artImg, bPx + dx, bPx + dy, dw, dh);
    extendEdgesToBleed(ctx, bPx + dx, bPx + dy, dw, dh, printW, printH);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, printH);
    grad.addColorStop(0, 'rgb(100,100,100)');
    grad.addColorStop(1, 'rgb(60,60,60)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, printW, printH);
  }

  const wholeCardFoil = foilOn(el, holo, 'card');
  if (!wholeCardFoil && foilOn(el, holo, 'art')) await multiplyFoil(ctx, holo);

  const [fontEmbedCSS] = await Promise.all([getFontEmbedCSS(), document.fonts.ready]);
  const overlayOpts = {
    pixelRatio: pr,
    quality: 1,
    width: CARD_W,
    height: CARD_H,
    fontEmbedCSS,
    style: { transform: 'none', borderRadius: '0' },
    filter: (node: Node) => {
      if (node instanceof HTMLElement) {
        const key = node.getAttribute('data-zone-key');
        if (key && BACKGROUND_ZONE_KEYS.has(key)) return false;
        if (node.classList.contains('art-needed-overlay')) return false;
        if (node.classList.contains('oz-holo-card')) return false;
      }
      return true;
    },
  };
  const overlayUrl = await renderCard(el, overlayOpts);
  const overlayImg = await loadImage(overlayUrl);
  ctx.drawImage(overlayImg, bPx, bPx);
  if (wholeCardFoil) await multiplyFoil(ctx, holo!);

  return canvas.toDataURL('image/png');
}

async function exportPrintBordered(el: HTMLElement, borderGradient?: GradientDef | null, holo?: HoloSettings | null): Promise<string> {
  const rootZone = el.firstElementChild as HTMLElement | null;
  const borderColor = rootZone
    ? getComputedStyle(rootZone).backgroundColor
    : 'rgb(221, 12, 34)';

  const wholeCardFoil = foilOn(el, holo, 'card');
  const [fontEmbedCSS] = await Promise.all([getFontEmbedCSS(), document.fonts.ready]);
  const borderedOpts = {
    pixelRatio: PIXEL_RATIO,
    quality: 1,
    width: CARD_W,
    height: CARD_H,
    fontEmbedCSS,
    style: { transform: 'none', borderRadius: '0' },
    filter: (node: Node) =>
      !(node instanceof HTMLElement
        && (node.classList.contains('art-needed-overlay') || (wholeCardFoil && node.classList.contains('oz-holo-card')))),
  };
  const cardDataUrl = await renderCard(el, borderedOpts);

  const pr = PIXEL_RATIO;
  const canvas = document.createElement('canvas');
  canvas.width = (CARD_W + 2 * BLEED) * pr;
  canvas.height = (CARD_H + 2 * BLEED) * pr;
  const ctx = canvas.getContext('2d')!;

  if (borderGradient) {
    const { x0, y0, x1, y1 } = cssGradientLine(borderGradient.angle, CARD_W, CARD_H);
    const off = BLEED * pr;
    const grad = ctx.createLinearGradient(x0 * pr + off, y0 * pr + off, x1 * pr + off, y1 * pr + off);
    const last = borderGradient.stops.length - 1;
    borderGradient.stops.forEach((c, i) => grad.addColorStop(i / last, c));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = borderColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!wholeCardFoil && foilOn(el, holo, 'border')) await multiplyFoil(ctx, holo);

  const img = await loadImage(cardDataUrl);
  ctx.drawImage(img, BLEED * pr, BLEED * pr, CARD_W * pr, CARD_H * pr);
  if (wholeCardFoil) await multiplyFoil(ctx, holo!);

  return canvas.toDataURL('image/png');
}
