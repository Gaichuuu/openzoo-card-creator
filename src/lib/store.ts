import { create } from 'zustand';
import type { LayoutType } from '@/types/layout';
import type { CardData, CardSnapshot, CardType, Element } from '@/types/card';
import { CARD_TYPE_TO_LAYOUT } from '@/data/constants';
import type { EffectBlock, EffectBlockType } from '@/types/effects';
import { createDefaultBlock } from '@/types/effects';
import { ZONE_ID_MAPS } from '@/data/layouts';
import { resolveBanner } from './bannerResolver';
import { resolveArtBorderStyle, resolveBgOverlayStyle, computeStrongAgainst } from '@/data/constants';
import { composeEffectBlocks } from './effectComposer';
import type { Locale } from '@/data/locales';
import { t, formatSpellbookLimitLocale, formatTypesTribesLocale } from '@/data/locales';

interface CardEditorState {
  cardType: CardType;
  layoutType: LayoutType;
  cardData: CardData;

  // Convenience fields
  cardName: string;
  tribe: string;
  spellbookLimit: string;
  primaryElement: Element | null;
  secondaryElement: Element | null;
  traits: (string | null)[];
  terras: (string | null)[];
  strongAgainst: (Element | null)[];
  cardArtUrl: string | null;

  // Effect blocks
  effectBlocks: EffectBlock[];

  // Locale
  locale: Locale;

  // Border
  borderless: boolean;

  // Snapshot loading guard — when true, mount effects should skip setting defaults
  _isLoadingSnapshot: boolean;
  _snapshotVersion: number;
  _snapshotTimer: ReturnType<typeof setTimeout> | null;

  // Actions
  setCardType: (type: CardType) => void;
  setLocale: (locale: Locale) => void;
  setLayoutType: (type: LayoutType) => void;
  setCardName: (name: string) => void;
  setTribe: (tribe: string) => void;
  setSpellbookLimit: (limit: string) => void;
  setTextField: (semanticKey: string, value: string) => void;
  setImageField: (semanticKey: string, value: string) => void;
  setStyleField: (semanticKey: string, value: string) => void;
  setPrimaryElement: (el: Element | null) => void;
  setSecondaryElement: (el: Element | null) => void;
  setTrait: (index: number, trait: string | null) => void;
  setTerra: (index: number, terra: string | null) => void;
  setStrongAgainst: (index: number, el: Element | null) => void;
  setCardArt: (url: string | null) => void;
  setBorderless: (v: boolean) => void;
  setRawCardData: (key: string, value: string) => void;
  addEffectBlock: (type: EffectBlockType) => void;
  removeEffectBlock: (id: string) => void;
  updateEffectBlock: (id: string, updates: Partial<EffectBlock>) => void;
  resetCard: () => void;
  loadCardData: (layoutType: LayoutType, data: CardData) => void;
  getSnapshot: () => CardSnapshot;
  loadSnapshot: (snapshot: CardSnapshot) => void;
}

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
 * Apply all aura-derived colors to the card data:
 * - Banner image
 * - Aura1/Aura2 icons
 * - ArtBorder background color
 * - BackgroundColor overlay
 */
function applyAuraColors(
  newData: CardData,
  layoutType: LayoutType,
  primary: Element | null,
  secondary: Element | null,
  cardType?: CardType,
) {
  // Banner
  const bannerKey = getImageZoneId(layoutType, 'Banner');
  if (bannerKey) {
    newData[bannerKey] = resolveBanner(primary, secondary, cardType);
  }

  // Aura icon positioning depends on card type
  const aura1Key = getImageZoneId(layoutType, 'Aura1');
  const aura2Key = getImageZoneId(layoutType, 'Aura2');
  if (cardType === 'Aura') {
    // Single element: icon in Aura2 (right position), Aura1 cleared
    if (aura1Key) newData[aura1Key] = '';
    if (aura2Key) newData[aura2Key] = primary ? `${primary}.png` : '';
  } else if (cardType === 'Special Aura') {
    // Special.png icon in Aura2 (right), Aura1 cleared
    if (aura1Key) newData[aura1Key] = '';
    if (aura2Key) newData[aura2Key] = 'Special.png';
  } else {
    // Default: Aura1 = primary, Aura2 = secondary
    if (aura1Key) newData[aura1Key] = primary ? `${primary}.png` : '';
    if (aura2Key) newData[aura2Key] = secondary ? `${secondary}.png` : '';
  }

  // Art border color
  const artBorderStyleKey = getStyleZoneId(layoutType, 'ArtBorder');
  if (artBorderStyleKey) {
    const artBorderBg = resolveArtBorderStyle(primary, secondary);
    newData[artBorderStyleKey] = artBorderBg ? `{background:${artBorderBg}}` : '';
  }

  // Background color overlay
  const bgColorStyleKey = getStyleZoneId(layoutType, 'BackgroundColor');
  if (bgColorStyleKey) {
    const bgOverlay = resolveBgOverlayStyle(primary, secondary);
    newData[bgColorStyleKey] = bgOverlay ? `{background:${bgOverlay}}` : '';
  }
}

