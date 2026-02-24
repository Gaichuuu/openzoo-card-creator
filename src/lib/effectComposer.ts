import type { EffectBlock, EffectBlockType } from '@/types/effects';
import type { LayoutType } from '@/types/layout';
import type { CardType } from '@/types/card';
import { BLOCK_ORDER } from '@/types/effects';
import { ZONE_ID_MAPS } from '@/data/layouts';
import type { Locale } from '@/data/locales';
import { t, toSmallCapsLocale } from '@/data/locales';

/**
 * Sort blocks by the canonical effect order, preserving insertion order within same type.
 */
export function sortBlocks(blocks: EffectBlock[]): EffectBlock[] {
  return [...blocks].sort((a, b) => {
    const ai = BLOCK_ORDER.indexOf(a.type);
    const bi = BLOCK_ORDER.indexOf(b.type);
    return ai - bi;
  });
}

/**
 * Compose a single keyword-type block into its text representation.
 */
function composeKeywordBlock(block: EffectBlock, locale: Locale = 'en'): string {
  const { type, hasStar, text } = block;
  if (!text) return '';

  const KEYWORD_KEYS: Partial<Record<EffectBlockType, string>> = {
    'static': '',
    'discard': 'DISCARD',
    'contract': 'CONTRACT',
    'enter': 'ENTER',
    'arena': 'ARENA',
    'destroyed': 'DESTROYED',
  };

  const keywordKey = KEYWORD_KEYS[type];
  if (keywordKey === undefined) return '';
  const keyword = keywordKey ? t(keywordKey, locale) : '';

  const starPrefix = hasStar ? '{Star}' : '';
  const colon = locale === 'ja' ? '：' : ':';
  const sp = locale === 'ja' ? '' : ' ';

  if (hasStar) {
    // Star blocks: keyword bold, text italicized
    // Use {I:...} inline class instead of *...* markdown for italic,
    // because markdown delimiters break when text contains {variable} tokens
    if (keyword) {
      return `${starPrefix}**${keyword}${colon}**${sp}{I:${text}}`;
    }
    // Static with star: {Star}**: {I:text}
    return `${starPrefix}**${colon}**${sp}{I:${text}}`;
  }

  // No star
  if (keyword) {
    return `**${keyword}${colon}**${sp}${text}`;
  }
  // Static without star: just the text
  return text;
}

/**
 * Compose a Power block into its text representation.
 */
function composePowerBlock(block: EffectBlock): string {
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

/**
 * Compose all text-zone blocks (static, keyword, power) into a single string
 * for the MainText / MainTextBox zone.
 */
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
    // Line break before power blocks so the pill doesn't overlap adjacent text
    if (seg.type === 'power') return '<br/>' + seg.text;
    return ' / ' + seg.text;
  }).join('');
}

/**
 * Compose tribal boost blocks into [boost1, boost2] text values.
 */
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
        : `[${toSmallCapsLocale(b.boostTarget, locale)}]`;
      const atk = t('ATK', locale);
      const lp = t('LP', locale);
      const boostColon = locale === 'ja' ? '：' : ':';
      const boostSp = locale === 'ja' ? '' : ' ';
      results[i] = `${localizedLabel}${boostColon}${boostSp}${bracket} ${b.boostAtk} ${atk}/${b.boostLp} ${lp}`;
    }
  }

  return results;
}

/**
 * Compose the attack name line with inline status effect icons + durations.
 * Format: ATTACK NAME {icon} (dur) {icon2} (dur2)
 */
function composeAttackName(block: EffectBlock, locale: Locale = 'en'): string {
  let line = block.attackName ? toSmallCapsLocale(block.attackName, locale) : '';

  // Append status effect 1
  if (block.statusEffect) {
    line += ` {OpenZoo Status Effects/${block.statusEffect}.png, 0.9, 0.1}`;
    if (block.statusEffectDuration) {
      line += `{Num:(${block.statusEffectDuration})}`;
    }
  }

  // Append status effect 2
  if (block.statusEffect2) {
    line += `${block.statusEffect ? '' : ' '}{OpenZoo Status Effects/${block.statusEffect2}.png, 0.9, 0.1}`;
    if (block.statusEffectDuration2) {
      line += `{Num:(${block.statusEffectDuration2})}`;
    }
  }

  return line;
}

/**
 * Extract the first attack block's data.
 */
export function composeAttack(blocks: EffectBlock[]): EffectBlock | null {
  return blocks.find((b) => b.type === 'attack') || null;
}

