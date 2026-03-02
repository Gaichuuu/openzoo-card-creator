import type { Element, CardType } from '@/types/card';

export function resolveBanner(
  primary: Element | null,
  secondary: Element | null,
  cardType?: CardType,
): string {
  const neutralBanner = cardType === 'Beastie' || cardType === 'Token' || !cardType
    ? 'NeutralBanner.png'
    : 'NeutralAltBanner.png';
  if (!primary || primary === 'Neutral') return neutralBanner;
  if (!secondary || secondary === primary || secondary === 'Neutral') return `${primary}Banner.png`;
  return `${primary}${secondary}Banner.png`;
}
