import { useState, type ReactNode } from 'react';
import { HINT, SECTION_LABEL } from './editorStyles';

interface CollapsibleSectionProps {
  title: string;
  status?: string | null;
  children: ReactNode;
}

export function CollapsibleSection({ title, status, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="group -mx-1.5 px-1.5 py-0.5 w-[calc(100%+0.75rem)] flex items-center justify-between gap-2 text-left rounded hover:bg-navy-700 focus-visible:bg-navy-700 transition-colors"
      >
        <span className={`${SECTION_LABEL} group-hover:text-gold-300 transition-colors`}>{title}</span>
        <span className="flex items-center gap-2">
          {!open && status && <span className={HINT}>{status}</span>}
          <span className="text-gray-300 text-xs group-hover:text-white transition-colors">{open ? '▾' : '▸'}</span>
        </span>
      </button>
      {open && children}
    </div>
  );
}
