import { useEffect, useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { ELEMENTS } from '@/data/constants';
import type { Element } from '@/types/card';
import { t } from '@/data/locales';

export function AuraElementSelector() {
  const setPrimaryElement = useCardStore((s) => s.setPrimaryElement);
  const setSecondaryElement = useCardStore((s) => s.setSecondaryElement);
  const setCardName = useCardStore((s) => s.setCardName);
  const setStyleField = useCardStore((s) => s.setStyleField);
  const cardType = useCardStore((s) => s.cardType);
  const locale = useCardStore((s) => s.locale);

  const snapshotGuard = useRef(false);
  const [element, setElement] = useState<Element>('Spirit');

  const applyElement = (el: Element) => {
    const colorEl = el === 'Neutral' ? null : el;
    setPrimaryElement(colorEl);
    setSecondaryElement(null);
    setCardName(`${t(el, locale)} ${t('Aura', locale)}`);
    // Border on the icon (Aura2 position, set by applyAuraColors)
    setStyleField('Aura2', '{border:1px solid rgba(0,0,0,1)}');
    // Hide the empty Aura1 zone (toggleIfNoContent is false, so it renders as empty 14x14 div)
    setStyleField('Aura1', '{display:none}');
  };

  // Apply defaults on mount (or sync from snapshot on import)
  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      snapshotGuard.current = true;
      const el = useCardStore.getState().primaryElement ?? 'Spirit';
      setElement(el);
      return;
    }
    if (snapshotGuard.current) return;
    applyElement('Spirit');
  }, []);

  // Re-apply when switching back to Aura
  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    if (snapshotGuard.current) { snapshotGuard.current = false; return; }
    if (cardType === 'Aura') {
      applyElement(element);
    }
  }, [cardType]);

  // Translate card name when locale changes (without re-applying all Aura settings)
  useEffect(() => {
    if (cardType === 'Aura') {
      setCardName(`${t(element, locale)} ${t('Aura', locale)}`);
    }
  }, [locale]);

  const handleElementChange = (el: Element) => {
    setElement(el);
    applyElement(el);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Aura
      </label>
      <select
        value={element}
        onChange={(e) => handleElementChange(e.target.value as Element)}
        className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
      >
        {ELEMENTS.filter((el) => el !== 'Neutral').map((el) => (
          <option key={el} value={el}>{el}</option>
        ))}
      </select>
    </div>
  );
}
