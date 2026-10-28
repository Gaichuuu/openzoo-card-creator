import { describe, it, expect, beforeEach } from 'vitest';
import { useCardStore } from '@/lib/store';

beforeEach(() => useCardStore.getState().resetCard());

describe('holo store', () => {
  it('setHolo round-trips through getSnapshot', () => {
    const h = { pattern: 'shards' as const, strength: 60, angle: 90 };
    useCardStore.getState().setHolo(h);
    expect(useCardStore.getState().getSnapshot().holo).toEqual(h);
  });
  it('rejects an unknown pattern', () => {
    useCardStore.getState().setHolo({ pattern: 'nope' } as never);
    expect(useCardStore.getState().holo).toBeNull();
  });
  it('resetCard clears holo', () => {
    useCardStore.getState().setHolo({ pattern: 'stars', strength: 50, angle: 0 });
    useCardStore.getState().resetCard();
    expect(useCardStore.getState().holo).toBeNull();
  });
  it('loadSnapshot with no holo gives null', () => {
    const s = useCardStore.getState();
    s.setHolo({ pattern: 'stars', strength: 50, angle: 0 });
    useCardStore.getState().loadSnapshot({ ...s.getSnapshot(), holo: undefined });
    expect(useCardStore.getState().holo).toBeNull();
  });
  it('loadSnapshot sanitizes holo', () => {
    const s = useCardStore.getState();
    s.loadSnapshot({ ...s.getSnapshot(), holo: { pattern: 'stars', strength: 999, angle: 10 } as never });
    expect(useCardStore.getState().holo?.strength).toBe(100);
  });
  it('survives a card type change', () => {
    const h = { pattern: 'bubbles' as const, strength: 40, angle: 5 };
    useCardStore.getState().setHolo(h);
    useCardStore.getState().setCardType('Aura');
    expect(useCardStore.getState().holo).toEqual(h);
  });
});
