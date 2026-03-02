import { describe, it, expect } from 'vitest';
import {
  sortBlocks,
  composeKeywordBlock,
  composePowerBlock,
  composeMainText,
  composeBoosts,
  composeAttackName,
  composeAttack,
  composeEffectBlocks,
} from '@/lib/effectComposer';
import type { EffectBlock, EffectBlockType } from '@/types/effects';

function makeBlock(overrides: Partial<EffectBlock> & { type: EffectBlockType }): EffectBlock {
  return {
    id: 'test',
    hasStar: false,
    text: '',
    powerName: '',
    attackName: '',
    attackDamage: '',
    attackEffect: '',
    attackHasStar: false,
    attackBonus: '',
    attackBonus2: '',
    showDivider: false,
    statusEffect: '',
    statusEffectDuration: '',
    statusEffect2: '',
    statusEffectDuration2: '',
    boostLabel: '',
    boostTarget: '',
    boostAtk: '',
    boostLp: '',
    ...overrides,
  };
}

describe('sortBlocks', () => {
  it('sorts by BLOCK_ORDER', () => {
    const blocks = [
      makeBlock({ type: 'attack', id: 'a' }),
      makeBlock({ type: 'tribal-boost', id: 'b' }),
      makeBlock({ type: 'static', id: 'c' }),
    ];
    const sorted = sortBlocks(blocks);
    expect(sorted.map(b => b.type)).toEqual(['tribal-boost', 'static', 'attack']);
  });

  it('does not mutate original array', () => {
    const blocks = [
      makeBlock({ type: 'power', id: 'a' }),
      makeBlock({ type: 'enter', id: 'b' }),
    ];
    const original = [...blocks];
    sortBlocks(blocks);
    expect(blocks.map(b => b.id)).toEqual(original.map(b => b.id));
  });
});

describe('composeKeywordBlock', () => {
  it('returns empty for empty text', () => {
    expect(composeKeywordBlock(makeBlock({ type: 'static' }))).toBe('');
  });

  it('composes static block without star', () => {
    expect(composeKeywordBlock(makeBlock({ type: 'static', text: 'Effect text' }))).toBe('Effect text');
  });

  it('composes static block with star', () => {
    const result = composeKeywordBlock(makeBlock({ type: 'static', text: 'Effect', hasStar: true }));
    expect(result).toBe('{Star}**:** {I:Effect}');
  });

  it('composes DISCARD keyword', () => {
    const result = composeKeywordBlock(makeBlock({ type: 'discard', text: 'Do something' }));
    expect(result).toBe('**DISCARD:** Do something');
  });

  it('composes ENTER keyword with star', () => {
    const result = composeKeywordBlock(makeBlock({ type: 'enter', text: 'Effect', hasStar: true }));
    expect(result).toBe('{Star}**ENTER:** {I:Effect}');
  });

  it('returns empty for non-keyword block type', () => {
    expect(composeKeywordBlock(makeBlock({ type: 'power', text: 'text' }))).toBe('');
  });

  it('composes Japanese locale with fullwidth colon', () => {
    const result = composeKeywordBlock(makeBlock({ type: 'discard', text: 'Effect' }), 'ja');
    expect(result).toBe('**破棄：**Effect');
  });
});

describe('composePowerBlock', () => {
  it('returns empty for empty name and text', () => {
    expect(composePowerBlock(makeBlock({ type: 'power' }))).toBe('');
  });

  it('composes power with name and text', () => {
    const result = composePowerBlock(makeBlock({ type: 'power', powerName: 'Sifting', text: 'Draw 1' }));
    expect(result).toBe('{Power:Sifting} Draw 1');
  });

  it('composes power with name only', () => {
    const result = composePowerBlock(makeBlock({ type: 'power', powerName: 'Ability' }));
    expect(result).toBe('{Power:Ability}');
  });

  it('composes power with star and text', () => {
    const result = composePowerBlock(makeBlock({ type: 'power', powerName: 'X', text: 'Y', hasStar: true }));
    expect(result).toBe('{Star}{Power:X} {I:Y}');
  });

  it('composes power with star, name only', () => {
    const result = composePowerBlock(makeBlock({ type: 'power', powerName: 'X', hasStar: true }));
    expect(result).toBe('{Star}{Power:X}');
  });
});

