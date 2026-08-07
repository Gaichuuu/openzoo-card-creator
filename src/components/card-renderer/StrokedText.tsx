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
}

export function StrokedText({ outline, children }: StrokedTextProps) {
  return (
    <span style={WRAPPER_STYLE}>
      <span aria-hidden="true" className="stroked-text-stroke" style={{ ...STROKE_BASE, ...outline }}>
        {children}
      </span>
      <span style={FILL_STYLE}>{children}</span>
    </span>
  );
}
