import { useSearchParams } from 'react-router-dom';
import { useCardStore } from '@/lib/store';
import { CARD_TYPES } from '@/data/constants';
import type { CardType } from '@/types/card';

export function CardTypeSelector() {
  const cardType = useCardStore((s) => s.cardType);
  const setCardType = useCardStore((s) => s.setCardType);
  const [searchParams] = useSearchParams();
  const isRemix = !!searchParams.get('remix');

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Page Type
      </label>
      <select
        value={cardType}
        onChange={(e) => setCardType(e.target.value as CardType)}
        disabled={isRemix}
        className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {CARD_TYPES.map((ct) => (
          <option key={ct} value={ct}>
            {ct}
          </option>
        ))}
      </select>
    </div>
  );
}
