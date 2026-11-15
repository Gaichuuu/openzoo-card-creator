import type { SavedCard } from '@/types/card';

export function gridThumbOf(card: SavedCard): string {
  return card.gridThumbUrl || card.thumbnailUrl;
}
