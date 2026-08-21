import { useRef, useState, useMemo } from 'react';
import { useCardStore } from '@/lib/store';
import { CARD_TYPE_TO_LAYOUT } from '@/data/constants';
import { MAX_UPLOAD_BYTES } from '@/lib/exportUtils';
import { processImageFile } from '@/lib/imageUtils';
import { Stepper } from './TextBoxBuilder';
import { ART_ZOOM_MIN, ART_ZOOM_MAX, ART_ZOOM_STEP, artZoomScale } from '@/lib/cardArtFit';

const MAX_IMAGE_DIM = 1600;
const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / (1024 * 1024);

const AXIS_ICON_PROPS = {
  viewBox: '0 0 16 16',
  className: 'w-2.5 h-2.5 inline-block align-middle',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const AxisLabel = ({ axis }: { axis: 'X' | 'Y' }) => (
  <span className="whitespace-nowrap">
    {axis}
    {' ('}
    <svg {...AXIS_ICON_PROPS}>
      {axis === 'X'
        ? <path d="M2 8h12M4.5 5.5 2 8l2.5 2.5M11.5 5.5 14 8l-2.5 2.5" />
        : <path d="M8 2v12M5.5 4.5 8 2l2.5 2.5M5.5 11.5 8 14l2.5-2.5" />}
    </svg>
    {')'}
  </span>
);

function dataUrlByteSize(dataUrl: string): number {
  const base64Len = dataUrl.length - dataUrl.indexOf(',') - 1;
  return Math.ceil(base64Len * 3 / 4);
}

export function ImageUploader() {
  const cardArtUrl = useCardStore((s) => s.cardArtUrl);
  const setCardArt = useCardStore((s) => s.setCardArt);
  const cardType = useCardStore((s) => s.cardType);
  const posX = useCardStore((s) => s.cardArtPositionX);
  const posY = useCardStore((s) => s.cardArtPositionY);
  const setCardArtPosition = useCardStore((s) => s.setCardArtPosition);
  const zoom = useCardStore((s) => s.cardArtZoom);
  const setCardArtZoom = useCardStore((s) => s.setCardArtZoom);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const borderless = useCardStore((s) => s.borderless);
  const artNeeded = useCardStore((s) => s.artNeeded);
  const setArtNeeded = useCardStore((s) => s.setArtNeeded);
  const layoutType = CARD_TYPE_TO_LAYOUT[cardType];
  const isTerraLayout = layoutType === 'Terra';
  const isAuraLayout = layoutType === 'Aura';
  const ratioHint = borderless ? '5:7 ratio | 952×1332 | PNG, JPG'
    : isTerraLayout ? '2:3 ratio | 848×1228 | PNG, JPG'
    : isAuraLayout ? '5:6 ratio | 788×936 | PNG, JPG'
    : '5:4 ratio | 788×636 | PNG, JPG';
  const previewAspect = borderless ? '238 / 333'
    : isTerraLayout ? '212 / 307'
    : isAuraLayout ? '394 / 468'
    : '394 / 318';

  const artSizeMB = useMemo(
    () => cardArtUrl?.startsWith('data:') ? dataUrlByteSize(cardArtUrl) / (1024 * 1024) : null,
    [cardArtUrl],
  );

  async function handleFile(file: File) {
    const { url, width, height } = await processImageFile(file, MAX_IMAGE_DIM);
    setDims({ width, height });
    setCardArt(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      handleFile(file);
    }
  }

  function handleRemove() {
    setCardArt(null);
    setDims(null);
  }

  function handleResetFraming() {
    setCardArtPosition(0, 0);
    setCardArtZoom(0);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
          Card Art
        </label>
        <span className="text-[10px] text-gold-500">{ratioHint}</span>
      </div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="w-full border-gold-dashed rounded flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
        style={{ aspectRatio: previewAspect }}
      >
        {cardArtUrl ? (
          <img
            src={cardArtUrl}
            alt="Card art"
            className="w-full h-full object-cover"
            style={{
              objectPosition: `${50 + posX}% ${50 + posY}%`,
              transform: zoom > 0 ? `scale(${artZoomScale(zoom)})` : undefined,
              transformOrigin: `${50 + posX}% ${50 + posY}%`,
            }}
          />
        ) : (
          <span className="text-gold-500 text-sm">Drop image or click to upload</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.type !== 'image/svg+xml') handleFile(file);
        }}
        className="hidden"
      />
      <div className="flex items-center justify-between">
        {cardArtUrl && (
          <button
            onClick={handleRemove}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove art
          </button>
        )}
        {dims && (
          <span className="text-[10px] text-gold-500">{dims.width}x{dims.height}</span>
        )}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={artNeeded}
          onChange={(e) => setArtNeeded(e.target.checked)}
          className="accent-gold-400"
        />
        <span className="text-xs text-gray-400">Art needed</span>
      </label>
      {artSizeMB !== null && artSizeMB > MAX_UPLOAD_MB && (
        <div className="text-[11px] text-red-400">
          Image is {artSizeMB.toFixed(1)}MB, over the {MAX_UPLOAD_MB}MB upload limit. Try a smaller image.
        </div>
      )}
      {cardArtUrl && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
          <Stepper label={<AxisLabel axis="X" />} value={posX} min={-50} max={50} onChange={(v) => setCardArtPosition(v, posY)} valueWidth="w-5" />
          <Stepper label={<AxisLabel axis="Y" />} value={posY} min={-50} max={50} onChange={(v) => setCardArtPosition(posX, v)} valueWidth="w-5" />
          <Stepper
            label="Zoom"
            value={zoom}
            min={ART_ZOOM_MIN}
            max={ART_ZOOM_MAX}
            step={ART_ZOOM_STEP}
            onChange={setCardArtZoom}
            valueWidth="w-5"
          />
          <div className="flex items-center justify-end">
            <button
              onClick={handleResetFraming}
              className="h-5 px-2 text-[10px] bg-navy-700 hover:bg-navy-600 text-gray-300 hover:text-white rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
