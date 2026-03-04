import type { EffectBlock, EffectBlockType } from '@/types/effects';
import type { LayoutType } from '@/types/layout';
import type { CardType, Element } from '@/types/card';
import { BLOCK_ORDER } from '@/types/effects';
import { getTextZoneId, getImageZoneId, getStyleZoneId } from '@/data/layouts';
import { AURA_COLORS } from '@/data/constants';
import type { Locale } from '@/data/locales';
import { t, toSmallCapsLocale, localeColon, localeSp } from '@/data/locales';

export function sortBlocks(blocks: EffectBlock[]): EffectBlock[] {
  return [...blocks].sort((a, b) => {
    const ai = BLOCK_ORDER.indexOf(a.type);
    const bi = BLOCK_ORDER.indexOf(b.type);
    return ai - bi;
  });
}

const KEYWORD_KEYS: Partial<Record<EffectBlockType, string>> = {
  'static': '',
  'discard': 'DISCARD',
  'contract': 'CONTRACT',
  'enter': 'ENTER',
  'arena': 'ARENA',
  'destroyed': 'DESTROYED',
};

export function composeKeywordBlock(block: EffectBlock, locale: Locale = 'en'): string {
  const { type, hasStar, text } = block;
  if (!text) return '';

  const keywordKey = KEYWORD_KEYS[type];
  if (keywordKey === undefined) return '';
  const keyword = keywordKey ? t(keywordKey, locale) : '';

  const starPrefix = hasStar ? '{Star}' : '';
  const colon = localeColon(locale);
  const sp = localeSp(locale);

  if (hasStar) {
    if (keyword) {
      return `${starPrefix}**${keyword}${colon}**${sp}{I:${text}}`;
    }
    return `${starPrefix}**${colon}**${sp}{I:${text}}`;
  }

  if (keyword) {
    return `**${keyword}${colon}**${sp}${text}`;
  }
  return text;
}

export function composePowerBlock(block: EffectBlock): string {
  const { hasStar, text, powerName } = block;
  if (!powerName && !text) return '';

  const starPrefix = hasStar ? '{Star}' : '';
  const powerTag = powerName ? `{Power:${powerName}}` : '';

  if (hasStar && text) {
    return `${starPrefix}${powerTag} {I:${text}}`;
  }
  if (text) {
    return `${starPrefix}${powerTag} ${text}`;
  }
  return `${starPrefix}${powerTag}`;
}

export function composeMainText(blocks: EffectBlock[], locale: Locale = 'en'): string {
  const textBlocks = sortBlocks(blocks).filter(
    (b) =>
      b.type !== 'tribal-boost' &&
      b.type !== 'attack'
  );

  const segments: { text: string; type: string }[] = [];
  for (const block of textBlocks) {
    let composed = '';
    if (block.type === 'power') {
      composed = composePowerBlock(block);
    } else {
      composed = composeKeywordBlock(block, locale);
    }
    if (composed) {
      segments.push({ text: composed, type: block.type });
    }
  }

  return segments.map((seg, i) => {
    if (i === 0) return seg.text;
    if (seg.type === 'power') return '<br/>' + seg.text;
    return ' / ' + seg.text;
  }).join('');
}

export function composeBoosts(blocks: EffectBlock[], locale: Locale = 'en'): [string, string] {
  const boostBlocks = blocks.filter((b) => b.type === 'tribal-boost');
  const results: [string, string] = ['', ''];

  for (let i = 0; i < Math.min(boostBlocks.length, 2); i++) {
    const b = boostBlocks[i];
    if (b.boostLabel && b.boostTarget && b.boostAtk && b.boostLp) {
      const localizedLabel = t(b.boostLabel, locale);
      const beastiePrefix = t('Beastie', locale);
      const bracket = b.boostLabel === 'TRIBAL BOOST'
        ? `[${toSmallCapsLocale(`${beastiePrefix} ${b.boostTarget}`, locale)}]`
        : `[${toSmallCapsLocale(t(b.boostTarget, locale), locale)}]`;
      const atk = t('ATK', locale);
      const lp = t('LP', locale);
      const boostColon = localeColon(locale);
      const boostSp = localeSp(locale);
      results[i] = `${localizedLabel}${boostColon}${boostSp}${bracket} ${b.boostAtk} ${atk}/${b.boostLp} ${lp}`;
    }
  }

  return results;
}

