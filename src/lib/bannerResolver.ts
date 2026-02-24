import type { Element, CardType } from '@/types/card';

/**
 * Resolves element selection(s) to a banner image filename.
 * Single element: "FlameBanner.png"
 * Dual elements: "FlameFrostBanner.png"
 * Beastie uses NeutralBanner.png; all other types use NeutralAltBanner.png.
 */
export function resolveBanner(
  primary: Element | null,
  secondary: Element | null,
  cardType?: CardType,
): string {
  const neutralBanner = cardType === 'Beastie' || !cardType
    ? 'NeutralBanner.png'
    : 'NeutralAltBanner.png';
  if (!primary || primary === 'Neutral') return neutralBanner;
  if (!secondary || secondary === primary) return `${primary}Banner.png`;
  return `${primary}${secondary}Banner.png`;
}
