import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCardStore } from '@/lib/store';
import { CARD_TYPE_TO_LAYOUT } from '@/data/constants';
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
import { JsonExportButton } from './JsonExportButton';
import { JsonImportButton } from './JsonImportButton';
import { PublishDialog } from './PublishDialog';
import { fetchCard } from '@/lib/galleryService';
import type { CardTag } from '@/types/card';

interface EditorSidebarProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
}

const BORDER_COLORS: Record<string, string> = {
  Red: 'rgb(221,12,34)',
  Sample: 'rgb(10,10,10)',
  PT: 'rgb(204,204,204)',
};

function SectionDivider() {
  return <hr className="border-navy-600" />;
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
          className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
        />
      )}
    </div>
  );
}

export function EditorSidebar({ cardRef }: EditorSidebarProps) {
  const [searchParams] = useSearchParams();
  const remixId = searchParams.get('remix');
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

  const [lp, setLp] = useState('10');
  const [flavorText, setFlavorText] = useState('');
  const [auraEffectText, setAuraEffectText] = useState('');
  const [terraEffectText, setTerraEffectText] = useState('');
  const [artist, setArtist] = useState('');
  const [borderStyle, setBorderStyle] = useState('Red');
  const [showPublish, setShowPublish] = useState(false);
  // Guards the cardType effect from re-applying defaults after a snapshot load.
  // Set to true during snapshot extraction; the cardType effect skips once then clears it.
  const snapshotGuard = useRef(false);

  const layout = CARD_TYPE_TO_LAYOUT[cardType];
  const isBasic = layout.startsWith('Basic');
  const isTerra = layout === 'Terra';
  const isAura = layout === 'Aura';
  const isRegularAura = cardType === 'Aura';
  const isSpecialAura = cardType === 'Special Aura';
  const isRegularTerra = cardType === 'Terra';
  const isSpecialTerra = cardType === 'Special Terra';
  const hasTribe = cardType === 'Artifact' || cardType === 'Beastie';
  const hasLP = cardType === 'Artifact' || cardType === 'Beastie';
  const hasMetadata = cardType === 'Beastie';
  const hasSpellbookLimit = !isRegularAura && !isRegularTerra;

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      snapshotGuard.current = true;
      const s = useCardStore.getState();
      const stripP = (v: string) => v.replace(/^<p>/, '').replace(/<\/p>$/, '');
      if (s.borderless) setBorderStyle('None');
      const lpZoneId = ZONE_ID_MAPS[s.layoutType]?.['LP'];
      const lpText = lpZoneId != null ? s.cardData[`t${lpZoneId}`] : '';
      const lpMatch = lpText?.match(/\{LP\}(\d+)/);
      if (lpMatch) setLp(lpMatch[1]);
      const flavorZoneId = ZONE_ID_MAPS[s.layoutType]?.['FlavorText'];
      const flavorVal = flavorZoneId != null ? s.cardData[`t${flavorZoneId}`] : '';
      if (flavorVal) setFlavorText(stripP(flavorVal));
      const artistZoneId = ZONE_ID_MAPS[s.layoutType]?.['Artist'];
      const artistText = artistZoneId != null ? stripP(s.cardData[`t${artistZoneId}`] || '') : '';
      const artistMatch = artistText?.match(/(?:Illus\.|イラスト)\s*(.*)/);
      if (artistMatch) setArtist(artistMatch[1]);
      const auraTextZoneId = ZONE_ID_MAPS[s.layoutType]?.['Aura/Terra Text Box'];
      const auraText = auraTextZoneId != null ? s.cardData[`t${auraTextZoneId}`] : '';
      if (auraText) setAuraEffectText(stripP(auraText));
      const terraTextZoneId = ZONE_ID_MAPS[s.layoutType]?.['Aura/Terra Text Box 1'];
      const terraText = terraTextZoneId != null ? s.cardData[`t${terraTextZoneId}`] : '';
      if (terraText) setTerraEffectText(stripP(terraText));
      setStyleField('LP', '{fontSize:19px}');
      setStyleField('TypesTribes', '{fontSize:9px;maxHeight:none;justifyContent:flex-start;paddingLeft:2px}');
      setStyleField('SpellbookLimit', '{fontSize:9px;maxHeight:none;justifyContent:flex-start;paddingLeft:2px}');
      setStyleField('CardName', '{maxHeight:23px;justifyContent:flex-start;paddingLeft:2px;outlineWidth:0px}');
      setStyleField('TNL', '{flex:1;minWidth:0;alignItems:stretch}');
      // AttackDivider: do NOT override — snapshot cardData has the correct display value
      setTextField('Copyright', `\u00a9 ${new Date().getFullYear()} OpenZoo`);
      setStyleField('Copyright', '{top:1px;marginLeft:2px}');
      setStyleField('Artist', '{top:1px;marginRight:2px}');
      setStyleField('FlavorText', '{left:95px;justifyContent:flex-end}');
      return;
    }
    if (snapshotGuard.current) {
      return;
    }
    setTextField('LP', `{LP}${lp}`);
    setStyleField('LP', '{fontSize:19px}');
    setStyleField('TypesTribes', '{fontSize:9px;maxHeight:none;justifyContent:flex-start;paddingLeft:2px}');
    setStyleField('SpellbookLimit', '{fontSize:9px;maxHeight:none;justifyContent:flex-start;paddingLeft:2px}');
    setStyleField('CardName', '{maxHeight:23px;justifyContent:flex-start;paddingLeft:2px;outlineWidth:0px}');
    setStyleField('TNL', '{flex:1;minWidth:0;alignItems:stretch}');
    setStyleField('AttackDivider', '{display:none}');
    setStyleField('CardBorder', `{outlineColor:${BORDER_COLORS.Red};background:${BORDER_COLORS.Red}}`);
    setTextField('Copyright', `\u00a9 ${new Date().getFullYear()} OpenZoo`);
    setStyleField('Copyright', '{top:1px;marginLeft:2px}');
    setStyleField('Artist', '{top:1px;marginRight:2px}');
    setStyleField('FlavorText', '{left:95px;justifyContent:flex-end}');
  }, [snapshotVersion]);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      return;
    }
    if (snapshotGuard.current) {
      snapshotGuard.current = false;
      return;
    }
    if (cardType === 'Aura') {
      setSpellbookLimit('');
      setTextField('SpellbookLimit', '');
      setAuraEffectText('');
      setFlavorText('');
      // Clear Special Aura icon overrides that persist across layout migration
      setStyleField('Aura1', '');
      setStyleField('Aura2', '');
      if (borderless) {
        setStyleField('CardArt', '{left:0px;top:0px;width:238px;height:333px;backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
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
        setStyleField('CardArt', '{left:0px;top:0px;width:238px;height:333px;backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
      }
    } else if (cardType === 'Terra') {
      setSpellbookLimit('');
      setTextField('SpellbookLimit', '');
      setTerraEffectText('');
      setFlavorText('');
      if (borderless) {
        setStyleField('Art', '{left:0px;top:0px;width:238px;height:333px;backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
      } else {
        setStyleField('Art', '{backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
      }
    } else if (cardType === 'Special Terra') {
      setCardName('Name');
      setSpellbookLimit('2');
      setTerraEffectText('{I:You may Fatigue this Terra Page at any time to generate 1 Terra of any type.}');
      setTextField('Aura/Terra Text Box 1', '{I:You may Fatigue this Terra Page at any time to generate 1 Terra of any type.}');
      setImageField('SetSymbol', 'OZLegacyGold.png');
      setFlavorText('');
      if (borderless) {
        setStyleField('Art', '{left:0px;top:0px;width:238px;height:333px;backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
      } else {
        setStyleField('Art', '{backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
      }
    } else {
      setCardName('Name');
      setSpellbookLimit('1');
      setAuraEffectText('');
      setTerraEffectText('');
      // Clear Aura icon style overrides that persist across layout migration
      setStyleField('Aura1', '');
      setStyleField('Aura2', '');
      setStyleField('LP', '{fontSize:19px}');
      setStyleField('AttackDivider', '{display:none}');
      setStyleField('TypesTribes', '{fontSize:9px;maxHeight:none;justifyContent:flex-start;paddingLeft:2px}');
      if (borderless) {
        setStyleField('CardArt', '{left:0px;top:0px;width:238px;height:333px;backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
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
    if (artist) {
      setTextField('Artist', `${t('Illus.', locale)} ${artist}`);
    }
  }, [locale]);

  const applyBorderless = () => {
    setBorderless(true);
    setStyleField('CardBorder', '{outlineWidth:0px;backgroundImage:none;backgroundColor:transparent}');
    setStyleField('CardArt', '{left:0px;top:0px;width:238px;height:333px;backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
    if (isTerra) {
      setStyleField('Art', '{left:0px;top:0px;width:238px;height:333px;backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
    }
  };

  const removeBorderless = (color: string) => {
    setBorderless(false);
    setStyleField('CardBorder', `{outlineColor:${color};background:${color}}`);
    setStyleField('CardArt', '');
    if (isTerra) {
      setStyleField('Art', '{backgroundImage:linear-gradient(to bottom, rgb(100,100,100), rgb(60,60,60))}');
    }
  };

  const handleLpChange = (v: string) => {
    const numeric = v.replace(/\D/g, '');
    setLp(numeric);
    setTextField('LP', numeric ? `{LP}${numeric}` : '');
  };

  return (
    <div className="w-80 bg-navy-900 border-r border-navy-600 overflow-y-auto p-4 space-y-4 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/assets/ozLogo.png" alt="OpenZoo" className="h-6" />
          </Link>
          <h2 className="text-lg font-bold text-white">Card Editor</h2>
        </div>
        <button
          onClick={() => { resetCard(); setBorderStyle('Red'); }}
          className="text-xs text-gold-400 hover:text-red-400 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Language + Border */}
      <div className="flex gap-4">
        <div className="w-1/2 space-y-1">
          <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
            Language
          </label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
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
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="Red">Red</option>
            <option value="Sample">Sample</option>
            <option value="PT">PT</option>
            <option value="None">Borderless</option>
          </select>
        </div>
      </div>

      {/* Card Type */}
      <CardTypeSelector />

      <SectionDivider />

      {/* Set Symbol */}
      <SetSymbolSelector />

      {/* Card Identity (hidden for regular Aura and regular Terra — name is auto-generated) */}
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
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Tribe: only for Artifacts and Beasties */}
      {hasTribe && (
        <TextField
          label="Tribe"
          value={tribe}
          onChange={setTribe}
          placeholder="e.g. Spirit"
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

      {/* Aura / Element Selection */}
      {isBasic && (
        <>
          <CostEditor />
          <SectionDivider />
        </>
      )}
      {isRegularAura && (
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

      {/* Traits (hidden for Terra and Aura layouts) */}
      {!isTerra && !isAura && (
        <>
          <TraitSelector />
        </>
      )}

      {/* Terra + Bonuses (hidden for Terra, Aura layouts, Potion, Artifact, Spell) */}
      {!isTerra && !isAura && cardType !== 'Potion' && cardType !== 'Artifact' && cardType !== 'Spell' && (
        <TerraSelector />
      )}

      <SectionDivider />

      {/* Card Art */}
      <ImageUploader />

      {/* Effect Text Box Builder (hidden for Terra and Aura layouts) */}
      {!isTerra && !isAura && (
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

      {/* Metadata (Beastie only) */}
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

      {/* Flavor Text (Basic layout only) */}
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

      {/* Credits */}
      <TextField
        label="Artist"
        value={artist}
        onChange={(v) => { setArtist(v); setTextField('Artist', v ? `${t('Illus.', locale)} ${v}` : ''); }}
        placeholder="Artist name"
        maxLength={30}
      />

      <SectionDivider />

      <button
        onClick={() => setShowPublish(true)}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 transition-colors border-gold"
      >
        Publish to Gallery
      </button>

      <ExportButton cardRef={cardRef} />

      <div className="flex gap-2">
        <JsonExportButton />
        <JsonImportButton />
      </div>

      <div className="h-4" />

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
