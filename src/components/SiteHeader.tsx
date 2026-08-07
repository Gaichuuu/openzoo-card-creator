import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '@/data/navLinks';

interface SiteHeaderProps {
  sticky?: boolean;
}

export function SiteHeader({ sticky = false }: SiteHeaderProps) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const linkClass = (to: string) =>
    (pathname.startsWith(to) ? 'text-gold-300' : 'text-gray-400 hover:text-white transition-colors');

  return (
    <header
      className={`${sticky ? 'sticky top-0 z-10' : 'relative'} bg-navy-950 flex items-center gap-3 md:gap-5 h-[var(--site-header-h)] px-4 md:px-6 border-b border-gold-500 shrink-0`}
    >
      <Link to="/" className="hover:opacity-80 transition-opacity shrink-0">
        <img src="/assets/ozLogo.png" alt="OpenZoo" className="h-6.5" />
      </Link>
      <nav className="hidden md:flex gap-5.5 text-sm">
        {NAV_LINKS.map(({ label, to }) => (
          <Link key={to} to={to} className={linkClass(to)}>
            {label}
          </Link>
        ))}
      </nav>
      <Link
        to="/create"
        className="px-3 py-2 md:px-4.5 bg-green-600 hover:bg-green-500 text-white text-[13px] font-semibold transition-colors border-gold shrink-0"
      >
        <span className="hidden sm:inline">Card Editor</span>
        <span className="sm:hidden">Create</span>
      </Link>
      <div className="flex-1" />
      <button
        onClick={() => setMenuOpen((open) => !open)}
        className="md:hidden w-11 h-11 -mr-2 flex items-center justify-center text-gray-300 shrink-0"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        {menuOpen ? (
          <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" />
          </svg>
        )}
      </button>
      {menuOpen && (
        <nav className="md:hidden absolute top-full left-0 right-0 z-20 flex flex-col bg-navy-950 border-b border-gold-500 py-1.5">
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} className={`px-5 py-3 text-sm ${linkClass(to)}`}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
