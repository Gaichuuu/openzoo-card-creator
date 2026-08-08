import { useEffect, useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { ZONE_ID_MAPS } from '@/data/layouts';
import { SETS } from '@/data/constants';
import { isCustomIconValue } from '@/lib/customIconUtils';
import { CustomIconPicker } from './CustomIconPicker';
import type { CustomIcon } from '@/types/customIcons';

function getFilename(set: string, rarity: string): string {
  const def = SETS.find((s) => s.value === set);
  if (def && def.rarities.length > 1) return `${set}${rarity}.png`;
  return `${set}.png`;
}

export function SetSymbolSelector() {
  const setImageField = useCardStore((s) => s.setImageField);
  const cardType = useCardStore((s) => s.cardType);
  const snapshotGuard = useRef(false);
  const customUrlRef = useRef('');
  const [set, setSet] = useState('OZLegacy');
  const [rarity, setRarity] = useState('Bronze');
  const [pickerOpen, setPickerOpen] = useState(false);

  const currentSet = SETS.find((s) => s.value === set);
  const rarities = currentSet?.rarities ?? [];

  const updateSymbol = (newSet: string, newRarity: string) => {
    if (newSet === '__custom__') {
      if (customUrlRef.current) setImageField('SetSymbol', customUrlRef.current);
      return;
    }
    setImageField('SetSymbol', getFilename(newSet, newRarity));
  };

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      snapshotGuard.current = true;
      const s = useCardStore.getState();
      const map = ZONE_ID_MAPS[s.layoutType];
      const zoneId = map?.['SetSymbol'];
      const img = zoneId != null ? s.cardData[`i${zoneId}`] || '' : '';

      if (isCustomIconValue(img)) {
        customUrlRef.current = img;
        setSet('__custom__');
        setRarity('');
        return;
      }
      const base = img.replace('.png', '');

      for (const def of [...SETS].sort((a, b) => b.value.length - a.value.length)) {
        if (base.startsWith(def.value)) {
          setSet(def.value);
          const rar = base.slice(def.value.length);
          setRarity(rar || (def.rarities[0] ?? ''));
          break;
        }
      }
      return;
    }
    if (snapshotGuard.current) { snapshotGuard.current = false; return; }
    updateSymbol(set, rarity);
  }, [cardType]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Set
      </label>
      <div className="flex gap-2">
        <select
          value={set}
          onChange={(e) => {
            const newSet = e.target.value;
            if (newSet === '__custom__') { setPickerOpen(true); return; }
            const def = SETS.find((s) => s.value === newSet);
            const newRarity = def && def.rarities.length > 0 ? def.rarities[0] : '';
            setSet(newSet);
            setRarity(newRarity);
            updateSymbol(newSet, newRarity);
          }}
          className="flex-1 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
        >
          {SETS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
          <option value="__custom__">Custom…</option>
        </select>
        {set !== '__custom__' && rarities.length > 1 ? (
          <select
            value={rarity}
            onChange={(e) => {
              setRarity(e.target.value);
              updateSymbol(set, e.target.value);
            }}
            className="flex-1 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
          >
            {rarities.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        ) : (
          <span className="flex-1 bg-navy-800 border border-navy-600 text-gold-400 rounded px-2 py-1 text-sm">
            {set === '__custom__' ? 'Custom' : rarities.length === 1 ? rarities[0] : 'None'}
          </span>
        )}
      </div>
      <CustomIconPicker
        type="set"
        title="Custom set symbol"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(icon: CustomIcon) => {
          customUrlRef.current = icon.image;
          setSet('__custom__');
          setRarity('');
          setImageField('SetSymbol', icon.image);
        }}
      />
    </div>
  );
}
