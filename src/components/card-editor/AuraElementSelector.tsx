import { useEffect, useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { ELEMENTS } from '@/data/constants';
import type { ElementOrCustom } from '@/types/card';
import type { CustomElementDef, CustomIcon } from '@/types/customIcons';
import { customIconToElementDef } from '@/lib/customIconUtils';
import { t } from '@/data/locales';
import { CustomIconPicker } from './CustomIconPicker';
import { zoneValue } from '@/lib/zoneData';

export function AuraElementSelector() {
  const setPrimaryElement = useCardStore((s) => s.setPrimaryElement);
  const setSecondaryElement = useCardStore((s) => s.setSecondaryElement);
  const setCardName = useCardStore((s) => s.setCardName);
  const setStyleField = useCardStore((s) => s.setStyleField);
  const cardType = useCardStore((s) => s.cardType);
  const locale = useCardStore((s) => s.locale);

  const isToken = cardType === 'Token';
  const snapshotGuard = useRef(false);
  const element = useCardStore((s): ElementOrCustom => s.primaryElement ?? (isToken ? 'Neutral' : 'Spirit'));
  const showIcon = useCardStore((s) => {
    const style = zoneValue(s, 'Aura2', 's');
    return !!style && !style.includes('display:none');
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const AURA_ICON_VISIBLE = '{border:1px solid rgba(0,0,0,1)}';

  const applyElement = (el: ElementOrCustom, customDef?: CustomElementDef, showTokenIcon = showIcon) => {
    const colorEl = el === 'Neutral' ? null : el;
    setPrimaryElement(colorEl, customDef);
    setSecondaryElement(null);
    if (cardType === 'Aura') {
      const name = el === 'Custom' ? customDef?.name : t(el, locale);
      if (name) setCardName(`${name} ${t('Aura', locale)}`);
    }
    if (cardType === 'Token') {
      setStyleField('Aura1', '{display:none}');
      setStyleField('Aura2', showTokenIcon ? AURA_ICON_VISIBLE : '{display:none}');
    } else {
      setStyleField('Aura2', AURA_ICON_VISIBLE);
      setStyleField('Aura1', '{display:none}');
    }
  };

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      snapshotGuard.current = true;
      return;
    }
    if (snapshotGuard.current) return;
    applyElement(isToken ? 'Cosmic' : 'Spirit');
  }, []);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    if (snapshotGuard.current) { snapshotGuard.current = false; return; }
    if (cardType === 'Token') {
      applyElement('Cosmic', undefined, false);
    } else if (cardType === 'Aura') {
      applyElement('Spirit');
    }
  }, [cardType]);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    if (cardType === 'Aura' && element !== 'Custom') {
      setCardName(`${t(element, locale)} ${t('Aura', locale)}`);
    }
  }, [locale]);

  const handleElementChange = (el: ElementOrCustom) => {
    if (el === 'Custom') { setPickerOpen(true); return; }
    applyElement(el);
  };

  const handleCustomPick = (icon: CustomIcon) => {
    applyElement('Custom', customIconToElementDef(icon));
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Aura
      </label>
      <select
        value={element}
        onChange={(e) => handleElementChange(e.target.value as ElementOrCustom)}
        className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
      >
        {ELEMENTS.filter((el) => isToken ? el !== 'Special' : el !== 'Neutral').map((el) => (
          <option key={el} value={el}>{el}</option>
        ))}
        <option value="Custom">Custom…</option>
      </select>
      {element === 'Custom' && (
        <button
          onClick={() => setPickerOpen(true)}
          className="text-xs text-gold-500 hover:text-white underline cursor-pointer"
        >
          Change custom element…
        </button>
      )}
      {isToken && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showIcon}
            onChange={(e) => {
              setStyleField('Aura2', e.target.checked ? AURA_ICON_VISIBLE : '{display:none}');
            }}
            className="accent-gold-400"
          />
          <span className="text-xs text-gray-400">Show aura icon</span>
        </label>
      )}
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