// Helper to get zone keys
function getTextZoneId(layoutType: LayoutType, semanticKey: string): string | null {
  const map = ZONE_ID_MAPS[layoutType];
  const zoneId = map?.[semanticKey];
  if (zoneId === undefined) return null;
  return `t${zoneId}`;
}

function getImageZoneId(layoutType: LayoutType, semanticKey: string): string | null {
  const map = ZONE_ID_MAPS[layoutType];
  const zoneId = map?.[semanticKey];
  if (zoneId === undefined) return null;
  return `i${zoneId}`;
}

function getStyleZoneId(layoutType: LayoutType, semanticKey: string): string | null {
  const map = ZONE_ID_MAPS[layoutType];
  const zoneId = map?.[semanticKey];
  if (zoneId === undefined) return null;
  return `s${zoneId}`;
}

/**
 * Compose all effect blocks into a CardData patch for the given layout type.
 * Returns a partial CardData object with the zones that should be updated.
 */
export function composeEffectBlocks(
  blocks: EffectBlock[],
  layoutType: LayoutType,
  cardType?: CardType,
  locale: Locale = 'en',
): Record<string, string> {
  const patch: Record<string, string> = {};

  // 1. Main text zone
  const mainText = composeMainText(blocks, locale);
  const mainTextKey =
    layoutType === 'BasicNoAttack'
      ? getTextZoneId(layoutType, 'MainText')
      : getTextZoneId(layoutType, 'MainTextBox');

  // For Aura layout, use the Aura/Terra Text Box
  const auraTextKey = layoutType === 'Aura'
    ? getTextZoneId(layoutType, 'Aura/Terra Text Box')
    : null;

  const textKey = auraTextKey || mainTextKey;
  if (textKey) {
    patch[textKey] = mainText ? `<p>${mainText}</p>` : '';
  }

  // 2. Boosts
  const [boost1, boost2] = composeBoosts(blocks, locale);
  const boost1Key = getTextZoneId(layoutType, 'Boost 1');
  const boost2Key = getTextZoneId(layoutType, 'Boost 2');
  if (boost1Key) patch[boost1Key] = boost1 ? `<p>${boost1}</p>` : '';
  if (boost2Key) patch[boost2Key] = boost2 ? `<p>${boost2}</p>` : '';

  // 2b. Container & text-box style overrides
  // Accumulate style parts per zone key so that when AttackContainer and
  // MainTextBox map to the same zone (BasicOnlyAttack) styles are merged.
  const activeBoosts = [boost1, boost2].filter(Boolean).length;
  const mainBoxStyleKey = getStyleZoneId(layoutType, 'MainTextBox');
  const attackContainerStyleKey = getStyleZoneId(layoutType, 'AttackContainer');
  const zoneParts: Record<string, string[]> = {};
  const addParts = (key: string | null, ...parts: string[]) => {
    if (!key) return;
    (zoneParts[key] ??= []).push(...parts);
  };

  // Text alignment (goes on the text-content zone)
  if (mainBoxStyleKey) {
    if (activeBoosts > 0) {
      const padding = activeBoosts === 1 ? 20 : 32;
      addParts(mainBoxStyleKey, 'alignItems:flex-start', `paddingTop:${padding}px`);
    } else if (cardType === 'Beastie') {
      // Beastie: top-align text, left-align flex items.
      // Always apply paddingTop so attack row starts at a consistent position
      // even when MainTextBox has no text content.
      addParts(mainBoxStyleKey, 'alignItems:flex-start', 'justifyContent:flex-start', 'paddingTop:8px');
    }
    // Non-Beastie: vertical centering handled by justifyContent on AttackContainer
  }

  // AttackContainer (zone 32) uses flexDirection:column-reverse, so
  // justifyContent controls vertical positioning:
  //   flex-end = visual top, center = visual center
  if (cardType === 'Beastie' || activeBoosts > 0) {
    // Beastie: push attack row to bottom, text to top
    addParts(attackContainerStyleKey, 'justifyContent:flex-end');
  } else if (mainText) {
    // Non-Beastie: vertically center text (also accounts for extra height
    // from missing metadata bar)
    addParts(attackContainerStyleKey, 'justifyContent:center');
  }

  // Horizontal padding on the text content zone (zone 30 in all beastie layouts).
  // Must target the TEXT zone (199px, box-sizing: border-box) not the container
  // (201px) — padding on the container doesn't shrink the 199px child, it overflows.
  // For BasicAttackMain, mainBoxStyleKey already targets zone 30.
  // For BasicNoAttack, mainBoxStyleKey targets the container (32), so use "MainText" (30).
  const textPaddingKey = layoutType === 'BasicNoAttack'
    ? getStyleZoneId(layoutType, 'MainText')
    : mainBoxStyleKey;
  if (textPaddingKey && mainText) {
    addParts(textPaddingKey, 'paddingLeft:2px', 'paddingRight:2px', 'paddingBottom:2px');
    // Beastie: left-align effect text; other card types: center
    const align = cardType === 'Beastie' ? 'left' : 'center';
    addParts(textPaddingKey, `textAlign:${align}`);
  }

  // Serialize accumulated styles into patch
  for (const [key, parts] of Object.entries(zoneParts)) {
    patch[key] = `{${parts.join(';')}}`;
  }
  // Clear known style keys that had no parts so previous overrides don't persist
  if (mainBoxStyleKey && !zoneParts[mainBoxStyleKey]) {
    patch[mainBoxStyleKey] = '';
  }
  if (attackContainerStyleKey && attackContainerStyleKey !== mainBoxStyleKey && !zoneParts[attackContainerStyleKey]) {
    patch[attackContainerStyleKey] = '';
  }
  if (textPaddingKey && textPaddingKey !== mainBoxStyleKey && textPaddingKey !== attackContainerStyleKey && !zoneParts[textPaddingKey]) {
    patch[textPaddingKey] = '';
  }

  // 3. Attack
  const attack = composeAttack(blocks);
  const suffix = layoutType === 'BasicOnlyAttack' ? '' : ' 1';

  const atkNameKey = getTextZoneId(layoutType, `Attack Name${suffix}`);
  const atkDmgKey = getTextZoneId(layoutType, `ATKDMG${suffix}`);
  const atkEffectKey = getTextZoneId(layoutType, `AttackEffect${suffix}`);
  const auraAdvKey = getImageZoneId(layoutType, `AuraAdvantage${suffix}`);

  // Clear the individual status effect zones (now composed inline in attack name)
  const statusEffectKey = getImageZoneId(layoutType, `Status Effect${suffix}`);
  const statusDurKey = getTextZoneId(layoutType, `StatusEffectDuration${suffix}`);
  if (statusEffectKey) patch[statusEffectKey] = '';
  if (statusDurKey) patch[statusDurKey] = '';

  // Attack name with inline status effect icons + durations
  const attackNameLine = attack ? composeAttackName(attack, locale) : '';
  if (atkNameKey) patch[atkNameKey] = attackNameLine ? `<p>${attackNameLine}</p>` : '';

  // Damage (with padding for spacing from adjacent zones)
  if (atkDmgKey) patch[atkDmgKey] = attack?.attackDamage ? `<p>${attack.attackDamage}</p>` : '';
  const atkDmgStyleKey = getStyleZoneId(layoutType, `ATKDMG${suffix}`);
  if (atkDmgStyleKey) {
    patch[atkDmgStyleKey] = attack?.attackDamage ? '{paddingLeft:2px;paddingRight:2px}' : '';
  }

  // Attack effect (supports 4th wall)
  if (atkEffectKey) {
    if (attack?.attackEffect) {
      const atkColon = locale === 'ja' ? '：' : ':';
      const atkSp = locale === 'ja' ? '' : ' ';
      const effectText = attack.attackHasStar
        ? `{Star}**${atkColon}**${atkSp}{I:${attack.attackEffect}}`
        : attack.attackEffect;
      patch[atkEffectKey] = `<p>${effectText}</p>`;
    } else {
      patch[atkEffectKey] = '';
    }
  }

  // Attack strength icons
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
  // AuraAdvantage2 repurposes the Status Effect zone (12x12) — resize to match AuraAdvantage (14x14)
  const auraAdv2StyleKey = getStyleZoneId(layoutType, `AuraAdvantage2${suffix}`);
  if (auraAdv2StyleKey) {
    // order:-1 moves this zone next to AuraAdvantage in the row-reverse attack container
    patch[auraAdv2StyleKey] = attack?.attackBonus2
      ? '{width:14px;height:14px;left:-1px;order:-1;marginLeft:1px}'
      : '';
  }

  // 4. Divider (controlled by attack block's showDivider toggle)
  // The zone has toggleIfNoContent: false so it's always visible.
  // Use style override to hide/show the gradient background.
  const dividerKey = getTextZoneId(layoutType, 'AttackDivider');
  const dividerStyleKey = getStyleZoneId(layoutType, 'AttackDivider');
  if (dividerKey) {
    patch[dividerKey] = attack?.showDivider ? '<p> </p>' : '';
  }
  if (dividerStyleKey) {
    patch[dividerStyleKey] = attack?.showDivider ? '' : '{background:none}';
  }

  return patch;
}
