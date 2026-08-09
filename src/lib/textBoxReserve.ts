import { ZONE_ID_MAPS } from '@/data/layouts';
import { stripHtml } from '@/lib/textParserUtils';
import type { LayoutType } from '@/types/layout';
import type { CardData } from '@/types/card';

export const TEXT_BOX_RESERVE_FULL = 23;
export const TEXT_BOX_RESERVE_MIN = 2;

export function computeTextBoxReserve(
  layoutType: LayoutType,
  cardData: CardData,
  borderless: boolean,
): number {
  if (borderless) return TEXT_BOX_RESERVE_MIN;
  const map = ZONE_ID_MAPS[layoutType];
  if (!map) return TEXT_BOX_RESERVE_MIN;

  const flavorId = map['FlavorText'];
  if (flavorId != null && stripHtml(cardData[`t${flavorId}`] || '').trim()) {
    return TEXT_BOX_RESERVE_FULL;
  }

  for (const key of ['SAura1', 'SAura2', 'SAura3', 'SAura4']) {
    const id = map[key];
    if (id != null && (cardData[`i${id}`] || '').trim()) {
      return TEXT_BOX_RESERVE_FULL;
    }
  }

  return TEXT_BOX_RESERVE_MIN;
}
