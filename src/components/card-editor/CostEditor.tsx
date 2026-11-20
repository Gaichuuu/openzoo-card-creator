import { useEffect, useRef, useState } from 'react';
import { useCardStore, elementIconFor } from '@/lib/store';
import { ELEMENTS } from '@/data/constants';
import type { Element, ElementOrCustom } from '@/types/card';
import type { CustomElementDef, CustomIcon } from '@/types/customIcons';
import { isCustomIconValue, customIconToElementDef } from '@/lib/customIconUtils';
import { CustomIconPicker } from './CustomIconPicker';
import { zoneText, zoneValue, type ZoneSource } from '@/lib/zoneData';

function readSlotElement(s: ZoneSource, slot: 1 | 2): ElementOrCustom | '' {
  const img = zoneValue(s, `Aura${slot}`, 'i');
  if (isCustomIconValue(img)) return 'Custom';
  return img.replace('.png', '') as Element | '';
}

function readSlotCost(s: ZoneSource, slot: 1 | 2): string {
  return zoneText(s, `Cost${slot}`);
}

export function CostEditor() {
  const setImageField = useCardStore((s) => s.setImageField);
  const setTextField = useCardStore((s) => s.setTextField);
  const setStyleField = useCardStore((s) => s.setStyleField);
  const setPrimaryElement = useCardStore((s) => s.setPrimaryElement);
  const setSecondaryElement = useCardStore((s) => s.setSecondaryElement);
  const cardType = useCardStore((s) => s.cardType);
  const snapshotVersion = useCardStore((s) => s._snapshotVersion);

  const availableElements = cardType === 'Aura' || cardType === 'Terra'
    ? ELEMENTS
    : ELEMENTS.filter((el) => el !== 'Special');

  const snapshotGuard = useRef(false);
  const slot1El = useCardStore((s) => readSlotElement(s, 1));
  const slot1Cost = useCardStore((s) => readSlotCost(s, 1));
  const slot2El = useCardStore((s) => readSlotElement(s, 2));
  const slot2Cost = useCardStore((s) => readSlotCost(s, 2));
  const [pickerSlot, setPickerSlot] = useState<1 | 2 | null>(null);

  const colorElement = (el: ElementOrCustom | '' | null): ElementOrCustom | null => {
    if (!el || el === 'Neutral') return null;
    return el;
  };

  const applySlot = (slot: 1 | 2, el: ElementOrCustom | '', cost: string) => {
    const showCost = el && cost;
    const s = useCardStore.getState();
    const icon = elementIconFor(el || null, slot === 1 ? s.customPrimary : s.customSecondary);
    setImageField(`Aura${slot}`, icon);
    setStyleField(`Aura${slot}`, el ? '{border:1px solid rgba(0,0,0,1)}' : '');
    setImageField(`CostImage${slot}`, showCost ? 'CostBox.png' : '');
    setTextField(`Cost${slot}`, showCost ? cost : '');
    const costFontSize = cost.length >= 2 ? '10px' : '13px';
    setStyleField(`Cost${slot}`, `{fontWeight:bold;fontSize:${costFontSize};top:-1px;left:-1px}`);
    setStyleField(`CostImage${slot}`, showCost ? '{border:1px solid rgba(0,0,0,1)}' : '');
  };

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      snapshotGuard.current = true;
      return;
    }
    if (snapshotGuard.current) return;
    const ct = useCardStore.getState().cardType;
    let s1El: Element = 'Forest', s1Cost = '2', s2El: Element | '' = 'Neutral', s2Cost = '1';
    if (ct === 'Potion') { s1El = 'Neutral'; s1Cost = '0'; s2El = ''; s2Cost = ''; }
    else if (ct === 'Spell') { s1El = 'Flame'; s1Cost = '1'; s2El = ''; s2Cost = ''; }
    else if (ct === 'Artifact') { s1El = 'Lightning'; s1Cost = '1'; s2El = ''; s2Cost = ''; }
    setPrimaryElement(colorElement(s1El));
    setSecondaryElement(colorElement(s2El));
    applySlot(1, s1El, s1Cost);
    applySlot(2, s2El, s2Cost);
    setStyleField('TopRight', '{gap:2px}');
  }, [snapshotVersion]);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    if (snapshotGuard.current) { snapshotGuard.current = false; return; }
    if (cardType === 'Potion') {
      setPrimaryElement(null);
      setSecondaryElement(null);
      applySlot(1, 'Neutral', '0');
      applySlot(2, '', '');
    } else if (cardType === 'Spell') {
      setPrimaryElement(colorElement('Flame'));
      setSecondaryElement(null);
      applySlot(1, 'Flame', '1');
      applySlot(2, '', '');
    } else if (cardType === 'Artifact') {
      setPrimaryElement(colorElement('Lightning'));
      setSecondaryElement(null);
      applySlot(1, 'Lightning', '1');
      applySlot(2, '', '');
    } else if (cardType === 'Beastie') {
      setPrimaryElement(colorElement('Forest'));
      setSecondaryElement(colorElement('Neutral'));
      applySlot(1, 'Forest', '2');
      applySlot(2, 'Neutral', '1');
    }
  }, [cardType]);

  const handleSlot1ElChange = (el: ElementOrCustom, def?: CustomElementDef) => {
    if (el === 'Custom' && !def) { setPickerSlot(1); return; }
    setPrimaryElement(colorElement(el), def);
    applySlot(1, el, slot1Cost);
    applySlot(2, slot2El, slot2Cost);
  };

  const handleSlot2ElChange = (el: ElementOrCustom | '', def?: CustomElementDef) => {
    if (el === 'Custom' && !def) { setPickerSlot(2); return; }
    setSecondaryElement(colorElement(el), def);
    applySlot(1, slot1El, slot1Cost);
    applySlot(2, el, slot2Cost);
  };

  const handleCustomPick = (icon: CustomIcon) => {
    const def = customIconToElementDef(icon);
    if (pickerSlot === 1) handleSlot1ElChange('Custom', def);
    else if (pickerSlot === 2) handleSlot2ElChange('Custom', def);
  };

  const handleSlot1CostChange = (cost: string) => {
    applySlot(1, slot1El, cost);
  };

  const handleSlot2CostChange = (cost: string) => {
    applySlot(2, slot2El, cost);
  };


  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Aura
      </label>
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gold-400 w-10">Slot 1</span>
          <select
            value={slot1El}
            onChange={(e) => handleSlot1ElChange(e.target.value as ElementOrCustom)}
            className="flex-1 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
          >
            {availableElements.map((el) => (
              <option key={el} value={el}>{el}</option>
            ))}
            <option value="Custom">Custom…</option>
          </select>
          <input
            type="text"
            value={slot1Cost}
            onChange={(e) => handleSlot1CostChange(e.target.value)}
            disabled={!slot1El}
            title={slot1El ? undefined : 'Pick an Aura first'}
            placeholder="Cost"
            maxLength={2}
            className="w-16 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm disabled:opacity-40"
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gold-400 w-10">Slot 2</span>
          <select
            value={slot2El}
            onChange={(e) => handleSlot2ElChange(e.target.value as ElementOrCustom | '')}
            className="flex-1 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
          >
            <option value="">None</option>
            {availableElements.map((el) => (
              <option key={el} value={el}>{el}</option>
            ))}
            <option value="Custom">Custom…</option>
          </select>
          <input
            type="text"
            value={slot2Cost}
            onChange={(e) => handleSlot2CostChange(e.target.value)}
            disabled={!slot2El}
            title={slot2El ? undefined : 'Pick an Aura first'}
            placeholder="Cost"
            maxLength={2}
            className="w-16 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm disabled:opacity-40"
          />
        </div>
        {(slot1El === 'Custom' || slot2El === 'Custom') && (
          <div className="flex flex-col items-start gap-1 ml-12">
            {slot1El === 'Custom' && (
              <button
                onClick={() => setPickerSlot(1)}
                className="text-xs text-gold-500 hover:text-white underline cursor-pointer"
              >
                Change slot 1 custom element…
              </button>
            )}
            {slot2El === 'Custom' && (
              <button
                onClick={() => setPickerSlot(2)}
                className="text-xs text-gold-500 hover:text-white underline cursor-pointer"
              >
                Change slot 2 custom element…
              </button>
            )}
          </div>
        )}
      </div>
      <CustomIconPicker
        type="aura"
        title="Custom aura element"
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={handleCustomPick}
      />
    </div>
  );
}
