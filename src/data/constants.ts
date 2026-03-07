import type { Element, Trait, Terra, CardType } from '@/types/card';
import type { LayoutType } from '@/types/layout';

export const ELEMENTS: Element[] = [
  'Neutral',
  'Cosmic', 'Dark', 'Earth', 'Flame', 'Forest',
  'Frost', 'Light', 'Lightning', 'Special', 'Spirit', 'Water',
];

export const ATTACK_ELEMENTS = ELEMENTS.filter(
  (el) => el !== 'Neutral' && el !== 'Special'
);

export const TRAITS: Trait[] = [
  'Bloodsucker', 'Burrow', 'Convert', 'Defender', 'Destroyer',
  'Equipment', 'Fear', 'First Strike', 'Flash', 'Fleet', 'Flight',
  'Immortal', 'Infectious', 'Invisible', 'Magiproof', 'Regen',
  'Self Destruct', 'Spectral', 'Stoneskin', 'Trap', 'Unblockable', 'Venomous',
];

export const TERRAS: Terra[] = [
  'Cave', 'City', 'Dawn', 'Daytime', 'Desert', 'Dusk', 'Farm', 'Fog',
  'Full Moon', 'Ground', 'Island', 'Lake', 'Lightning Storm', 'Meteor Shower',
  'Mountain', 'Nighttime', 'North Pole', 'Ocean', 'Raining', 'River', 'Snowing',
  'Stars', 'Suburban', 'Swamp', 'Winter', 'Woodlands',
];

export const CARD_TYPES: CardType[] = [
  'Beastie', 'Artifact', 'Spell', 'Potion',
  'Terra', 'Special Terra', 'Aura', 'Special Aura', 'Token',
];

export const TYPES_WITHOUT_TERRA = new Set<CardType>([
  'Potion', 'Artifact', 'Spell', 'Aura', 'Special Aura', 'Terra', 'Special Terra', 'Token',
]);

export const TYPES_WITHOUT_TRAITS = new Set<CardType>([
  'Aura', 'Special Aura', 'Terra', 'Special Terra', 'Token',
]);

export const CARD_TYPE_TO_LAYOUT: Record<CardType, LayoutType> = {
  Artifact: 'BasicAttackMain',
  Aura: 'Aura',
  Beastie: 'BasicAttackMain',
  Potion: 'BasicAttackMain',
  'Special Aura': 'Aura',
  'Special Terra': 'Terra',
  Spell: 'BasicAttackMain',
  Terra: 'Terra',
  Token: 'Aura',
};