export function composeAttackName(block: EffectBlock, locale: Locale = 'en'): string {
  let line = block.attackName ? toSmallCapsLocale(block.attackName, locale) : '';

  if (block.statusEffect) {
    line += ` {OpenZoo Status Effects/${block.statusEffect}.png, 0.9, 0.1}`;
    if (block.statusEffectDuration) {
      line += `{Num:(${block.statusEffectDuration})}`;
    }
  }

  if (block.statusEffect2) {
    line += `${block.statusEffect ? '' : ' '}{OpenZoo Status Effects/${block.statusEffect2}.png, 0.9, 0.1}`;
    if (block.statusEffectDuration2) {
      line += `{Num:(${block.statusEffectDuration2})}`;
    }
  }

  return line;
}

export function composeAttack(blocks: EffectBlock[]): EffectBlock | null {
  return blocks.find((b) => b.type === 'attack') || null;
}

export function composeEffectBlocks(
  blocks: EffectBlock[],
  layoutType: LayoutType,
  cardType?: CardType,
  locale: Locale = 'en',
  borderless = false,
): Record<string, string> {
  const patch: Record<string, string> = {};

  const mainText = composeMainText(blocks, locale);
  const mainTextKey =
    layoutType === 'BasicNoAttack'
      ? getTextZoneId(layoutType, 'MainText')
      : getTextZoneId(layoutType, 'MainTextBox');

  const auraTextKey = layoutType === 'Aura'
    ? getTextZoneId(layoutType, 'Aura/Terra Text Box')
    : null;

  const textKey = auraTextKey || mainTextKey;
  if (textKey) {
    patch[textKey] = mainText ? `<p>${mainText}</p>` : '';
  }

  const boostBlocks = blocks.filter((b) => b.type === 'tribal-boost');
  const [boost1, boost2] = composeBoosts(blocks, locale);
  const boost1Key = getTextZoneId(layoutType, 'Boost 1');
  const boost2Key = getTextZoneId(layoutType, 'Boost 2');
  if (boost1Key) patch[boost1Key] = boost1 ? `<p>${boost1}</p>` : '';
  if (boost2Key) patch[boost2Key] = boost2 ? `<p>${boost2}</p>` : '';

  for (let i = 0; i < Math.min(boostBlocks.length, 2); i++) {
    const b = boostBlocks[i];
    if (b.boostLabel === 'AURA BOOST' && b.boostTarget) {
      const color = AURA_COLORS[b.boostTarget as Element]?.cardBackground;
      if (color) {
        const boostStyleKey = getStyleZoneId(layoutType, i === 0 ? 'Boost 1' : 'Boost 2');
        if (boostStyleKey) patch[boostStyleKey] = `{background:${color}}`;
      }
    }
  }

  const activeBoosts = [boost1, boost2].filter(Boolean).length;
  const mainBoxStyleKey = getStyleZoneId(layoutType, 'MainTextBox');
  const attackContainerStyleKey = getStyleZoneId(layoutType, 'AttackContainer');
  const zoneParts: Record<string, string[]> = {};
  const addParts = (key: string | null, ...parts: string[]) => {
    if (!key) return;
    (zoneParts[key] ??= []).push(...parts);
  };

  if (mainBoxStyleKey) {
    if (activeBoosts > 0) {
      const padding = activeBoosts === 1 ? 20 : 32;
      addParts(mainBoxStyleKey, 'alignItems:flex-start', `paddingTop:${padding}px`);
    } else if (cardType === 'Beastie') {
      addParts(mainBoxStyleKey, 'alignItems:flex-start', 'justifyContent:flex-start', 'paddingTop:8px');
    }
  }

  if (cardType === 'Beastie' || activeBoosts > 0) {
    addParts(attackContainerStyleKey, 'justifyContent:flex-end');
  } else if (mainText) {
    addParts(attackContainerStyleKey, 'justifyContent:center');
  }

  // Horizontal padding on the text content zone (zone 30 in all beastie layouts).
  // Must target the TEXT zone (199px, box-sizing: border-box) not the container
  const textPaddingKey = layoutType === 'BasicNoAttack'
    ? getStyleZoneId(layoutType, 'MainText')
    : mainBoxStyleKey;
  if (textPaddingKey && mainText) {
    addParts(textPaddingKey, 'paddingLeft:2px', 'paddingRight:2px', 'paddingBottom:2px');
    const align = cardType === 'Beastie' ? 'left' : 'center';
    addParts(textPaddingKey, `textAlign:${align}`);
  }

  for (const [key, parts] of Object.entries(zoneParts)) {
    patch[key] = `{${parts.join(';')}}`;
  }
  if (mainBoxStyleKey && !zoneParts[mainBoxStyleKey]) {
    patch[mainBoxStyleKey] = '';
  }
  if (attackContainerStyleKey && attackContainerStyleKey !== mainBoxStyleKey && !zoneParts[attackContainerStyleKey]) {
    patch[attackContainerStyleKey] = '';
  }
  if (textPaddingKey && textPaddingKey !== mainBoxStyleKey && textPaddingKey !== attackContainerStyleKey && !zoneParts[textPaddingKey]) {
    patch[textPaddingKey] = '';
  }

  const attack = composeAttack(blocks);
  const suffix = layoutType === 'BasicOnlyAttack' ? '' : ' 1';
  const atkNameKey = getTextZoneId(layoutType, `Attack Name${suffix}`);
  const atkDmgKey = getTextZoneId(layoutType, `ATKDMG${suffix}`);
  const atkEffectKey = getTextZoneId(layoutType, `AttackEffect${suffix}`);
  const auraAdvKey = getImageZoneId(layoutType, `AuraAdvantage${suffix}`);
  const statusEffectKey = getImageZoneId(layoutType, `Status Effect${suffix}`);
  const statusDurKey = getTextZoneId(layoutType, `StatusEffectDuration${suffix}`);
  if (statusEffectKey) patch[statusEffectKey] = '';
  if (statusDurKey) patch[statusDurKey] = '';
  const attackNameLine = attack ? composeAttackName(attack, locale) : '';
  if (atkNameKey) patch[atkNameKey] = attackNameLine ? `<p>${attackNameLine}</p>` : '';
  if (atkDmgKey) patch[atkDmgKey] = attack?.attackDamage ? `<p>${attack.attackDamage}</p>` : '';
  const atkDmgStyleKey = getStyleZoneId(layoutType, `ATKDMG${suffix}`);
  if (atkDmgStyleKey) {
    patch[atkDmgStyleKey] = attack?.attackDamage ? '{paddingLeft:2px;paddingRight:2px}' : '';
  }

  if (atkEffectKey) {
    if (attack?.attackEffect) {
      const atkColon = localeColon(locale);
      const atkSp = localeSp(locale);
      const effectText = attack.attackHasStar
        ? `{Star}**${atkColon}**${atkSp}{I:${attack.attackEffect}}`
        : attack.attackEffect;
      patch[atkEffectKey] = `<p>${effectText}</p>`;
    } else {
      patch[atkEffectKey] = '';
    }
  }

  if (auraAdvKey) {
    patch[auraAdvKey] = attack?.attackBonus
      ? `OpenZoo Aura/${attack.attackBonus}.png`
      : '';
  }
  const auraAdv2Key = getImageZoneId(layoutType, `AuraAdvantage2${suffix}`);
  if (auraAdv2Key) {
    patch[auraAdv2Key] = attack?.attackBonus2
      ? `OpenZoo Aura/${attack.attackBonus2}.png`
      : '';
  }

  const auraAdv2StyleKey = getStyleZoneId(layoutType, `AuraAdvantage2${suffix}`);
  if (auraAdv2StyleKey) {
    patch[auraAdv2StyleKey] = attack?.attackBonus2
      ? '{width:14px;height:14px;left:-1px;order:-1;marginLeft:1px}'
      : '';
  }

  const dividerKey = getTextZoneId(layoutType, 'AttackDivider');
  const dividerStyleKey = getStyleZoneId(layoutType, 'AttackDivider');
  if (dividerKey) {
    patch[dividerKey] = attack?.showDivider ? '<p> </p>' : '';
  }
  if (dividerStyleKey) {
    const dividerMargin = 'marginTop:1px;marginBottom:1px';
    if (!attack?.showDivider) {
      patch[dividerStyleKey] = '{background:none}';
    } else if (borderless) {
      patch[dividerStyleKey] = `{background:linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 45%, rgba(255,255,255,1) 53%, rgba(255,255,255,1) 60%, rgba(255,255,255,0) 100%);${dividerMargin}}`;
    } else {
      patch[dividerStyleKey] = `{${dividerMargin}}`;
    }
  }

  return patch;
}
