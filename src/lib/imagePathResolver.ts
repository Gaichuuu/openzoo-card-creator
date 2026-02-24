/**
 * Resolves Dextrous image paths to local asset paths.
 *
 * Dextrous stores paths like "OpenZoo Banners/NeutralBanner.png"
 * or bare filenames like "Cost1.png" with a defaultImageFolders context.
 * We map these to /assets/... paths.
 */

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

  // If it's already a data URL, blob URL, or absolute URL, return as-is
  if (rawPath.startsWith('data:') || rawPath.startsWith('blob:') || rawPath.startsWith('http') || rawPath.startsWith('/assets/')) {
    return rawPath;
  }

  for (const [dexFolder, localFolder] of Object.entries(FOLDER_MAP)) {
    if (rawPath.startsWith(dexFolder + '/')) {
      const filename = rawPath.slice(dexFolder.length + 1);
      return `${localFolder}/${filename}`;
    }
  }

  // For bare filenames, try common asset directories
  // The banner resolver already gives us just the filename
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

  // Default: assume it's relative to assets
  return `/assets/${rawPath}`;
}