/**
 * Auto-populate SAura1–4 image zones based on element strengths.
 * Also ensures the "StrongAgainst" text label is always set.
 */
function applyStrongAgainst(
  newData: CardData,
  layoutType: LayoutType,
  primary: Element | null,
  secondary: Element | null,
  locale: Locale = 'en',
) {
  const strengths = computeStrongAgainst(primary, secondary);
  const saKeys = ['SAura1', 'SAura2', 'SAura3', 'SAura4'];
  for (let i = 0; i < saKeys.length; i++) {
    const imgKey = getImageZoneId(layoutType, saKeys[i]);
    if (imgKey) {
      newData[imgKey] = i < strengths.length ? `${strengths[i]}.png` : '';
    }
    // Show border when icon is present, hide zone when empty (so it doesn't
    // take flex space and push the +20 value text to the right)
    const styleKey = getStyleZoneId(layoutType, saKeys[i]);
    if (styleKey) {
      newData[styleKey] = i < strengths.length
        ? '{boxShadow:inset 0 0 0 1px rgba(0,0,0,1);outlineWidth:0px;outlineOffset:0px}'
        : '{display:none}';
    }
  }
  // Always show the "Strong Against:" label, left-aligned
  const textKey = getTextZoneId(layoutType, 'StrongAgainst');
  if (textKey) {
    newData[textKey] = `<p>${t('Strong Against', locale)}</p>`;
  }
  const textStyleKey = getStyleZoneId(layoutType, 'StrongAgainst');
  if (textStyleKey) {
    const saLeft = locale === 'ja' ? '-17px' : '-7px';
    newData[textStyleKey] = `{left:${saLeft};width:60px;textAlign:left}`;
  }
  // Left-align the icon container (child of StrongAgainst zone).
  // Compensate for parent's left shift in Japanese (compounding absolute offsets).
  // Font styling matches Terra bonus values for the "+20" text.
  const containerStyleKey = getStyleZoneId(layoutType, 'SAContainer');
  if (containerStyleKey) {
    const saContainerLeft = locale === 'ja' ? '19px' : '9px';
    newData[containerStyleKey] = `{left:${saContainerLeft};width:78px;justifyContent:flex-end;gap:1px;outline:none;fontSize:8px;fontWeight:bold;letterSpacing:-0.1em;color:red;-webkit-text-stroke:0.5px white}`;
  }
  // "+20" value after the icons (only when there are strong-against auras)
  const valueKey = getTextZoneId(layoutType, 'SAValue');
  if (valueKey) {
    newData[valueKey] = strengths.length > 0 ? '<p>+20</p>' : '';
  }
}

/**
 * Small caps are handled by the {SC:} inline class in the text content.
 * The zone's base textTransform:uppercase and fontWeight:bold are preserved.
 * Japanese locale skips small caps entirely (delegated to toSmallCapsLocale).
 */

function getTypeCapabilities(type: CardType) {
  return {
    hasLP: type === 'Artifact' || type === 'Beastie',
    hasMetadata: type === 'Beastie',
    hasAttacks: type === 'Beastie',
  };
}

const METADATA_ZONES = ['CryptidInfoBar', 'DOB/Discovered:', 'GPS', 'Weight', 'Height/Length'] as const;

