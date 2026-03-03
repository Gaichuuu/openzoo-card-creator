import type { EffectBlock } from '@/types/effects';
import { BLOCK_LABELS } from '@/types/effects';
import { STATUS_EFFECTS, ATTACK_ELEMENTS } from '@/data/constants';
import { FormattedTextarea } from './FormattedTextarea';

interface EffectBlockEditorProps {
  block: EffectBlock;
  onUpdate: (updates: Partial<EffectBlock>) => void;
  onRemove: () => void;
}

const KEYWORD_TYPES = ['static', 'discard', 'contract', 'enter', 'arena', 'destroyed'] as const;

export function EffectBlockEditor({ block, onUpdate, onRemove }: EffectBlockEditorProps) {
  const label = BLOCK_LABELS[block.type];
  const isKeyword = (KEYWORD_TYPES as readonly string[]).includes(block.type);

  return (
    <div className="border border-navy-600 rounded bg-navy-800/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-navy-700/50">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
          {label}
        </span>
        <button
          onClick={onRemove}
          className="text-gold-500 hover:text-red-400 text-xs leading-none px-1"
          title="Remove"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="p-2 space-y-2">
        {/* Keyword effect blocks */}
        {isKeyword && (
          <KeywordEditor block={block} onUpdate={onUpdate} />
        )}

        {/* Power block */}
        {block.type === 'power' && (
          <PowerEditor block={block} onUpdate={onUpdate} />
        )}

        {/* Attack block */}
        {block.type === 'attack' && (
          <AttackBlockEditor block={block} onUpdate={onUpdate} />
        )}

        {/* Tribal boost block */}
        {block.type === 'tribal-boost' && (
          <TribalBoostEditor block={block} onUpdate={onUpdate} />
        )}

      </div>
    </div>
  );
}

function StarToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-3 h-3 rounded border-navy-600 bg-navy-700 accent-yellow-500"
      />
      <span className="text-[10px] text-gold-400">4th Wall</span>
    </label>
  );
}



function KeywordEditor({ block, onUpdate }: { block: EffectBlock; onUpdate: (u: Partial<EffectBlock>) => void }) {
  return (
    <FormattedTextarea
      value={block.text}
      onChange={(v) => onUpdate({ text: v })}
      placeholder="Effect text..."
      headerLeft={<StarToggle checked={block.hasStar} onChange={(v) => onUpdate({ hasStar: v })} />}
    />
  );
}

function PowerEditor({ block, onUpdate }: { block: EffectBlock; onUpdate: (u: Partial<EffectBlock>) => void }) {
  return (
    <>
      <div>
        <label className="text-[10px] text-gold-500">Power Name</label>
        <input
          type="text"
          value={block.powerName}
          onChange={(e) => onUpdate({ powerName: e.target.value })}
          placeholder="e.g. ROCK TOMB"
          maxLength={40}
          className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
        />
      </div>
      <FormattedTextarea
        value={block.text}
        onChange={(v) => onUpdate({ text: v })}
        placeholder="Power effect text..."
        headerLeft={<StarToggle checked={block.hasStar} onChange={(v) => onUpdate({ hasStar: v })} />}
      />
    </>
  );
}

