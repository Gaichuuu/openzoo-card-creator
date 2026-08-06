import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCardStore } from '@/lib/store';
import {
  CARD_TYPE_TO_LAYOUT, TYPES_WITHOUT_TERRA,
  STYLE_TYPES_TRIBES, STYLE_TYPES_TRIBES_TOKEN, STYLE_SPELLBOOK_LIMIT,
  STYLE_CARD_NAME, STYLE_TNL, STYLE_TNL_TOKEN, STYLE_LP, STYLE_FLAVOR_TEXT,
  BORDERLESS_ART_STYLE, TERRA_GRADIENT_STYLE,
} from '@/data/constants';
import { stripParagraphWrap } from '@/lib/textParserUtils';
import { ZONE_ID_MAPS } from '@/data/layouts';
import { CardTypeSelector } from './CardTypeSelector';
import { t } from '@/data/locales';
import type { Locale } from '@/data/locales';
import { TraitSelector } from './TraitSelector';
import { TerraSelector } from './TerraSelector';
import { ImageUploader } from './ImageUploader';
import { CostEditor } from './CostEditor';
import { CryptidInfoEditor } from './CryptidInfoEditor';
import { AuraElementSelector } from './AuraElementSelector';
import { TerraCardSelector } from './TerraCardSelector';
import { SetSymbolSelector } from './SetSymbolSelector';
import { TextBoxBuilder } from './TextBoxBuilder';
import { FormattedTextarea } from './FormattedTextarea';
import { ExportButton } from './ExportButton';
import { exportCardPng } from '@/lib/useCardExport';
import { JsonExportButton } from './JsonExportButton';
import { JsonImportButton } from './JsonImportButton';
import { PublishDialog } from './PublishDialog';
import { fetchCard } from '@/lib/galleryService';
import type { CardTag } from '@/types/card';

interface EditorSidebarProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  clearSignal?: number;
}

const BORDER_COLORS: Record<string, string> = {
  Red: 'rgb(221,12,34)',
  Sample: 'rgb(10,10,10)',
  PT: 'rgb(204,204,204)',
};

function SectionDivider({ alwaysVisible }: { alwaysVisible?: boolean }) {
  return <hr className={`border-navy-600 ${alwaysVisible ? '' : 'hidden md:block'}`} />;
}

function EditorSection({ id, title, summary, openSection, onToggle, className = '', children }: {
  id: string;
  title: string;
  summary?: React.ReactNode;
  openSection: string | null;
  onToggle: (id: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const open = openSection === id;
  return (
    <div className={`max-md:border-b max-md:border-navy-700 ${className}`}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="md:hidden w-full h-11 flex items-center justify-between gap-3 text-left cursor-pointer"
      >
        <span className="text-sm font-semibold text-white shrink-0">{title}</span>
        <span className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
          <span className="truncate">{summary}</span>
          <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
        </span>
      </button>
      <div className={`${open ? 'flex' : 'hidden'} md:flex flex-col gap-4 max-md:pb-4`}>
        {children}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline, maxLength }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-gold-400 resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-gold-400"
        />
      )}
    </div>
  );
}

