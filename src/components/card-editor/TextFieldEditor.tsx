import { useCardStore } from '@/lib/store';
import { ZONE_ID_MAPS } from '@/data/layouts';

interface TextFieldEditorProps {
  label: string;
  semanticKey: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

export function TextFieldEditor({ label, semanticKey, placeholder, multiline, maxLength }: TextFieldEditorProps) {
  const setTextField = useCardStore((s) => s.setTextField);
  const layoutType = useCardStore((s) => s.layoutType);
  const cardData = useCardStore((s) => s.cardData);

  const map = ZONE_ID_MAPS[layoutType];
  const zoneId = map?.[semanticKey];
  const key = zoneId !== undefined ? `t${zoneId}` : null;
  const rawValue = key ? (cardData[key] || '') : '';
  const displayValue = rawValue.replace(/<\/?p>/g, '').trim();

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={displayValue}
          onChange={(e) => setTextField(semanticKey, e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="w-full bg-navy-800 border border-navy-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-y"
        />
      ) : (
        <input
          type="text"
          value={displayValue}
          onChange={(e) => setTextField(semanticKey, e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full bg-navy-800 border border-navy-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      )}
    </div>
  );
}
