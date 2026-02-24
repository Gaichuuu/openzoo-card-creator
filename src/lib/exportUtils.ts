/** Card dimensions at 1x scale (matches Dextrous Euro Poker layout). */
export const CARD_W = 238;
export const CARD_H = 333;
export const BLEED = 13; // ~3.5mm at card scale

/** Convert a base64 data URL to a Blob. */
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

/**
 * Trigger a browser download from a data URL.
 * Converts to a blob URL first — raw data URLs can silently fail
 * in some browsers when the payload exceeds ~2 MB.
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
