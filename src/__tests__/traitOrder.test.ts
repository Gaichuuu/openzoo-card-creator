import { describe, it, expect } from 'vitest';
import { sortTraits, TRAIT_ORDER } from '@/lib/traitOrder';
import { TRAITS } from '@/data/constants';

describe('sortTraits', () => {
  it('orders Contract, then Arena-entry, then alphabetical traits', () => {
    expect(sortTraits(['Flight', 'Flash', null])).toEqual(['Flash', 'Flight', null]);
    expect(sortTraits(['Stone Skin', 'Defender', 'Fear'])).toEqual(['Fear', 'Defender', 'Stone Skin']);
    expect(sortTraits(['Convert', 'Trap', 'Equipment'])).toEqual(['Trap', 'Equipment', 'Convert']);
  });

  it('moves empty slots to the end and keeps length', () => {
    expect(sortTraits([null, 'Regen', 'Fleet'])).toEqual(['Fleet', 'Regen', null]);
    expect(sortTraits([null, null, null])).toEqual([null, null, null]);
  });

  it('sorts unknown names after known ones', () => {
    expect(sortTraits(['Zeta', 'Alpha', 'Fear'])).toEqual(['Fear', 'Alpha', 'Zeta']);
  });

  it('ranks every trait asset', () => {
    for (const t of TRAITS) expect(TRAIT_ORDER).toContain(t);
  });
});
