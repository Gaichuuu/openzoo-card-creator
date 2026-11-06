export const MM_PER_CSS_PX = 25.4 / 96;

export const EXPORT_DPIS = [384, 768, 1152] as const;
export type ExportDpi = (typeof EXPORT_DPIS)[number];
export const DEFAULT_EXPORT_DPI: ExportDpi = 384;

export type ExportFormat = 'png' | 'svg';

export function parseExportDpi(raw: string | null): ExportDpi {
  const n = Number(raw);
  return (EXPORT_DPIS as readonly number[]).includes(n) ? (n as ExportDpi) : DEFAULT_EXPORT_DPI;
}

export function pixelRatioForDpi(dpi: ExportDpi): number {
  return dpi / 96;
}

export function cssPxToMm(px: number): number {
  return px * MM_PER_CSS_PX;
}

export function wrapPngInSvg(pngDataUrl: string, pxWidth: number, pxHeight: number, mmWidth: number, mmHeight: number): string {
  const mm = (v: number) => `${Number(v.toFixed(3))}mm`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${mm(mmWidth)}" height="${mm(mmHeight)}" viewBox="0 0 ${pxWidth} ${pxHeight}">`
    + `<image width="${pxWidth}" height="${pxHeight}" href="${pngDataUrl}" xlink:href="${pngDataUrl}"/></svg>`;
}

function showsFoil(onLayer: Uint8ClampedArray, offLayer: Uint8ClampedArray, i: number): boolean {
  return Math.max(
    Math.abs(onLayer[i] - offLayer[i]),
    Math.abs(onLayer[i + 1] - offLayer[i + 1]),
    Math.abs(onLayer[i + 2] - offLayer[i + 2]),
  ) >= 128;
}

export function edgeShowsFoil(onLayer: Uint8ClampedArray, offLayer: Uint8ClampedArray, width: number): boolean {
  return showsFoil(onLayer, offLayer, Math.floor(width / 2) * 4);
}

export type MaskCorners = 'transparent' | 'ink' | 'foil';

export function whiteInkMaskPixels(onLayer: Uint8ClampedArray, offLayer: Uint8ClampedArray, invert: boolean, corners: MaskCorners = 'transparent'): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(onLayer.length);
  const ink = invert ? 255 : 0;
  for (let i = 0; i < onLayer.length; i += 4) {
    const a = onLayer[i + 3];
    let alpha = a;
    let inked = a > 0 && !showsFoil(onLayer, offLayer, i);
    if (corners !== 'transparent') {
      alpha = 255;
      if (a < 128) inked = corners === 'ink';
    }
    const v = inked ? ink : 255 - ink;
    out[i] = v;
    out[i + 1] = v;
    out[i + 2] = v;
    out[i + 3] = alpha;
  }
  return out;
}
