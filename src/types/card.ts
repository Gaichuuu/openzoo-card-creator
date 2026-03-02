import type { LayoutType } from './layout';
import type { EffectBlock } from './effects';
import type { Locale } from '@/data/locales';

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

export type Trait =
  | 'Bloodsucker'
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
  | 'Stoneskin'
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

export type CardTag = 'Playtesting' | 'Mockup' | 'Final' | 'Parody' | 'Proxy';

export const CARD_TAGS: CardTag[] = ['Playtesting', 'Mockup', 'Final', 'Parody', 'Proxy'];

export const TAG_COLORS: Record<CardTag, { bg: string; text: string }> = {
  Playtesting: { bg: 'bg-yellow-900', text: 'text-yellow-300' },
  Mockup:      { bg: 'bg-blue-900',   text: 'text-blue-300' },
  Final:       { bg: 'bg-green-900',  text: 'text-green-300' },
  Parody:      { bg: 'bg-purple-900', text: 'text-purple-300' },
  Proxy:       { bg: 'bg-orange-900', text: 'text-orange-300' },
};

export interface CardSnapshot {
  cardType: CardType;
  layoutType: LayoutType;
  cardData: CardData;
  cardName: string;
  tribe: string;
  spellbookLimit: string;
  primaryElement: Element | null;
  secondaryElement: Element | null;
  traits: (string | null)[];
  terras: (string | null)[];
  strongAgainst: (Element | null)[];
  cardArtUrl: string | null;
  effectBlocks: EffectBlock[];
  locale?: Locale;
  borderless?: boolean;
  mainTextBoxNudge?: number;
  mainTextBoxExtraShrink?: number;
  cardArtPositionX?: number;
  cardArtPositionY?: number;
}

export interface SavedCard extends CardSnapshot {
  id: string;
  thumbnailUrl: string;
  creatorName: string;
  tags: CardTag[];
  remixedFrom: string | null;
  remixedFromName: string;
  createdAt: Date;
  updatedAt: Date;
}
