export type Locale = 'en' | 'ja';

const translations: Record<string, Record<Locale, string>> = {
  'Beastie': { en: 'Beastie', ja: 'ビースティ' },
  'Artifact': { en: 'Artifact', ja: '秘宝' },
  'Spell': { en: 'Spell', ja: '呪文' },
  'Potion': { en: 'Potion', ja: '薬' },
  'Aura': { en: 'Aura', ja: 'オーラ' },
  'Special Aura': { en: 'Special Aura', ja: '特別オーラ' },
  'Special Terra': { en: 'Special Terra', ja: '特別テラ' },
  'Token': { en: 'Token', ja: 'トークン' },
  'Neutral': { en: 'Neutral', ja: '無' },
  'Cosmic': { en: 'Cosmic', ja: '宇宙' },
  'Dark': { en: 'Dark', ja: '闇' },
  'Earth': { en: 'Earth', ja: '地' },
  'Flame': { en: 'Flame', ja: '炎' },
  'Forest': { en: 'Forest', ja: '森' },
  'Frost': { en: 'Frost', ja: '氷' },
  'Light': { en: 'Light', ja: '光' },
  'Lightning': { en: 'Lightning', ja: '雷' },
  'Special': { en: 'Special', ja: '特別' },
  'Spirit': { en: 'Spirit', ja: '精霊' },
  'Water': { en: 'Water', ja: '水' },
  'Cave': { en: 'Cave', ja: '洞窟' },
  'City': { en: 'City', ja: '都市' },
  'Dawn': { en: 'Dawn', ja: '夜明け' },
  'Daytime': { en: 'Daytime', ja: '昼間' },
  'Desert': { en: 'Desert', ja: '砂漠' },
  'Dusk': { en: 'Dusk', ja: '夕暮れ' },
  'Farm': { en: 'Farm', ja: '農場' },
  'Fog': { en: 'Fog', ja: '霧' },
  'Full Moon': { en: 'Full Moon', ja: '満月' },
  'Ground': { en: 'Ground', ja: '大地' },
  'Island': { en: 'Island', ja: '島' },
  'Lake': { en: 'Lake', ja: '湖' },
  'Lightning Storm': { en: 'Lightning Storm', ja: '雷雨' },
  'Meteor Shower': { en: 'Meteor Shower', ja: '流星群' },
  'Mountain': { en: 'Mountain', ja: '山' },
  'Nighttime': { en: 'Nighttime', ja: '夜' },
  'Ocean': { en: 'Ocean', ja: '海' },
  'Raining': { en: 'Raining', ja: '雨' },
  'River': { en: 'River', ja: '川' },
  'Snowing': { en: 'Snowing', ja: '雪' },
  'Stars': { en: 'Stars', ja: '星空' },
  'Suburban': { en: 'Suburban', ja: '郊外' },
  'Swamp': { en: 'Swamp', ja: '沼地' },
  'Winter': { en: 'Winter', ja: '冬' },
  'Woodlands': { en: 'Woodlands', ja: '森林' },
  'North Pole': { en: 'North Pole', ja: '北極' },
  'Strong Against': { en: 'Strong Against', ja: '強い相手' },
  'Illus.': { en: 'Illus.', ja: 'イラスト' },
  'REVEAL': { en: 'REVEAL', ja: '公開' },
  'DISCARD': { en: 'DISCARD', ja: '破棄' },
  'CONTRACT': { en: 'CONTRACT', ja: '契約' },
  'ENTER': { en: 'ENTER', ja: '登場' },
  'ARENA': { en: 'ARENA', ja: '闘技場' },
  'DESTROYED': { en: 'DESTROYED', ja: '破壊' },
  'TRIBAL BOOST': { en: 'TRIBAL BOOST', ja: '種族強化' },
  'AURA BOOST': { en: 'AURA BOOST', ja: 'オーラ強化' },
  'ATK': { en: 'ATK', ja: 'ATK' },
  'LP': { en: 'LP', ja: 'LP' },
  'Discovered': { en: 'Discovered', ja: '発見年' },
  'DOB': { en: 'DOB', ja: 'DOB' },
  'Origin': { en: 'Origin', ja: '起源' },
  'Est.': { en: 'Est.', ja: 'Est.' },
  'GPS': { en: 'GPS', ja: 'GPS' },
  'Weight': { en: 'Weight', ja: '体重' },
  'Height': { en: 'Height', ja: '身長' },
  'Length': { en: 'Length', ja: '長さ' },
};

export function localeColon(locale: Locale): string {
  return locale === 'ja' ? '：' : ':';
}

export function localeSp(locale: Locale): string {
  return locale === 'ja' ? '' : ' ';
}

export function t(key: string, locale: Locale): string {
  return translations[key]?.[locale] ?? translations[key]?.en ?? key;
}

export function toSmallCapsLocale(text: string, locale: Locale): string {
  if (locale === 'ja') return text;
  return text
    .split(' ')
    .map((word) => {
      if (!word) return '';
      if (word.length === 1) return word.toUpperCase();
      return word[0].toUpperCase() + `{SC:${word.slice(1)}}`;
    })
    .join(' ');
}

export function formatSpellbookLimitLocale(limit: string, locale: Locale): string {
  if (locale === 'ja') {
    return `<p>呪文書ごとに${limit}枚</p>`;
  }
  return `<p>${limit} ${toSmallCapsLocale('Per Spellbook', 'en')}</p>`;
}

export function formatTypesTribesLocale(
  cardType: string,
  tribe: string,
  locale: Locale,
): string {
  if (cardType === 'Aura' || cardType === 'Terra') return '';
  if (cardType === 'Token') {
    return tribe ? `<p>${toSmallCapsLocale(tribe, locale)}</p>` : '';
  }
  const hasTribe = cardType === 'Artifact' || cardType === 'Beastie';
  const localizedType = t(cardType, locale);
  const text = hasTribe && tribe ? `${localizedType} ${tribe}` : localizedType;
  return `<p>${toSmallCapsLocale(text, locale)}</p>`;
}

export function formatMetadataLocale(label: string, value: string, locale: Locale): string {
  const localizedLabel = t(label, locale);
  const colon = localeColon(locale);
  const sp = localeSp(locale);
  return `{B:${localizedLabel}${colon}${sp}}${value}`;
}

export function getPSBVariable(locale: Locale): string {
  if (locale === 'ja') return '呪文書ごとに';
  return 'P{TTL:ER} S{TTL:PELLBOOK}';
}