describe('composeMainText', () => {
  it('returns empty for no blocks', () => {
    expect(composeMainText([])).toBe('');
  });

  it('composes single static block', () => {
    const result = composeMainText([makeBlock({ type: 'static', text: 'Hello' })]);
    expect(result).toBe('Hello');
  });

  it('joins keyword blocks with separator', () => {
    const result = composeMainText([
      makeBlock({ type: 'static', text: 'A', id: '1' }),
      makeBlock({ type: 'enter', text: 'B', id: '2' }),
    ]);
    expect(result).toBe('A / **ENTER:** B');
  });

  it('joins power blocks with <br/> separator', () => {
    const result = composeMainText([
      makeBlock({ type: 'static', text: 'A', id: '1' }),
      makeBlock({ type: 'power', powerName: 'X', text: 'Y', id: '2' }),
    ]);
    expect(result).toBe('A<br/>{Power:X} Y');
  });

  it('excludes tribal-boost and attack blocks', () => {
    const result = composeMainText([
      makeBlock({ type: 'static', text: 'A', id: '1' }),
      makeBlock({ type: 'tribal-boost', text: 'ignored', id: '2' }),
      makeBlock({ type: 'attack', text: 'ignored', id: '3' }),
    ]);
    expect(result).toBe('A');
  });

  it('sorts blocks before composing', () => {
    const result = composeMainText([
      makeBlock({ type: 'destroyed', text: 'D', id: '1' }),
      makeBlock({ type: 'static', text: 'S', id: '2' }),
    ]);
    expect(result).toBe('S / **DESTROYED:** D');
  });
});

describe('composeBoosts', () => {
  it('returns empty pair for no boost blocks', () => {
    expect(composeBoosts([])).toEqual(['', '']);
  });

  it('composes a tribal boost', () => {
    const block = makeBlock({
      type: 'tribal-boost',
      boostLabel: 'TRIBAL BOOST',
      boostTarget: 'Sasquatch',
      boostAtk: '+10',
      boostLp: '+10',
    });
    const [b1, b2] = composeBoosts([block]);
    expect(b1).toContain('TRIBAL BOOST');
    expect(b1).toContain('+10 ATK/+10 LP');
    expect(b2).toBe('');
  });

  it('composes an aura boost', () => {
    const block = makeBlock({
      type: 'tribal-boost',
      boostLabel: 'AURA BOOST',
      boostTarget: 'Water',
      boostAtk: '+20',
      boostLp: '+20',
    });
    const [b1] = composeBoosts([block]);
    expect(b1).toContain('AURA BOOST');
    expect(b1).toContain('W{SC:ater}');
  });

  it('returns empty for incomplete boost', () => {
    const block = makeBlock({
      type: 'tribal-boost',
      boostLabel: 'TRIBAL BOOST',
      boostTarget: '',
      boostAtk: '+10',
      boostLp: '+10',
    });
    expect(composeBoosts([block])).toEqual(['', '']);
  });

  it('composes Japanese boost', () => {
    const block = makeBlock({
      type: 'tribal-boost',
      boostLabel: 'TRIBAL BOOST',
      boostTarget: 'Sasquatch',
      boostAtk: '+10',
      boostLp: '+10',
    });
    const [b1] = composeBoosts([block], 'ja');
    expect(b1).toContain('種族強化');
    expect(b1).toContain('：');
  });

  it('caps at 2 boosts', () => {
    const blocks = [0, 1, 2].map((i) =>
      makeBlock({
        type: 'tribal-boost',
        id: String(i),
        boostLabel: 'TRIBAL BOOST',
        boostTarget: 'X',
        boostAtk: '+1',
        boostLp: '+1',
      })
    );
    const [b1, b2] = composeBoosts(blocks);
    expect(b1).not.toBe('');
    expect(b2).not.toBe('');
  });
});