const DEFAULT_CARD_TYPE: CardType = 'Beastie';
const DEFAULT_LAYOUT: LayoutType = CARD_TYPE_TO_LAYOUT[DEFAULT_CARD_TYPE];
const DEFAULT_CARD_NAME = 'Name';
const DEFAULT_TRIBE = 'Caster';
const DEFAULT_SPELLBOOK_LIMIT = '1';

function buildInitialCardData(layout: LayoutType, cardType: CardType, locale: Locale = 'en'): CardData {
  const data: CardData = {};
  const nameKey = getTextZoneId(layout, 'CardName');
  if (nameKey) data[nameKey] = `<p>${DEFAULT_CARD_NAME}</p>`;
  const typesKey = getTextZoneId(layout, 'TypesTribes');
  if (typesKey) data[typesKey] = formatTypesTribesLocale(cardType, DEFAULT_TRIBE, locale);
  const limitKey = getTextZoneId(layout, 'SpellbookLimit');
  if (limitKey) data[limitKey] = formatSpellbookLimitLocale(DEFAULT_SPELLBOOK_LIMIT, locale);

  // Essential style overrides — must be in initial cardData so
  // AutoShrinkText and zone rendering work from the first frame,
  // even before EditorSidebar's mount useEffect fires.
  const styles: [string, string][] = [
    ['LP', '{fontSize:19px}'],
    ['TypesTribes', '{fontSize:9px;maxHeight:none;justifyContent:flex-start;paddingLeft:2px}'],
    ['SpellbookLimit', '{fontSize:9px;maxHeight:none;justifyContent:flex-start;paddingLeft:2px}'],
    ['CardName', '{maxHeight:23px;justifyContent:flex-start;paddingLeft:2px;outlineWidth:0px}'],
    ['TNL', '{flex:1;minWidth:0;alignItems:stretch}'],
    ['AttackDivider', '{display:none}'],
    ['FlavorText', '{left:95px;justifyContent:flex-end}'],
  ];
  for (const [key, value] of styles) {
    const styleKey = getStyleZoneId(layout, key);
    if (styleKey) data[styleKey] = value;
  }

  return data;
}

