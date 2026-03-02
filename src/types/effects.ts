export type EffectBlockType =
  | 'tribal-boost'
  | 'static'
  | 'discard'
  | 'contract'
  | 'enter'
  | 'arena'
  | 'destroyed'
  | 'power'
  | 'attack';

export interface EffectBlock {
  id: string;
  type: EffectBlockType;
  hasStar: boolean;
  text: string;
  powerName: string;
  attackName: string;
  attackDamage: string;
  attackEffect: string;
  attackHasStar: boolean;
  attackBonus: string;
  attackBonus2: string;
  showDivider: boolean;
  statusEffect: string;
  statusEffectDuration: string;
  statusEffect2: string;
  statusEffectDuration2: string;
  boostLabel: string;
  boostTarget: string;
  boostAtk: string;
  boostLp: string;
}

export const BLOCK_ORDER: EffectBlockType[] = [
  'tribal-boost',
  'static',
  'discard',
  'contract',
  'enter',
  'arena',
  'destroyed',
  'power',
  'attack',
];

export const BLOCK_LABELS: Record<EffectBlockType, string> = {
  'tribal-boost': 'Tribal Boost',
  'static': 'Static Effect',
  'discard': 'DISCARD',
  'contract': 'CONTRACT',
  'enter': 'ENTER',
  'arena': 'ARENA',
  'destroyed': 'DESTROYED',
  'power': 'Power',
  'attack': 'Attack',
};

export function createDefaultBlock(type: EffectBlockType): Omit<EffectBlock, 'id'> {
  return {
    type,
    hasStar: type === 'static' || type === 'discard' || type === 'contract',
    text: type === 'static'
      ? 'If {Lightning Storm} is active, this Page has {Fleet}.'
      : type === 'discard'
        ? 'Pay 2 {Water} and say "No, No, No..." to nullify target resolving Page.'
        : type === 'contract'
          ? 'You may only Contract this Page if you are wearing a scarf.'
          : type === 'enter'
            ? 'Destroy a Beastie you control to place any Page from your Spellbook into your Chapter.'
            : type === 'arena'
              ? 'Beasties you control cannot have their Traits nullfiied or removed by Page Effects.'
              : type === 'destroyed'
                ? 'Until the end of the active Caster\'s next turn, {Lightning Storm} is active.'
                : type === 'power'
                  ? 'You may pay 1 {Water} to Bookmark 1.'
                  : '',
    powerName: type === 'power' ? 'Sifting' : '',
    attackName: type === 'attack' ? 'Rushing Waters' : '',
    attackDamage: type === 'attack' ? '50' : '',
    attackEffect: type === 'attack' ? 'If {Lake} is active, all non-{Water} Beasties lose 30 LP until the end of this turn.' : '',
    attackHasStar: type === 'attack',
    attackBonus: '',
    attackBonus2: '',
    showDivider: false,
    statusEffect: '',
    statusEffectDuration: '',
    statusEffect2: '',
    statusEffectDuration2: '',
    boostLabel: 'TRIBAL BOOST',
    boostTarget: 'Sasquatch',
    boostAtk: '+10',
    boostLp: '+10',
  };
}
