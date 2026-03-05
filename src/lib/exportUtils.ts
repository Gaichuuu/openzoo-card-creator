import { toPng } from 'html-to-image';

export const CARD_W = 238;
export const CARD_H = 333;
export const BLEED = 13;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // must match Firebase Storage rules

const PIXEL_RATIO = 4;

const BACKGROUND_ZONE_KEYS = new Set([
  'CardArt', 'Art', 'CardBackground', 'BackgroundColor',
  'ArtBorder', 'BottomBar', 'CryptidInfoBar',
]);

const FONT_FACES = [
  { style: 'normal', weight: 400, file: '/fonts/luxisr.ttf' },
  { style: 'italic', weight: 400, file: '/fonts/luxisri.ttf' },
  { style: 'normal', weight: 700, file: '/fonts/luxisb.ttf' },
  { style: 'italic', weight: 700, file: '/fonts/luxisbi.ttf' },
];

let fontEmbedCSSCache: string | null = null;

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function getFontEmbedCSS(): Promise<string> {
  if (fontEmbedCSSCache) return fontEmbedCSSCache;
  const rules = await Promise.all(FONT_FACES.map(async (f) => {
    const dataUrl = await fetchAsDataUrl(f.file);
    return `@font-face { font-family: 'Luxi Sans'; font-style: ${f.style}; font-weight: ${f.weight}; src: url('${dataUrl}') format('truetype'); }`;
  }));
  fontEmbedCSSCache = rules.join('\n');
  return fontEmbedCSSCache;
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
  return (name || 'openzoo-card')
    .replace(/\\n/g, ' ')
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
  await toPng(el, opts);
  return toPng(el, opts);
}

export async function exportPrintReadyPng(
  el: HTMLElement,
  borderless: boolean,
  cardArtUrl: string | null,
  crossOrigin?: boolean,
): Promise<string> {
  if (borderless) {
    return exportPrintBorderless(el, cardArtUrl, crossOrigin);
  }
  return exportPrintBordered(el);
}

async function exportPrintBorderless(
  el: HTMLElement,
  cardArtUrl: string | null,
  crossOrigin?: boolean,
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
    const scale = Math.max(printW / artImg.naturalWidth, printH / artImg.naturalHeight);
    const dw = artImg.naturalWidth * scale;
    const dh = artImg.naturalHeight * scale;
    ctx.drawImage(artImg, (printW - dw) / 2, (printH - dh) / 2, dw, dh);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, printH);
    grad.addColorStop(0, 'rgb(100,100,100)');
    grad.addColorStop(1, 'rgb(60,60,60)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, printW, printH);
  }

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
      }
      return true;
    },
  };
  await toPng(el, overlayOpts);
  const overlayUrl = await toPng(el, overlayOpts);
  const overlayImg = await loadImage(overlayUrl);
  ctx.drawImage(overlayImg, bPx, bPx);

  return canvas.toDataURL('image/png');
}

async function exportPrintBordered(el: HTMLElement): Promise<string> {
  const rootZone = el.firstElementChild as HTMLElement | null;
  const borderColor = rootZone
    ? getComputedStyle(rootZone).backgroundColor
    : 'rgb(221, 12, 34)';

  const [fontEmbedCSS] = await Promise.all([getFontEmbedCSS(), document.fonts.ready]);
  const borderedOpts = {
    pixelRatio: PIXEL_RATIO,
    quality: 1,
    width: CARD_W,
    height: CARD_H,
    fontEmbedCSS,
    style: { transform: 'none', borderRadius: '0' },
  };
  await toPng(el, borderedOpts);
  const cardDataUrl = await toPng(el, borderedOpts);

  const pr = PIXEL_RATIO;
  const canvas = document.createElement('canvas');
  canvas.width = (CARD_W + 2 * BLEED) * pr;
  canvas.height = (CARD_H + 2 * BLEED) * pr;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = borderColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = await loadImage(cardDataUrl);
  ctx.drawImage(img, BLEED * pr, BLEED * pr, CARD_W * pr, CARD_H * pr);

  return canvas.toDataURL('image/png');
}
