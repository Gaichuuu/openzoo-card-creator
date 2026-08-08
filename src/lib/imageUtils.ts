export interface ProcessedImage {
  url: string;
  width: number;
  height: number;
}

export function processImageFile(
  file: File,
  maxDim: number,
  mimeType = 'image/png',
  quality?: number,
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = w > maxDim || h > maxDim ? Math.min(maxDim / w, maxDim / h) : 1;
      const width = Math.round(w * scale);
      const height = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(objectUrl);
      if (!ctx) { reject(new Error('Canvas 2D not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      let url = canvas.toDataURL(mimeType, quality);
      if (mimeType !== 'image/png' && !url.startsWith(`data:${mimeType}`)) {
        url = canvas.toDataURL('image/jpeg', quality ?? 0.9);
      }
      resolve({ url, width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}
