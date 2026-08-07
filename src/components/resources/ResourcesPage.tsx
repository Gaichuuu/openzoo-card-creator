import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PageTitle } from '@/components/PageTitle';
import { ELEMENTS, TRAITS, TERRAS, STATUS_EFFECTS } from '@/data/constants';
import { FONT_BODY, FONT_TITLE } from '@/data/constants';

interface AssetDownload {
  name: string;
  description: string;
  path: string;
  filename: string;
}

const PRINT_ASSETS: AssetDownload[] = [
  { name: 'Card Back (Standard)', description: '952×1332px, rounded corners', path: '/assets/OPZDexCardBack-Standard.png', filename: 'OpenZoo-CardBack-Standard.png' },
  { name: 'Card Back (Print Ready)', description: '1056×1436px, 52px bleed', path: '/assets/OPZDexCardBack-PrintReady.png', filename: 'OpenZoo-CardBack-PrintReady.png' },
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

const TOTAL_SYMBOLS = SYMBOL_PACKS.reduce((n, g) => n + g.items.length, 0);

const BTN_CLASS = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-navy-700 hover:bg-navy-600 text-gold-300 transition-colors';

function downloadAsset(path: string, filename: string) {
  const a = document.createElement('a');
  a.href = path;
  a.download = filename;
  a.click();
}

function SectionHeading({ title, count }: { title: string; count?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4.5">
      <h2 className="font-title font-normal text-2xl text-gold-400 m-0">{title}</h2>
      {count && <span className="text-xs text-gray-500">{count}</span>}
    </div>
  );
}

function AssetCard({ asset }: { asset: AssetDownload }) {
  return (
    <button
      onClick={() => downloadAsset(asset.path, asset.filename)}
      className="bg-navy-900 border border-navy-600 overflow-hidden cursor-pointer hover:border-gold-400 transition-colors text-left"
    >
      <div className="flex items-center justify-center bg-navy-990 border-b border-navy-600 p-3.5 h-42.5">
        <img src={asset.path} alt={asset.name} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="p-3.5">
        <h3 className="text-sm font-bold text-white mb-1 m-0">{asset.name}</h3>
        <p className="text-xs text-gray-500 mb-3 m-0">{asset.description}</p>
        <span className={BTN_CLASS}>Download PNG</span>
      </div>
    </button>
  );
}

function FontCard({ name, fontFamily, description, url, size }: {
  name: string;
  fontFamily: string;
  description: string;
  url: string;
  size: number;
}) {
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      className="block bg-navy-900 border border-navy-600 p-5 cursor-pointer hover:border-gold-400 transition-colors"
    >
      <p className="text-white mb-1.5 m-0" style={{ fontFamily, fontSize: size }}>{name}</p>
      <p className="text-[13px] text-gray-400 mb-3.5 m-0">{description}</p>
      <span className={BTN_CLASS}>Google Fonts →</span>
    </a>
  );
}

function SymbolPackSection({ group }: { group: SymbolGroup }) {
  return (
    <div>
      <span className="block text-[15px] font-bold text-gold-500 mb-3.5">
        {group.title}
      </span>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-13 gap-x-1.5 gap-y-3">
        {group.items.map(name => (
          <button
            key={name}
            onClick={() => downloadAsset(`/assets/${group.folder}/${encodeURIComponent(name)}.png`, `${name}.png`)}
            className="flex flex-col items-center gap-1.25 cursor-pointer group"
            title={`Download ${name}`}
          >
            <div className="flex items-center justify-center bg-navy-800 border border-navy-600 p-1.5 group-hover:border-gold-400 transition-colors" style={{ width: 52, height: 52 }}>
              <img src={`/assets/${group.folder}/${encodeURIComponent(name)}.png`} alt={name} className="w-full h-full object-contain" loading="lazy" />
            </div>
            <span className="text-[10px] text-gray-400 text-center leading-tight">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ResourcesPage() {
  return (
    <div className="min-h-dvh bg-navy-950 text-white">
      <SiteHeader sticky />
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-12 pb-18 flex flex-col gap-11">
        <header>
          <PageTitle className="mb-3.5">Resources</PageTitle>
          <p className="text-[20px] leading-normal text-gray-300 m-0 mb-4" style={{ fontFamily: FONT_BODY }}>
            Everything you need to get started with OpenZoo.
          </p>
          <nav className="flex flex-wrap gap-2">
            {['Rulebook', 'Print Assets', 'Fonts', 'Icons'].map((section) => (
              <a
                key={section}
                href={`#${section.toLowerCase().replace(/ /g, '-')}`}
                className="px-3.5 py-1.5 text-[13px] bg-navy-800 hover:bg-navy-700 text-gold-300 transition-colors border-gold"
              >
                {section}
              </a>
            ))}
          </nav>
        </header>

        <section id="rulebook" className="scroll-mt-18">
          <SectionHeading title="Rulebook" />
          <Link
            to="/rulebook"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-navy-900 border-gold px-5.5 py-5"
          >
            <span>
              <span className="block text-base font-bold text-white mb-1">OpenZoo Rulebook version 0.1</span>
              <span className="block text-[13px] text-gray-400 mb-1">
                Complete game rules, glossary, and reference for the OpenZoo trading card game.
              </span>
              <span className="block text-xs text-gray-500">Updated March 29, 2026</span>
            </span>
            <span className="shrink-0 self-start sm:self-auto px-4.5 py-2.25 text-[13px] font-semibold bg-navy-700 hover:bg-navy-600 text-gold-300 transition-colors">
              Read Rulebook →
            </span>
          </Link>
        </section>

        <section id="print-assets" className="scroll-mt-18">
          <SectionHeading title="Print Assets" count="4 files · PNG" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRINT_ASSETS.map(asset => <AssetCard key={asset.name} asset={asset} />)}
          </div>
        </section>

        <section id="fonts" className="scroll-mt-18">
          <SectionHeading title="Fonts" count="Both free on Google Fonts" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FontCard name="EB Garamond" fontFamily={FONT_BODY} size={30} description="Card body text, effects, LP, cost, and spellbook limit." url="https://fonts.google.com/specimen/EB+Garamond" />
            <FontCard name="Archivo Black" fontFamily={FONT_TITLE} size={26} description="Card names and strong-against text." url="https://fonts.google.com/specimen/Archivo+Black" />
          </div>
        </section>

        <section id="icons" className="scroll-mt-18">
          <SectionHeading title="Icons" count={`${TOTAL_SYMBOLS} symbols · PNG`} />
          <div className="flex flex-col gap-7.5">
            {SYMBOL_PACKS.map(group => <SymbolPackSection key={group.title} group={group} />)}
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
