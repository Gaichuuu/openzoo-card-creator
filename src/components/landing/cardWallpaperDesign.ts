export const WALLPAPER_TILE_SRC = '/assets/OPZDexCardBackTile.jpg';
export const WALLPAPER_BACKGROUND = '#080a19'; // navy-950
const VIGNETTE = { rx: 0.64, ry: 0.62, cy: 0.4, inner: 'rgba(8,10,25,.35)', outer: 'rgba(8,10,25,.93)' };
const pct = (f: number) => `${Math.round(f * 100)}%`;
export const WALLPAPER_VIGNETTE = `radial-gradient(${pct(VIGNETTE.rx)} ${pct(VIGNETTE.ry)} at 50% ${pct(VIGNETTE.cy)}, ${VIGNETTE.inner} 0%, ${VIGNETTE.outer} 100%)`;
const OPACITY = 0.15;
export const ROTATE_DEG = -10;
export const SCALE = 1.14;
const INSET_PX = 60;
const GAP_PX = 18;
const TILE_RADIUS_PX = 8;
const TILE_ASPECT = 333 / 238;

export function drawCardWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number, tile: CanvasImageSource, cols: number): void {
  ctx.save();
  ctx.fillStyle = WALLPAPER_BACKGROUND;
  ctx.fillRect(0, 0, w, h);

  const gridW = w + 2 * INSET_PX;
  const tileW = (gridW - (cols - 1) * GAP_PX) / cols;
  const tileH = tileW * TILE_ASPECT;
  const gridH = h + 2 * INSET_PX;
  ctx.translate(w / 2, h / 2);
  ctx.rotate((ROTATE_DEG * Math.PI) / 180);
  ctx.scale(SCALE, SCALE);
  ctx.globalAlpha = OPACITY;
  const reach = Math.hypot(gridW, gridH) / 2;
  const stepX = tileW + GAP_PX;
  const stepY = tileH + GAP_PX;
  for (let y = -gridH / 2 - Math.ceil((reach - gridH / 2) / stepY) * stepY; y < reach; y += stepY) {
    for (let x = -gridW / 2 - Math.ceil((reach - gridW / 2) / stepX) * stepX; x < reach; x += stepX) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, tileW, tileH, TILE_RADIUS_PX);
      ctx.clip();
      ctx.drawImage(tile, x, y, tileW, tileH);
      ctx.restore();
    }
  }
  ctx.restore();

  ctx.save();
  ctx.translate(w / 2, h * VIGNETTE.cy);
  ctx.scale(w * VIGNETTE.rx, h * VIGNETTE.ry);
  const v = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  v.addColorStop(0, VIGNETTE.inner);
  v.addColorStop(1, VIGNETTE.outer);
  ctx.fillStyle = v;
  ctx.fillRect(-2, -2, 4, 4);
  ctx.restore();
}
