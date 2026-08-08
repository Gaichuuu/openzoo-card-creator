import type { ElementOrCustom, CardType } from '@/types/card';

export function resolveBanner(
  primary: ElementOrCustom | null,
  secondary: ElementOrCustom | null,
  cardType?: CardType,
): string {
  if (primary === 'Custom' || secondary === 'Custom') return 'NeutralAltBanner.png';
  const neutralBanner = cardType === 'Beastie' || cardType === 'Token' || !cardType
    ? 'NeutralBanner.png'
    : 'NeutralAltBanner.png';
  if (!primary || primary === 'Neutral') return neutralBanner;
  if (!secondary || secondary === primary || secondary === 'Neutral') return `${primary}Banner.png`;
  return `${primary}${secondary}Banner.png`;
}