export function EditorSidebar({ cardRef, clearSignal = 0 }: EditorSidebarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const remixId = searchParams.get('remix');

  const clearRemix = () => {
    if (remixId) {
      setSearchParams({}, { replace: true });
      setRemixSource(null);
    }
  };
  const [remixSource, setRemixSource] = useState<{ name: string; tags: CardTag[] } | null>(null);

  useEffect(() => {
    if (!remixId) return;
    fetchCard(remixId).then((card) => {
      if (card) setRemixSource({ name: card.cardName, tags: card.tags });
    });
  }, [remixId]);
  const cardType = useCardStore((s) => s.cardType);
  const cardName = useCardStore((s) => s.cardName);
  const setCardName = useCardStore((s) => s.setCardName);
  const tribe = useCardStore((s) => s.tribe);
  const setTribe = useCardStore((s) => s.setTribe);
  const spellbookLimit = useCardStore((s) => s.spellbookLimit);
  const setSpellbookLimit = useCardStore((s) => s.setSpellbookLimit);
  const setTextField = useCardStore((s) => s.setTextField);
  const setImageField = useCardStore((s) => s.setImageField);
  const setStyleField = useCardStore((s) => s.setStyleField);
  const resetCard = useCardStore((s) => s.resetCard);
  const borderless = useCardStore((s) => s.borderless);
  const setBorderless = useCardStore((s) => s.setBorderless);
  const locale = useCardStore((s) => s.locale);
  const setLocale = useCardStore((s) => s.setLocale);
  const snapshotVersion = useCardStore((s) => s._snapshotVersion);
  const effectBlocks = useCardStore((s) => s.effectBlocks);
  const artNeeded = useCardStore((s) => s.artNeeded);
  const cardArtUrl = useCardStore((s) => s.cardArtUrl);
  const primaryElement = useCardStore((s) => s.primaryElement);
  const secondaryElement = useCardStore((s) => s.secondaryElement);
  const traits = useCardStore((s) => s.traits);
  const terras = useCardStore((s) => s.terras);
  const [lp, setLp] = useState('10');
  const [flavorText, setFlavorText] = useState('');
  const [auraEffectText, setAuraEffectText] = useState('');
  const [terraEffectText, setTerraEffectText] = useState('');
  const [artist, setArtist] = useState('');
  const [borderStyle, setBorderStyle] = useState('Red');
  const [showPublish, setShowPublish] = useState(false);
  // Mobile single-open accordion (design 3b); desktop ignores this.
  const [openSection, setOpenSection] = useState<string | null>('identity');
  const snapshotGuard = useRef(false);
  const layout = CARD_TYPE_TO_LAYOUT[cardType];
  const isBasic = layout.startsWith('Basic');
  const isTerra = layout === 'Terra';
  const isAura = layout === 'Aura';
  const isRegularAura = cardType === 'Aura';
  const isSpecialAura = cardType === 'Special Aura';
  const isRegularTerra = cardType === 'Terra';
  const isSpecialTerra = cardType === 'Special Terra';
  const isToken = cardType === 'Token';
  const hasTribe = cardType === 'Artifact' || cardType === 'Beastie' || cardType === 'Token';
  const hasLP = cardType === 'Artifact' || cardType === 'Beastie';
  const hasMetadata = cardType === 'Beastie';
  const hasSpellbookLimit = !isRegularAura && !isRegularTerra && !isToken;

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      snapshotGuard.current = true;
      const s = useCardStore.getState();
      if (s.borderless) {
        setBorderStyle('None');
      } else {
        const cbZoneId = ZONE_ID_MAPS[s.layoutType]?.['CardBorder'];
        const cbStyle = cbZoneId != null ? s.cardData[`s${cbZoneId}`] || '' : '';
        const match = Object.entries(BORDER_COLORS).find(([, c]) => cbStyle.includes(c));
        if (match) setBorderStyle(match[0]);
      }
      const lpZoneId = ZONE_ID_MAPS[s.layoutType]?.['LP'];
      const lpText = lpZoneId != null ? s.cardData[`t${lpZoneId}`] : '';
      const lpMatch = lpText?.match(/\{LP\}(\d+)/);
      if (lpMatch) setLp(lpMatch[1]);
      const flavorZoneId = ZONE_ID_MAPS[s.layoutType]?.['FlavorText'];
      const flavorVal = flavorZoneId != null ? s.cardData[`t${flavorZoneId}`] : '';
      if (flavorVal) setFlavorText(stripParagraphWrap(flavorVal));
      const artistZoneId = ZONE_ID_MAPS[s.layoutType]?.['Artist'];
      const artistText = artistZoneId != null ? stripParagraphWrap(s.cardData[`t${artistZoneId}`] || '') : '';
      const artistMatch = artistText?.match(/(?:Illus\.|イラスト)\s*(.*)/);
      if (artistMatch) setArtist(artistMatch[1]);
      const auraTextZoneId = ZONE_ID_MAPS[s.layoutType]?.['Aura/Terra Text Box'];
      const auraText = auraTextZoneId != null ? s.cardData[`t${auraTextZoneId}`] : '';
      if (auraText) setAuraEffectText(stripParagraphWrap(auraText));
      const terraTextZoneId = ZONE_ID_MAPS[s.layoutType]?.['Aura/Terra Text Box 1'];
      const terraText = terraTextZoneId != null ? s.cardData[`t${terraTextZoneId}`] : '';
      if (terraText) setTerraEffectText(stripParagraphWrap(terraText));
      const setStyleIfMissing = (key: string, value: string) => {
        const zoneId = ZONE_ID_MAPS[s.layoutType]?.[key];
        if (zoneId !== undefined && !s.cardData[`s${zoneId}`]) {
          setStyleField(key, value);
        }
      };
      setStyleIfMissing('LP', STYLE_LP);
      setStyleIfMissing('CardName', STYLE_CARD_NAME);
      if (s.cardType === 'Token') {
        setStyleIfMissing('TypesTribes', STYLE_TYPES_TRIBES_TOKEN);
        setStyleIfMissing('SpellbookLimit', '{display:none}');
        setStyleIfMissing('TNL', STYLE_TNL_TOKEN);
      } else {
        setStyleIfMissing('TypesTribes', STYLE_TYPES_TRIBES);
        setStyleIfMissing('SpellbookLimit', STYLE_SPELLBOOK_LIMIT);
        setStyleIfMissing('TNL', STYLE_TNL);
      }
      setTextField('Copyright', `\u00a9 ${new Date().getFullYear()} OpenZoo`);
      setStyleIfMissing('Copyright', '{top:1px;marginLeft:2px}');
      setStyleIfMissing('Artist', '{top:1px;marginRight:2px}');
      setStyleIfMissing('FlavorText', STYLE_FLAVOR_TEXT);
      return;
    }
    if (snapshotGuard.current) {
      return;
    }
    setTextField('LP', `{LP}${lp}`);
    setStyleField('LP', STYLE_LP);
    setStyleField('TypesTribes', STYLE_TYPES_TRIBES);
    setStyleField('SpellbookLimit', STYLE_SPELLBOOK_LIMIT);
    setStyleField('CardName', STYLE_CARD_NAME);
    setStyleField('TNL', STYLE_TNL);
    setStyleField('AttackDivider', '{display:none}');
    setStyleField('CardBorder', `{outlineColor:${BORDER_COLORS.Red};background:${BORDER_COLORS.Red}}`);
    setTextField('Copyright', `\u00a9 ${new Date().getFullYear()} OpenZoo`);
    setStyleField('Copyright', '{top:1px;marginLeft:2px}');
    setStyleField('Artist', '{top:1px;marginRight:2px}');
    setStyleField('FlavorText', STYLE_FLAVOR_TEXT);
  }, [snapshotVersion]);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      return;
    }
    if (snapshotGuard.current) {
      snapshotGuard.current = false;
      return;
    }
    if (cardType === 'Token') {
      setCardName('Name');
      setTribe('');
      setTextField('TypesTribes', '');
      setSpellbookLimit('');
      setTextField('SpellbookLimit', '');
      setAuraEffectText('');
      setFlavorText('');
      setStyleField('Aura1', '{display:none}');
      setStyleField('Aura2', '');
      setStyleField('TypesTribes', STYLE_TYPES_TRIBES_TOKEN);
      setStyleField('SpellbookLimit', '{display:none}');
      setStyleField('TNL', STYLE_TNL_TOKEN);
      if (borderless) {
        setStyleField('CardArt', BORDERLESS_ART_STYLE);
      }
    } else if (cardType === 'Aura') {
      setSpellbookLimit('');
      setTextField('SpellbookLimit', '');
      setAuraEffectText('');
      setFlavorText('');
      setStyleField('Aura1', '');
      setStyleField('Aura2', '');
      setStyleField('TypesTribes', STYLE_TYPES_TRIBES);
      setStyleField('SpellbookLimit', STYLE_SPELLBOOK_LIMIT);
      setStyleField('TNL', STYLE_TNL);
      if (borderless) {
        setStyleField('CardArt', BORDERLESS_ART_STYLE);
      }
    } else if (cardType === 'Special Aura') {
      setCardName('Name');
      setSpellbookLimit('2');
      setAuraEffectText('{I:You may Fatigue this Aura Page at any time to generate 1 Aura of any type.}');
      setTextField('Aura/Terra Text Box', '{I:You may Fatigue this Aura Page at any time to generate 1 Aura of any type.}');
      setStyleField('Aura1', '{display:none}');
      setStyleField('Aura2', '{border:1px solid rgba(0,0,0,1)}');
      setImageField('SetSymbol', 'OZLegacyGold.png');
      setFlavorText('');
      if (borderless) {
        setStyleField('CardArt', BORDERLESS_ART_STYLE);
      }
    } else if (cardType === 'Terra') {
      setSpellbookLimit('');
      setTextField('SpellbookLimit', '');
      setTerraEffectText('');
      setFlavorText('');
      if (borderless) {
        setStyleField('Art', BORDERLESS_ART_STYLE);
      } else {
        setStyleField('Art', TERRA_GRADIENT_STYLE);
      }
    } else if (cardType === 'Special Terra') {
      setCardName('Name');
      setSpellbookLimit('2');
      setTerraEffectText('{I:You may Fatigue this Terra Page at any time to generate 1 Terra of any type.}');
      setTextField('Aura/Terra Text Box 1', '{I:You may Fatigue this Terra Page at any time to generate 1 Terra of any type.}');
      setImageField('SetSymbol', 'OZLegacyGold.png');
      setFlavorText('');
      if (borderless) {
        setStyleField('Art', BORDERLESS_ART_STYLE);
      } else {
        setStyleField('Art', TERRA_GRADIENT_STYLE);
      }
    } else {
      setCardName('Name');
      setSpellbookLimit('1');
      setAuraEffectText('');
      setTerraEffectText('');
      setStyleField('Aura1', '');
      setStyleField('Aura2', '');
      setStyleField('LP', STYLE_LP);
      setStyleField('AttackDivider', '{display:none}');
      setStyleField('TypesTribes', STYLE_TYPES_TRIBES);
      if (borderless) {
        setStyleField('CardArt', BORDERLESS_ART_STYLE);
        setStyleField('CardBorder', '{outlineWidth:0px;backgroundImage:none;backgroundColor:transparent}');
      }

      if (cardType === 'Artifact') {
        setLp('20');
        setTextField('LP', '{LP}20');
        setTribe('Terra Orb');
      } else if (cardType === 'Beastie') {
        setLp('10');
        setTextField('LP', '{LP}10');
        setTribe('Caster');
      } else {
        setTribe('');
      }
    }
  }, [cardType, snapshotVersion]);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    if (artist) {
      setTextField('Artist', `${t('Illus.', locale)} ${artist}`);
    }
  }, [locale]);

  const applyBorderless = () => {
    setBorderless(true);
    setStyleField('CardBorder', '{outlineWidth:0px;backgroundImage:none;backgroundColor:transparent}');
    setStyleField('CardArt', BORDERLESS_ART_STYLE);
    if (isTerra) {
      setStyleField('Art', BORDERLESS_ART_STYLE);
    }
  };

  const removeBorderless = (color: string) => {
    setBorderless(false);
    setStyleField('CardBorder', `{outlineColor:${color};background:${color}}`);
    setStyleField('CardArt', '');
    if (isTerra) {
      setStyleField('Art', TERRA_GRADIENT_STYLE);
    }
  };

  const handleLpChange = (v: string) => {
    const numeric = v.replace(/\D/g, '');
    setLp(numeric);
    setTextField('LP', numeric ? `{LP}${numeric}` : '');
  };

  const doClear = () => {
    resetCard();
    setBorderStyle('Red');
    clearRemix();
  };

  useEffect(() => {
    if (clearSignal === 0) return;
    doClear();
  }, [clearSignal]);

  const toggleSection = (id: string) => setOpenSection((prev) => (prev === id ? null : id));

  const showTraits = !isTerra && !isAura;
  const showTerraSlots = !TYPES_WITHOUT_TERRA.has(cardType);
  const showAuraSection = isBasic || isRegularAura || isToken || isTerra;
  const showEffectSection = showTraits || isSpecialTerra || isSpecialAura;

  const identitySummary = [
    hasTribe && tribe,
    hasLP && lp && `${lp} LP`,
    hasSpellbookLimit && spellbookLimit,
  ].filter(Boolean).join(' · ');
  const auraSummary = [primaryElement, secondaryElement].filter(Boolean).join(' · ');
  const traitsSummary = [...traits.filter(Boolean), ...terras.filter(Boolean)].join(', ');
  const effectSummary = `${effectBlocks.length} component${effectBlocks.length === 1 ? '' : 's'}`;
  const artSummary = artNeeded
    ? <span className="text-red-300">Art needed</span>
    : cardArtUrl ? 'Attached' : '';
  const loreSummary = [
    flavorText.trim() && 'Flavor',
    artist.trim() && 'Artist',
    hasMetadata && 'Metadata',
  ].filter(Boolean).join(' · ');
  const languageSummary = `${locale === 'ja' ? '日本語' : 'English'} · ${borderStyle === 'None' ? 'Borderless' : borderStyle}`;

  return (
    <div className="w-full md:w-82 bg-navy-900 md:border-r border-navy-600 flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Desktop panel header */}
        <div className="hidden md:flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-white">Card Editor</h2>
          <button
            onClick={() => {
              if (window.confirm('Clear the editor and start a new card?')) doClear();
            }}
            className="px-3 py-1.5 text-xs text-gold-400 border border-navy-600 hover:text-red-400 hover:border-red-400/60 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>

        {/* Language + Border */}
        <EditorSection id="language" title="Language & border" summary={languageSummary} openSection={openSection} onToggle={toggleSection} className="max-md:order-7">
          <div className="flex gap-4">
            <div className="w-1/2 space-y-1">
              <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                Language
              </label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-gold-400"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div className="w-1/2 space-y-1">
              <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                Border
              </label>
              <select
                value={borderStyle}
                onChange={(e) => {
                  const val = e.target.value;
                  setBorderStyle(val);
                  if (val === 'None') {
                    applyBorderless();
                  } else {
                    const color = BORDER_COLORS[val];
                    if (borderless) {
                      removeBorderless(color);
                    } else {
                      setStyleField('CardBorder', `{outlineColor:${color};background:${color}}`);
                    }
                  }
                }}
                className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-gold-400"
              >
                <option value="Red">Red</option>
                <option value="Sample">Sample</option>
                <option value="PT">PT</option>
                <option value="None">Borderless</option>
              </select>
            </div>
          </div>
        </EditorSection>

        <EditorSection id="identity" title="Identity & stats" summary={identitySummary} openSection={openSection} onToggle={toggleSection} className="max-md:order-1">
          {/* Card Type */}
          <CardTypeSelector />

          <SectionDivider />

          {/* Set Symbol */}
          <SetSymbolSelector />

          {/* Card Name */}
          {!isRegularAura && !isRegularTerra && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                Card Name
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Enter card name"
                maxLength={40}
                className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
          )}

          {/* Tribe */}
          {hasTribe && (
            <TextField
              label="Tribe"
              value={tribe}
              onChange={setTribe}
              placeholder="e.g. Humanoid"
              maxLength={30}
            />
          )}

          {(hasSpellbookLimit || hasLP) && (
            <div className="flex gap-4">
              {hasSpellbookLimit && (
                <div className="w-1/2">
                  <TextField
                    label="Spellbook Limit"
                    value={spellbookLimit}
                    onChange={setSpellbookLimit}
                    placeholder="e.g. 2"
                    maxLength={2}
                  />
                </div>
              )}
              {hasLP && (
                <div className="w-1/2">
                  <TextField
                    label="LP (Life Points)"
                    value={lp}
                    onChange={handleLpChange}
                    placeholder="e.g. 10"
                    maxLength={4}
                  />
                </div>
              )}
            </div>
          )}
        </EditorSection>

        {/* Aura */}
        {showAuraSection && (
          <EditorSection
            id="aura"
            title={isBasic ? 'Aura cost' : isTerra ? 'Terra' : 'Aura'}
            summary={auraSummary}
            openSection={openSection}
            onToggle={toggleSection}
            className="max-md:order-2"
          >
            {isBasic && (
              <>
                <CostEditor />
                <SectionDivider />
              </>
            )}
            {(isRegularAura || isToken) && (
              <>
                <AuraElementSelector />
                <SectionDivider />
              </>
            )}
            {isTerra && (
              <>
                <TerraCardSelector />
                <SectionDivider />
              </>
            )}
          </EditorSection>
        )}

        {/* Traits + Terra */}
        {(showTraits || showTerraSlots) && (
          <EditorSection id="traits" title="Traits & Terra" summary={traitsSummary} openSection={openSection} onToggle={toggleSection} className="max-md:order-3">
            {showTraits && (
              <TraitSelector />
            )}
            {showTerraSlots && (
              <TerraSelector />
            )}
          </EditorSection>
        )}

        {/* Card Art */}
        <EditorSection id="art" title="Card art" summary={artSummary} openSection={openSection} onToggle={toggleSection} className="max-md:order-5">
          <SectionDivider />
          <ImageUploader />
        </EditorSection>

        {/* Effect Text */}
        {showEffectSection && (
          <EditorSection id="effect" title="Effect text" summary={effectSummary} openSection={openSection} onToggle={toggleSection} className="max-md:order-4">
            {/* Effect Text */}
            {showTraits && (
              <>
                <SectionDivider />
                <TextBoxBuilder />
              </>
            )}

            {/* Special Terra effect text */}
            {isSpecialTerra && (
              <>
                <SectionDivider />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                    Effect Text
                  </label>
                  <FormattedTextarea
                    value={terraEffectText}
                    onChange={(v) => { setTerraEffectText(v); setTextField('Aura/Terra Text Box 1', v); }}
                    placeholder="Effect text..."
                  />
                </div>
              </>
            )}

            {/* Special Aura effect text */}
            {isSpecialAura && (
              <>
                <SectionDivider />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                    Effect Text
                  </label>
                  <FormattedTextarea
                    value={auraEffectText}
                    onChange={(v) => { setAuraEffectText(v); setTextField('Aura/Terra Text Box', v); }}
                    placeholder="Effect text..."
                  />
                </div>
              </>
            )}
          </EditorSection>
        )}

        <EditorSection id="lore" title="Lore & credits" summary={loreSummary} openSection={openSection} onToggle={toggleSection} className="max-md:order-6">
          {/* Metadata */}
          {hasMetadata && (
            <>
              <SectionDivider />
              {borderless ? (
                <div className="text-xs text-gold-500 italic">Metadata does not appear on borderless cards.</div>
              ) : (
                <CryptidInfoEditor />
              )}
            </>
          )}

          <SectionDivider />

          {/* Flavor Text */}
          {isBasic && (borderless ? (
            <div className="text-xs text-gold-500 italic">Flavor text does not appear on borderless cards.</div>
          ) : (
            <TextField
              label="Flavor Text"
              value={flavorText}
              onChange={(v) => { setFlavorText(v); setTextField('FlavorText', v); }}
              placeholder="Lore or flavor text..."
              multiline
              maxLength={200}
            />
          ))}

          {/* Artist */}
          <TextField
            label="Artist"
            value={artist}
            onChange={(v) => { setArtist(v); setTextField('Artist', v ? `${t('Illus.', locale)} ${v}` : ''); }}
            placeholder="Artist name"
            maxLength={30}
          />
        </EditorSection>

        <div className="flex flex-col gap-4 max-md:order-8">
          <SectionDivider alwaysVisible />

          <button
            onClick={() => setShowPublish(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 transition-colors border-gold"
          >
            Publish to Gallery
          </button>

          <ExportButton cardRef={cardRef} />

          <div className="flex gap-2">
            <JsonExportButton />
            <JsonImportButton onImport={clearRemix} />
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="flex md:hidden gap-3 px-4 pt-3 pb-5.5 border-t border-navy-600 bg-navy-900 shrink-0">
        <button
          onClick={() => exportCardPng(cardRef.current)}
          className="flex-1 h-12 bg-navy-800 text-gold-300 font-semibold border-gold"
        >
          Export PNG
        </button>
        <button
          onClick={() => setShowPublish(true)}
          className="flex-1 h-12 bg-green-600 text-white font-semibold border-gold"
        >
          Publish
        </button>
      </div>

      {showPublish && (
        <PublishDialog
          cardRef={cardRef}
          onClose={() => setShowPublish(false)}
          remixedFrom={remixId}
          remixedFromName={remixSource?.name}
          initialTags={remixSource?.tags}
        />
      )}
    </div>
  );
}
