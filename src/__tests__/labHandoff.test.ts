import { describe, expect, it } from 'vitest';
import { handoffIdFrom, shouldRestoreLabCard, type LabCard } from '@/components/holo-lab/labHandoff';
import type { CardSnapshot } from '@/types/card';

const snap = (o: Partial<CardSnapshot>) => ({ cardName: 'Mothman', layoutType: 'BasicNoAttack', cardData: {}, popOutUrl: null, ...o }) as CardSnapshot;
const saved = (s: unknown, savedAt = 1000): LabCard => ({ snapshot: s as CardSnapshot, savedAt });
const ART = { i6: 'data:image/png;base64,AAAA' };

describe('shouldRestoreLabCard', () => {
  it('restores the exact handoff this tab was opened for, whatever the store shows', () => {
    expect(shouldRestoreLabCard(saved(snap({ cardName: 'Other' }), 42), snap({}), 42)).toBe(true);
  });

  it('does not treat a newer handoff from another click as this one', () => {
    expect(shouldRestoreLabCard(saved(snap({ cardName: 'Other' }), 43), snap({}), 42)).toBe(false);
  });

  it('restores images a reload lost, for the same card only', () => {
    expect(shouldRestoreLabCard(saved(snap({ cardData: ART })), snap({}), null)).toBe(true);
    expect(shouldRestoreLabCard(saved(snap({ cardData: ART, cardName: 'Other' })), snap({}), null)).toBe(false);
    expect(shouldRestoreLabCard(saved(snap({})), snap({ cardData: ART }), null)).toBe(false);
  });

  it('survives hand-edited snapshots without throwing', () => {
    for (const bad of [null, 'card', { cardName: 'Mothman', layoutType: 'BasicNoAttack' }, snap({ cardData: { t1: 5 } as unknown as Record<string, string> })]) {
      expect(() => shouldRestoreLabCard(saved(bad), snap({}), null)).not.toThrow();
    }
  });
});

describe('handoffIdFrom', () => {
  it('reads a positive integer id and rejects anything else', () => {
    expect(handoffIdFrom('?handoff=1761400000000')).toBe(1761400000000);
    for (const q of ['', '?handoff=', '?handoff=abc', '?handoff=-5', '?handoff=1.5']) expect(handoffIdFrom(q)).toBeNull();
  });
});
