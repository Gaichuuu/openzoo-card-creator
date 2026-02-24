import { useEffect, useRef } from 'react';
import { useCardStore } from '@/lib/store';
import { TRAITS } from '@/data/constants';
import type { Trait } from '@/types/card';

const POTION_TRAITS: Trait[] = ['Trap'];
const SPELL_TRAITS: Trait[] = ['Equipment', 'Trap'];

export function TraitSelector() {
  const traits = useCardStore((s) => s.traits);
  const setTrait = useCardStore((s) => s.setTrait);
  const setStyleField = useCardStore((s) => s.setStyleField);
  const cardType = useCardStore((s) => s.cardType);

  const snapshotGuard = useRef(false);
  const isPotion = cardType === 'Potion';
  const isSpell = cardType === 'Spell';
  const slotCount = isPotion || isSpell ? 1 : 3;
  const availableTraits = isPotion ? POTION_TRAITS : isSpell ? SPELL_TRAITS : TRAITS;

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) { snapshotGuard.current = true; return; }
    if (snapshotGuard.current) return;
    setTrait(0, 'Convert');
    const traitStyle = '{width:20px;height:20px}';
    setStyleField('Trait1', traitStyle);
    setStyleField('Trait2', traitStyle);
    setStyleField('Trait3', traitStyle);
  }, []);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    if (snapshotGuard.current) { snapshotGuard.current = false; return; }
    if (isPotion) {
      setTrait(0, 'Trap');
      setTrait(1, null);
      setTrait(2, null);
    } else if (cardType === 'Spell') {
      setTrait(0, null);
      setTrait(1, null);
      setTrait(2, null);
    } else if (cardType === 'Artifact') {
      setTrait(0, 'Equipment');
      setTrait(1, null);
      setTrait(2, null);
    } else if (cardType === 'Beastie') {
      setTrait(0, 'Convert');
      setTrait(1, null);
      setTrait(2, null);
    }
  }, [cardType]);

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Traits
      </label>
      <div className="space-y-2">
        {Array.from({ length: slotCount }, (_, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xs text-gold-400 w-10">Slot {i + 1}</span>
            <select
              value={traits[i] || ''}
              onChange={(e) => setTrait(i, e.target.value || null)}
              className="flex-1 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
            >
              <option value="">None</option>
              {availableTraits.map((trait) => (
                <option key={trait} value={trait}>{trait}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
