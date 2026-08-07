import { useState, type ReactNode } from 'react';
import { ELEMENTS, TRAITS, TERRAS, STATUS_EFFECTS } from '@/data/constants';
import { readLocalStorage, writeLocalStorage } from '@/lib/safeStorage';

function Accordion({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-navy-600 rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-navy-800 hover:bg-navy-700 transition-colors text-left"
      >
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{title}</span>
        <span className="text-gray-300 text-xs">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 max-md:px-2 max-md:py-1 bg-navy-700 hover:bg-navy-600 text-gray-300 hover:text-white rounded text-[10px] max-md:text-xs font-mono transition-colors"
      title={`Copy: ${text}`}
    >
      {text}
      {copied && <span className="text-green-400">&#10003;</span>}
    </button>
  );
}

function matches(query: string, ...haystacks: string[]): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return haystacks.some((h) => h.toLowerCase().includes(q));
}

function TokenTable({ query = '' }: { query?: string }) {
  const tokens = [
    ['{B:text}', 'Bold'],
    ['{I:text}', 'Italic'],
    ['{BI:text}', 'Bold italic'],
    ['{R:text}', 'Regular (removes default italic)'],
    ['{RB:text}', 'Regular bold (no italic)'],
    ['{SC:text}', 'Small caps'],
    ['{Power:NAME}', 'Pill badge'],
    ['{Star}', '4th Wall star icon'],
    ['\\n', 'Line break'],
  ].filter(([token, desc]) => matches(query, token, desc));
  if (tokens.length === 0) return null;
  return (
    <div>
      <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Formatting</h4>
      <div className="space-y-0.5">
        {tokens.map(([token, desc]) => (
          <div key={token} className="flex items-center gap-2">
            <CopyChip text={token} />
            <span className="text-[10px] text-gray-400">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconGroup({ title, items, query = '' }: { title: string; items: readonly string[]; query?: string }) {
  const shown = items.filter((name) => matches(query, name, title));
  if (shown.length === 0) return null;
  return (
    <div>
      <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">{title} ({shown.length})</h4>
      <div className="flex flex-wrap gap-0.5">
        {shown.map((name) => (
          <CopyChip key={name} text={`{${name}}`} />
        ))}
      </div>
    </div>
  );
}

function ClassesCheatSheet({ query = '' }: { query?: string }) {
  return (
    <>
      <TokenTable query={query} />
      <IconGroup title="Aura" items={ELEMENTS} query={query} />
      <IconGroup title="Traits" items={TRAITS} query={query} />
      <IconGroup title="Terra" items={TERRAS} query={query} />
      <IconGroup title="Status Effects" items={STATUS_EFFECTS} query={query} />
      {matches(query, 'custom icon') && (
        <div>
          <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Custom Icon</h4>
          <CopyChip text="{path/to/image.png, scale, offset}" />
          <p className="text-[10px] text-gray-400 mt-0.5">
            scale = height in em (0.9), offset = vertical shift (0.1)
          </p>
        </div>
      )}
    </>
  );
}

function DesignBible() {
  return (
    <>
      {/* Effect Writing */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Effect Writing</h4>
        <p className="text-[10px] text-gray-300 font-mono bg-navy-800 rounded px-2 py-1">
          TARGET(S) &mdash; ACTION &mdash; QUALITY/QUANTITY
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          Conditional: <span className="text-gray-300">If [condition], [target] [action].</span>
        </p>
      </div>

      {/* Capitalization */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Always Capitalized</h4>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          4th Wall Effect, Action(s), Arena, Artifact, Attack(s), Aura, Aura Cost, Awakened, Beastie, Bookmark, Caster, Chapter, Combat, Contract, Counter(s), Damage, Defender, Destroy, Destroyed, Discard, Effect(s), Enter, Equip, Fatigue, Indicator(s), Life Points, Page, Page Type, Potion, Power, Spell, Spellbook, Status Effect(s), Terra, Token, Trait(s), Tribe(s), Type Advantage
        </p>
      </div>
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Never Capitalized</h4>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          affect, another, burrow, control(s), controller, copy, declare, gain(s), inflict(s), name, non, nullify, own(s), owner(s), pay, place, recover(s), turn
        </p>
      </div>

      {/* Numbers */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Numbers</h4>
        <p className="text-[10px] text-gray-400">
          <span className="text-gray-300">Digits</span> for quantitative (10 Damage, Bookmark 2, +10 LP)
        </p>
        <p className="text-[10px] text-gray-400">
          <span className="text-gray-300">Words</span> for qualitative (two Pages, three Beasties)
        </p>
      </div>

      {/* 4th Wall */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">4th Wall Rules</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li>Keywords are NOT italicized in 4th Wall</li>
          <li>Italicize the singular effect sentence</li>
          <li>4th Wall goes at the beginning, near the star</li>
          <li>Contract restrictions: bold + italic (or star + italic, no bold)</li>
        </ul>
      </div>

      {/* Dealing Damage */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Dealing Damage</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li>"Target Beastie is dealt 10 Damage."</li>
          <li>"Target Beastie or Caster is dealt 10 Damage."</li>
          <li>"...is dealt 25 Damage and is inflicted with Burn."</li>
          <li><span className="text-gray-300">"gains +X Damage"</span> = stacking / temporary</li>
          <li><span className="text-gray-300">"deals X Damage"</span> = one-time</li>
          <li>"This Attack gains +X Damage while..." for temp increases</li>
        </ul>
      </div>

      {/* Referencing Pages & Casters */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Referencing Pages & Casters</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li><span className="text-gray-300">In Arena</span> = reference by Page Type ("This Beastie...")</li>
          <li><span className="text-gray-300">In Chapter</span> = reference as "Page"</li>
          <li><span className="text-gray-300">Owner</span> = "you"; others = "Caster"</li>
          <li>Specific Page name = {'{I:italics}'}</li>
          <li>Part of a name = double quotes ("Cat" in its name)</li>
          <li>Tribe search: [Page Type][Tribe]; all types: [Tribe][Page]</li>
        </ul>
      </div>

      {/* If Statements */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">"If" Statements</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li>"If" always at the start of the sentence</li>
          <li>Comma after qualifier: "If [x], [y]."</li>
          <li>", if able" at end of sentence preceded by comma</li>
          <li>Contract exception: "You may only Contract this Page if..."</li>
        </ul>
      </div>

      {/* Status Effects */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Status Effects</h4>
        <p className="text-[10px] text-gray-400">
          Use <span className="text-gray-300">"is inflicted with [Status]"</span> not "inflict [Status] on"
        </p>
      </div>

      {/* Place / Send */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Place / Send Syntax</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li>"Place [Page] into [zone]"</li>
          <li>"Place [Page] from [zone] into [zone]"</li>
          <li>Always use "place" (not "send")</li>
          <li>Always "into" after "Place"</li>
        </ul>
      </div>

      {/* Control Language */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Control Language</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li><span className="text-gray-300">"you control"</span> = current game state / Arena</li>
          <li><span className="text-gray-300">"under your control"</span> = placing into Arena</li>
          <li><span className="text-gray-300">"your"</span> = describing control (not ownership)</li>
        </ul>
      </div>

      {/* Triggered Keywords */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Triggered Keywords</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li><span className="text-gray-300">"Each time" / "When"</span> = goes on chain</li>
          <li><span className="text-gray-300">"Instead"</span> = replacement effect</li>
          <li><span className="text-gray-300">"Whenever"</span> = triggered, goes on chain</li>
        </ul>
      </div>

      {/* Declare vs Choose */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Declare vs Choose</h4>
        <p className="text-[10px] text-gray-400">
          <span className="text-gray-300">"declare"</span> = selecting a passive effect;{' '}
          <span className="text-gray-300">"choose"</span> = selecting a target
        </p>
      </div>

      {/* Token Creation */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Token Creation</h4>
        <p className="text-[10px] text-gray-300 font-mono bg-navy-800 rounded px-2 py-1 leading-relaxed">
          Create [#] Name Token(s) (## LP [Aura] [Type] [Tribe] with [## Damage Attack] [Aura Advantage] [Traits] [Terra Bonuses] and the Effect "...").
        </p>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0 mt-1">
          <li>Token name = {'{I:italics}'} (unless in 4th Wall)</li>
          <li>Period outside closing parenthesis</li>
        </ul>
      </div>

      {/* Terra 4th Wall Phrasing */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Terra in 4th Wall Text</h4>
        <p className="text-[10px] text-gray-400 mb-1">
          Use descriptive phrasing (not icons) for terra conditions:
        </p>
        <div className="text-[10px] text-gray-400 leading-relaxed grid grid-cols-2 gap-x-2 gap-y-0">
          <span>"If you are in a <span className="text-gray-300">Forest</span>"</span>
          <span>"If it is <span className="text-gray-300">Nighttime</span>"</span>
          <span>"If you are on a <span className="text-gray-300">Mountain</span>"</span>
          <span>"If it is <span className="text-gray-300">Raining</span>"</span>
          <span>"If you are in the <span className="text-gray-300">Ocean</span>"</span>
          <span>"If <span className="text-gray-300">Stars</span> are visible"</span>
        </div>
      </div>

      {/* Dual Tribes */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Dual Tribes</h4>
        <p className="text-[10px] text-gray-400">
          Always <span className="text-gray-300">alphabetical order</span>, space-separated after Page Type.
          When referencing multiple Tribes, use <span className="text-gray-300">plural</span> form (Wolves, not Wolf).
        </p>
      </div>

      {/* Trait Ordering */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Trait Ordering</h4>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          <span className="text-gray-300">1.</span> Ambush{' '}
          <span className="text-gray-300">2.</span> Trap{' '}
          <span className="text-gray-300">3.</span> Equipment{' '}
          <span className="text-gray-300">4.</span> Fear{' '}
          <span className="text-gray-300">5.</span> Flash{' '}
          <span className="text-gray-300">6.</span> Fleet{' '}
          <span className="text-gray-300">7+.</span> Rest alphabetical
        </p>
      </div>

      {/* Other Ordering Rules */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Other Ordering Rules</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li><span className="text-gray-300">Terra Bonuses</span> — always alphabetical</li>
          <li><span className="text-gray-300">Page Types</span> — alphabetical when listing multiple</li>
          <li><span className="text-gray-300">Status Effects</span> — alphabetical (Burn, Confusion, Frozen, Paralyze, Poison, Scared, Sleep)</li>
        </ul>
      </div>

      {/* Aura & Cost References */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Aura & Cost References</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li>Generate: <span className="text-gray-300">"Generate 1 [Dark Aura]"</span> (digit + bracketed)</li>
          <li>Cost: <span className="text-gray-300">"with an Aura Cost of [number]"</span></li>
          <li><span className="text-gray-300">"costs 0 Aura to Contract"</span></li>
        </ul>
      </div>

      {/* Traits & Terras in Effects */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Traits & Terras in Effects</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li>Always use <span className="text-gray-300">symbol icons</span> — never write the name</li>
          <li>Terra Bonus format: <span className="text-gray-300">[Terra] 20/20 LP</span> (no "+" prefix)</li>
        </ul>
      </div>

      {/* Has vs Gains */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">"Has" vs "Gains"</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li><span className="text-gray-300">"has"</span> = static conditional ("If [Terra] is active, this Beastie has [Trait]")</li>
          <li><span className="text-gray-300">"gains"</span> = temporary increase</li>
        </ul>
      </div>

      {/* Resolution Order */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Resolution Order</h4>
        <p className="text-[10px] text-gray-400">
          Effect text boxes resolve <span className="text-gray-300">top-down, left-to-right</span>. The first sentence resolves first, then the next, and so on. Keep this rule in mind when writing out complex effects.
        </p>
      </div>

      {/* Contractions */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Contractions</h4>
        <p className="text-[10px] text-gray-400">
          <span className="text-gray-300">Spell out</span> in game mechanics; <span className="text-gray-300">use contractions</span> only in Caster speech/dialogue.
        </p>
      </div>

      {/* Misc */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Common Phrases</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li>"Any time" (not "anytime")</li>
          <li>"Cannot" (not "can not" or "may not")</li>
          <li>"Each Caster" (not "All Casters")</li>
          <li>"Until the end of this turn" at end of sentence</li>
          <li>"Without paying its Aura Cost"</li>
          <li>"With the Effect" (not "with the text")</li>
          <li>Self-reference = italics; another Page = "quotes"</li>
        </ul>
      </div>
    </>
  );
}

const REFERENCE_COLLAPSED_KEY = 'openzoo-reference-collapsed';
const COLLAPSE_BUTTON_CLASS = 'w-6.5 h-6.5 border border-navy-600 text-gray-300 hover:text-white hover:border-gold-400 transition-colors text-xs cursor-pointer';
const EYEBROW_CLASS = 'text-[11px] font-bold tracking-[.14em] uppercase text-gold-500';

interface InfoPanelProps {
  collapsible?: boolean;
  searchable?: boolean;
}

export function InfoPanel({ collapsible = false, searchable = false }: InfoPanelProps) {
  const [collapsed, setCollapsed] = useState(
    () => collapsible && readLocalStorage(REFERENCE_COLLAPSED_KEY) === '1',
  );
  const [query, setQuery] = useState('');

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      writeLocalStorage(REFERENCE_COLLAPSED_KEY, c ? '0' : '1');
      return !c;
    });
  };

  if (collapsible && collapsed) {
    return (
      <div className="w-10 bg-navy-900 border-navy-600 md:border-r flex flex-col items-center gap-3 py-3 shrink-0">
        <button onClick={toggleCollapsed} title="Expand reference panel" className={COLLAPSE_BUTTON_CLASS}>
          ‹
        </button>
        <span className={EYEBROW_CLASS} style={{ writingMode: 'vertical-rl' }}>
          Reference
        </span>
      </div>
    );
  }

  return (
    <div className="w-full md:w-74 bg-navy-900 border-navy-600 md:border-r flex flex-col overflow-hidden shrink-0">
      {collapsible && (
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-navy-700 shrink-0">
          <span className={EYEBROW_CLASS}>Reference</span>
          <button onClick={toggleCollapsed} title="Collapse reference panel" className={COLLAPSE_BUTTON_CLASS}>
            ›
          </button>
        </div>
      )}
      <div className="p-2 overflow-y-auto space-y-3">
        {searchable && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tokens and terms…"
            className="input-plain w-full bg-navy-800 px-3 py-2.5 text-sm text-white placeholder-gray-500"
          />
        )}
        <Accordion title="Token Cheat Sheet">
          <ClassesCheatSheet query={query} />
        </Accordion>
        <Accordion title="Design Tips" defaultOpen={false}>
          <DesignBible />
        </Accordion>
      </div>
    </div>
  );
}
