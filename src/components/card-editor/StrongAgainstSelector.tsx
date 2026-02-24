import { useCardStore } from '@/lib/store';
import { ELEMENTS } from '@/data/constants';

export function StrongAgainstSelector() {
  const strongAgainst = useCardStore((s) => s.strongAgainst);
  const setStrongAgainst = useCardStore((s) => s.setStrongAgainst);

  const filledCount = strongAgainst.filter(Boolean).length;

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Strong Against ({filledCount}/4)
      </label>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((slot) => (
          <div key={slot} className="space-y-1">
            <span className="text-[10px] text-gold-500 block text-center">Slot {slot + 1}</span>
            <select
              value={strongAgainst[slot] || ''}
              onChange={(e) => {
                const val = e.target.value;
                setStrongAgainst(slot, val ? (val as typeof ELEMENTS[number]) : null);
              }}
              className="w-full bg-navy-800 border border-navy-600 text-white rounded px-1 py-1 text-xs"
            >
              <option value="">None</option>
              {ELEMENTS.map((el) => (
                <option key={el} value={el}>{el}</option>
              ))}
            </select>
            {strongAgainst[slot] && (
              <img
                src={`/assets/AuraSymbols/${strongAgainst[slot]}.png`}
                alt={strongAgainst[slot]!}
                className="w-8 h-8 mx-auto"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
