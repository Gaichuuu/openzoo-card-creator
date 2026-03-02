const FOLDER_MAP: Record<string, string> = {
  'OpenZoo Banners': '/assets/Banners',
  'OpenZoo Background': '/assets',
  'OpenZoo Backgrounds': '/assets',
  'OpenZoo Aura': '/assets/AuraSymbols',
  'OpenZoo Cost Boxes': '/assets/AuraSymbols',
  'OpenZoo Terra': '/assets/TerraNoGlow',
  'OpenZoo Traits': '/assets/TraitsNoGlow',
  'OpenZoo Set Symbols': '/assets/SetSymbols',
  'OpenZoo Status Effects': '/assets/StatusEffects',
  'StatusEffect Symbols': '/assets/StatusEffects',
  'OpenZooMisc': '/assets',
};

export function resolveImagePath(rawPath: string): string {
  if (!rawPath || rawPath === 'default_image') return '';

  if (rawPath.startsWith('data:') || rawPath.startsWith('blob:') || rawPath.startsWith('http') || rawPath.startsWith('/assets/')) {
    return rawPath;
  }

  for (const [dexFolder, localFolder] of Object.entries(FOLDER_MAP)) {
    if (rawPath.startsWith(dexFolder + '/')) {
      const filename = rawPath.slice(dexFolder.length + 1);
      return `${localFolder}/${filename}`;
    }
  }

  if (rawPath.endsWith('Banner.png')) {
    return `/assets/Banners/${rawPath}`;
  }

  if (['Cosmic', 'Dark', 'Earth', 'Flame', 'Forest', 'Frost', 'Light', 'Lightning', 'Neutral', 'Special', 'Spirit', 'Water']
    .some(el => rawPath === `${el}.png`)) {
    return `/assets/AuraSymbols/${rawPath}`;
  }

  if (rawPath.startsWith('OZLegacy') || rawPath === 'MetaPoo.png' || rawPath === 'Promo.png') {
    return `/assets/SetSymbols/${rawPath}`;
  }

  return `/assets/${rawPath}`;
}
