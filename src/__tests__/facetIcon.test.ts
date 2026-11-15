import { describe, expect, it } from 'vitest';
import { ELEMENTS, TERRAS, TRAITS } from '@/data/constants';
import { facetIcon, type FacetIconDir } from '@/lib/facetIcon';

const files = new Set(Object.keys(import.meta.glob('/public/assets/facet-icons/*/*.webp')));
const missing = (dir: FacetIconDir, names: readonly string[]) =>
  names.filter((name) => !files.has(`/public${decodeURIComponent(facetIcon(dir, name))}`));

describe('facet icons', () => {
  it('has a small icon for every aura, terra and trait (run scripts/temp/generateFacetIcons.sh)', () => {
    expect(missing('AuraSymbols', ELEMENTS.filter((e) => e !== 'Special'))).toEqual([]);
    expect(missing('TerraNoGlow', TERRAS)).toEqual([]);
    expect(missing('TraitsNoGlow', TRAITS)).toEqual([]);
  });

  it('encodes names with spaces', () => {
    expect(facetIcon('TerraNoGlow', 'Full Moon')).toBe('/assets/facet-icons/TerraNoGlow/Full%20Moon.webp');
  });
});
