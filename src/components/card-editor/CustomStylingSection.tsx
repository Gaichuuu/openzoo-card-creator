import { useState } from 'react';
import { useCardStore } from '@/lib/store';
import { CUSTOM_STYLE_ITEMS, GRADIENT_FIELDS, availableStyleItems, outlineItems, hasCustomStyle, isSafeColor, parseColor, GRADIENT_MIN_STOPS, GRADIENT_MAX_STOPS, type GradientTarget, type StyleItem } from '@/lib/customStyle';
import { AURA_COLORS, getAuraColor, hexToRgba } from '@/data/constants';
import type { GradientDef, TextColorKey } from '@/types/card';
import { CollapsibleSection } from './CollapsibleSection';
import { DANGER_LINK, FIELD_LABEL, HINT, MICRO_BUTTON, SUB_LABEL } from './editorStyles';

const UNSET_SENTINEL = '#000001';
const SAFE_SEED = [AURA_COLORS.Neutral.cardBackground, AURA_COLORS.Neutral.artBorder];

function Swatch({ value, onChange, label, unsetText, className = 'w-7 h-5' }: {
  value: string | null;
  onChange: (hex: string) => void;
  label: string;
  unsetText?: string;
  className?: string;
}) {
  const parsed = value ? parseColor(value) : null;
  return (
    <label className={`relative shrink-0 cursor-pointer ${className}`} title={label}>
      {parsed ? (
        <span className="absolute inset-0 rounded border border-navy-600" style={{ backgroundColor: value ?? undefined }} />
      ) : (
        <span className="absolute inset-0 rounded border border-dashed border-navy-600 bg-navy-800 flex items-center justify-center text-[9px] leading-none text-gray-400">
          {unsetText}
        </span>
      )}
      <input
        type="color"
        aria-label={label}
        value={parsed?.hex ?? UNSET_SENTINEL}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </label>
  );
}

function GradientEditor({ gradient, update, label }: {
  gradient: GradientDef;
  update: (fn: (g: GradientDef) => GradientDef) => void;
  label: string;
}) {
  const [angleDraft, setAngleDraft] = useState<string | null>(null);
  const { stops, angle } = gradient;

  const setStop = (i: number, hex: string) => update((g) => ({ ...g, stops: g.stops.map((s, j) => (j === i ? hex : s)) }));
  const addStop = () => update((g) => (g.stops.length >= GRADIENT_MAX_STOPS ? g : { ...g, stops: [...g.stops, g.stops[g.stops.length - 1]] }));
  const removeStop = (i: number) => update((g) => (g.stops.length <= GRADIENT_MIN_STOPS ? g : { ...g, stops: g.stops.filter((_, j) => j !== i) }));
  const commitAngle = (raw: string) => {
    setAngleDraft(raw);
    const n = parseInt(raw, 10);
    if (Number.isFinite(n)) update((g) => ({ ...g, angle: Math.max(0, Math.min(359, n)) }));
  };

  return (
    <div className="space-y-1.5 pl-2 border-l border-navy-600">
      <div className="flex flex-wrap items-center gap-1.5">
        {stops.map((stop, i) => (
          <span key={i} className="flex items-center gap-0.5">
            <Swatch value={stop} onChange={(hex) => setStop(i, hex)} label={`${label} stop ${i + 1}`} />
            <button
              onClick={() => removeStop(i)}
              disabled={stops.length <= GRADIENT_MIN_STOPS}
              aria-label={`Remove ${label} stop ${i + 1}`}
              className="w-4 h-5 text-[10px] text-gray-400 hover:text-white disabled:opacity-30"
            >×</button>
          </span>
        ))}
        <button onClick={addStop} disabled={stops.length >= GRADIENT_MAX_STOPS} className={MICRO_BUTTON}>
          + Stop
        </button>
      </div>
      <label className="flex items-center gap-1.5">
        <span className={SUB_LABEL}>Angle</span>
        <input
          type="number"
          min={0}
          max={359}
          step={5}
          value={angleDraft ?? String(angle)}
          onChange={(e) => commitAngle(e.target.value)}
          onBlur={() => setAngleDraft(null)}
          className="w-14 bg-navy-800 border border-navy-600 text-white rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-gold-400"
        />
        <span className={SUB_LABEL}>deg</span>
      </label>
    </div>
  );
}

function OutlineRow({ item }: { item: StyleItem & { key: TextColorKey } }) {
  const value = useCardStore((s) => s.customStyle?.outlines?.[item.key] ?? null);
  const setCustomOutline = useCardStore((s) => s.setCustomOutline);
  const isSet = value !== null;
  return (
    <div className="flex items-center gap-2 min-h-4 pl-2">
      <span className={`${SUB_LABEL} flex-1`}>Outline</span>
      <Swatch
        value={value}
        onChange={(hex) => setCustomOutline(item.key, hex)}
        label={`${item.label} outline`}
        unsetText="Auto"
        className="w-7 h-4"
      />
      <button
        onClick={() => setCustomOutline(item.key, null)}
        className={`${MICRO_BUTTON} ${isSet ? '' : 'invisible'}`}
        tabIndex={isSet ? 0 : -1}
        aria-hidden={!isSet}
        aria-label={`Reset ${item.label} outline`}
      >
        Reset
      </button>
    </div>
  );
}

