import { ZONE_ID_MAPS } from '@/data/layouts';
import { stripHtml } from '@/lib/textParserUtils';
import type { CardSnapshot } from '@/types/card';

const TEXT_KEYS = [
  'MainTextBox', 'MainText',
  'AttackEffect 1', 'AttackEffect',
  'Attack Name 1', 'Attack Name',
  'Boost 1', 'Boost 2',
  'FlavorText',
  'Aura/Terra Text Box', 'Aura/Terra Text Box 1',
];

export function buildCardSearchText(card: CardSnapshot): string {
  const map = ZONE_ID_MAPS[card.layoutType] || {};
  const parts: string[] = [];
  const seen = new Set<string | number>();
  for (const key of TEXT_KEYS) {
    const id = map[key];
    if (id == null || seen.has(id)) continue;
    seen.add(id);
    const value = card.cardData[`t${id}`];
    if (value) parts.push(value);
  }
  return stripHtml(parts.join('\n'))
    .replace(/\{[^{}]*\.(?:png|jpg|webp)[^{}]*\}/gi, ' ')
    .replace(/\{[A-Za-z]+:/g, '')
    .replace(/[{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
