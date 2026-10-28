import type { CSSProperties, ReactNode } from 'react';
import type { OutlineStyle } from '@/lib/outlineUtils';

const WRAPPER_STYLE: CSSProperties = { position: 'relative', display: 'inline-block' };
const FILL_STYLE: CSSProperties = { position: 'relative' };
const STROKE_BASE: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  color: 'transparent',
};

interface StrokedTextProps {
  outline: OutlineStyle;
  children: ReactNode;
  fill?: CSSProperties | null;
}

export function StrokedText({ outline, children, fill }: StrokedTextProps) {
  return (
    <span style={WRAPPER_STYLE}>
      <span aria-hidden="true" className="stroked-text-stroke" style={{ ...STROKE_BASE, ...outline }}>
        {children}
      </span>
      <span style={fill ? { ...FILL_STYLE, ...fill } : FILL_STYLE}>{children}</span>
    </span>
  );
}
