import { describe, it, expect } from 'vitest';
import {
  t,
  toSmallCapsLocale,
  formatSpellbookLimitLocale,
  formatTypesTribesLocale,
  formatMetadataLocale,
  getPSBVariable,
} from '@/data/locales';

describe('t', () => {
  it('returns English translation', () => {
    expect(t('Beastie', 'en')).toBe('Beastie');
  });

  it('returns Japanese translation', () => {
    expect(t('Beastie', 'ja')).toBe('ビースティ');
  });

  it('falls back to English for missing JA key', () => {
    expect(t('ATK', 'ja')).toBe('ATK');
  });

  it('returns key itself for unknown key', () => {
    expect(t('NonExistentKey', 'en')).toBe('NonExistentKey');
  });
});

describe('toSmallCapsLocale', () => {
  it('wraps rest of word in SC class', () => {
    expect(toSmallCapsLocale('Spell', 'en')).toBe('S{SC:pell}');
  });

  it('handles multi-word text', () => {
    expect(toSmallCapsLocale('Per Spellbook', 'en')).toBe('P{SC:er} S{SC:pellbook}');
  });

  it('handles single-character words', () => {
    expect(toSmallCapsLocale('A', 'en')).toBe('A');
  });

  it('returns empty for empty string', () => {
    expect(toSmallCapsLocale('', 'en')).toBe('');
  });

  it('returns text unmodified for Japanese', () => {
    expect(toSmallCapsLocale('Spell', 'ja')).toBe('Spell');
  });
});

describe('formatSpellbookLimitLocale', () => {
  it('formats English', () => {
    expect(formatSpellbookLimitLocale('2', 'en')).toBe('<p>2 P{SC:er} S{SC:pellbook}</p>');
  });

  it('formats Japanese', () => {
    expect(formatSpellbookLimitLocale('2', 'ja')).toBe('<p>呪文書ごとに2枚</p>');
  });
});

describe('formatTypesTribesLocale', () => {
  it('formats Beastie with tribe', () => {
    const result = formatTypesTribesLocale('Beastie', 'Sasquatch', 'en');
    expect(result).toBe('<p>B{SC:eastie} S{SC:asquatch}</p>');
  });

  it('formats Artifact with tribe', () => {
    const result = formatTypesTribesLocale('Artifact', 'Terra Orb', 'en');
    expect(result).toBe('<p>A{SC:rtifact} T{SC:erra} O{SC:rb}</p>');
  });

  it('formats Spell without tribe', () => {
    const result = formatTypesTribesLocale('Spell', '', 'en');
    expect(result).toBe('<p>S{SC:pell}</p>');
  });

  it('returns empty for Aura', () => {
    expect(formatTypesTribesLocale('Aura', 'anything', 'en')).toBe('');
  });

  it('returns empty for Terra', () => {
    expect(formatTypesTribesLocale('Terra', '', 'en')).toBe('');
  });

  it('formats Token with tribe', () => {
    expect(formatTypesTribesLocale('Token', 'Goblin', 'en')).toBe('<p>G{SC:oblin}</p>');
  });

  it('returns empty for Token without tribe', () => {
    expect(formatTypesTribesLocale('Token', '', 'en')).toBe('');
  });

  it('formats Japanese Beastie', () => {
    const result = formatTypesTribesLocale('Beastie', 'Caster', 'ja');
    expect(result).toBe('<p>ビースティ Caster</p>');
  });
});

describe('formatMetadataLocale', () => {
  it('formats English with colon and space', () => {
    expect(formatMetadataLocale('Weight', '99kg', 'en')).toBe('{B:Weight: }99kg');
  });

  it('formats Japanese with fullwidth colon', () => {
    expect(formatMetadataLocale('Weight', '99kg', 'ja')).toBe('{B:体重：}99kg');
  });
});

describe('getPSBVariable', () => {
  it('returns Dextrous-formatted string for English', () => {
    expect(getPSBVariable('en')).toBe('P{TTL:ER} S{TTL:PELLBOOK}');
  });

  it('returns kanji for Japanese', () => {
    expect(getPSBVariable('ja')).toBe('呪文書ごとに');
  });
});
