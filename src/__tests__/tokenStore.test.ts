import { describe, it, expect, beforeEach } from 'vitest';
import { useCardStore } from '@/lib/store';
import { LAYOUTS, TOKEN_LP_ZONE_ID, ZONE_ID_MAPS, findZone } from '@/data/layouts';
import { ATTACK_ZONE_PX, DAMAGE_RED, SPECIAL_TEXT_FONT_PX } from '@/data/constants';

beforeEach(() => useCardStore.getState().resetCard());

const lpText = () => {
  const s = useCardStore.getState();
  return s.cardData[`t${ZONE_ID_MAPS[s.layoutType].LP}`] ?? '';
};
const boxText = () => {
  const s = useCardStore.getState();
  const id = ZONE_ID_MAPS[s.layoutType]['Aura/Terra Text Box'];
  return id == null ? '' : s.cardData[`t${id}`] ?? '';
};

describe('token LP zone', () => {
  it('is a hide-when-empty copy of the Beastie LP zone at the end of the Aura top-right row', () => {
    const topRight = findZone(LAYOUTS.Aura.rootZone, 'TopRight')!;
    const lp = topRight.childZones.at(-1)!;
    expect(lp.id).toBe(TOKEN_LP_ZONE_ID);
    expect(lp.textDataKey).toBe('LP');
    expect(lp.toggleIfNoContent).toBe(true);
    expect(lp.style).toEqual(findZone(LAYOUTS.BasicAttackMain.rootZone, 'LP')!.style);
  });
});

describe('token attack row constants', () => {
  const style = (layout: 'BasicAttackMain' | 'Aura', key: string) => findZone(LAYOUTS[layout].rootZone, key)!.style;

  it('match the Beastie attack zones and the Aura text box font', () => {
    expect(parseFloat(String(style('BasicAttackMain', 'Attack Name 1').fontSize))).toBe(ATTACK_ZONE_PX.name);
    expect(parseFloat(String(style('BasicAttackMain', 'ATKDMG 1').fontSize))).toBe(ATTACK_ZONE_PX.damage);
    expect(parseFloat(String(style('BasicAttackMain', 'AuraAdvantage 1').width))).toBe(ATTACK_ZONE_PX.advantage);
    expect(style('BasicAttackMain', 'ATKDMG 1').color).toBe(DAMAGE_RED);
    expect(parseFloat(String(style('Aura', 'Aura/Terra Text Box').fontSize))).toBe(SPECIAL_TEXT_FONT_PX);
  });
});

describe('token store', () => {
  it('carries a Beastie LP into Token and clears it on Aura', () => {
    const s = useCardStore.getState();
    s.setTextField('LP', '{LP}80');
    s.setCardType('Token');
    expect(lpText()).toContain('{LP}80');
    useCardStore.getState().setCardType('Aura');
    expect(lpText()).toBe('');
  });

  it('gives a Token from an Aura card the default LP', () => {
    const s = useCardStore.getState();
    s.setCardType('Aura');
    s.setCardType('Token');
    expect(lpText()).toContain('{LP}10');
  });

  it('keeps the attack block when switching Beastie to Token and composes it into the box', () => {
    const s = useCardStore.getState();
    s.addEffectBlock('attack');
    s.setCardType('Token');
    const st = useCardStore.getState();
    expect(st.effectBlocks.map((b) => b.type)).toEqual(['attack']);
    expect(boxText()).toContain('{AtkRow:');
  });

  it('drops the blocks a Token cannot have when switching from Beastie', () => {
    const s = useCardStore.getState();
    for (const type of ['tribal-boost', 'contract', 'discard', 'arena', 'attack'] as const) {
      useCardStore.getState().addEffectBlock(type);
    }
    s.setCardType('Token');
    expect(useCardStore.getState().effectBlocks.map((b) => b.type).sort()).toEqual(['arena', 'attack']);
    expect(boxText()).not.toContain('CONTRACT');
    expect(boxText()).not.toContain('DISCARD');
  });

  it('drops the effect blocks and the box on Aura', () => {
    const s = useCardStore.getState();
    s.setCardType('Token');
    useCardStore.getState().addEffectBlock('arena');
    useCardStore.getState().setCardType('Aura');
    expect(useCardStore.getState().effectBlocks).toEqual([]);
    expect(boxText()).toBe('');
  });

  it('keeps trait slots on a Token and clears them on Aura', () => {
    const s = useCardStore.getState();
    s.setCardType('Token');
    useCardStore.getState().setTrait(0, 'Flight');
    const traitImage = () => {
      const st = useCardStore.getState();
      return st.cardData[`i${ZONE_ID_MAPS[st.layoutType].Trait1}`];
    };
    expect(useCardStore.getState().traits[0]).toBe('Flight');
    expect(traitImage()).toBe('OpenZoo Traits/Flight.png');
    useCardStore.getState().setCardType('Aura');
    expect(useCardStore.getState().traits).toEqual([null, null, null]);
    expect(traitImage()).toBe('');
  });

  it('resets the fit when switching between Beastie and Token', () => {
    const s = useCardStore.getState();
    s.setMainTextBoxExtraShrink(-10);
    s.setCardType('Token');
    expect(useCardStore.getState().mainTextBoxExtraShrink).toBe(0);
  });
});
