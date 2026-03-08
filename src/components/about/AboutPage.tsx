import { Link } from 'react-router-dom';

interface Attribution {
  symbol: string;
  originalIcon: string;
  originalAuthor: string;
  originalLicense: string;
  sourceUrl: string;
}

const STATUS_EFFECTS: Attribution[] = [
  { symbol: 'Burn', originalIcon: 'Fire spell cast', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/fire-spell-cast.html' },
  { symbol: 'Confused', originalIcon: 'Uncertainty', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/uncertainty.html' },
  { symbol: 'Frozen', originalIcon: 'Ice spell cast', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/ice-spell-cast.html' },
  { symbol: 'Paralyze', originalIcon: 'Bolt spell cast', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/bolt-spell-cast.html' },
  { symbol: 'Poison', originalIcon: 'Deathcab', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/deathcab.html' },
  { symbol: 'Scared', originalIcon: 'Terror', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/terror.html' },
  { symbol: 'Sleep', originalIcon: 'Night sleep', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/night-sleep.html' },
];

const AURAS: Attribution[] = [
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

const TERRA: Attribution[] = [
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
  { symbol: 'Woods', originalIcon: 'Forest', originalAuthor: 'Delapouite', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/delapouite/forest.html' },
];

const TRAITS: Attribution[] = [
  { symbol: 'Bloodsucker', originalIcon: 'Fangs', originalAuthor: 'Skoll', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/skoll/fangs.html' },
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
  { symbol: 'Self-Destruct', originalIcon: 'Internal Injury', originalAuthor: 'Lorc', originalLicense: 'CC BY 3.0', sourceUrl: 'https://game-icons.net/1x1/lorc/internal-injury.html' },
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

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5" />
  </svg>
);

function AttributionTable({ title, data }: { title: string; data: Attribution[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-gold-400">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left table-fixed">
          <thead>
            <tr className="border-b border-navy-600 text-gold-300">
              <th className="py-2 pr-4 w-[24%]">Symbol</th>
              <th className="py-2 pr-4 w-[24%]">Original Icon</th>
              <th className="py-2 pr-4 w-[24%]">Author</th>
              <th className="py-2 pr-4 w-[20%]">License</th>
              <th className="py-2 w-[8%] text-right">Source</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.symbol} className="border-b border-navy-800 text-gray-300">
                <td className="py-1.5 pr-4 font-medium text-white">{row.symbol}</td>
                <td className="py-1.5 pr-4">{row.originalIcon}</td>
                <td className="py-1.5 pr-4">{row.originalAuthor}</td>
                <td className="py-1.5 pr-4 whitespace-nowrap">{row.originalLicense}</td>
                <td className="py-1.5 text-right">
                  <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-block">
                    <ExternalLinkIcon />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ScpTable({ data }: { data: ScpAttribution[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-gold-400">SCP Cards</h2>
      <p className="text-sm text-gray-400">
        Cards based on <a href="https://scp-wiki.wikidot.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">SCP Foundation</a> content, licensed under CC BY-SA.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left table-fixed">
          <thead>
            <tr className="border-b border-navy-600 text-gold-300">
              <th className="py-2 pr-4 w-[24%]">Card</th>
              <th className="py-2 pr-4 w-[28%]">SCP Article</th>
              <th className="py-2 pr-4 w-[40%]">Author(s)</th>
              <th className="py-2 w-[8%] text-right">Source</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.card} className="border-b border-navy-800 text-gray-300">
                <td className="py-1.5 pr-4 font-medium text-white whitespace-nowrap">{row.card}</td>
                <td className="py-1.5 pr-4">{row.article}</td>
                <td className="py-1.5 pr-4">{row.authors}</td>
                <td className="py-1.5 text-right">
                  <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-block">
                    <ExternalLinkIcon />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AboutPage() {
  return (
    <div className="min-h-dvh bg-navy-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <header className="space-y-4">
          <Link to="/" className="inline-block">
            <img src="/assets/ozLogo.png" alt="OpenZoo" className="h-16" />
          </Link>
          <p className="text-gray-400 max-w-3xl">
            OpenZoo is the unofficial continuation of{' '}<strong className="text-white">vintage MetaZoo</strong>, made by MetaZoo fans,{' '}
            <strong className="text-white"><em>FOR</em></strong> MetaZoo fans. Exclusively using assets within
            Creative Commons or made in-house, we plan on adding more cards to the MetaZoo card pool
            ad infinitum. OpenZoo assets are provided free of charge to anyone who wants them under{' '}
            <strong className="text-white">Creative Commons 3.0</strong>, specifically{' '}
            <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              CC BY-SA 3.0
            </a>.
          </p>
          <p className="text-gray-400 max-w-3xl">
            All OpenZoo symbols are created by <strong className="text-white">Jack Penman</strong> unless
            otherwise noted. Original icons are sourced from{' '}
            <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
              game-icons.net
            </a>{' '}
            and used under their respective licenses.
          </p>
        </header>

        <nav className="flex flex-wrap gap-2">
          {['Status Effects', 'Auras', 'Terra', 'Traits', 'Set Symbols', 'SCP Cards'].map((section) => (
            <a
              key={section}
              href={`#${section.toLowerCase().replace(/ /g, '-')}`}
              className="px-3 py-1 text-sm bg-navy-800 text-gold-300 hover:bg-navy-700 transition-colors border-gold"
            >
              {section}
            </a>
          ))}
        </nav>

        <div id="status-effects">
          <AttributionTable title="Status Effect Symbols" data={STATUS_EFFECTS} />
        </div>
        <div id="auras">
          <AttributionTable title="Aura Symbols" data={AURAS} />
        </div>
        <div id="terra">
          <AttributionTable title="Terra Symbols" data={TERRA} />
        </div>
        <div id="traits">
          <AttributionTable title="Trait Symbols" data={TRAITS} />
        </div>
        <div id="set-symbols">
          <AttributionTable title="Set Symbols" data={SET_SYMBOLS} />
          <p className="text-sm text-gray-400 mt-2">
            Each set symbol has Bronze, Silver, and Gold rarity variants.
          </p>
        </div>
        <div id="scp-cards">
          <ScpTable data={SCP_CARDS} />
        </div>
      </div>
    </div>
  );
}
