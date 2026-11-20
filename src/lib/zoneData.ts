import { ZONE_ID_MAPS } from '@/data/layouts';
import { stripParagraphWrap } from '@/lib/textParserUtils';
import type { CardData } from '@/types/card';
import type { LayoutType } from '@/types/layout';

export interface ZoneSource {
  layoutType: LayoutType;
  cardData: CardData;
}

export function zoneValue(s: ZoneSource, key: string, prefix: 't' | 'i' | 's'): string {
  const id = ZONE_ID_MAPS[s.layoutType]?.[key];
  return id == null ? '' : s.cardData[`${prefix}${id}`] || '';
}

export function zoneText(s: ZoneSource, key: string): string {
  return stripParagraphWrap(zoneValue(s, key, 't'));
}
