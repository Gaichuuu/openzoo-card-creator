import type { LayoutType } from './layout';
import type { EffectBlock } from './effects';
import type { Locale } from '@/data/locales';
import type { CustomElementDef } from './customIcons';

export type Element =
  | 'Cosmic'
  | 'Dark'
  | 'Earth'
  | 'Flame'
  | 'Forest'
  | 'Frost'
  | 'Light'
  | 'Lightning'
  | 'Neutral'
  | 'Special'
  | 'Spirit'
  | 'Water';

export type ElementOrCustom = Element | 'Custom';

export type Trait =
  | 'Blood Sucker'
  | 'Burrow'
  | 'Convert'
  | 'Defender'
  | 'Destroyer'
  | 'Equipment'
  | 'Fear'
  | 'First Strike'
  | 'Flash'
  | 'Fleet'
  | 'Flight'
  | 'Immortal'
  | 'Infectious'
  | 'Invisible'
  | 'Magiproof'
  | 'Regen'
  | 'Self Destruct'
  | 'Spectral'
  | 'Stone Skin'
  | 'Trap'
  | 'Unblockable'
  | 'Venomous';

export type Terra =
  | 'Cave'
  | 'City'
  | 'Dawn'
  | 'Daytime'
  | 'Desert'
  | 'Dusk'
  | 'Farm'
  | 'Fog'
  | 'Full Moon'
  | 'Ground'
  | 'Island'
  | 'Lake'
  | 'Lightning Storm'
  | 'Meteor Shower'
  | 'Mountain'
  | 'Nighttime'
  | 'Ocean'
  | 'Raining'
  | 'River'
  | 'Snowing'
  | 'Stars'
  | 'Suburban'
  | 'Swamp'
  | 'Winter'
  | 'Woodlands'
  | 'North Pole';

export type CardType =
  | 'Artifact'
  | 'Aura'
  | 'Beastie'
  | 'Potion'
  | 'Special Aura'
  | 'Special Terra'
  | 'Spell'
  | 'Terra'
  | 'Token';

export type CardData = Record<string, string>;

export type CardTag = 'Playtesting' | 'Mockup' | 'Final' | 'Parody' | 'Proxy' | 'Art Needed';

export const CARD_TAGS: CardTag[] = ['Art Needed', 'Final', 'Mockup', 'Parody', 'Playtesting', 'Proxy'];

export type TextColorKey =
  | 'cardName' | 'typeLine' | 'spellbookText' | 'effectText' | 'attackName' | 'boostText' | 'bottomBarText' | 'credits'
  | 'pillText';

export type CustomColorKey =
  | 'border' | 'spellbookBar' | 'artFrame' | 'effectBox' | 'boostBar' | 'backgroundTint' | 'divider' | 'bottomBar'
  | 'pillFill' | 'pillBorder'
  | TextColorKey;

export interface GradientDef { angle: number; stops: string[] }

export interface CustomStyle {
  colors: Partial<Record<CustomColorKey, string>>;
  outlines?: Partial<Record<TextColorKey, string>>;
  borderGradient?: GradientDef | null;
  nameGradient?: GradientDef | null;
  pillGradient?: GradientDef | null;
}

export type HoloPatternId = 'rainbow' | 'sand' | 'streaks' | 'diamond' | 'bubbles' | 'shards' | 'stars';

export type HoloArea = 'art' | 'border' | 'reverse' | 'card';

export interface HoloSettings {
  pattern: HoloPatternId;
  strength: number;
  angle: number;
  areas?: HoloArea[];
}

export interface CardSnapshot {
  cardType: CardType;
  layoutType: LayoutType;
  cardData: CardData;
  cardName: string;
  tribe: string;
  spellbookLimit: string;
  primaryElement: ElementOrCustom | null;
  secondaryElement: ElementOrCustom | null;
  traits: (string | null)[];
  terras: (string | null)[];
  strongAgainst: (Element | null)[];
  cardArtUrl: string | null;
  effectBlocks: EffectBlock[];
  locale?: Locale;
  borderless?: boolean;
  mainTextBoxNudge?: number;
  mainTextBoxExtraShrink?: number;
  mainTextBoxLineHeight?: number;
  mainTextBoxLetterSpacing?: number;
  attackEffectGap?: number;
  attackNameSize?: number;
  attackEffectSpaced?: boolean;
  cardArtPositionX?: number;
  cardArtPositionY?: number;
  cardArtZoom?: number;
  artNeeded?: boolean;
  customPrimary?: CustomElementDef | null;
  customSecondary?: CustomElementDef | null;
  customStyle?: CustomStyle | null;
  popOutUrl?: string | null;
  holo?: HoloSettings | null;
}

export type CardFitSettings = Pick<CardSnapshot,
  'mainTextBoxNudge' | 'mainTextBoxExtraShrink' | 'mainTextBoxLineHeight' | 'mainTextBoxLetterSpacing'
  | 'attackEffectGap' | 'attackNameSize' | 'cardArtPositionX' | 'cardArtPositionY'
  | 'cardArtZoom' | 'cardType'>;

export interface SavedCard extends CardSnapshot {
  id: string;
  thumbnailUrl: string;
  creatorName: string;
  ownerUid: string | null;
  tags: CardTag[];
  remixedFrom: string | null;
  remixedFromName: string;
  createdAt: Date;
  updatedAt: Date;
}
