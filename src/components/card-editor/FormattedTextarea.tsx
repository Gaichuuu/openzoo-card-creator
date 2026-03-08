import { useRef, type ReactNode } from 'react';

const FMT_BTN = "px-1.5 py-0 text-[10px] text-gold-400 bg-navy-700 hover:bg-navy-600 hover:text-white rounded transition-colors";

export function FormattedTextarea({ value, onChange, placeholder, rows = 2, headerLeft, maxLength = 500 }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  headerLeft?: ReactNode;
  maxLength?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (tag: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const wrapped = `{${tag}:${selected}}`;
    const newValue = value.slice(0, start) + wrapped + value.slice(end);
    onChange(newValue);
    const cursorPos = start + tag.length + 2 + selected.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = cursorPos;
      ta.selectionEnd = cursorPos;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        {headerLeft ?? <span />}
        <div className="flex gap-0.5">
          <button type="button" onClick={() => wrapSelection('B')} className={`${FMT_BTN} font-bold`} title="Bold {B:text}">B</button>
          <button type="button" onClick={() => wrapSelection('I')} className={`${FMT_BTN} italic`} title="Italic {I:text}">I</button>
          <button type="button" onClick={() => wrapSelection('BI')} className={`${FMT_BTN} font-bold italic`} title="Bold Italic {BI:text}">BI</button>
          <button type="button" onClick={() => wrapSelection('R')} className={FMT_BTN} title="Regular — cancel inherited italic {R:text}">R</button>
          <button type="button" onClick={() => wrapSelection('RB')} className={`${FMT_BTN} font-bold`} title="Regular Bold — bold without italic {RB:text}">RB</button>
        </div>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full bg-navy-800 border border-navy-600 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-gold-400 resize-y"
      />
    </div>
  );
}
