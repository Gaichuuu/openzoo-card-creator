import { useState } from 'react';
import { useCardStore } from '@/lib/store';
import { ZONE_ID_MAPS } from '@/data/layouts';
import { isCustomIconValue } from '@/lib/customIconUtils';
import { CustomIconPicker } from './CustomIconPicker';

export function BackgroundSelector() {
  const layoutType = useCardStore((s) => s.layoutType);
  const borderless = useCardStore((s) => s.borderless);
  const setImageField = useCardStore((s) => s.setImageField);
  const zoneId = ZONE_ID_MAPS[layoutType]?.['CardBackground'];
  const current = useCardStore((s) => (zoneId != null ? s.cardData[`i${zoneId}`] || '' : ''));
  const [pickerOpen, setPickerOpen] = useState(false);

  if (layoutType === 'Terra' || borderless || zoneId == null) return null;

  const hasCustom = isCustomIconValue(current);

  return (
    <div className="space-y-1 pt-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Background Pattern
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPickerOpen(true)}
          className="flex-1 bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm text-left hover:border-gold-400 focus:outline-none focus:border-gold-400"
        >
          {hasCustom ? 'Custom pattern' : 'Default'}
        </button>
        {hasCustom && (
          <button
            onClick={() => setImageField('CardBackground', '')}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Reset
          </button>
        )}
      </div>
      {hasCustom && (
        <img src={current} alt="Background pattern" className="h-12 rounded border border-navy-600 object-cover" />
      )}
      <CustomIconPicker
        type="background"
        title="Custom background pattern"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(icon) => setImageField('CardBackground', icon.image)}
      />
    </div>
  );
}
