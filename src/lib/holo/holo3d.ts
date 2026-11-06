import type { HoloSettings } from '@/types/card';
import type { LayoutType } from '@/types/layout';
import { exportStandardPng, exportWhiteInkMask, loadImage, withHoloLayerStyle } from '@/lib/exportUtils';
import { withExportState } from '@/lib/useCardExport';
import { ensureFoil } from './foilImage';
import { effectiveHoloAreas } from './holoAreas';
import { isHoloActive } from './holoSettings';
import type { FoilInputs } from './foilMaterial';

const AREA_PX = 4;
const CARD_WEBP_QUALITY = 0.92;

export interface Holo3dImages {
  card: string;
  area: string;
}

async function compactCard(png: string): Promise<string> {
  const img = await loadImage(png);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d')!.drawImage(img, 0, 0);
  return c.toDataURL('image/webp', CARD_WEBP_QUALITY);
}

export async function buildHolo3dImages(root: HTMLElement, holo: HoloSettings | null, borderless: boolean): Promise<Holo3dImages> {
  const png = await withExportState(root, null, () => withHoloLayerStyle(root, { display: 'none' }, () => exportStandardPng(root, borderless)));
  const area = await withExportState(root, holo, () => exportWhiteInkMask(root, false, borderless, false, AREA_PX));
  return { card: await compactCard(png), area };
}

export async function foilInputs(
  holo: HoloSettings | null | undefined,
  layoutType: LayoutType,
  borderless: boolean,
  images: Holo3dImages,
): Promise<FoilInputs> {
  const active = isHoloActive(holo) && effectiveHoloAreas(holo, layoutType, borderless).length > 0;
  const foil = active ? await ensureFoil(holo) : null;
  return { ...images, mask: foil?.maskUrl ?? null, strength: foil && holo ? holo.strength / 100 : 0, pattern: holo?.pattern ?? null };
}
