import { hasFourthWall, setFourthWall } from '@/lib/fourthWallText';
import { FormattedTextarea } from './FormattedTextarea';
import { SpecialTextFitControls } from './TextBoxBuilder';
import { StarToggle } from './EffectBlockEditor';

export function SpecialEffectText({ value, onChange, italicize }: {
  value: string;
  onChange: (v: string) => void;
  italicize: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
        Effect Text
      </label>
      <SpecialTextFitControls />
      <FormattedTextarea
        value={value}
        onChange={onChange}
        placeholder="Effect text..."
        headerLeft={
          <StarToggle
            checked={hasFourthWall(value)}
            onChange={(on) => onChange(setFourthWall(value, on, italicize))}
          />
        }
      />
    </div>
  );
}