describe('composeAttackName', () => {
  it('composes basic attack name with small caps', () => {
    const block = makeBlock({ type: 'attack', attackName: 'Rushing Waters' });
    expect(composeAttackName(block)).toBe('R{SC:ushing} W{SC:aters}');
  });

  it('composes attack with status effect', () => {
    const block = makeBlock({ type: 'attack', attackName: 'Bite', statusEffect: 'Burn' });
    const result = composeAttackName(block);
    expect(result).toContain('B{SC:ite}');
    expect(result).toContain('{OpenZoo Status Effects/Burn.png, 0.9, 0.1}');
  });

  it('composes attack with status effect and duration', () => {
    const block = makeBlock({
      type: 'attack',
      attackName: 'Chill',
      statusEffect: 'Frozen',
      statusEffectDuration: '2',
    });
    const result = composeAttackName(block);
    expect(result).toContain('{Num:(2)}');
  });

  it('composes attack with two status effects', () => {
    const block = makeBlock({
      type: 'attack',
      attackName: 'Hit',
      statusEffect: 'Burn',
      statusEffect2: 'Scared',
    });
    const result = composeAttackName(block);
    expect(result).toContain('Burn.png');
    expect(result).toContain('Scared.png');
  });

  it('returns empty for no attack name', () => {
    expect(composeAttackName(makeBlock({ type: 'attack' }))).toBe('');
  });

  it('skips small caps for Japanese', () => {
    const block = makeBlock({ type: 'attack', attackName: 'Rushing Waters' });
    expect(composeAttackName(block, 'ja')).toBe('Rushing Waters');
  });
});

describe('composeAttack', () => {
  it('returns null when no attack block', () => {
    expect(composeAttack([makeBlock({ type: 'static' })])).toBeNull();
  });

  it('returns the attack block', () => {
    const attack = makeBlock({ type: 'attack', id: 'atk' });
    expect(composeAttack([makeBlock({ type: 'static' }), attack])).toBe(attack);
  });
});

describe('composeEffectBlocks', () => {
  it('returns empty patch for empty blocks', () => {
    const patch = composeEffectBlocks([], 'BasicAttackMain');
    expect(patch).toBeDefined();
    expect(typeof patch).toBe('object');
  });

  it('populates main text zone for static block', () => {
    const patch = composeEffectBlocks(
      [makeBlock({ type: 'static', text: 'Hello' })],
      'BasicAttackMain',
      'Beastie',
    );
    const hasMainText = Object.values(patch).some(v => v.includes('Hello'));
    expect(hasMainText).toBe(true);
  });

  it('wraps main text in <p> tags', () => {
    const patch = composeEffectBlocks(
      [makeBlock({ type: 'static', text: 'Hello' })],
      'BasicAttackMain',
    );
    const mainTextEntry = Object.values(patch).find(v => v.includes('Hello'));
    expect(mainTextEntry).toBe('<p>Hello</p>');
  });

  it('populates attack zones', () => {
    const patch = composeEffectBlocks(
      [makeBlock({ type: 'attack', attackName: 'Slash', attackDamage: '30' })],
      'BasicAttackMain',
    );
    const hasAttackName = Object.values(patch).some(v => v.includes('S{SC:lash}'));
    const hasAttackDmg = Object.values(patch).some(v => v.includes('30'));
    expect(hasAttackName).toBe(true);
    expect(hasAttackDmg).toBe(true);
  });

  it('handles borderless divider style', () => {
    const patch = composeEffectBlocks(
      [makeBlock({ type: 'attack', attackName: 'X', attackDamage: '10', showDivider: true })],
      'BasicAttackMain',
      'Beastie',
      'en',
      true,
    );
    const hasBorderlessDivider = Object.values(patch).some(v =>
      v.includes('linear-gradient(90deg, rgba(255,255,255,0)')
    );
    expect(hasBorderlessDivider).toBe(true);
  });
});
