import { useLocation } from 'react-router-dom';
import { useCardStore } from '@/lib/store';
import {
  HOLO_PATTERNS,
  HOLO_STRENGTH_MIN,
  HOLO_STRENGTH_MAX,
  HOLO_STRENGTH_DEFAULT,
  HOLO_ANGLE_MAX,
  HOLO_ANGLE_DEFAULT,
} from '@/lib/holo/holoSettings';
import { HOLO_AREAS, availableHoloAreas, toggleHoloArea, visibleHoloAreas } from '@/lib/holo/holoAreas';
import type { HoloArea, HoloPatternId } from '@/types/card';
import { Stepper } from './TextBoxBuilder';
import { CollapsibleSection } from './CollapsibleSection';
import { CHECK_LABEL, FULL_SELECT, SECTION_LABEL, TEXT_LINK } from './editorStyles';

const STRENGTH_STEP = 5;
const ANGLE_STEP = 15;
const ANGLE_STEP_MAX = Math.floor(HOLO_ANGLE_MAX / ANGLE_STEP) * ANGLE_STEP;

const LAB_PATH = '/holo-lab';

function handOffToLab(e: React.MouseEvent<HTMLAnchorElement>) {
  if (e.button !== 0 && e.button !== 1) return;
  const id = Date.now();
  e.currentTarget.href = `${LAB_PATH}?handoff=${id}`;
  const snapshot = useCardStore.getState().getSnapshot();
  void import('@/components/holo-lab/labHandoff').then((m) => m.saveLabCard(snapshot, id));
}

export function HoloControls({ collapsible = true }: { collapsible?: boolean }) {
  const holo = useCardStore((s) => s.holo);
  const setHolo = useCardStore((s) => s.setHolo);
  const { pathname } = useLocation();
  const layoutType = useCardStore((s) => s.layoutType);
  const borderless = useCardStore((s) => s.borderless);
  const available = availableHoloAreas(layoutType, borderless);
  const shown = holo ? visibleHoloAreas(holo, layoutType, borderless) : [];
  const wholeCard = shown.includes('card');

  const toggleArea = (id: HoloArea, on: boolean) => {
    if (!holo) return;
    setHolo({ ...holo, areas: toggleHoloArea(holo, id, on, layoutType, borderless) });
  };

  const handlePattern = (value: string) => {
    if (value === '') {
      setHolo(null);
      return;
    }
    const pattern = value as HoloPatternId;
    setHolo({
      pattern,
      strength: holo?.strength ?? HOLO_STRENGTH_DEFAULT,
      angle: holo?.angle ?? HOLO_ANGLE_DEFAULT,
      areas: holo?.areas,
    });
  };

  const body = (
    <div className="space-y-1">
      {pathname !== LAB_PATH && (
        <a href={LAB_PATH} target="_blank" rel="noopener" onClick={handOffToLab} onAuxClick={handOffToLab} className={`block ${TEXT_LINK}`}>
          Open holo lab ↗
        </a>
      )}
      <select
        value={holo?.pattern ?? ''}
        onChange={(e) => handlePattern(e.target.value)}
        className={FULL_SELECT}
      >
        <option value="">None</option>
        {HOLO_PATTERNS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>
      {holo && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
          {HOLO_AREAS.filter((a) => available.includes(a.id)).map((a) => {
            const covered = wholeCard && a.id !== 'card';
            const checked = covered || shown.includes(a.id);
            const lastOne = checked && !covered && a.id !== 'card' && shown.length === 1;
            return (
              <label key={a.id} className={`flex items-center gap-2 ${covered || lastOne ? 'opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={covered || lastOne}
                  onChange={(e) => toggleArea(a.id, e.target.checked)}
                  className="accent-gold-400"
                />
                <span className={CHECK_LABEL}>{a.label}</span>
              </label>
            );
          })}
        </div>
      )}
      {holo && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
          <Stepper
            label="Strength"
            value={holo.strength}
            min={HOLO_STRENGTH_MIN}
            max={HOLO_STRENGTH_MAX}
            step={STRENGTH_STEP}
            onChange={(strength) => setHolo({ ...holo, strength })}
            valueWidth="w-6"
          />
          <Stepper
            label="Light angle"
            value={holo.angle}
            min={0}
            max={ANGLE_STEP_MAX}
            step={ANGLE_STEP}
            onChange={(angle) => setHolo({ ...holo, angle })}
            valueWidth="w-6"
          />
        </div>
      )}
    </div>
  );
  const title = 'Holo foil';
  if (collapsible) {
    const status = holo ? HOLO_PATTERNS.find((p) => p.id === holo.pattern)?.label : null;
    return <div className="pt-2"><CollapsibleSection title={title} status={status}>{body}</CollapsibleSection></div>;
  }
  return (
    <div className="space-y-1 pt-2">
      <div className={SECTION_LABEL}>{title}</div>
      {body}
    </div>
  );
}
