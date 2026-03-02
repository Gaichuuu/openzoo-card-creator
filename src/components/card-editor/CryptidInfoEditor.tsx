import { useEffect, useRef, useState } from 'react';
import { useCardStore } from '@/lib/store';
import { ZONE_ID_MAPS } from '@/data/layouts';
import { formatMetadataLocale } from '@/data/locales';

const SLOT_CONFIG = [
  {
    semanticKey: 'DOB/Discovered:',
    options: ['DOB', 'Discovered', 'Origin', 'Est.'],
    defaultLabel: 'Discovered',
    defaultValue: '???',
    placeholder: 'e.g. 01/2025',
  },
  {
    semanticKey: 'GPS',
    options: ['GPS'],
    defaultLabel: 'GPS',
    defaultValue: 'USA',
    placeholder: 'e.g. 40.7,-73.9',
  },
  {
    semanticKey: 'Weight',
    options: ['Weight'],
    defaultLabel: 'Weight',
    defaultValue: '99kg',
    placeholder: 'e.g. 200lbs',
  },
  {
    semanticKey: 'Height/Length',
    options: ['Height', 'Length'],
    defaultLabel: 'Height',
    defaultValue: '2m',
    placeholder: 'e.g. 6ft',
  },
];

export function CryptidInfoEditor() {
  const setTextField = useCardStore((s) => s.setTextField);
  const setStyleField = useCardStore((s) => s.setStyleField);
  const locale = useCardStore((s) => s.locale);

  const snapshotGuard = useRef(false);
  const [slots, setSlots] = useState(
    SLOT_CONFIG.map((cfg) => ({ label: cfg.defaultLabel, value: cfg.defaultValue }))
  );

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) {
      const s = useCardStore.getState();
      const map = ZONE_ID_MAPS[s.layoutType];
      const stripP = (v: string) => v.replace(/^<p>/, '').replace(/<\/p>$/, '');
      const restored = SLOT_CONFIG.map((cfg) => {
        const zoneId = map?.[cfg.semanticKey];
        const raw = zoneId != null ? stripP(s.cardData[`t${zoneId}`] || '') : '';
        const m = raw.match(/\{B:(.+?)(?::\s*|：)\}(.*)/);
        if (m) {
          const matchedOpt = cfg.options.find((opt) => raw.includes(opt)) || cfg.defaultLabel;
          return { label: matchedOpt, value: m[2] };
        }
        return { label: cfg.defaultLabel, value: cfg.defaultValue };
      });
      setSlots(restored);
      snapshotGuard.current = true;
      return;
    }
    if (snapshotGuard.current) return;
    SLOT_CONFIG.forEach((cfg) => {
      setTextField(cfg.semanticKey, formatMetadataLocale(cfg.defaultLabel, cfg.defaultValue, locale));
    });
    setStyleField('DOB/Discovered:', '{top:0px;left:0px}');
    setStyleField('CryptidInfoBar', '{background:linear-gradient(to top, rgb(230, 165, 10), rgb(248, 210, 50));gap:2px}');
  }, []);

  useEffect(() => {
    if (useCardStore.getState()._isLoadingSnapshot) return;
    slots.forEach((slot, i) => {
      const { semanticKey } = SLOT_CONFIG[i];
      if (slot.value) {
        setTextField(semanticKey, formatMetadataLocale(slot.label, slot.value, locale));
      }
    });
  }, [locale]);

  const updateSlot = (index: number, label: string, value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { label, value };
    setSlots(newSlots);
    const { semanticKey } = SLOT_CONFIG[index];
    setTextField(semanticKey, value ? formatMetadataLocale(label, value, locale) : '');
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Metadata
      </label>
      <div className="space-y-2">
        {SLOT_CONFIG.map((cfg, i) => (
          <div key={cfg.semanticKey} className="flex gap-2 items-center">
            <div className="w-1/2 shrink-0">
              {cfg.options.length > 1 ? (
                <select
                  value={slots[i].label}
                  onChange={(e) => updateSlot(i, e.target.value, slots[i].value)}
                  className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
                >
                  {cfg.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-gray-300 px-2">
                  {cfg.defaultLabel}
                </span>
              )}
            </div>
            <input
              type="text"
              value={slots[i].value}
              onChange={(e) => updateSlot(i, slots[i].label, e.target.value)}
              placeholder={cfg.placeholder}
              maxLength={20}
              className="w-1/2 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
