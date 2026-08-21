export const ART_ZOOM_MIN = 0;
export const ART_ZOOM_MAX = 100;
export const ART_ZOOM_STEP = 5;
export const ART_POS_MIN = -50;
export const ART_POS_MAX = 50;

export interface ArtDrawRect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

export function artZoomScale(zoom: number): number {
  return 1 + zoom / 100;
}

export function computeArtDrawRect(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
  posX = 0,
  posY = 0,
  zoom = 0,
): ArtDrawRect {
  if (!(imgW > 0) || !(imgH > 0)) {
    return { dx: 0, dy: 0, dw: boxW, dh: boxH };
  }
  const scale = Math.max(boxW / imgW, boxH / imgH) * artZoomScale(zoom);
  const dw = imgW * scale;
  const dh = imgH * scale;
  return {
    dw,
    dh,
    dx: (boxW - dw) * (50 + posX) / 100,
    dy: (boxH - dh) * (50 + posY) / 100,
  };
}

export function clampArtZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return ART_ZOOM_MIN;
  return Math.max(ART_ZOOM_MIN, Math.min(ART_ZOOM_MAX, zoom));
}

export function clampArtPosition(pos: number): number {
  if (!Number.isFinite(pos)) return 0;
  return Math.max(ART_POS_MIN, Math.min(ART_POS_MAX, pos));
}

export function artPositionCss(posX: number, posY: number): string {
  return `${50 + posX}% ${50 + posY}%`;
}
