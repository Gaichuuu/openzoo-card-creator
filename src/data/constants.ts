import type { Element, Trait, Terra, CardType } from '@/types/card';
import type { LayoutType } from '@/types/layout';

export const ELEMENTS: Element[] = [
  'Neutral',
  'Cosmic', 'Dark', 'Earth', 'Flame', 'Forest',
  'Frost', 'Light', 'Lightning', 'Special', 'Spirit', 'Water',
];

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
  'Terra', 'Special Terra', 'Aura', 'Special Aura',
];

export const CARD_TYPE_TO_LAYOUT: Record<CardType, LayoutType> = {
  Artifact: 'BasicAttackMain',
  Aura: 'Aura',
  Beastie: 'BasicAttackMain',
  Potion: 'BasicAttackMain',
  'Special Aura': 'Aura',
  'Special Terra': 'Terra',
  Spell: 'BasicAttackMain',
  Terra: 'Terra',
};

/**
 * Aura color definitions from aura-colors.csv.
 * Each element has a Card Background color and an Art Border color.
 * When an element is selected:
 *   - ArtBorder style = Art Border color (full opacity)
 *   - BackgroundColor style = Card Background color at 0.65 opacity
 * For dual elements, both become linear gradients (primary -> secondary).
 */
export interface AuraColor {
  cardBackground: string;  // hex color
  artBorder: string;       // hex color
  /** RGBA with full opacity for art border */
  artBorderRgba: string;
  /** RGBA at 0.65 opacity for background overlay */
  bgOverlayRgba: string;
}

function hexToRgba(hex: string, alpha: number): string {
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

/**
 * Resolves art border CSS background for element selection.
 * Single: solid color. Dual: linear gradient.
 * Light alone gets a rainbow gradient.
 */
export function resolveArtBorderStyle(
  primary: Element | null,
  secondary: Element | null
): string {
  if (!primary) return '';
  const pc = AURA_COLORS[primary];

  // Light alone = rainbow gradient
  if (primary === 'Light' && (!secondary || secondary === 'Light')) {
    return 'linear-gradient(135deg, #8F00FF 0%, #0000FF 17%, #FFFFFF 33%, #00FF00 50%, #FFFF00 67%, #FF8F00 83%, #FF0000 100%)';
  }

  if (!secondary || secondary === primary) {
    return pc.artBorderRgba;
  }
  const sc = AURA_COLORS[secondary];
  return `linear-gradient(90deg, ${pc.artBorderRgba} 0%, ${sc.artBorderRgba} 100%)`;
}

/**
 * Resolves background overlay CSS for element selection.
 * Single: solid color at 0.65 opacity. Dual: linear gradient of both at 0.65.
 */
export function resolveBgOverlayStyle(
  primary: Element | null,
  secondary: Element | null
): string {
  if (!primary) return '';
  const pc = AURA_COLORS[primary];

  if (!secondary || secondary === primary) {
    return pc.bgOverlayRgba;
  }
  const sc = AURA_COLORS[secondary];
  return `linear-gradient(90deg, ${pc.bgOverlayRgba} 0%, ${sc.bgOverlayRgba} 100%)`;
}

/**
 * Aura strength chart: each element's list of elements it is strong against.
 */
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

/**
 * Compute the Strong Against elements for a primary/secondary element pair.
 * Returns a deduplicated array (max 4).
 */
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
