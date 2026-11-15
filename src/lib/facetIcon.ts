export type FacetIconDir = 'AuraSymbols' | 'TerraNoGlow' | 'TraitsNoGlow';

export function facetIcon(dir: FacetIconDir, name: string): string {
  return `/assets/facet-icons/${dir}/${encodeURIComponent(name)}.webp`;
}
