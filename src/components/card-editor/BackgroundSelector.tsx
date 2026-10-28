import { useState } from 'react';
import { useCardStore } from '@/lib/store';
import { ZONE_ID_MAPS } from '@/data/layouts';
import { isCustomIconValue } from '@/lib/customIconUtils';
import { CustomIconPicker } from './CustomIconPicker';
import { CollapsibleSection } from './CollapsibleSection';
import { FULL_SELECT, TEXT_LINK } from './editorStyles';

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
    <div className="pt-2">
      <CollapsibleSection title="Card texture" status={hasCustom ? 'Custom' : null}>
      <div className="space-y-1">
      <select
        value={hasCustom ? '__custom__' : 'default'}
        onChange={(e) => {
          if (e.target.value === '__custom__') { setPickerOpen(true); return; }
          setImageField('CardBackground', '');
        }}
        className={FULL_SELECT}
      >
        <option value="default">Default</option>
        <option value="__custom__">{hasCustom ? 'Custom' : 'Custom…'}</option>
      </select>
      {hasCustom && (
        <>
          <button
            onClick={() => setPickerOpen(true)}
            className={`block ${TEXT_LINK}`}
          >
            Change card texture…
          </button>
          <img src={current} alt="Card texture" className="h-12 rounded border border-navy-600 object-cover" />
        </>
      )}
      </div>
      </CollapsibleSection>
      <CustomIconPicker
        type="background"
        title="Custom card texture"
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(icon) => setImageField('CardBackground', icon.image)}
      />
    </div>
  );
}