export interface AuraColor {
  cardBackground: string;
  artBorder: string;
  artBorderRgba: string;
  bgOverlayRgba: string;
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeAuraColor(cardBg: string, artBorder: string): AuraColor {
  return {
    cardBackground: cardBg,
    artBorder,
    artBorderRgba: hexToRgba(artBorder, 1),
    bgOverlayRgba: hexToRgba(cardBg, 0.65),
  };
}

export const AURA_COLORS: Record<Element, AuraColor> = {
  Water:     makeAuraColor('#2780DD', '#C8E6FD'),
  Flame:     makeAuraColor('#F78B0C', '#F8D42C'),
  Forest:    makeAuraColor('#01762D', '#039F4E'),
  Frost:     makeAuraColor('#A1CBE5', '#E4F0EF'),
  Lightning: makeAuraColor('#E5F20D', '#635561'),
  Earth:     makeAuraColor('#D89A57', '#7F4514'),
  Cosmic:    makeAuraColor('#629C10', '#8D519A'),
  Dark:      makeAuraColor('#000000', '#E42935'),
  Light:     makeAuraColor('#F2EECA', '#4A3593'),
  Spirit:    makeAuraColor('#F93C8C', '#563A84'),
  Neutral:   makeAuraColor('#A2A2A2', '#969696'),
  Special:   makeAuraColor('#DAA520', '#FFD700'),
};

export function resolveArtBorderStyle(
  primary: Element | null,
  secondary: Element | null
): string {
  if (!primary) return '';
  const pc = AURA_COLORS[primary];

  if (primary === 'Light' && (!secondary || secondary === 'Light' || secondary === 'Neutral')) {
    return 'linear-gradient(135deg, #8F00FF 0%, #0000FF 17%, #FFFFFF 33%, #00FF00 50%, #FFFF00 67%, #FF8F00 83%, #FF0000 100%)';
  }

  if (!secondary || secondary === primary || secondary === 'Neutral') {
    return pc.artBorderRgba;
  }
  const sc = AURA_COLORS[secondary];
  return `linear-gradient(90deg, ${pc.artBorderRgba} 0%, ${sc.artBorderRgba} 100%)`;
}

export function resolveBgOverlayStyle(
  primary: Element | null,
  secondary: Element | null
): string {
  if (!primary) return '';
  const pc = AURA_COLORS[primary];

  if (!secondary || secondary === primary || secondary === 'Neutral') {
    return pc.bgOverlayRgba;
  }
  const sc = AURA_COLORS[secondary];
  return `linear-gradient(90deg, ${pc.bgOverlayRgba} 0%, ${sc.bgOverlayRgba} 100%)`;
}

export const AURA_STRENGTHS: Record<Element, Element[]> = {
  Water: ['Flame', 'Earth'],
  Flame: ['Forest', 'Frost'],
  Forest: ['Water'],
  Frost: ['Water'],
  Lightning: ['Water'],
  Earth: ['Lightning'],
  Cosmic: ['Spirit'],
  Dark: ['Spirit', 'Light'],
  Light: ['Dark'],
  Spirit: ['Dark'],
  Neutral: [],
  Special: [],
};

export function computeStrongAgainst(
  primary: Element | null,
  secondary: Element | null,
): Element[] {
  const result: Element[] = [];
  if (primary) result.push(...AURA_STRENGTHS[primary]);
  if (secondary && secondary !== primary) {
    for (const el of AURA_STRENGTHS[secondary]) {
      if (!result.includes(el)) result.push(el);
    }
  }
  return result.slice(0, 4);
}

export const STATUS_EFFECTS = [
  'Burn', 'Confused', 'Frozen', 'Paralyze', 'Scared',
] as const;

export type StatusEffect = (typeof STATUS_EFFECTS)[number];

// Font family constants
export const FONT_BODY = "'EB Garamond', serif";
export const FONT_CAMBRIA = "'EB Garamond', 'Cambria', 'Times New Roman', serif";

// Shared style override constants used by EditorSidebar and store
export const STYLE_TYPES_TRIBES = '{fontSize:9px;maxHeight:none;justifyContent:flex-start;paddingLeft:2px}';
export const STYLE_TYPES_TRIBES_TOKEN = '{fontSize:9px;height:10px;maxHeight:none;justifyContent:flex-start;paddingLeft:2px}';
// Same style as TypesTribes — both are TNL child zones with identical base overrides
export const STYLE_SPELLBOOK_LIMIT = STYLE_TYPES_TRIBES;
export const STYLE_TNL = '{flex:1;minWidth:0;alignItems:stretch}';
export const STYLE_TNL_TOKEN = '{flex:1;minWidth:0;alignItems:stretch;justifyContent:flex-end}';
export const STYLE_CARD_NAME = '{maxHeight:23px;justifyContent:flex-start;paddingLeft:2px;outlineWidth:0px}';
export const STYLE_LP = '{fontSize:19px}';
export const STYLE_FLAVOR_TEXT = '{left:95px;justifyContent:flex-end}';

const DARK_GRADIENT = 'linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))';
export const BORDERLESS_ART_STYLE = `{left:0px;top:0px;width:238px;height:333px;backgroundImage:${DARK_GRADIENT}}`;
export const TERRA_GRADIENT_STYLE = `{backgroundImage:${DARK_GRADIENT}}`;
