import { useEffect, useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { TERRAS } from '@/data/constants';
import { ZONE_ID_MAPS } from '@/data/layouts';
import { stripParagraphWrap } from '@/lib/textParserUtils';

const DEFAULT_TERRAS: [string, string] = ['Lake', 'Nighttime'];
const DEFAULT_BONUSES = [
  { atk: '+20', lp: '' },
  { atk: '', lp: '+15' },
];

const BONUS_STYLE = '{fontSize:8px;fontWeight:bold;letterSpacing:-0.1em;whiteSpace:nowrap;textWrap:nowrap;overflow:visible}';

function formatBonus(value: string, suffix: string): string {
  if (!value) return '';
  return `${value} ${suffix}`;
}

export function TerraSelector() {
  const terras = useCardStore((s) => s.terras);
  const setTerra = useCardStore((s) => s.setTerra);
  const setTextField = useCardStore((s) => s.setTextField);
  const setStyleField = useCardStore((s) => s.setStyleField);
  const snapshotGuard = useRef(false);
  const [bonuses, setBonuses] = useState(DEFAULT_BONUSES);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      const s = useCardStore.getState();
      const map = ZONE_ID_MAPS[s.layoutType];
      const extractBonus = (key: string, suffix: string) => {
        const zoneId = map?.[key];
        const text = zoneId != null ? stripParagraphWrap(s.cardData[`t${zoneId}`] || '') : '';
        return text.replace(` ${suffix}`, '');
      };
      setBonuses([
        { atk: extractBonus('Terra1ATK', 'ATK'), lp: extractBonus('Terra1LP', 'LP') },
        { atk: extractBonus('Terra2ATK', 'ATK'), lp: extractBonus('Terra2LP', 'LP') },
      ]);
      snapshotGuard.current = true;
      return;
    }
    if (snapshotGuard.current) return;
    setTerra(0, DEFAULT_TERRAS[0]);
    setTerra(1, DEFAULT_TERRAS[1]);
    setTextField('Terra1ATK', formatBonus(DEFAULT_BONUSES[0].atk, 'ATK'));
    setTextField('Terra1LP', formatBonus(DEFAULT_BONUSES[0].lp, 'LP'));
    setTextField('Terra2ATK', formatBonus(DEFAULT_BONUSES[1].atk, 'ATK'));
    setTextField('Terra2LP', formatBonus(DEFAULT_BONUSES[1].lp, 'LP'));
    setStyleField('Terra1ATK', BONUS_STYLE);
    setStyleField('Terra1LP', BONUS_STYLE);
    setStyleField('Terra2ATK', BONUS_STYLE);
    setStyleField('Terra2LP', BONUS_STYLE);
  }, []);

  const handleTerraChange = (i: number, value: string) => {
    setTerra(i, value || null);
    if (!value) {
      const newBonuses = [...bonuses];
      newBonuses[i] = { atk: '', lp: '' };
      setBonuses(newBonuses);
      setTextField(`Terra${i + 1}ATK`, '');
      setTextField(`Terra${i + 1}LP`, '');
    }
  };

  const handleBonusChange = (i: number, field: 'atk' | 'lp', value: string) => {
    const newBonuses = [...bonuses];
    newBonuses[i] = { ...newBonuses[i], [field]: value };
    setBonuses(newBonuses);
    const suffix = field === 'atk' ? 'ATK' : 'LP';
    const key = field === 'atk' ? `Terra${i + 1}ATK` : `Terra${i + 1}LP`;
    setTextField(key, formatBonus(value, suffix));
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Terra
      </label>
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gold-400 w-10">Slot {i + 1}</span>
              <select
                value={terras[i] || ''}
                onChange={(e) => handleTerraChange(i, e.target.value)}
                className="flex-1 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
              >
                <option value="">None</option>
                {TERRAS.map((terra) => (
                  <option key={terra} value={terra}>{terra}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 ml-12">
              <div className="flex-1 flex items-center gap-1">
                <label className="text-[10px] text-gold-500 shrink-0">ATK</label>
                <input
                  type="text"
                  value={bonuses[i].atk}
                  onChange={(e) => handleBonusChange(i, 'atk', e.target.value)}
                  placeholder="+10"
                  maxLength={4}
                  className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs"
                />
              </div>
              <div className="flex-1 flex items-center gap-1">
                <label className="text-[10px] text-gold-500 shrink-0">LP</label>
                <input
                  type="text"
                  value={bonuses[i].lp}
                  onChange={(e) => handleBonusChange(i, 'lp', e.target.value)}
                  placeholder="+10"
                  maxLength={4}
                  className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
