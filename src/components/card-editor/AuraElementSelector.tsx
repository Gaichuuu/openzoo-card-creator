import { useEffect, useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { ELEMENTS } from '@/data/constants';
import type { Element } from '@/types/card';
import type { CustomElementDef, CustomIcon } from '@/types/customIcons';
import { t } from '@/data/locales';
import { CustomIconPicker } from './CustomIconPicker';

export function AuraElementSelector() {
  const setPrimaryElement = useCardStore((s) => s.setPrimaryElement);
  const setSecondaryElement = useCardStore((s) => s.setSecondaryElement);
  const setCardName = useCardStore((s) => s.setCardName);
  const setStyleField = useCardStore((s) => s.setStyleField);
  const cardType = useCardStore((s) => s.cardType);
  const locale = useCardStore((s) => s.locale);

  const isToken = cardType === 'Token';
  const snapshotGuard = useRef(false);
  const [element, setElement] = useState<Element | 'Custom'>(isToken ? 'Cosmic' : 'Spirit');
  const [pickerOpen, setPickerOpen] = useState(false);

  const applyElement = (el: Element | 'Custom') => {
    const colorEl = el === 'Neutral' ? null : el;
    setPrimaryElement(colorEl);
    setSecondaryElement(null);
    if (cardType === 'Aura' && el !== 'Custom') {
      setCardName(`${t(el, locale)} ${t('Aura', locale)}`);
    }
    if (cardType === 'Token') {
      setStyleField('Aura1', '{display:none}');
      setStyleField('Aura2', '{display:none}');
    } else {
      setStyleField('Aura2', '{border:1px solid rgba(0,0,0,1)}');
      setStyleField('Aura1', '{display:none}');
    }
  };

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      snapshotGuard.current = true;
      const el = useCardStore.getState().primaryElement ?? (isToken ? 'Cosmic' : 'Spirit');
      setElement(el);
      return;
    }
    if (snapshotGuard.current) return;
    applyElement(isToken ? 'Cosmic' : 'Spirit');
  }, []);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    if (snapshotGuard.current) { snapshotGuard.current = false; return; }
    if (cardType === 'Token') {
      const defaultEl = 'Cosmic';
      setElement(defaultEl);
      applyElement(defaultEl);
    } else if (cardType === 'Aura') {
      const defaultEl = 'Spirit';
      setElement(defaultEl);
      applyElement(defaultEl);
    }
  }, [cardType]);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    if (cardType === 'Aura' && element !== 'Custom') {
      setCardName(`${t(element, locale)} ${t('Aura', locale)}`);
    }
  }, [locale]);

  const handleElementChange = (el: Element | 'Custom') => {
    if (el === 'Custom') { setPickerOpen(true); return; }
    setElement(el);
    applyElement(el);
  };

  const handleCustomPick = (icon: CustomIcon) => {
    const def: CustomElementDef = {
      name: icon.name || 'Custom',
      icon: icon.image,
      cardBackground: icon.aura?.cardBackground ?? '#888888',
      artBorder: icon.aura?.artBorder ?? '#CCCCCC',
      strongAgainst: icon.aura?.strongAgainst ?? [],
    };
    setElement('Custom');
    setPrimaryElement('Custom', def);
    setSecondaryElement(null);
    if (cardType === 'Aura') {
      setCardName(`${def.name} ${t('Aura', locale)}`);
    }
    if (cardType === 'Token') {
      setStyleField('Aura1', '{display:none}');
      setStyleField('Aura2', '{display:none}');
    } else {
      setStyleField('Aura2', '{border:1px solid rgba(0,0,0,1)}');
      setStyleField('Aura1', '{display:none}');
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Aura
      </label>
      <select
        value={element}
        onChange={(e) => handleElementChange(e.target.value as Element | 'Custom')}
        className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
      >
        {ELEMENTS.filter((el) => isToken ? el !== 'Special' : el !== 'Neutral').map((el) => (
          <option key={el} value={el}>{el}</option>
        ))}
        <option value="Custom">Custom…</option>
      </select>
      <CustomIconPicker
        type="aura"
        title="Custom aura element"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleCustomPick}
      />
    </div>
  );
}
