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
      <select
        value={hasCustom ? '__custom__' : 'default'}
        onChange={(e) => {
          if (e.target.value === '__custom__') { setPickerOpen(true); return; }
          setImageField('CardBackground', '');
        }}
        className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-sm"
      >
        <option value="default">Default</option>
        <option value="__custom__">{hasCustom ? 'Custom' : 'Custom…'}</option>
      </select>
      {hasCustom && (
        <>
          <button
            onClick={() => setPickerOpen(true)}
            className="text-xs text-gold-500 hover:text-white underline cursor-pointer"
          >
            Change custom pattern…
          </button>
          <img src={current} alt="Background pattern" className="h-12 rounded border border-navy-600 object-cover" />
        </>
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
