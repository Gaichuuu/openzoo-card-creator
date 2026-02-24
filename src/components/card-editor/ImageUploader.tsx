import { useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { CARD_TYPE_TO_LAYOUT } from '@/data/constants';

// Max dimension for card art. At pixelRatio 4, the art zone is 197*4 = 788px.
// We use 1600px to allow plenty of headroom for high-quality print exports.
const MAX_IMAGE_DIM = 1600;

/** Load, optionally resize, and return a data URL for the image. */
function processImage(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;

      // Determine target dimensions (resize if too large)
      const needsResize = w > MAX_IMAGE_DIM || h > MAX_IMAGE_DIM;
      const scale = needsResize ? Math.min(MAX_IMAGE_DIM / w, MAX_IMAGE_DIM / h) : 1;
      const newW = Math.round(w * scale);
      const newH = Math.round(h * scale);

      // Always convert to data URL via canvas for reliable CSS background rendering
      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas 2D not supported')); return; }
      ctx.drawImage(img, 0, 0, newW, newH);

      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/png');
      resolve({ url: dataUrl, width: newW, height: newH });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

export function ImageUploader() {
  const cardArtUrl = useCardStore((s) => s.cardArtUrl);
  const setCardArt = useCardStore((s) => s.setCardArt);
  const cardType = useCardStore((s) => s.cardType);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  const borderless = useCardStore((s) => s.borderless);
  const layoutType = CARD_TYPE_TO_LAYOUT[cardType];
  const isTerraLayout = layoutType === 'Terra';
  const isAuraLayout = layoutType === 'Aura';
  // Borderless: art fills full card (238×333 native, ~5:7)
  const ratioHint = borderless ? '5:7 ratio | 952×1332 | PNG, JPG'
    : isTerraLayout ? '2:3 ratio | 848×1228 | PNG, JPG'
    : isAuraLayout ? '5:6 ratio | 788×936 | PNG, JPG'
    : '5:4 ratio | 788×636 | PNG, JPG';
  const previewAspect = borderless ? '238 / 333'
    : isTerraLayout ? '212 / 307'
    : isAuraLayout ? '394 / 468'
    : '394 / 318';

  async function handleFile(file: File) {
    const { url, width, height } = await processImage(file);
    setDims({ width, height });
    setCardArt(url);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  }

  function handleRemove() {
    setCardArt(null);
    setDims(null);
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
          <img src={cardArtUrl} alt="Card art" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gold-500 text-sm">Drop image or click to upload</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
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
    </div>
  );
}
