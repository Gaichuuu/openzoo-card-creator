import type { CardSnapshot } from '@/types/card';

export function trimSnapshotForAutosave(snapshot: CardSnapshot, maxChars: number): CardSnapshot {
  const cardData = { ...snapshot.cardData };
  for (const key of Object.keys(cardData)) {
    const value = cardData[key];
    if (value && value.startsWith('data:') && value.length > maxChars) {
      delete cardData[key];
    }
  }
  const pop = snapshot.popOutUrl;
  const popOutUrl = typeof pop === 'string' && !(pop.startsWith('data:') && pop.length > maxChars) ? pop : null;
  return { ...snapshot, cardData, cardArtUrl: null, popOutUrl };
}
