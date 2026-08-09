import { describe, it, expect } from 'vitest';
import { computeTextBoxReserve, TEXT_BOX_RESERVE_FULL, TEXT_BOX_RESERVE_MIN } from '@/lib/textBoxReserve';
import { ZONE_ID_MAPS } from '@/data/layouts';

const map = ZONE_ID_MAPS['BasicAttackMain'];
const flavorKey = `t${map['FlavorText']}`;
const sauraKey = `i${map['SAura1']}`;

describe('computeTextBoxReserve', () => {
  it('reserves the full strip when flavor text is present', () => {
    expect(computeTextBoxReserve('BasicAttackMain', { [flavorKey]: '<p>Some flavor.</p>' }, false))
      .toBe(TEXT_BOX_RESERVE_FULL);
  });

  it('reserves the full strip when a strong-against icon is present', () => {
    expect(computeTextBoxReserve('BasicAttackMain', { [sauraKey]: 'Water.png' }, false))
      .toBe(TEXT_BOX_RESERVE_FULL);
  });

  it('reserves only the minimum when the strip is empty', () => {
    expect(computeTextBoxReserve('BasicAttackMain', {}, false)).toBe(TEXT_BOX_RESERVE_MIN);
  });

  it('treats empty paragraph flavor as absent', () => {
    expect(computeTextBoxReserve('BasicAttackMain', { [flavorKey]: '<p></p>' }, false))
      .toBe(TEXT_BOX_RESERVE_MIN);
  });

  it('reserves only the minimum on borderless cards (strip is hidden)', () => {
    const data = { [flavorKey]: '<p>Some flavor.</p>', [sauraKey]: 'Water.png' };
    expect(computeTextBoxReserve('BasicAttackMain', data, true)).toBe(TEXT_BOX_RESERVE_MIN);
  });

  it('applies to all three Basic layouts', () => {
    for (const layout of ['BasicNoAttack', 'BasicOnlyAttack', 'BasicAttackMain'] as const) {
      const m = ZONE_ID_MAPS[layout];
      expect(computeTextBoxReserve(layout, { [`i${m['SAura1']}`]: 'Water.png' }, false))
        .toBe(TEXT_BOX_RESERVE_FULL);
      expect(computeTextBoxReserve(layout, {}, false)).toBe(TEXT_BOX_RESERVE_MIN);
    }
  });
});
