import { useEffect, useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { ELEMENTS } from '@/data/constants';
import { ZONE_ID_MAPS } from '@/data/layouts';
import type { Element } from '@/types/card';
import { stripParagraphWrap } from '@/lib/textParserUtils';

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
  const [slot1El, setSlot1El] = useState<Element>('Forest');
  const [slot1Cost, setSlot1Cost] = useState('2');
  const [slot2El, setSlot2El] = useState<Element | ''>('Neutral');
  const [slot2Cost, setSlot2Cost] = useState('1');

  const colorElement = (el: Element | '' | null): Element | null => {
    if (!el || el === 'Neutral') return null;
    return el;
  };

  const applySlot = (slot: 1 | 2, el: Element | '', cost: string) => {
    const showCost = el && cost;
    setImageField(`Aura${slot}`, el ? `${el}.png` : '');
    setStyleField(`Aura${slot}`, el ? '{border:1px solid rgba(0,0,0,1)}' : '');
    setImageField(`CostImage${slot}`, showCost ? 'CostBox.png' : '');
    setTextField(`Cost${slot}`, showCost ? cost : '');
    setStyleField(`Cost${slot}`, '{fontWeight:bold;fontSize:13px;top:-1px;left:-0.5px}');
    setStyleField(`CostImage${slot}`, showCost ? '{border:1px solid rgba(0,0,0,1)}' : '');
  };

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      snapshotGuard.current = true;
      const s = useCardStore.getState();
      const map = ZONE_ID_MAPS[s.layoutType];
      const aura1Img = map?.['Aura1'] != null ? s.cardData[`i${map['Aura1']}`] : '';
      const el1 = aura1Img?.replace('.png', '') as Element || '';
      const cost1 = map?.['Cost1'] != null ? stripParagraphWrap(s.cardData[`t${map['Cost1']}`] || '') : '';
      const aura2Img = map?.['Aura2'] != null ? s.cardData[`i${map['Aura2']}`] : '';
      const el2 = aura2Img?.replace('.png', '') as Element | '' || '';
      const cost2 = map?.['Cost2'] != null ? stripParagraphWrap(s.cardData[`t${map['Cost2']}`] || '') : '';
      if (el1) { setSlot1El(el1 as Element); setSlot1Cost(cost1); }
      if (el2) { setSlot2El(el2 as Element); setSlot2Cost(cost2); } else { setSlot2El(''); setSlot2Cost(''); }
      return;
    }
    if (snapshotGuard.current) return;
    const ct = useCardStore.getState().cardType;
    let s1El: Element = 'Forest', s1Cost = '2', s2El: Element | '' = 'Neutral', s2Cost = '1';
    if (ct === 'Potion') { s1El = 'Neutral'; s1Cost = '0'; s2El = ''; s2Cost = ''; }
    else if (ct === 'Spell') { s1El = 'Flame'; s1Cost = '1'; s2El = ''; s2Cost = ''; }
    else if (ct === 'Artifact') { s1El = 'Lightning'; s1Cost = '1'; s2El = ''; s2Cost = ''; }
    setSlot1El(s1El); setSlot1Cost(s1Cost);
    setSlot2El(s2El); setSlot2Cost(s2Cost);
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
      setSlot1El('Neutral');
      setSlot1Cost('0');
      setSlot2El('');
      setSlot2Cost('');
      setPrimaryElement(null);
      setSecondaryElement(null);
      applySlot(1, 'Neutral', '0');
      applySlot(2, '', '');
    } else if (cardType === 'Spell') {
      setSlot1El('Flame');
      setSlot1Cost('1');
      setSlot2El('');
      setSlot2Cost('');
      setPrimaryElement(colorElement('Flame'));
      setSecondaryElement(null);
      applySlot(1, 'Flame', '1');
      applySlot(2, '', '');
    } else if (cardType === 'Artifact') {
      setSlot1El('Lightning');
      setSlot1Cost('1');
      setSlot2El('');
      setSlot2Cost('');
      setPrimaryElement(colorElement('Lightning'));
      setSecondaryElement(null);
      applySlot(1, 'Lightning', '1');
      applySlot(2, '', '');
    } else if (cardType === 'Beastie') {
      setSlot1El('Forest');
      setSlot1Cost('2');
      setSlot2El('Neutral');
      setSlot2Cost('1');
      setPrimaryElement(colorElement('Forest'));
      setSecondaryElement(colorElement('Neutral'));
      applySlot(1, 'Forest', '2');
      applySlot(2, 'Neutral', '1');
    }
  }, [cardType]);

  const handleSlot1ElChange = (el: Element) => {
    setSlot1El(el);
    setPrimaryElement(colorElement(el));
    applySlot(1, el, slot1Cost);
    applySlot(2, slot2El, slot2Cost);
  };

  const handleSlot2ElChange = (el: Element | '') => {
    setSlot2El(el);
    setSecondaryElement(colorElement(el));
    applySlot(1, slot1El, slot1Cost);
    applySlot(2, el, slot2Cost);
  };

  const handleSlot1CostChange = (cost: string) => {
    setSlot1Cost(cost);
    applySlot(1, slot1El, cost);
  };

  const handleSlot2CostChange = (cost: string) => {
    setSlot2Cost(cost);
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
            onChange={(e) => handleSlot1ElChange(e.target.value as Element)}
            className="flex-1 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
          >
            {availableElements.map((el) => (
              <option key={el} value={el}>{el}</option>
            ))}
          </select>
          <input
            type="text"
            value={slot1Cost}
            onChange={(e) => handleSlot1CostChange(e.target.value)}
            placeholder="Cost"
            maxLength={2}
            className="w-16 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gold-400 w-10">Slot 2</span>
          <select
            value={slot2El}
            onChange={(e) => handleSlot2ElChange(e.target.value as Element | '')}
            className="flex-1 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
          >
            <option value="">None</option>
            {availableElements.map((el) => (
              <option key={el} value={el}>{el}</option>
            ))}
          </select>
          <input
            type="text"
            value={slot2Cost}
            onChange={(e) => handleSlot2CostChange(e.target.value)}
            placeholder="Cost"
            maxLength={2}
            className="w-16 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
