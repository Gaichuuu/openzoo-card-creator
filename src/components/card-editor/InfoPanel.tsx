import { useState, type ReactNode } from 'react';
import { ELEMENTS, TRAITS, TERRAS, STATUS_EFFECTS } from '@/data/constants';

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
      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-navy-700 hover:bg-navy-600 text-gray-300 hover:text-white rounded text-[10px] font-mono transition-colors"
      title={`Copy: ${text}`}
    >
      {text}
      {copied && <span className="text-green-400">&#10003;</span>}
    </button>
  );
}

function TokenTable() {
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
  ];
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

function IconGroup({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">{title} ({items.length})</h4>
      <div className="flex flex-wrap gap-0.5">
        {items.map((name) => (
          <CopyChip key={name} text={`{${name}}`} />
        ))}
      </div>
    </div>
  );
}

function ClassesCheatSheet() {
  return (
    <>
      <TokenTable />
      <IconGroup title="Aura" items={ELEMENTS} />
      <IconGroup title="Traits" items={TRAITS} />
      <IconGroup title="Terra" items={TERRAS} />
      <IconGroup title="Status Effects" items={STATUS_EFFECTS} />
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Custom Icon</h4>
        <CopyChip text="{path/to/image.png, scale, offset}" />
        <p className="text-[10px] text-gray-400 mt-0.5">
          scale = height in em (0.9), offset = vertical shift (0.1)
        </p>
      </div>
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

      {/* Misc */}
      <div>
        <h4 className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Common Phrases</h4>
        <ul className="text-[10px] text-gray-400 list-disc list-inside space-y-0">
          <li>"Any time" (not "anytime")</li>
          <li>"Cannot" (not "can not" or "may not")</li>
          <li>"Each Caster" (not "All Casters")</li>
          <li>"Until the end of this turn" at end of sentence</li>
          <li>"Without paying its Aura Cost"</li>
          <li>Self-reference = italics; another Page = "quotes"</li>
        </ul>
      </div>
    </>
  );
}

export function InfoPanel() {
  return (
    <div className="w-82 bg-navy-900 border-navy-600 border-r p-2 overflow-y-auto space-y-3">
      <Accordion title="Token Cheat Sheet">
        <ClassesCheatSheet />
      </Accordion>
      <Accordion title="Design Tips">
        <DesignBible />
      </Accordion>
    </div>
  );
}
