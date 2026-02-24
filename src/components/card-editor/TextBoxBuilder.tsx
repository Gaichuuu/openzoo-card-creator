import { useState } from 'react';
import { useCardStore } from '@/lib/store';
import type { EffectBlockType } from '@/types/effects';
import { BLOCK_ORDER, BLOCK_LABELS } from '@/types/effects';
import { sortBlocks } from '@/lib/effectComposer';
import { EffectBlockEditor } from './EffectBlockEditor';

/** Which block types are available per layout type */
const AVAILABLE_BLOCKS: Record<string, EffectBlockType[]> = {
  BasicNoAttack: [
    'tribal-boost', 'static', 'discard',
    'contract', 'enter', 'arena', 'destroyed', 'power',
  ],
  BasicOnlyAttack: [
    'tribal-boost', 'attack',
  ],
  BasicAttackMain: BLOCK_ORDER,
  Terra: [],
};

export function TextBoxBuilder() {
  const layoutType = useCardStore((s) => s.layoutType);
  const effectBlocks = useCardStore((s) => s.effectBlocks);
  const addEffectBlock = useCardStore((s) => s.addEffectBlock);
  const removeEffectBlock = useCardStore((s) => s.removeEffectBlock);
  const updateEffectBlock = useCardStore((s) => s.updateEffectBlock);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const available = AVAILABLE_BLOCKS[layoutType] || [];
  const sorted = sortBlocks(effectBlocks);

  if (available.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
          Effect Text Box
        </label>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 transition-colors border-gold"
          >
            + Add Component
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-navy-800 border border-navy-600 rounded shadow-lg z-50 py-1">
              {available.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    addEffectBlock(type);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left text-xs text-gray-300 hover:bg-navy-700 hover:text-white px-3 py-1.5 transition-colors"
                >
                  {BLOCK_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sorted block list */}
      {sorted.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          No effects added. Click "+ Add Component" to start.
        </p>
      )}

      <div className="space-y-2">
        {sorted.map((block) => (
          <EffectBlockEditor
            key={block.id}
            block={block}
            onUpdate={(updates) => updateEffectBlock(block.id, updates)}
            onRemove={() => removeEffectBlock(block.id)}
          />
        ))}
      </div>
    </div>
  );
}
