import { useState, type ReactNode } from 'react';
import { useCardStore } from '@/lib/store';
import type { LayoutType } from '@/types/layout';
import type { EffectBlockType } from '@/types/effects';
import { BLOCK_ORDER, BLOCK_LABELS } from '@/types/effects';
import { getFitMode } from '@/lib/fitMode';
import { sortBlocks } from '@/lib/effectComposer';
import { EffectBlockEditor } from './EffectBlockEditor';

export function Stepper({ label, value, min, max, onChange, valueWidth = 'w-4', step = 1 }: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  valueWidth?: string;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-1">
      <span className="text-[10px] text-gold-500">{label}</span>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="w-5 h-5 text-xs bg-navy-700 hover:bg-navy-600 text-gray-300 rounded flex items-center justify-center disabled:opacity-30"
      >-</button>
      <span className={`text-[10px] text-gray-400 ${valueWidth} text-center tabular-nums`}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="w-5 h-5 text-xs bg-navy-700 hover:bg-navy-600 text-gray-300 rounded flex items-center justify-center disabled:opacity-30"
      >+</button>
    </div>
  );
}

const AVAILABLE_BLOCKS: Partial<Record<LayoutType, EffectBlockType[]>> = {
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
  const extraShrink = useCardStore((s) => s.mainTextBoxExtraShrink);
  const setExtraShrink = useCardStore((s) => s.setMainTextBoxExtraShrink);
  const lineHeightAdj = useCardStore((s) => s.mainTextBoxLineHeight);
  const setLineHeightAdj = useCardStore((s) => s.setMainTextBoxLineHeight);
  const letterSpacingAdj = useCardStore((s) => s.mainTextBoxLetterSpacing);
  const setLetterSpacingAdj = useCardStore((s) => s.setMainTextBoxLetterSpacing);
  const nudge = useCardStore((s) => s.mainTextBoxNudge);
  const setNudge = useCardStore((s) => s.setMainTextBoxNudge);
  const attackEffectSpaced = useCardStore((s) => s.attackEffectSpaced);
  const setAttackEffectSpaced = useCardStore((s) => s.setAttackEffectSpaced);
  const autoFitRatio = useCardStore((s) => s._autoFitRatio);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const available = AVAILABLE_BLOCKS[layoutType] || [];
  const sorted = sortBlocks(effectBlocks);
  const ladder = getFitMode() === 'ladder';
  const totalRatio = ladder
    ? Math.min(1, autoFitRatio)
    : Math.min(1, autoFitRatio * (1 - extraShrink * 0.01));
  const totalShrinkPct = Math.round((1 - totalRatio) * 100);
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

      {sorted.length > 0 && <div className="flex flex-wrap gap-2">
        <Stepper label="Height" value={lineHeightAdj} min={-6} max={6} onChange={setLineHeightAdj} />
        <Stepper label="Spacing" value={letterSpacingAdj} min={-6} max={6} onChange={setLetterSpacingAdj} />
        <Stepper
          label={<>Shrink{totalShrinkPct > 0 && <span className="text-gray-500 ml-0.5">({totalShrinkPct}%)</span>}</>}
          value={extraShrink} min={-20} max={20} step={ladder ? 5 : 1} onChange={setExtraShrink}
        />
        <Stepper label="Nudge" value={nudge} min={-10} max={10} onChange={setNudge} />
        {sorted.some((b) => b.type === 'attack') && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={attackEffectSpaced}
              onChange={(e) => setAttackEffectSpaced(e.target.checked)}
              className="accent-gold-400"
            />
            <span className="text-[10px] text-gold-500">Spaced attack text</span>
          </label>
        )}
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
