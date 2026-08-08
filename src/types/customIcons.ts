import type { Element } from './card';

export type CustomIconType = 'set' | 'trait' | 'terra' | 'aura' | 'background';

export interface CustomAuraSettings {
  cardBackground: string;
  artBorder: string;
  strongAgainst: Element[];
}

export interface CustomElementDef extends CustomAuraSettings {
  name: string;
  icon: string;
}

export interface CustomIcon {
  id: string;
  type: CustomIconType;
  name: string;
  image: string;
  aura?: CustomAuraSettings;
  creatorName?: string;
  createdAt: number;
}