export const useCardStore = create<CardEditorState>((set, get) => ({
  cardType: DEFAULT_CARD_TYPE,
  layoutType: DEFAULT_LAYOUT,
  cardData: buildInitialCardData(DEFAULT_LAYOUT, DEFAULT_CARD_TYPE),
  cardName: DEFAULT_CARD_NAME,
  tribe: DEFAULT_TRIBE,
  spellbookLimit: DEFAULT_SPELLBOOK_LIMIT,
  primaryElement: null,
  secondaryElement: null,
  traits: [null, null, null],
  terras: [null, null],
  strongAgainst: [null, null, null, null],
  cardArtUrl: null,
  effectBlocks: [],
  locale: 'en' as Locale,
  borderless: false,
  _isLoadingSnapshot: false,
  _snapshotVersion: 0,
  _snapshotTimer: null,

  setCardType: (type) => {
    const layout = CARD_TYPE_TO_LAYOUT[type];
    set({ cardType: type });
    get().setLayoutType(layout);

    const state = get();
    const lt = state.layoutType;
    const newData = { ...state.cardData };
    const caps = getTypeCapabilities(type);

    // TypesTribes
    const typesKey = getTextZoneId(lt, 'TypesTribes');
    if (typesKey) newData[typesKey] = formatTypesTribesLocale(type, state.tribe, state.locale);

    // LP: clear or set default
    const lpKey = getTextZoneId(lt, 'LP');
    if (lpKey) {
      if (!caps.hasLP) {
        newData[lpKey] = '';
      } else if (!newData[lpKey]) {
        newData[lpKey] = '<p>{LP}10</p>';
        const lpStyleKey = getStyleZoneId(lt, 'LP');
        if (lpStyleKey) newData[lpStyleKey] = '{fontSize:19px}';
      }
    }

    // Metadata: clear for non-Beastie
    if (!caps.hasMetadata) {
      for (const zone of METADATA_ZONES) {
        const key = getTextZoneId(lt, zone);
        if (key) newData[key] = '';
      }
      // Clear CryptidInfoBar gradient background
      const infoBarStyleKey = getStyleZoneId(lt, 'CryptidInfoBar');
      if (infoBarStyleKey) newData[infoBarStyleKey] = '';
    }

    // Terra bonuses: clear for types without terra bonus section
    if (type === 'Potion' || type === 'Artifact' || type === 'Spell' || type === 'Aura' || type === 'Special Aura' || type === 'Terra' || type === 'Special Terra') {
      for (const zone of ['Terra1', 'Terra2']) {
        const imgKey = getImageZoneId(lt, zone);
        if (imgKey) newData[imgKey] = '';
      }
      for (const zone of ['Terra1ATK', 'Terra1LP', 'Terra2ATK', 'Terra2LP']) {
        const textKey = getTextZoneId(lt, zone);
        if (textKey) newData[textKey] = '';
      }
    }

    // Traits: clear for Aura/Special Aura/Terra/Special Terra
    if (type === 'Aura' || type === 'Special Aura' || type === 'Terra' || type === 'Special Terra') {
      for (const zone of ['Trait1', 'Trait2', 'Trait3']) {
        const imgKey = getImageZoneId(lt, zone);
        if (imgKey) newData[imgKey] = '';
      }
      // Clear text boxes
      const textBoxKey = getTextZoneId(lt, 'Aura/Terra Text Box');
      if (textBoxKey) newData[textBoxKey] = '';
      const textBoxKey1 = getTextZoneId(lt, 'Aura/Terra Text Box 1');
      if (textBoxKey1) newData[textBoxKey1] = '';
    }

    // Special Aura: apply Neutral colors (gray background, NeutralAltBanner)
    if (type === 'Special Aura') {
      applyAuraColors(newData, lt, 'Neutral', null, type);
    }

    // Attacks: filter attack blocks for non-Beastie, recompose
    let { effectBlocks } = state;
    if (!caps.hasAttacks) {
      effectBlocks = effectBlocks.filter((b) => b.type !== 'attack');
    }
    // Clear effect blocks for Aura/Terra types (no effect block editor)
    if (type === 'Aura' || type === 'Special Aura' || type === 'Terra' || type === 'Special Terra') {
      effectBlocks = [];
    }
    const effectPatch = composeEffectBlocks(effectBlocks, lt, type, state.locale);
    Object.assign(newData, effectPatch);

    const noTerra = type === 'Potion' || type === 'Artifact' || type === 'Spell' || type === 'Aura' || type === 'Special Aura' || type === 'Terra' || type === 'Special Terra';
    const noTraits = type === 'Aura' || type === 'Special Aura' || type === 'Terra' || type === 'Special Terra';
    const clearElements = type === 'Special Aura' || type === 'Terra' || type === 'Special Terra';
    set({
      effectBlocks,
      cardData: newData,
      ...(noTerra ? { terras: [null, null] as [null, null] } : {}),
      ...(noTraits ? { traits: [null, null, null] as [null, null, null] } : {}),
      ...(clearElements ? { primaryElement: null, secondaryElement: null } : {}),
    });
  },

  setLayoutType: (type) => {
    const state = get();
    if (type === state.layoutType) return;

    const oldMap = ZONE_ID_MAPS[state.layoutType];
    const newMap = ZONE_ID_MAPS[type];
    const newCardData: CardData = {};

    for (const semanticKey of Object.keys(newMap)) {
      const newZoneId = newMap[semanticKey];
      const oldZoneId = oldMap?.[semanticKey];
      if (oldZoneId !== undefined) {
        for (const prefix of ['t', 'i', 's']) {
          const oldKey = `${prefix}${oldZoneId}`;
          const newKey = `${prefix}${newZoneId}`;
          if (state.cardData[oldKey]) {
            newCardData[newKey] = state.cardData[oldKey];
          }
        }
      }
    }

    // Re-apply card art — semantic key differs across layouts (CardArt vs Art)
    if (state.cardArtUrl) {
      const artKey = getImageZoneId(type, 'CardArt') || getImageZoneId(type, 'Art');
      if (artKey) newCardData[artKey] = state.cardArtUrl;
    }

    // Re-apply aura colors and strong against for new layout
    applyAuraColors(newCardData, type, state.primaryElement, state.secondaryElement, state.cardType);
    applyStrongAgainst(newCardData, type, state.primaryElement, state.secondaryElement, state.locale);

    // Re-compose effect blocks for new layout
    const effectPatch = composeEffectBlocks(state.effectBlocks, type, state.cardType, state.locale);
    Object.assign(newCardData, effectPatch);

    set({ layoutType: type, cardData: newCardData });
  },

  setCardName: (name) => {
    const { layoutType, cardData } = get();
    const key = getTextZoneId(layoutType, 'CardName');
    if (!key) return;
    // Convert literal \n token to actual newline for line breaks in rendering
    const renderName = name.replace(/\\n/g, '\n');
    set({
      cardName: name,
      cardData: { ...cardData, [key]: `<p>${renderName}</p>` },
    });
  },

  setTribe: (tribe) => {
    const { layoutType, cardData, cardType, locale } = get();
    const key = getTextZoneId(layoutType, 'TypesTribes');
    if (!key) return;
    set({
      tribe,
      cardData: { ...cardData, [key]: formatTypesTribesLocale(cardType, tribe, locale) },
    });
  },

  setSpellbookLimit: (limit) => {
    const { layoutType, cardData, locale } = get();
    const key = getTextZoneId(layoutType, 'SpellbookLimit');
    if (!key) return;
    set({
      spellbookLimit: limit,
      cardData: { ...cardData, [key]: formatSpellbookLimitLocale(limit, locale) },
    });
  },

  setTextField: (semanticKey, value) => {
    const { layoutType, cardData } = get();
    const key = getTextZoneId(layoutType, semanticKey);
    if (!key) return;
    set({ cardData: { ...cardData, [key]: value ? `<p>${value}</p>` : '' } });
  },

  setImageField: (semanticKey, value) => {
    const { layoutType, cardData } = get();
    const key = getImageZoneId(layoutType, semanticKey);
    if (!key) return;
    set({ cardData: { ...cardData, [key]: value } });
  },

  setStyleField: (semanticKey, value) => {
    const { layoutType, cardData } = get();
    const key = getStyleZoneId(layoutType, semanticKey);
    if (!key) return;
    set({ cardData: { ...cardData, [key]: value } });
  },

  setPrimaryElement: (el) => {
    const { layoutType, cardData, secondaryElement, cardType, locale } = get();
    const newData = { ...cardData };
    applyAuraColors(newData, layoutType, el, secondaryElement, cardType);
    applyStrongAgainst(newData, layoutType, el, secondaryElement, locale);
    const strengths = computeStrongAgainst(el, secondaryElement);
    const sa: (Element | null)[] = [null, null, null, null];
    strengths.forEach((s, i) => { sa[i] = s; });
    set({ primaryElement: el, strongAgainst: sa, cardData: newData });
  },

  setSecondaryElement: (el) => {
    const { layoutType, cardData, primaryElement, cardType, locale } = get();
    const newData = { ...cardData };
    applyAuraColors(newData, layoutType, primaryElement, el, cardType);
    applyStrongAgainst(newData, layoutType, primaryElement, el, locale);
    const strengths = computeStrongAgainst(primaryElement, el);
    const sa: (Element | null)[] = [null, null, null, null];
    strengths.forEach((s, i) => { sa[i] = s; });
    set({ secondaryElement: el, strongAgainst: sa, cardData: newData });
  },

  setTrait: (index, trait) => {
    const { layoutType, cardData, traits } = get();
    const newTraits = [...traits];
    newTraits[index] = trait;

    const newData = { ...cardData };
    const traitKeys = ['Trait1', 'Trait2', 'Trait3'];
    const key = getImageZoneId(layoutType, traitKeys[index]);
    if (key) {
      newData[key] = trait ? `OpenZoo Traits/${trait}.png` : '';
    }

    set({ traits: newTraits, cardData: newData });
  },

  setTerra: (index, terra) => {
    const { layoutType, cardData, terras } = get();
    const newTerras = [...terras];
    newTerras[index] = terra;

    const newData = { ...cardData };
    const terraKeys = ['Terra1', 'Terra2'];
    const key = getImageZoneId(layoutType, terraKeys[index]);
    if (key) {
      newData[key] = terra ? `OpenZoo Terra/${terra}.png` : '';
    }

    set({ terras: newTerras, cardData: newData });
  },

  setStrongAgainst: (index, el) => {
    const { layoutType, cardData, strongAgainst } = get();
    const newSA = [...strongAgainst];
    newSA[index] = el;

    const newData = { ...cardData };
    const saKeys = ['SAura1', 'SAura2', 'SAura3', 'SAura4'];
    const key = getImageZoneId(layoutType, saKeys[index]);
    if (key) {
      newData[key] = el ? `${el}.png` : '';
    }

    set({ strongAgainst: newSA, cardData: newData });
  },

  setCardArt: (url) => {
    const { layoutType, cardData } = get();
    const newData = { ...cardData };

    const key = getImageZoneId(layoutType, 'CardArt') || getImageZoneId(layoutType, 'Art');
    if (key) {
      newData[key] = url || '';
    }

    set({ cardArtUrl: url, cardData: newData });
  },

  setBorderless: (v) => {
    set({ borderless: v });
  },

  setRawCardData: (key, value) => {
    const { cardData } = get();
    set({ cardData: { ...cardData, [key]: value } });
  },

  addEffectBlock: (type) => {
    const { layoutType, cardData, effectBlocks, cardType, locale } = get();
    const id = `eb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newBlock: EffectBlock = { id, ...createDefaultBlock(type) };
    const newBlocks = [...effectBlocks, newBlock];
    const patch = composeEffectBlocks(newBlocks, layoutType, cardType, locale);
    set({ effectBlocks: newBlocks, cardData: { ...cardData, ...patch } });
  },

  removeEffectBlock: (id) => {
    const { layoutType, cardData, effectBlocks, cardType, locale } = get();
    const newBlocks = effectBlocks.filter((b) => b.id !== id);
    const patch = composeEffectBlocks(newBlocks, layoutType, cardType, locale);
    set({ effectBlocks: newBlocks, cardData: { ...cardData, ...patch } });
  },

  updateEffectBlock: (id, updates) => {
    const { layoutType, cardData, effectBlocks, cardType, locale } = get();
    const newBlocks = effectBlocks.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    );
    const patch = composeEffectBlocks(newBlocks, layoutType, cardType, locale);
    set({ effectBlocks: newBlocks, cardData: { ...cardData, ...patch } });
  },

  setLocale: (locale) => {
    set({ locale });
    const state = get();
    const { layoutType: lt, cardType, tribe, spellbookLimit, primaryElement, secondaryElement, effectBlocks } = state;
    const newData = { ...state.cardData };

    // Re-compose TypesTribes
    const typesKey = getTextZoneId(lt, 'TypesTribes');
    if (typesKey) newData[typesKey] = formatTypesTribesLocale(cardType, tribe, locale);

    // Re-compose SpellbookLimit
    const limitKey = getTextZoneId(lt, 'SpellbookLimit');
    if (limitKey && spellbookLimit) newData[limitKey] = formatSpellbookLimitLocale(spellbookLimit, locale);

    // Re-compose StrongAgainst
    applyStrongAgainst(newData, lt, primaryElement, secondaryElement, locale);

    // Re-compose effect blocks
    const effectPatch = composeEffectBlocks(effectBlocks, lt, cardType, locale);
    Object.assign(newData, effectPatch);

    set({ cardData: newData });
  },

  resetCard: () => {
    const { cardType, layoutType, _snapshotVersion, _snapshotTimer } = get();
    if (_snapshotTimer) clearTimeout(_snapshotTimer);
    set({
      cardData: buildInitialCardData(layoutType, cardType, get().locale),
      cardName: DEFAULT_CARD_NAME,
      tribe: DEFAULT_TRIBE,
      spellbookLimit: DEFAULT_SPELLBOOK_LIMIT,
      primaryElement: null,
      secondaryElement: null,
      traits: [null, null, null],
      terras: [null, null],
      strongAgainst: [null, null, null, null],
      cardArtUrl: null,
      effectBlocks: [],
      borderless: false,
      _isLoadingSnapshot: false,
      _snapshotVersion: _snapshotVersion + 1,
      _snapshotTimer: null,
    });
  },

  loadCardData: (layoutType, data) => {
    set({
      layoutType,
      cardData: data,
    });
  },

  getSnapshot: () => {
    const s = get();
    return {
      cardType: s.cardType,
      layoutType: s.layoutType,
      cardData: s.cardData,
      cardName: s.cardName,
      tribe: s.tribe,
      spellbookLimit: s.spellbookLimit,
      primaryElement: s.primaryElement,
      secondaryElement: s.secondaryElement,
      traits: s.traits,
      terras: s.terras,
      strongAgainst: s.strongAgainst,
      cardArtUrl: s.cardArtUrl,
      effectBlocks: s.effectBlocks,
      locale: s.locale,
      borderless: s.borderless,
    };
  },

  loadSnapshot: (snapshot) => {
    // Cancel any pending timer from a previous loadSnapshot so it doesn't
    // clear _isLoadingSnapshot while the current import's effects are firing.
    const prev = get()._snapshotTimer;
    if (prev) clearTimeout(prev);

    const locale = snapshot.locale ?? 'en';
    const newData = { ...snapshot.cardData };

    // Ensure card art image zone matches cardArtUrl (e.g. blob URL from
    // remix conversion — the snapshot's cardData still has the remote URL)
    const lt = snapshot.layoutType;
    const artKey = getImageZoneId(lt, 'CardArt') || getImageZoneId(lt, 'Art');
    if (artKey && snapshot.cardArtUrl) {
      newData[artKey] = snapshot.cardArtUrl;
    }

    // Re-compose effect blocks as a fallback for older snapshots that may
    // be missing composition-managed zone data. Only fill in keys that don't
    // already exist in the snapshot — the snapshot's cardData is the source
    // of truth (it captured the full accumulated state from editing).
    const effectPatch = composeEffectBlocks(
      snapshot.effectBlocks ?? [], lt, snapshot.cardType, locale,
    );

    for (const key of Object.keys(effectPatch)) {
      if (!(key in newData)) {
        newData[key] = effectPatch[key];
      }
    }

    // Re-apply aura colors from stored elements — older snapshots or
    // autosaves created before the resetCard ordering fix may be missing
    // ArtBorder/BackgroundColor/Banner styles in cardData.
    applyAuraColors(newData, lt, snapshot.primaryElement, snapshot.secondaryElement, snapshot.cardType);

    // Clear after all effects have fired. Components also use a local
    // snapshotGuard ref as belt-and-suspenders (in case this fires early),
    // but 500ms provides generous margin for React StrictMode's double-
    // invocation cycle and any scheduling delays.
    const timer = setTimeout(() => {
      set({ _isLoadingSnapshot: false, _snapshotTimer: null });
    }, 500);

    set({
      ...snapshot,
      cardData: newData,
      locale,
      borderless: snapshot.borderless ?? false,
      _isLoadingSnapshot: true,
      _snapshotVersion: get()._snapshotVersion + 1,
      _snapshotTimer: timer,
    });
  },
}));

// Auto-save to sessionStorage
const AUTOSAVE_KEY = 'openzoo-card-autosave';
let _saveTimer: ReturnType<typeof setTimeout> | null = null;

useCardStore.subscribe((state) => {
  // Don't save while a snapshot is being loaded (would re-save the same data)
  if (state._isLoadingSnapshot) return;
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      const snapshot = useCardStore.getState().getSnapshot();
      // Blob URLs don't survive reloads — exclude cardArtUrl
      sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ ...snapshot, cardArtUrl: null }));
    } catch { /* sessionStorage quota exceeded or unavailable */ }
  }, 500);
});

// Restore saved state on page load (runs during module evaluation, before
// React mounts, so _isLoadingSnapshot guards work correctly).
try {
  const saved = sessionStorage.getItem(AUTOSAVE_KEY);
  if (saved) {
    const snapshot = JSON.parse(saved) as CardSnapshot;
    useCardStore.getState().loadSnapshot(snapshot);
  }
} catch { /* corrupted data or private browsing */ }
