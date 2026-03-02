import { useEffect, useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { TERRAS } from '@/data/constants';
import { ZONE_ID_MAPS } from '@/data/layouts';
import type { Terra } from '@/types/card';
import { t as translate } from '@/data/locales';

export function TerraCardSelector() {
  const setImageField = useCardStore((s) => s.setImageField);
  const setStyleField = useCardStore((s) => s.setStyleField);
  const setCardName = useCardStore((s) => s.setCardName);
  const cardType = useCardStore((s) => s.cardType);
  const locale = useCardStore((s) => s.locale);
  const snapshotGuard = useRef(false);
  const [terra, setTerra] = useState<Terra>('Cave');
  const applyTerra = (t: Terra) => {
    setImageField('TerraSymbol', `OpenZoo Terra/${t}.png`);
    setStyleField('TerraSymbol', '{outlineWidth:0px;left:-2px}');
    if (cardType === 'Terra') {
      setCardName(translate(t, locale));
    }
  };

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      snapshotGuard.current = true;
      const s = useCardStore.getState();
      const map = ZONE_ID_MAPS[s.layoutType];
      const zoneId = map?.['TerraSymbol'];
      const img = zoneId != null ? s.cardData[`i${zoneId}`] || '' : '';
      const m = img.match(/OpenZoo Terra\/(.+)\.png/);
      if (m && TERRAS.includes(m[1] as Terra)) setTerra(m[1] as Terra);
      return;
    }
    if (snapshotGuard.current) return;
    applyTerra('Cave');
  }, []);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    if (snapshotGuard.current) { snapshotGuard.current = false; return; }
    if (cardType === 'Terra' || cardType === 'Special Terra') {
      applyTerra(terra);
    }
  }, [cardType]);

  useEffect(() => {
    if (cardType === 'Terra' || cardType === 'Special Terra') {
      setCardName(translate(terra, locale));
    }
  }, [locale]);

  const handleTerraChange = (t: Terra) => {
    setTerra(t);
    applyTerra(t);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Terra
      </label>
      <select
        value={terra}
        onChange={(e) => handleTerraChange(e.target.value as Terra)}
        className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
      >
        {TERRAS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}
