export interface Zone {
  id: number | string;
  type: 'image' | 'text' | 'container';
  imageDataKey: string;
  textDataKey: string;
  image: string;
  text: string;
  style: Record<string, string | number | null>;
  toggleIfNoContent: boolean;
  isStatic: boolean;
  allowTextShrink: boolean;
  allowTextSquash: boolean;
  rotation: number;
  childZones: Zone[];
}

export interface LayoutData {
  name: string;
  cardSize: string;
  rootZone: Zone;
}

export type LayoutType =
  | 'BasicNoAttack'
  | 'BasicOnlyAttack'
  | 'BasicAttackMain'
  | 'Aura'
  | 'Terra';

export interface ZoneIdMap {
  [semanticKey: string]: number | string;
}
