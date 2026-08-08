import type { CustomElementDef, CustomIcon } from '@/types/customIcons';

export const DEFAULT_CUSTOM_BG = '#888888';
export const DEFAULT_CUSTOM_BORDER = '#CCCCCC';

export function isCustomIconValue(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith('data:') || value.startsWith('http');
}

export function customIconToElementDef(icon: CustomIcon): CustomElementDef {
  return {
    name: icon.name || 'Custom',
    icon: icon.image,
    cardBackground: icon.aura?.cardBackground ?? DEFAULT_CUSTOM_BG,
    artBorder: icon.aura?.artBorder ?? DEFAULT_CUSTOM_BORDER,
    strongAgainst: icon.aura?.strongAgainst ?? [],
  };
}
