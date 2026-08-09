import { describe, it, expect } from 'vitest';
import { buildCardSearchText } from '@/lib/cardSearchText';
import { ZONE_ID_MAPS } from '@/data/layouts';
import type { CardSnapshot } from '@/types/card';

function makeCard(layoutType: CardSnapshot['layoutType'], zones: Record<string, string>): CardSnapshot {
  const map = ZONE_ID_MAPS[layoutType];
  const cardData: Record<string, string> = {};
  for (const [key, value] of Object.entries(zones)) {
    cardData[`t${map[key]}`] = value;
  }
  return { layoutType, cardType: 'Beastie', cardName: 'Test', cardData } as CardSnapshot;
}

describe('buildCardSearchText', () => {
  it('includes main effect text with markup stripped', () => {
    const card = makeCard('BasicAttackMain', {
      MainTextBox: '<p>**ARENA:** Beasties gain {B:+10 ATK}.</p>',
    });
    expect(buildCardSearchText(card)).toContain('beasties gain +10 atk');
  });

  it('includes flavor text', () => {
    const card = makeCard('BasicAttackMain', {
      FlavorText: '<p>A gentle giant of the mountains.</p>',
    });
    expect(buildCardSearchText(card)).toContain('gentle giant');
  });

  it('unwraps small caps in attack names', () => {
    const card = makeCard('BasicAttackMain', {
      'Attack Name 1': '<p>V{SC:igilant} S{SC:tampede}</p>',
    });
    expect(buildCardSearchText(card)).toContain('vigilant stampede');
  });

  it('drops inline icon references but keeps variable names', () => {
    const card = makeCard('BasicAttackMain', {
      MainTextBox: '<p>If {OpenZoo Status Effects/Frozen.png, 0.9, 0.1} is active, gain {Fleet}.</p>',
    });
    const text = buildCardSearchText(card);
    expect(text).not.toContain('png');
    expect(text).toContain('fleet');
  });

  it('reads the aura text box for Aura layouts', () => {
    const card = makeCard('Aura', {
      'Aura/Terra Text Box': '<p>{I:Draw two cards.}</p>',
    });
    expect(buildCardSearchText(card)).toContain('draw two cards');
  });

  it('returns empty string when no text zones are set', () => {
    const card = makeCard('BasicAttackMain', {});
    expect(buildCardSearchText(card)).toBe('');
  });
});
