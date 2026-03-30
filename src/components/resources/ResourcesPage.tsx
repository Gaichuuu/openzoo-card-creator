import { Link } from 'react-router-dom';
import { ELEMENTS, TRAITS, TERRAS, STATUS_EFFECTS } from '@/data/constants';
import { FONT_BODY, FONT_TITLE } from '@/data/constants';

interface AssetDownload {
  name: string;
  description: string;
  path: string;
  filename: string;
}

const PRINT_ASSETS: AssetDownload[] = [
  { name: 'Card Back (Standard)', description: '952×1332px with rounded corners', path: '/assets/OPZDexCardBack-Standard.png', filename: 'OpenZoo-CardBack-Standard.png' },
  { name: 'Card Back (Print Ready)', description: '1056×1436px with 52px bleed', path: '/assets/OPZDexCardBack-PrintReady.png', filename: 'OpenZoo-CardBack-PrintReady.png' },
  { name: 'Card Back (Original)', description: '714×999px source file', path: '/assets/OPZDexCardBack.png', filename: 'OpenZoo-CardBack.png' },
  { name: 'Blank Background', description: 'Card background texture', path: '/assets/BlankBackground.png', filename: 'OpenZoo-BlankBackground.png' },
];

interface SymbolGroup {
  title: string;
  folder: string;
  items: readonly string[];
}

const SYMBOL_PACKS: SymbolGroup[] = [
  { title: 'Aura', folder: 'AuraSymbols', items: ELEMENTS },
  { title: 'Status Effects', folder: 'StatusEffects', items: STATUS_EFFECTS },
  { title: 'Traits', folder: 'TraitsNoGlow', items: TRAITS },
  { title: 'Terra', folder: 'TerraNoGlow', items: TERRAS },
];

const BTN_CLASS = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-navy-700 hover:bg-navy-600 text-gold-300 rounded transition-colors';

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

function downloadAsset(path: string, filename: string) {
  const a = document.createElement('a');
  a.href = path;
  a.download = filename;
  a.click();
}

function AssetCard({ asset }: { asset: AssetDownload }) {
  return (
    <div
      onClick={() => downloadAsset(asset.path, asset.filename)}
      className="bg-navy-800 rounded-lg border border-navy-600 overflow-hidden cursor-pointer hover:border-gold-400 transition-colors"
    >
      <div className="flex items-center justify-center bg-navy-900 p-4 h-40">
        <img src={asset.path} alt={asset.name} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-white mb-1">{asset.name}</h3>
        <p className="text-xs text-gray-400 mb-3">{asset.description}</p>
        <span className={BTN_CLASS}>
          <DownloadIcon />
          Download PNG
        </span>
      </div>
    </div>
  );
}

function FontCard({ name, fontFamily, description, url, bold }: {
  name: string;
  fontFamily: string;
  description: string;
  url: string;
  bold?: boolean;
}) {
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      className="block bg-navy-800 rounded-lg border border-navy-600 p-4 cursor-pointer hover:border-gold-400 transition-colors"
    >
      <p className={`text-lg mb-1 ${bold ? 'font-bold' : ''}`} style={{ fontFamily }}>{name}</p>
      <p className="text-xs text-gray-400 mb-3">{description}</p>
      <span className={BTN_CLASS}>Google Fonts</span>
    </a>
  );
}

function SymbolPackSection({ group }: { group: SymbolGroup }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gold-300 mb-3">{group.title}</h2>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-13 gap-x-1 gap-y-4">
        {group.items.map(name => (
          <button
            key={name}
            onClick={() => downloadAsset(`/assets/${group.folder}/${encodeURIComponent(name)}.png`, `${name}.png`)}
            className="flex flex-col items-center gap-1 cursor-pointer group"
            title={`Download ${name}`}
          >
            <div className="flex items-center justify-center bg-navy-800 rounded border border-navy-600 p-1.5 group-hover:border-gold-400 transition-colors" style={{ width: 52, height: 52 }}>
              <img src={`/assets/${group.folder}/${encodeURIComponent(name)}.png`} alt={name} className="w-full h-full object-contain" loading="lazy" />
            </div>
            <span className="text-[10px] text-gray-300 text-center leading-tight">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ResourcesPage() {
  return (
    <div className="min-h-dvh bg-navy-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <header className="mb-4">
          <Link to="/" className="inline-block">
            <img src="/assets/ozLogo.png" alt="OpenZoo" className="h-16" />
          </Link>
        </header>

        <section className="space-y-3 mt-0!">
          <h1 className="text-2xl font-bold text-gold-400">Rulebook</h1>
          <Link to="/rulebook" className="block bg-navy-800 rounded-lg border border-navy-600 p-5 hover:border-gold-400 transition-colors">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">OpenZoo Rulebook version 0.1</h3>
                <p className="text-xs text-gray-400 mb-1">
                  Complete game rules, glossary, and reference for the OpenZoo trading card game.
                </p>
                <p className="text-xs text-gray-500">Updated March 29, 2026</p>
              </div>
              <span className={`shrink-0 ${BTN_CLASS}`}>
                Read Rulebook
              </span>
            </div>
          </Link>
        </section>

        <section className="space-y-3">
          <h1 className="text-2xl font-bold text-gold-400">Print Assets</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRINT_ASSETS.map(asset => <AssetCard key={asset.name} asset={asset} />)}
          </div>
        </section>

        <section className="space-y-3">
          <h1 className="text-2xl font-bold text-gold-400">Fonts</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FontCard name="EB Garamond" fontFamily={FONT_BODY} description="Used for card body text, effects, LP, cost, and spellbook limit." url="https://fonts.google.com/specimen/EB+Garamond" />
            <FontCard name="Archivo Black" fontFamily={FONT_TITLE} description="Used for card names and strong-against text." url="https://fonts.google.com/specimen/Archivo+Black" bold />
          </div>
        </section>

        <section className="space-y-5">
          <h1 className="text-2xl font-bold text-gold-400">Icons</h1>
          {SYMBOL_PACKS.map(group => <SymbolPackSection key={group.title} group={group} />)}
        </section>
      </div>
    </div>
  );
}
