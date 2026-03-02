import { useState, type ReactNode } from 'react';
import { useCardStore } from '@/lib/store';
import type { EffectBlockType } from '@/types/effects';
import { BLOCK_ORDER, BLOCK_LABELS } from '@/types/effects';
import { sortBlocks } from '@/lib/effectComposer';
import { EffectBlockEditor } from './EffectBlockEditor';

export function Stepper({ label, value, min, max, onChange, valueWidth = 'w-4' }: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  valueWidth?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 w-1/2">
      <span className="text-[10px] text-gold-500">{label}</span>
      <button
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="w-5 h-5 text-xs bg-navy-700 hover:bg-navy-600 text-gray-300 rounded flex items-center justify-center disabled:opacity-30"
      >-</button>
      <span className={`text-[10px] text-gray-400 ${valueWidth} text-center tabular-nums`}>{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="w-5 h-5 text-xs bg-navy-700 hover:bg-navy-600 text-gray-300 rounded flex items-center justify-center disabled:opacity-30"
      >+</button>
    </div>
  );
}

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
  const nudge = useCardStore((s) => s.mainTextBoxNudge);
  const setNudge = useCardStore((s) => s.setMainTextBoxNudge);
  const extraShrink = useCardStore((s) => s.mainTextBoxExtraShrink);
  const setExtraShrink = useCardStore((s) => s.setMainTextBoxExtraShrink);
  const autoFitRatio = useCardStore((s) => s._autoFitRatio);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const available = AVAILABLE_BLOCKS[layoutType] || [];
  const sorted = sortBlocks(effectBlocks);
  if (available.length === 0) return null;
  const totalRatio = autoFitRatio * (1 - extraShrink * 0.02);
  const totalShrinkPct = Math.round((1 - totalRatio) * 100);

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

      {sorted.length > 0 && <div className="flex">
        <Stepper label="Nudge" value={nudge} min={-10} max={10} onChange={setNudge} />
        <Stepper
          label={<>Shrink{totalShrinkPct > 0 && <span className="text-gray-500 ml-0.5">({totalShrinkPct}%)</span>}</>}
          value={extraShrink} min={0} max={20} onChange={setExtraShrink}
        />
      </div>}

      {sorted.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">
          No effects added. Click &quot;+ Add Component&quot; to start.
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
