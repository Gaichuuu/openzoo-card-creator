import type { ReactNode } from 'react';

export function PageTitle({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <h1 className={`text-gold-gradient font-title font-normal text-4xl md:text-[46px] leading-[1.05] m-0 ${className}`}>
      {children}
    </h1>
  );
}