function StatusEffectRow({
  label,
  effect,
  duration,
  onEffectChange,
  onDurationChange,
}: {
  label: string;
  effect: string;
  duration: string;
  onEffectChange: (v: string) => void;
  onDurationChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <label className="text-[10px] text-gold-500">{label}</label>
        <select
          value={effect}
          onChange={(e) => onEffectChange(e.target.value)}
          className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs"
        >
          <option value="">None</option>
          {STATUS_EFFECTS.map((se) => (
            <option key={se} value={se}>{se}</option>
          ))}
        </select>
      </div>
      <div className="w-16">
        <label className="text-[10px] text-gold-500">#</label>
        <input
          type="text"
          value={duration}
          onChange={(e) => onDurationChange(e.target.value)}
          placeholder="3"
          maxLength={4}
          className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}

function AttackBlockEditor({ block, onUpdate }: { block: EffectBlock; onUpdate: (u: Partial<EffectBlock>) => void }) {
  return (
    <>
      {/* Divider toggle */}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={block.showDivider}
          onChange={(e) => onUpdate({ showDivider: e.target.checked })}
          className="w-3 h-3 rounded border-navy-600 bg-navy-700 accent-blue-500"
        />
        <span className="text-[10px] text-gold-400">Show divider above attack</span>
      </label>

      {/* Attack name + ATK */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gold-500">Attack Name</label>
          <input
            type="text"
            value={block.attackName}
            onChange={(e) => onUpdate({ attackName: e.target.value })}
            placeholder="Attack name"
            maxLength={40}
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="w-16">
          <label className="text-[10px] text-gold-500">ATK</label>
          <input
            type="text"
            value={block.attackDamage}
            onChange={(e) => onUpdate({ attackDamage: e.target.value })}
            placeholder="50"
            maxLength={4}
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Status Effect 1 */}
      <StatusEffectRow
        label="Status Effect 1"
        effect={block.statusEffect}
        duration={block.statusEffectDuration}
        onEffectChange={(v) => onUpdate({ statusEffect: v })}
        onDurationChange={(v) => onUpdate({ statusEffectDuration: v })}
      />

      {/* Status Effect 2 */}
      <StatusEffectRow
        label="Status Effect 2"
        effect={block.statusEffect2}
        duration={block.statusEffectDuration2}
        onEffectChange={(v) => onUpdate({ statusEffect2: v })}
        onDurationChange={(v) => onUpdate({ statusEffectDuration2: v })}
      />

      {/* Attack Strength */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gold-500">Attack Strength 1</label>
          <select
            value={block.attackBonus}
            onChange={(e) => onUpdate({ attackBonus: e.target.value })}
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs"
          >
            <option value="">None</option>
            {ATTACK_ELEMENTS.map((el) => (
              <option key={el} value={el}>{el}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gold-500">Attack Strength 2</label>
          <select
            value={block.attackBonus2}
            onChange={(e) => onUpdate({ attackBonus2: e.target.value })}
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs"
          >
            <option value="">None</option>
            {ATTACK_ELEMENTS.map((el) => (
              <option key={el} value={el}>{el}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attack Effect */}
      <div>
        <label className="text-[10px] text-gold-500">Attack Effect</label>
        <FormattedTextarea
          value={block.attackEffect}
          onChange={(v) => onUpdate({ attackEffect: v })}
          placeholder="Attack effect text..."
          headerLeft={<StarToggle checked={block.attackHasStar} onChange={(v) => onUpdate({ attackHasStar: v })} />}
        />
      </div>
    </>
  );
}

function TribalBoostEditor({ block, onUpdate }: { block: EffectBlock; onUpdate: (u: Partial<EffectBlock>) => void }) {
  return (
    <>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gold-500">Type</label>
          <select
            value={block.boostLabel}
            onChange={(e) => onUpdate({
              boostLabel: e.target.value,
              boostTarget: e.target.value === 'TRIBAL BOOST' ? 'Sasquatch' : 'Forest',
            })}
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs"
          >
            <option value="TRIBAL BOOST">Tribal Boost</option>
            <option value="AURA BOOST">Aura Boost</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gold-500">
            {block.boostLabel === 'TRIBAL BOOST' ? 'Tribe' : 'Aura'}
          </label>
          {block.boostLabel === 'AURA BOOST' ? (
            <select
              value={block.boostTarget}
              onChange={(e) => onUpdate({ boostTarget: e.target.value })}
              className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs"
            >
              {ATTACK_ELEMENTS.map((el) => (
                <option key={el} value={el}>{el}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={block.boostTarget}
              onChange={(e) => onUpdate({ boostTarget: e.target.value })}
              placeholder="e.g. Sasquatch"
              maxLength={20}
              className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            />
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gold-500">ATK</label>
          <input
            type="text"
            value={block.boostAtk}
            onChange={(e) => onUpdate({ boostAtk: e.target.value })}
            placeholder="+10"
            maxLength={4}
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gold-500">LP</label>
          <input
            type="text"
            value={block.boostLp}
            onChange={(e) => onUpdate({ boostLp: e.target.value })}
            placeholder="+10"
            maxLength={4}
            className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </>
  );
}
