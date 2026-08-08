import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PageTitle } from '@/components/PageTitle';
import { AURA_COLORS, FONT_BODY } from '@/data/constants';
import type { Element, Terra, Trait } from '@/types/card';

interface Attribution<S extends string = string> {
  symbol: S;
  originalIcon: string;
  originalAuthor: string;
  originalLicense: string;
  sourceUrl: string;
}

const STATUS_EFFECTS: Attribution[] = [
  { symbol: 'Burn', originalIcon: 'Fire spell cast', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/fire-spell-cast.html' },
  { symbol: 'Confusion', originalIcon: 'Uncertainty', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/uncertainty.html' },
  { symbol: 'Frozen', originalIcon: 'Ice spell cast', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/ice-spell-cast.html' },
  { symbol: 'Paralyze', originalIcon: 'Bolt spell cast', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/bolt-spell-cast.html' },
  { symbol: 'Poison', originalIcon: 'Deathcab', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/deathcab.html' },
  { symbol: 'Scared', originalIcon: 'Terror', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/terror.html' },
  { symbol: 'Sleep', originalIcon: 'Night sleep', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/night-sleep.html' },
];

const AURAS: Attribution<Element>[] = [
  { symbol: 'Water', originalIcon: 'Big wave', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/big-wave.html' },
  { symbol: 'Flame', originalIcon: 'Small fire', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/small-fire.html' },
  { symbol: 'Forest', originalIcon: 'Pine tree', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/pine-tree.html' },
  { symbol: 'Frost', originalIcon: 'Snowflake', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/snowflake-1.html' },
  { symbol: 'Lightning', originalIcon: 'Electric', originalAuthor: 'sbed', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/sbed/electric.html' },
  { symbol: 'Earth', originalIcon: 'Summits', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/summits.html' },
  { symbol: 'Cosmic', originalIcon: 'Vortex', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/vortex.html' },
  { symbol: 'Dark', originalIcon: 'Evil moon', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/evil-moon.html' },
  { symbol: 'Light', originalIcon: 'Shiny entrance', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/shiny-entrance.html' },
  { symbol: 'Spirit', originalIcon: 'Ghost', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/ghost.html' },
];

const TERRA: Attribution<Terra>[] = [
  { symbol: 'Cave', originalIcon: 'Cave Entrance', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/cave-entrance.html' },
  { symbol: 'City', originalIcon: 'Modern City', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/modern-city.html' },
  { symbol: 'Dawn', originalIcon: 'Sunrise', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/sunrise.html' },
  { symbol: 'Daytime', originalIcon: 'Sun', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/sun.html' },
  { symbol: 'Desert', originalIcon: 'Cactus', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/cactus.html' },
  { symbol: 'Dusk', originalIcon: 'Sunset', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/sunset.html' },
  { symbol: 'Farm', originalIcon: 'Barn', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/barn.html' },
  { symbol: 'Fog', originalIcon: 'Fog', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/fog.html' },
  { symbol: 'Full Moon', originalIcon: 'Wolf Howl', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/wolf-howl.html' },
  { symbol: 'Ground', originalIcon: 'Stone Pile', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/stone-pile.html' },
  { symbol: 'Island', originalIcon: 'Island', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/island.html' },
  { symbol: 'Lake', originalIcon: 'Oasis', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/oasis.html' },
  { symbol: 'Lightning Storm', originalIcon: 'Lightning Storm', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/lightning-storm.html' },
  { symbol: 'Meteor Shower', originalIcon: 'Rainbow Star', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/rainbow-star.html' },
  { symbol: 'Mountain', originalIcon: 'Peaks', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/peaks.html' },
  { symbol: 'Nighttime', originalIcon: 'Moon', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/moon.html' },
  { symbol: 'Ocean', originalIcon: 'Ammonite Fossil', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/ammonite-fossil.html' },
  { symbol: 'Raining', originalIcon: 'Raining', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/raining.html' },
  { symbol: 'River', originalIcon: 'River', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/river.html' },
  { symbol: 'Snowing', originalIcon: 'Snowing', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/snowing.html' },
  { symbol: 'Stars', originalIcon: 'Sparkles', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/sparkles.html' },
  { symbol: 'Suburban', originalIcon: 'House', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/house.html' },
  { symbol: 'Swamp', originalIcon: 'Swamp', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/swamp.html' },
  { symbol: 'Winter', originalIcon: 'Igloo', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/igloo.html' },
  { symbol: 'Woodlands', originalIcon: 'Forest', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/forest.html' },
];

const TRAITS: Attribution<Trait>[] = [
  { symbol: 'Blood Sucker', originalIcon: 'Fangs', originalAuthor: 'Skoll', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/skoll/fangs.html' },
  { symbol: 'Burrow', originalIcon: 'Needle Drill', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/needle-drill.html' },
  { symbol: 'Convert', originalIcon: 'Rolling Energy', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/rolling-energy.html' },
  { symbol: 'Defender', originalIcon: 'Defensive Wall', originalAuthor: 'HeavenlyDog', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/heavenly-dog/defensive-wall.html' },
  { symbol: 'Destroyer', originalIcon: 'Skull Crossed Bones', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/skull-crossed-bones.html' },
  { symbol: 'Equipment', originalIcon: 'Spanner', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/spanner.html' },
  { symbol: 'Fear', originalIcon: 'Gluttonous Smile', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/gluttonous-smile.html' },
  { symbol: 'First Strike', originalIcon: 'Saber Slash', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/saber-slash.html' },
  { symbol: 'Flash', originalIcon: 'Flashlight', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/flashlight.html' },
  { symbol: 'Fleet', originalIcon: 'Wingfoot', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/wingfoot.html' },
  { symbol: 'Flight', originalIcon: 'Fluffy Wing', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/fluffy-wing.html' },
  { symbol: 'Spectral', originalIcon: 'Haunting', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/haunting.html' },
  { symbol: 'Immortal', originalIcon: 'Ouroboros', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/ouroboros.html' },
  { symbol: 'Infectious', originalIcon: 'Parmecia', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/parmecia.html' },
  { symbol: 'Invisible', originalIcon: 'Sight Disabled', originalAuthor: 'Skoll', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/skoll/sight-disabled.html' },
  { symbol: 'Magiproof', originalIcon: 'Rosa Shield', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/rosa-shield.html' },
  { symbol: 'Regen', originalIcon: 'Heart Plus', originalAuthor: 'Zeromancer', originalLicense: 'CC0 PDD', sourceUrl: 'https://game-icons.net/1x1/zeromancer/heart-plus.html' },
  { symbol: 'Self Destruct', originalIcon: 'Internal Injury', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/internal-injury.html' },
  { symbol: 'Stone Skin', originalIcon: 'Rock Golem', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/rock-golem.html' },
  { symbol: 'Trap', originalIcon: 'Wolf Trap', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/wolf-trap.html' },
  { symbol: 'Unblockable', originalIcon: 'Broken Shield', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/broken-shield.html' },
  { symbol: 'Venomous', originalIcon: 'Scorpion Tail', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/scorpion-tail.html' },
];

const SET_SYMBOLS: Attribution[] = [
  { symbol: 'Legacy', originalIcon: 'Eagle Emblem', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/eagle-emblem.html' },
  { symbol: 'Tales of the Night', originalIcon: 'Abstract 097', originalAuthor: 'Viscious Speed', originalLicense: 'CC0 PDD', sourceUrl: 'https://game-icons.net/1x1/viscious-speed/abstract-097.html' },
  { symbol: 'SCP', originalIcon: 'SCP Logo', originalAuthor: 'Aelanna', originalLicense: 'CC BY-SA 3.0', sourceUrl: 'http://scp-wiki.wikidot.com/dr-mackenzie-s-sketchbook' },
  { symbol: 'Ancient', originalIcon: 'T Rex Skull', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/t-rex-skull.html' },
  { symbol: 'War', originalIcon: 'Winged Sword', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/winged-sword.html' },
];

interface ScpAttribution {
  card: string;
  article: string;
  authors: string;
  sourceUrl: string;
}

const SCP_CARDS: ScpAttribution[] = [
  { card: 'SCP-006', article: 'Fountain of Youth', authors: 'Unknown Author, rewritten by Epic Phail Spy and Proxtown', sourceUrl: 'https://scpwiki.com/scp-006' },
  { card: 'SCP-015', article: 'Pipe Nightmare', authors: 'Dr Gears', sourceUrl: 'https://scpwiki.com/scp-015' },
  { card: 'SCP-017', article: 'Shadow Person', authors: 'Sam Swicegood (CityToast)', sourceUrl: 'https://scpwiki.com/scp-017' },
  { card: 'SCP-036', article: 'The Reincarnation Pilgrimage of the Yazidi', authors: 'FritzWillie', sourceUrl: 'https://scpwiki.com/scp-036' },
  { card: 'SCP-055', article: '[unknown]', authors: 'qntm and CptBellman', sourceUrl: 'https://scpwiki.com/scp-055' },
  { card: 'SCP-058', article: 'Heart of Darkness', authors: 'Unknown author', sourceUrl: 'https://scpwiki.com/scp-058' },
  { card: 'SCP-079', article: 'Old AI', authors: 'Unknown author', sourceUrl: 'https://scpwiki.com/scp-079' },
  { card: 'SCP-088', article: 'The Lizard King', authors: 'Sorts', sourceUrl: 'https://scpwiki.com/scp-088' },
  { card: 'SCP-096', article: 'The "Shy Guy"', authors: 'Dr Dan', sourceUrl: 'https://scpwiki.com/scp-096' },
  { card: 'SCP-105', article: '"Iris"', authors: 'thedeadlymoose, Dantensen, and DrClef', sourceUrl: 'https://scpwiki.com/scp-105' },
  { card: 'SCP-105-B', article: "Iris' Personal Camera", authors: 'thedeadlymoose, Dantensen, and DrClef', sourceUrl: 'https://scpwiki.com/scp-105' },
  { card: 'SCP-190', article: 'A Prize Toybox', authors: 'Raaxis, rewritten by Drewbear', sourceUrl: 'https://scpwiki.com/scp-190' },
  { card: 'SCP-300', article: '"A World In A Bottle"', authors: 'Aelanna', sourceUrl: 'https://scpwiki.com/scp-300' },
  { card: 'SCP-426', article: 'I am a Toaster', authors: 'Flah', sourceUrl: 'https://scpwiki.com/scp-426' },
  { card: 'SCP-610', article: 'The Flesh that Hates', authors: 'NekoChris', sourceUrl: 'https://scpwiki.com/scp-610' },
  { card: 'SCP-682', article: 'Hard-to-Destroy Reptile', authors: 'Dr Gears and Epic Phail Spy', sourceUrl: 'https://scpwiki.com/scp-682' },
  { card: 'SCP-993', article: 'Bobble the Clown', authors: 'Tanhony', sourceUrl: 'https://scpwiki.com/scp-993' },
  { card: 'SCP-001', article: 'When Day Breaks', authors: 'S D Locke', sourceUrl: 'https://scpwiki.com/shaggydredlocks-proposal' },
  { card: 'SCP-3001', article: 'Red Reality', authors: 'OZ Ouroboros', sourceUrl: 'https://scpwiki.com/scp-3001' },
  { card: 'SCP-3230', article: 'Intergalactic Isolation', authors: 'NatVoltaic', sourceUrl: 'https://scp-wiki.wikidot.com/scp-3230' },
  { card: 'SCP-____-J', article: 'Procrastinate', authors: 'Communism will win', sourceUrl: 'https://scpwiki.com/scp-j' },
  { card: 'SCP Logo', article: 'SCP Medal', authors: 'Aelanna', sourceUrl: 'http://scp-wiki.wikidot.com/dr-mackenzie-s-sketchbook' },
];

type TabKey = 'aura' | 'status' | 'terra' | 'traits' | 'sets' | 'scp';

interface TabConfig {
  key: TabKey;
  label: string;
  data?: Attribution[];
  iconFolder?: string;
}

const TABS: TabConfig[] = [
  { key: 'aura', label: 'Aura', data: AURAS, iconFolder: 'AuraSymbols' },
  { key: 'status', label: 'Status', data: STATUS_EFFECTS, iconFolder: 'StatusEffects' },
  { key: 'terra', label: 'Terra', data: TERRA, iconFolder: 'TerraNoGlow' },
  { key: 'traits', label: 'Traits', data: TRAITS, iconFolder: 'TraitsNoGlow' },
  { key: 'sets', label: 'Sets', data: SET_SYMBOLS },
  { key: 'scp', label: 'SCP' },
];

const ANCHOR_TO_TAB: Record<string, TabKey> = {
  auras: 'aura',
  'status-effects': 'status',
  terra: 'terra',
  traits: 'traits',
  'set-symbols': 'sets',
  'scp-cards': 'scp',
};

const TH_CLASS = 'py-2.75 px-3 border-b border-navy-600 text-gray-500 text-[11px] uppercase tracking-[.1em]';
const TD_CLASS = 'py-2.5 px-3 border-b border-navy-800';

function SymbolCell({ symbol, folder }: { symbol: string; folder?: string }) {
  const auraColor = folder === 'AuraSymbols' ? AURA_COLORS[symbol as Element]?.cardBackground : undefined;
  return (
    <span className="inline-flex items-center gap-2.5">
      {folder && (
        <img
          src={`/assets/${folder}/${encodeURIComponent(symbol)}.png`}
          alt=""
          className="w-6 h-6 rounded-[3px]"
          style={auraColor ? { backgroundColor: auraColor } : undefined}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      {symbol}
    </span>
  );
}

function SourceLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gold-400 hover:text-gold-300 transition-colors"
      aria-label="View original source"
    >
      ↗
    </a>
  );
}

function AttributionTable({ data, iconFolder }: { data: Attribution[]; iconFolder?: string }) {
  return (
    <table className="w-full table-fixed md:table-auto text-sm text-left border-collapse">
      <thead>
        <tr>
          <th className={`${TH_CLASS} pl-0 w-[26%]`}>Symbol</th>
          <th className={`${TH_CLASS} w-[28%]`}>Original icon</th>
          <th className={`${TH_CLASS} w-[22%]`}>Author</th>
          <th className={`${TH_CLASS} w-[16%]`}>License</th>
          <th className={`${TH_CLASS} pr-0 w-[8%] text-right`}>Source</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.symbol}>
            <td className={`${TD_CLASS} pl-0 text-white break-words`}><SymbolCell symbol={row.symbol} folder={iconFolder} /></td>
            <td className={`${TD_CLASS} text-gray-300 break-words`}>{row.originalIcon}</td>
            <td className={`${TD_CLASS} text-gray-300 break-words`}>{row.originalAuthor}</td>
            <td className={`${TD_CLASS} text-gray-400 md:whitespace-nowrap`}>{row.originalLicense}</td>
            <td className={`${TD_CLASS} pr-0 text-right`}><SourceLink url={row.sourceUrl} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ScpTable({ data }: { data: ScpAttribution[] }) {
  return (
    <table className="w-full table-fixed md:table-auto text-sm text-left border-collapse">
      <thead>
        <tr>
          <th className={`${TH_CLASS} pl-0 w-[26%]`}>Card</th>
          <th className={`${TH_CLASS} w-[28%]`}>SCP Article</th>
          <th className={`${TH_CLASS} w-[38%]`}>Author(s)</th>
          <th className={`${TH_CLASS} pr-0 w-[8%] text-right`}>Source</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.card}>
            <td className={`${TD_CLASS} pl-0 text-white break-words md:whitespace-nowrap`}>{row.card}</td>
            <td className={`${TD_CLASS} text-gray-300 break-words`}>{row.article}</td>
            <td className={`${TD_CLASS} text-gray-300 break-words`}>{row.authors}</td>
            <td className={`${TD_CLASS} pr-0 text-right`}><SourceLink url={row.sourceUrl} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const PROSE_LINK_CLASS = 'text-gold-400 hover:text-gold-300 transition-colors';

export function AboutPage() {
  const [activeTab, setActiveTab] = useState<TabKey>(
    () => ANCHOR_TO_TAB[window.location.hash.slice(1)] ?? 'aura',
  );
  const tab = TABS.find(t => t.key === activeTab)!;

  useEffect(() => {
    if (ANCHOR_TO_TAB[window.location.hash.slice(1)]) {
      document.getElementById('attribution')?.scrollIntoView();
    }
  }, []);

  return (
    <div className="min-h-dvh bg-navy-950 text-white">
      <SiteHeader sticky />
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-13 pb-18">
        <PageTitle className="mb-3.5">About OpenZoo</PageTitle>

        <p className="text-[18px] leading-normal text-gray-300 m-0 mb-4" style={{ fontFamily: FONT_BODY }}>
          OpenZoo is the unofficial continuation of <strong className="text-white">vintage MetaZoo</strong>, made
          by MetaZoo fans, <em className="text-white">for</em> MetaZoo fans. Exclusively using assets within
          Creative Commons or made in-house, we plan on adding more cards to the MetaZoo card pool ad infinitum.
        </p>
        <p className="text-[18px] leading-normal text-gray-300 m-0 mb-4" style={{ fontFamily: FONT_BODY }}>
          OpenZoo assets are provided free of charge to anyone who wants them under{' '}
          <strong className="text-white">Creative Commons 3.0</strong>, specifically{' '}
          <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer" className={PROSE_LINK_CLASS}>
            CC BY-SA 3.0
          </a>.
        </p>

        <section id="contribute" className="mt-10 mb-11 scroll-mt-18">
          <h2 className="font-title font-normal text-[22px] text-gold-400 m-0 mb-2.5">Contribute</h2>
          <p className="text-[15px] leading-[1.7] text-gray-400 max-w-155 m-0 mb-5">
            There&rsquo;s no application and no account. Make a card and publish it.
          </p>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 max-w-3xl mb-6">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider m-0 mb-2.5">OpenZoo TCG</h3>
              <ul className="list-disc pl-5 text-[15px] leading-[1.7] text-gray-400 m-0 space-y-1.5">
                <li>
                  Create a card with the OpenZoo <Link to="/create" className={PROSE_LINK_CLASS}>Card Editor</Link>.
                  <ul className="list-[circle] pl-5 mt-1 space-y-1">
                    <li>Make a mockup, parody, proxy, or whatever you want.</li>
                  </ul>
                </li>
                <li>
                  Try cards tagged{' '}
                  <Link to="/gallery?tag=Playtesting" className={PROSE_LINK_CLASS}>Playtesting</Link> and share what you find.
                </li>
                <li>
                  Make artwork for cards tagged{' '}
                  <Link to="/gallery?tag=Art+Needed" className={PROSE_LINK_CLASS}>Art Needed</Link>.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider m-0 mb-2.5">OpenZoo codebase</h3>
              <ul className="list-disc pl-5 text-[15px] leading-[1.7] text-gray-400 m-0 space-y-1.5">
                <li>
                  The project is open source on <a href="https://github.com/Gaichuuu/openzoo-card-creator" target="_blank" rel="noopener noreferrer" className={PROSE_LINK_CLASS}>GitHub</a>.
                  <ul className="list-[circle] pl-5 mt-1 space-y-1">
                    <li>Anyone can clone this project and open a pull request.</li>
                  </ul>
                </li>
                <li>
                  Feedback and feature requests:{' '}
                  <a href="https://github.com/Gaichuuu/openzoo-card-creator/issues" target="_blank" rel="noopener noreferrer" className={PROSE_LINK_CLASS}>open a ticket</a>.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://discord.gg/2jQPtQceqT"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5.5 py-2.75 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors border-gold"
            >
              Join the Discord
            </a>
            <Link
              to="/gallery?tag=Art+Needed"
              className="px-5.5 py-2.75 bg-navy-800 hover:bg-navy-700 text-gold-300 text-sm font-semibold transition-colors border-gold"
            >
              Art Needed
            </Link>
          </div>
        </section>

        <section id="attribution" className="scroll-mt-18">
          <h2 className="font-title font-normal text-[22px] text-gold-400 m-0 mb-2.5">Attribution</h2>
          <p className="text-[15px] leading-[1.7] text-gray-400 m-0 mb-5">
            All OpenZoo symbols are created by{' '}
            <a href="https://github.com/Gaichuuu" target="_blank" rel="noopener noreferrer" className="text-white font-semibold hover:text-gold-300 transition-colors">Jack Penman</a>{' '}
            unless otherwise noted. Original icons come from{' '}
            <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer" className={PROSE_LINK_CLASS}>game-icons.net</a>;<br/>
            SCP-themed cards reference{' '}
            <a href="https://scp-wiki.wikidot.com/" target="_blank" rel="noopener noreferrer" className={PROSE_LINK_CLASS}>SCP Foundation</a>{' '}
            content under CC BY-SA 3.0.
          </p>

          <div className="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="Attribution tables">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`px-2.75 py-1 text-[13px] bg-navy-800 border border-navy-600 rounded transition-colors cursor-pointer ${
                  activeTab === key ? 'text-gold-300' : 'text-gray-500 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab.data ? (
            <>
              <AttributionTable data={tab.data} iconFolder={tab.iconFolder} />
              {tab.key === 'sets' && (
                <p className="text-[13px] text-gray-500 mt-3.5">
                  Each set symbol has Bronze, Silver, and Gold rarity variants.
                </p>
              )}
            </>
          ) : (
            <ScpTable data={SCP_CARDS} />
          )}
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
