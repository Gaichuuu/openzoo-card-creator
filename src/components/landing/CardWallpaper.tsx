import { ROTATE_DEG, SCALE, WALLPAPER_TILE_SRC } from './cardWallpaperDesign';

export function CardWallpaper({ tiles = 24 }: { tiles?: number }) {
  return (
    <div
      aria-hidden="true"
      className="absolute -inset-15 grid grid-cols-4 md:grid-cols-8 gap-4.5 opacity-15"
      style={{ transform: `rotate(${ROTATE_DEG}deg) scale(${SCALE})`, transformOrigin: 'center' }}
    >
      {Array.from({ length: tiles }, (_, i) => (
        <img
          key={i}
          src={WALLPAPER_TILE_SRC}
          alt=""
          className="w-full rounded-lg aspect-238/333 object-cover"
        />
      ))}
    </div>
  );
}