const hasOutline = (item: StyleItem): item is StyleItem & { key: TextColorKey } => item.group === 'text' && !!item.outline;

const gradientTargetOf = (item: StyleItem): GradientTarget | null =>
  item.gradient && item.key in GRADIENT_FIELDS ? (item.key as GradientTarget) : null;

function StyleRow({ item }: { item: StyleItem }) {
  const gradientTarget = gradientTargetOf(item);
  const value = useCardStore((s) => s.customStyle?.colors[item.key] ?? null);
  const gradient = useCardStore((s) => (gradientTarget ? s.customStyle?.[GRADIENT_FIELDS[gradientTarget]] ?? null : null));
  const borderless = useCardStore((s) => s.borderless);
  const layoutType = useCardStore((s) => s.layoutType);
  const primary = useCardStore((s) => s.primaryElement);
  const customPrimary = useCardStore((s) => s.customPrimary);
  const setCustomColor = useCardStore((s) => s.setCustomColor);
  const setCustomGradient = useCardStore((s) => s.setCustomGradient);

  const parsed = value ? parseColor(value) : null;
  const alpha = parsed?.alpha ?? 1;
  const isSet = value !== null || gradient !== null;

  const setHex = (hex: string) => setCustomColor(item.key, hexToRgba(hex, item.alpha ? alpha : 1));
  const setAlpha = (pct: number) => {
    if (parsed) setCustomColor(item.key, hexToRgba(parsed.hex, pct / 100));
  };
  const reset = () => {
    setCustomColor(item.key, null);
    if (gradientTarget) setCustomGradient(gradientTarget, null);
  };
  const toggleGradient = (on: boolean) => {
    if (!gradientTarget) return;
    if (!on) { setCustomGradient(gradientTarget, null); return; }
    const el = getAuraColor(primary ?? 'Neutral', customPrimary);
    const seed = [parsed?.hex ?? el.cardBackground, el.artBorder].map((c, i) => (isSafeColor(c) ? c : SAFE_SEED[i]));
    setCustomGradient(gradientTarget, { angle: 90, stops: seed });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 min-h-5">
        <span className={`${FIELD_LABEL} mr-auto whitespace-nowrap`}>{item.label}</span>
        {gradientTarget && (
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={gradient !== null}
              onChange={(e) => toggleGradient(e.target.checked)}
              className="accent-gold-400"
            />
            <span className={SUB_LABEL}>Gradient</span>
          </label>
        )}
        {!gradient && (
          <>
            {item.alpha && (
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(alpha * 100)}
                disabled={!parsed}
                onChange={(e) => setAlpha(Number(e.target.value))}
                aria-label={`${item.label} opacity`}
                title={parsed ? `Opacity ${Math.round(alpha * 100)}%` : 'Pick a color first'}
                className="w-16 min-w-8 accent-gold-400 disabled:opacity-30"
              />
            )}
            <Swatch value={value} onChange={setHex} label={item.label} />
          </>
        )}
        <button
          onClick={reset}
          className={`${MICRO_BUTTON} ${isSet ? '' : 'invisible'}`}
          tabIndex={isSet ? 0 : -1}
          aria-hidden={!isSet}
        >
          Reset
        </button>
      </div>
      {hasOutline(item) && outlineItems(layoutType, borderless).has(item.key) && <OutlineRow item={item} />}
      {(item.key === 'border' || item.key === 'backgroundTint') && borderless && (
        <div className={`${HINT} italic`}>Not shown on borderless cards</div>
      )}
      {gradient && gradientTarget && (
        <GradientEditor
          gradient={gradient}
          update={(fn) => {
            const cur = useCardStore.getState().customStyle?.[GRADIENT_FIELDS[gradientTarget]];
            if (cur) setCustomGradient(gradientTarget, fn(cur));
          }}
          label={item.label}
        />
      )}
    </div>
  );
}

export function CustomStylingSection() {
  const layoutType = useCardStore((s) => s.layoutType);
  const customized = useCardStore((s) => hasCustomStyle(s.customStyle));
  const resetCustomStyle = useCardStore((s) => s.resetCustomStyle);
  const available = new Set(availableStyleItems(layoutType));
  const groups = [
    { title: 'Boxes', items: CUSTOM_STYLE_ITEMS.filter((i) => i.group === 'box' && available.has(i.key)) },
    { title: 'Text', items: CUSTOM_STYLE_ITEMS.filter((i) => i.group === 'text' && available.has(i.key)) },
  ];

  return (
    <CollapsibleSection title="Custom Styling" status={customized ? 'Customized' : null}>
      <div className="space-y-3">
        {groups.map(({ title, items }) => items.length > 0 && (
          <div key={title} className="space-y-1.5">
            <div className={`${SUB_LABEL} uppercase tracking-wider`}>{title}</div>
            {items.map((item) => <StyleRow key={item.key} item={item} />)}
          </div>
        ))}
        <button
          onClick={resetCustomStyle}
          disabled={!customized}
          className={DANGER_LINK}
        >
          Reset all styling
        </button>
      </div>
    </CollapsibleSection>
  );
}
