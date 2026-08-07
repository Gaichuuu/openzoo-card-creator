import { Fragment, useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from 'react';
import rulebookRaw from '@/data/rulebook.md?raw';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { PageTitle } from '@/components/PageTitle';
import { ELEMENTS, TRAITS, TERRAS, STATUS_EFFECTS, AURA_COLORS, AURA_STRENGTHS } from '@/data/constants';
import type { Element } from '@/types/card';

const ELEMENT_SET = new Set<string>(ELEMENTS);
const TRAIT_SET = new Set<string>(TRAITS);
const TERRA_SET = new Set<string>(TERRAS);
const STATUS_SET = new Set<string>(STATUS_EFFECTS);

function getIconPath(name: string): string | null {
  if (name === 'Special Aura') return '/assets/AuraSymbols/Special.png';
  if (ELEMENT_SET.has(name)) return `/assets/AuraSymbols/${name}.png`;
  if (TRAIT_SET.has(name)) return `/assets/TraitsNoGlow/${encodeURIComponent(name)}.png`;
  if (TERRA_SET.has(name)) return `/assets/TerraNoGlow/${encodeURIComponent(name)}.png`;
  if (STATUS_SET.has(name))
    return `/assets/StatusEffects/${encodeURIComponent(name)}.png`;
  return null;
}

function GameIcon({ name, size = 5 }: { name: string; size?: number }) {
  const path = getIconPath(name);
  if (!path) return null;
  const isElement = ELEMENT_SET.has(name) || name === 'Special Aura';
  return (
    <img
      src={path}
      alt={name}
      className="inline-block align-text-bottom mr-1.5"
      style={{
        width: size * 4,
        height: size * 4,
        ...(isElement ? { backgroundColor: auraBg((name === 'Special Aura' ? 'Special' : name) as Element), borderRadius: 3 } : {}),
      }}
    />
  );
}

function IconGrid({ items, folder, iconMap }: { items: readonly string[]; folder: string; iconMap?: Record<string, string> }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-x-2 gap-y-4 mt-6 mb-4">
      {items.map(name => {
        const file = iconMap?.[name] ?? name;
        return (
          <div key={name} className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center bg-navy-800 rounded border border-navy-600 p-1.5" style={{ width: 52, height: 52 }}>
              <img src={`/assets/${folder}/${encodeURIComponent(file)}.png`} alt={name} className="w-full h-full object-contain" />
            </div>
            <span className="text-[10px] text-gray-300 text-center leading-tight">{name}</span>
          </div>
        );
      })}
    </div>
  );
}

function auraBg(el: Element): string {
  return AURA_COLORS[el].cardBackground;
}

function CardLayoutDiagram() {
  const cw = 238, ch = 333;
  const sideMargin = 135;
  const topMargin = 30;
  const svgW = cw + sideMargin * 2;
  const svgH = ch + topMargin + 14;
  const cx = sideMargin, cy = topMargin;

  interface Label {
    text: string;
    px: number; py: number;
    side: 'left' | 'right' | 'top';
    lx?: number; ly?: number;
  }

  // Dot positions tuned to the Indrid Cold card at 238×333
  const labels: Label[] = [
    // Top labels
    { text: 'Page Type',   px: 58,  py: 14, side: 'top', lx: 48 },
    { text: 'Tribe',       px: 90, py: 14, side: 'top', lx: 100 },
    { text: 'Aura Cost',   px: 164, py: 23, side: 'top', lx: 152 },
    { text: 'Aura Type',   px: 180, py: 23, side: 'top', lx: 212 },

    // Left labels
    { text: 'Set/Rarity',      px: 26, py: 28,  side: 'left',  ly: 38 },
    { text: 'Spellbook Limit', px: 72, py: 44,  side: 'left',  ly: 58 },
    { text: 'Traits',          px: 24, py: 78,  side: 'left',  ly: 78 },
    { text: 'Terra Bonuses',   px: 24, py: 142, side: 'left',  ly: 150 },
    { text: 'Metadata',        px: 20, py: 213, side: 'left',  ly: 204 },
    { text: '4th Wall Effects', px: 26, py: 228, side: 'left', ly: 224 },
    { text: 'Effects/Powers',  px: 62, py: 244, side: 'left',  ly: 244 },
    { text: 'Attack Name',     px: 67, py: 272, side: 'left',  ly: 264 },
    { text: 'Attack Effect',   px: 82, py: 280, side: 'left',  ly: 284 },
    { text: 'Type Advantage',  px: 24, py: 296, side: 'left',  ly: 304 },
    { text: 'Copyright',       px: 48, py: 318, side: 'left',  ly: 324 },

    // Right labels
    { text: 'Life Points',           px: 224, py: 28,  side: 'right', ly: 18 },
    { text: 'Page Name',             px: 110, py: 30,  side: 'right', ly: 70 },
    { text: 'Status Effect',         px: 144, py: 266, side: 'right', ly: 206 },
    { text: 'Base Damage',           px: 164, py: 266, side: 'right', ly: 234 },
    { text: 'Aura Attack Advantage', px: 196, py: 272, side: 'right', ly: 260 },
    { text: 'Flavor Text',           px: 175, py: 294, side: 'right', ly: 296 },
    { text: 'Artist',                px: 195, py: 318, side: 'right', ly: 324 },
  ];

  function renderLabel(label: Label) {
    const { text, px, py, side, lx, ly } = label;
    const dotX = cx + px;
    const dotY = cy + py;
    let endX: number, endY: number, textX: number, textY: number;
    let anchor: 'start' | 'middle' | 'end';

    if (side === 'top') {
      endX = cx + (lx ?? px);
      endY = cy - 6;
      textX = endX;
      textY = cy - 10;
      anchor = 'middle';
    } else if (side === 'left') {
      endX = cx - 6;
      endY = cy + (ly ?? py);
      textX = endX - 4;
      textY = endY + 3.5;
      anchor = 'end';
    } else {
      endX = cx + cw + 6;
      endY = cy + (ly ?? py);
      textX = endX + 4;
      textY = endY + 3.5;
      anchor = 'start';
    }

    return (
      <g key={`${text}-${side}`}>
        <line x1={dotX} y1={dotY} x2={endX} y2={endY} stroke="black" strokeWidth={4} />
        <line x1={dotX} y1={dotY} x2={endX} y2={endY} stroke="cyan" strokeWidth={0.75} />
        <circle cx={dotX} cy={dotY} r={3} fill="cyan" stroke="black" strokeWidth={2} />
        <text x={textX} y={textY} textAnchor={anchor} fill="#d1d5db" fontSize="9" fontWeight="600">
          {text}
        </text>
      </g>
    );
  }

  return (
    <div className="my-6 overflow-x-auto">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
        <defs>
          <clipPath id="card-clip">
            <rect x={cx} y={cy} width={cw} height={ch} rx={10} />
          </clipPath>
        </defs>
        <image
          href="/assets/rulebook-example-card.jpg"
          x={cx} y={cy} width={cw} height={ch}
          clipPath="url(#card-clip)"
        />
        {labels.map(renderLabel)}
      </svg>
    </div>
  );
}

const WHEEL_TOP: Element[] = ['Frost', 'Water', 'Earth', 'Cosmic', 'Light', 'Neutral'];
const WHEEL_BOT: Element[] = ['Flame', 'Forest', 'Lightning', 'Spirit', 'Dark', 'Special'];

function AuraWheel() {
  const colW = 100;
  const iconSize = 52;
  const labelH = 18;
  const gap = 60; 
  const padX = 30;
  const padY = 20;

  // Row 1 top edge = padY
  // Row 1 icon bottom = padY + iconSize
  // Row 1 label bottom = padY + iconSize + labelH
  // Row 2 top edge = padY + iconSize + labelH + gap
  // Row 2 icon bottom = padY + iconSize + labelH + gap + iconSize
  // Row 2 label bottom = padY + iconSize + labelH + gap + iconSize + labelH
  const row2Y = padY + iconSize + labelH + gap;
  const svgW = colW * 6 + padX * 2;
  const svgH = row2Y + iconSize + labelH + padY;

  function iconY(row: number) {
    return row === 0 ? padY : row2Y;
  }

  function iconCenterX(col: number) {
    return padX + col * colW + colW / 2;
  }

  function elemPos(el: Element): { cx: number; cy: number } {
    let idx = WHEEL_TOP.indexOf(el);
    if (idx !== -1) return { cx: iconCenterX(idx), cy: iconY(0) + iconSize / 2 };
    idx = WHEEL_BOT.indexOf(el);
    return { cx: iconCenterX(idx), cy: iconY(1) + iconSize / 2 };
  }

  const edges: { from: Element; to: Element }[] = [];
  for (const el of [...WHEEL_TOP, ...WHEEL_BOT]) {
    for (const target of AURA_STRENGTHS[el]) {
      edges.push({ from: el, to: target });
    }
  }

  return (
    <div className="my-4">
      <h3 className="text-lg font-bold text-gold-300 mb-3">Aura Wheel</h3>
      <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill="#6b7280" />
          </marker>
        </defs>

        {/* Arrows */}
        {edges.map(({ from, to }, i) => {
          const f = elemPos(from);
          const t = elemPos(to);

          const dx = t.cx - f.cx;
          const dy = t.cy - f.cy;
          const goingDown = dy > 0;
          const goingUp = dy < 0;
          const horizontal = dy === 0;

          const fromIsTop = WHEEL_TOP.includes(from);
          let x1 = f.cx, y1 = f.cy;
          if (goingDown) {
            y1 = f.cy + iconSize / 2 + (fromIsTop ? labelH + 4 : 4);
          } else if (goingUp) {
            y1 = f.cy - iconSize / 2 - 4;
          } else {
            x1 = f.cx + (dx > 0 ? iconSize / 2 + 4 : -(iconSize / 2 + 4));
          }

          const toIsTop = WHEEL_TOP.includes(to);
          let x2 = t.cx, y2 = t.cy;
          if (goingDown) {
            y2 = t.cy - iconSize / 2 - 4;
          } else if (goingUp) {
            y2 = t.cy + iconSize / 2 + (toIsTop ? labelH + 4 : 4);
          } else {
            x2 = t.cx + (dx > 0 ? -(iconSize / 2 + 4) : iconSize / 2 + 4);
          }

          if (!horizontal) {
            const totalDx = x2 - x1;
            const totalDy = y2 - y1;
            const d = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
            if (d > 0) {
              x1 = f.cx + (totalDx / d) * (iconSize / 2 + 4);
              x2 = t.cx - (totalDx / d) * (iconSize / 2 + 4);
            }
          }

          return (
            <line key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Aura icons */}
        {[...WHEEL_TOP.map((el, col) => ({ el, col, row: 0 })),
          ...WHEEL_BOT.map((el, col) => ({ el, col, row: 1 }))].map(({ el, col, row }) => {
          const cx = iconCenterX(col);
          const y = iconY(row);
          return (
            <g key={el}>
              <rect
                x={cx - iconSize / 2} y={y}
                width={iconSize} height={iconSize}
                rx={6} fill={auraBg(el)}
                stroke="#374151" strokeWidth={1.5}
              />
              <image
                href={`/assets/AuraSymbols/${el}.png`}
                x={cx - iconSize / 2 + 4} y={y + 4}
                width={iconSize - 8} height={iconSize - 8}
              />
              <text x={cx} y={y + iconSize + 14}
                textAnchor="middle" fill="#d1d5db" fontSize="11" fontWeight="600"
              >
                {el}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
    </div>
  );
}

function AuraCostIcon({ element, cost }: { element: Element; cost: number }) {
  return (
    <span className="inline-flex items-center">
      <span className="text-white font-bold text-sm mr-0.5">{cost}</span>
      <img
        src={`/assets/AuraSymbols/${element}.png`} alt={element}
        className="inline-block w-5 h-5 rounded-sm"
        style={{ backgroundColor: auraBg(element) }}
      />
    </span>
  );
}

function AuraCostExamples() {
  const rows: { costs: { element: Element; cost: number }[]; result: string }[] = [
    { costs: [{ element: 'Neutral', cost: 0 }], result: 'Neutral' },
    { costs: [{ element: 'Flame', cost: 0 }], result: 'Flame' },
    { costs: [{ element: 'Flame', cost: 1 }], result: 'Flame' },
    { costs: [{ element: 'Neutral', cost: 1 }, { element: 'Flame', cost: 0 }], result: 'Flame' },
    { costs: [{ element: 'Neutral', cost: 1 }, { element: 'Flame', cost: 1 }], result: 'Flame' },
    { costs: [{ element: 'Forest', cost: 1 }, { element: 'Flame', cost: 1 }], result: 'Forest and Flame' },
  ];

  return (
    <div className="overflow-x-auto my-4">
      <table className="text-sm text-left">
        <thead>
          <tr className="border-b border-navy-600 text-gold-300">
            <th className="py-2 pr-8">Aura Cost</th>
            <th className="py-2">Base Aura Type(s)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-navy-800 text-gray-300 align-middle">
              <td className="py-2.5 pr-8">
                <span className="inline-flex items-center gap-1">
                  {row.costs.map((c, ci) => <AuraCostIcon key={ci} element={c.element} cost={c.cost} />)}
                </span>
              </td>
              <td className="py-2.5">{row.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Section {
  id: string;
  title: string;
  level: number;
  content: string;
}

interface GlossaryEntry {
  term: string;
  id: string;
  definition: string;
}

function parseRulebook(raw: string): { sections: Section[]; glossary: GlossaryEntry[] } {
  const lines = raw.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);

    if (h2) {
      if (current) sections.push(current);
      const title = h2[1];
      const id = slugify(title);
      current = { id, title, level: 2, content: '' };
      continue;
    }

    if (h3) {
      if (current) sections.push(current);
      const title = h3[1];
      const id = slugify(title);
      current = { id, title, level: 3, content: '' };
      continue;
    }

    if (current && line !== '---') {
      current.content += line + '\n';
    }
  }
  if (current) sections.push(current);

  const glossaryIdx = sections.findIndex(s => s.title === 'Glossary');
  const glossary: GlossaryEntry[] = [];
  if (glossaryIdx !== -1) {
    for (let i = glossaryIdx + 1; i < sections.length; i++) {
      const s = sections[i];
      if (s.level !== 3) break;
      glossary.push({ term: s.title, id: s.id, definition: s.content.trim() });
    }
  }

  return { sections, glossary };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function renderInline(text: string, kwRegex: RegExp | null): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const emMatch = remaining.match(/\*(.+?)\*/);
    const codeMatch = remaining.match(/`(.+?)`/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(#([^)]+)\)/);

    const matches = [
      boldMatch && { idx: boldMatch.index!, len: boldMatch[0].length, node: <strong key={key++} className="text-white"><GameIcon name={boldMatch[1]} />{renderInline(boldMatch[1], null)}</strong> },
      emMatch && emMatch.index !== boldMatch?.index && { idx: emMatch.index!, len: emMatch[0].length, node: <em key={key++}>{emMatch[1]}</em> },
      codeMatch && { idx: codeMatch.index!, len: codeMatch[0].length, node: <code key={key++} className="bg-navy-800 px-1 rounded text-gray-200 text-xs">{codeMatch[1]}</code> },
      linkMatch && { idx: linkMatch.index!, len: linkMatch[0].length, node: <a key={key++} href={`#${linkMatch[2]}`} className="text-blue-400 hover:text-blue-300">{linkMatch[1]}</a> },
    ].filter(Boolean) as { idx: number; len: number; node: ReactNode }[];

    if (matches.length === 0) {
      parts.push(addKeywordSpans(remaining, key, kwRegex));
      break;
    }

    const first = matches.reduce((a, b) => a.idx < b.idx ? a : b);
    if (first.idx > 0) {
      parts.push(addKeywordSpans(remaining.slice(0, first.idx), key, kwRegex));
      key++;
    }
    parts.push(first.node);
    remaining = remaining.slice(first.idx + first.len);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function buildGlossaryRegex(glossary: GlossaryEntry[]): RegExp | null {
  const termPattern = glossary
    .filter(g => g.term.length > 3)
    .map(g => g.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return termPattern ? new RegExp(`\\b(${termPattern})\\b`) : null;
}

function addKeywordSpans(text: string, baseKey: number, kwRegex: RegExp | null): ReactNode {
  if (!kwRegex) return text;

  const regex = kwRegex;
  const segments: ReactNode[] = [];
  let rest = text;
  let k = baseKey;

  while (rest.length > 0) {
    const m = rest.match(regex);
    if (!m || m.index === undefined) {
      segments.push(rest);
      break;
    }
    if (m.index > 0) segments.push(rest.slice(0, m.index));
    segments.push(
      <span key={`kw-${k++}`} className="keyword-link underline decoration-dotted cursor-help" style={{ textDecorationColor: '#93c5fd' }} data-term={m[1]}>
        {m[1]}
      </span>
    );
    rest = rest.slice(m.index + m[0].length);
  }

  // Keyed: renderInline pushes this into an array of siblings.
  return segments.length === 1 ? segments[0] : <Fragment key={`kws-${baseKey}`}>{segments}</Fragment>;
}

function renderContent(content: string, kwRegex: RegExp | null): ReactNode[] {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableAligns: string[] = [];
  let tableRows: string[][] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;

  const flushTable = () => {
    if (!tableHeaders.length) return;
    elements.push(
      <div key={`t-${elements.length}`} className="overflow-x-auto my-4">
        <table className="w-full text-[15px] text-left border-collapse">
          <thead>
            <tr>
              {tableHeaders.map((h, i) => (
                <th
                  key={i}
                  className="py-2.5 px-3 border-b border-gold-600 text-gold-300 text-[11px] uppercase tracking-[.12em]"
                  style={tableAligns[i] === 'center' ? { textAlign: 'center' } : undefined}
                >
                  {renderInline(h, kwRegex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr key={ri} className="odd:bg-[rgba(18,28,55,.5)]">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`py-2.75 px-3 align-middle leading-normal ${ci === 0 ? 'text-white' : 'text-gray-300'}`}
                    style={tableAligns[ci] === 'center' ? { textAlign: 'center' } : undefined}
                  >
                    {renderInline(cell, kwRegex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableHeaders = [];
    tableAligns = [];
    tableRows = [];
  };

  const flushCode = () => {
    elements.push(
      <pre key={`c-${elements.length}`} className="bg-navy-800 rounded px-3 py-2 text-sm text-gray-300 overflow-x-auto my-2 font-mono whitespace-pre-wrap">
        {codeLines.join('\n')}
      </pre>
    );
    codeLines = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    const Tag = listOrdered ? 'ol' : 'ul';
    elements.push(
      <Tag key={`l-${elements.length}`} className={`text-[17px] text-gray-300 leading-[1.75] ${listOrdered ? 'list-decimal' : 'list-disc'} list-outside pl-5.5 my-3 space-y-1.5`}>
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item, kwRegex)}</li>
        ))}
      </Tag>
    );
    listItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) { flushCode(); inCodeBlock = false; }
      else { flushList(); inCodeBlock = true; }
      continue;
    }
    if (inCodeBlock) { codeLines.push(line); continue; }

    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (!inTable) {
        tableHeaders = cells;
        inTable = true;
      } else if (cells.every(c => /^[-:]+$/.test(c))) {
        tableAligns = cells.map(c => {
          if (c.startsWith(':') && c.endsWith(':')) return 'center';
          if (c.endsWith(':')) return 'right';
          return 'left';
        });
      } else {
        tableRows.push(cells);
      }
      continue;
    }
    if (inTable) { flushTable(); inTable = false; }

    const bullet = line.match(/^[-*] (.+)$/);
    const numbered = line.match(/^(\d+)\. (.+)$/);
    const lettered = line.match(/^([a-z])\) (.+)$/);
    const indentedBullet = line.match(/^ {2,}[-*] (.+)$/);

    if (bullet || indentedBullet) {
      if (listItems.length && listOrdered) flushList();
      listOrdered = false;
      listItems.push((bullet || indentedBullet)![1]);
      continue;
    }
    if (numbered || lettered) {
      if (listItems.length && !listOrdered) flushList();
      listOrdered = true;
      listItems.push(numbered ? numbered[2] : lettered![2]);
      continue;
    }
    if (listItems.length && line.startsWith('   ')) {
      listItems[listItems.length - 1] += ' ' + line.trim();
      continue;
    }
    if (listItems.length && line.trim() === '') continue;
    if (listItems.length) flushList();

    if (line.startsWith('<!-- ') || line.trim() === '' || line.startsWith('#') || line.startsWith('####')) continue;

    elements.push(
      <p key={`p-${elements.length}`} className="text-[17px] text-gray-300 leading-[1.75] my-3.5" style={{ textWrap: 'pretty' }}>
        {renderInline(line, kwRegex)}
      </p>
    );
  }

  if (inTable) flushTable();
  if (inCodeBlock) flushCode();
  flushList();

  return elements;
}

function GlossaryPopover({ term, definition, rect, onClose }: {
  term: string;
  definition: string;
  rect: DOMRect;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [onClose]);

  const popoverH = 160;
  const spaceBelow = window.innerHeight - rect.bottom;
  const top = spaceBelow > popoverH + 10
    ? rect.bottom + 6
    : rect.top - popoverH - 6;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - 300));

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-navy-800 border border-gold-400 rounded-lg shadow-lg p-3"
      style={{ top, left, maxWidth: Math.min(290, window.innerWidth - 16) }}
    >
      <div className="mb-1">
        <span className="text-sm font-bold text-gold-400">{term}</span>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">{definition}</p>
    </div>
  );
}

function parseVersionInfo(raw: string): { version: string; updated: string } {
  const m = raw.match(/^### Version ([^\s~]+) ~ (.+)$/m);
  return { version: m?.[1] ?? '0.1', updated: m?.[2]?.trim() ?? '' };
}

interface TocNode {
  section: Section;
  number: string;
  children: Section[];
}

export function RulebookPage() {
  const { sections, glossary } = useMemo(() => parseRulebook(rulebookRaw), []);
  const versionInfo = useMemo(() => parseVersionInfo(rulebookRaw), []);
  const [activeId, setActiveId] = useState('');
  const [popover, setPopover] = useState<{ term: string; definition: string; rect: DOMRect } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const kwRegex = useMemo(() => buildGlossaryRegex(glossary), [glossary]);

  const tocSections = useMemo(() => {
    const glossaryIdx = sections.findIndex(s => s.title === 'Glossary');
    return sections.filter((s, i) => {
      if (s.level === 2) return true;
      if (glossaryIdx !== -1 && i > glossaryIdx) return false;
      return s.level === 3;
    });
  }, [sections]);

  const sectionNumbers = useMemo(() => {
    const map: Record<string, string> = {};
    let n = 0;
    for (const s of sections) {
      if (s.level === 2) map[s.id] = String(++n).padStart(2, '0');
    }
    return map;
  }, [sections]);

  const tocTree = useMemo(() => {
    const tree: TocNode[] = [];
    for (const s of tocSections) {
      if (s.level === 2) tree.push({ section: s, number: sectionNumbers[s.id], children: [] });
      else if (tree.length > 0) tree[tree.length - 1].children.push(s);
    }
    return tree;
  }, [tocSections, sectionNumbers]);

  const activeBranchId = useMemo(() => {
    const node = tocTree.find(
      n => n.section.id === activeId || n.children.some(c => c.id === activeId)
    );
    return node?.section.id ?? '';
  }, [tocTree, activeId]);

  const mainSections = useMemo(() => {
    const glossaryIdx = sections.findIndex(s => s.title === 'Glossary');
    return glossaryIdx !== -1 ? sections.slice(0, glossaryIdx + 1) : sections;
  }, [sections]);

  const glossaryTerms = useMemo(() => {
    const glossaryIdx = sections.findIndex(s => s.title === 'Glossary');
    if (glossaryIdx === -1) return [];
    const terms: Section[] = [];
    for (let i = glossaryIdx + 1; i < sections.length; i++) {
      if (sections[i].level === 2) break;
      if (sections[i].level === 3) terms.push(sections[i]);
    }
    return terms;
  }, [sections]);

  const postGlossarySections = useMemo(() => {
    const glossaryIdx = sections.findIndex(s => s.title === 'Glossary');
    if (glossaryIdx === -1) return [];
    let endOfGlossary = glossaryIdx + 1;
    while (endOfGlossary < sections.length && sections[endOfGlossary].level === 3) endOfGlossary++;
    return sections.slice(endOfGlossary);
  }, [sections]);

  useEffect(() => {
    const visibleIds = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleIds.add(entry.target.id);
          else visibleIds.delete(entry.target.id);
        }
        const allSections = contentRef.current?.querySelectorAll('[data-section-id]');
        if (!allSections) return;
        for (const el of Array.from(allSections)) {
          if (visibleIds.has(el.id)) {
            setActiveId(el.id);
            return;
          }
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0 }
    );

    const headings = contentRef.current?.querySelectorAll('[data-section-id]');
    headings?.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  const howToUseContent = useMemo(() => {
    const first = sections[0];
    if (!first) return '';
    return first.content
      .split('\n')
      .filter(l => !l.trim().startsWith('**If'))
      .join('\n');
  }, [sections]);

  const closePopover = useCallback(() => setPopover(null), []);

  const handleKeywordClick = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('.keyword-link') as HTMLElement | null;
    if (!target) return;
    const term = target.dataset.term;
    if (!term) return;
    const entry = glossary.find(g => g.term === term);
    if (!entry) return;
    const rect = target.getBoundingClientRect();
    setPopover({ term: entry.term, definition: entry.definition, rect });
  }, [glossary]);

  const sectionHeader = (section: Section) =>
    section.level === 2 ? (
      <div className="flex items-baseline gap-3.5 mb-4">
        <span className="font-mono text-[13px] text-gold-600">{sectionNumbers[section.id]}</span>
        <h2 className="font-title font-normal text-[24px] md:text-[28px] text-gold-400 m-0">{section.title}</h2>
      </div>
    ) : (
      <h3 className="text-[19px] font-bold text-gold-300 mt-7 mb-2.5">{section.title}</h3>
    );

  return (
    <div className="min-h-dvh bg-navy-950 text-white">
      <SiteHeader sticky />
      <nav className="hidden lg:block fixed top-15 left-0 w-68 h-[calc(100dvh-3.75rem)] overflow-y-auto border-r border-navy-600 bg-navy-900 py-6.5 px-5 z-10">
        <span className="block text-[10px] uppercase tracking-[.18em] text-gold-500 mb-4">Contents</span>
        <div className="flex flex-col gap-0.5">
          {tocTree.map(({ section, number, children }) => (
            <Fragment key={section.id}>
              <a
                href={`#${section.id}`}
                className={`flex gap-2.5 py-1 text-[13px] transition-colors ${
                  activeBranchId === section.id ? 'text-gold-400 font-semibold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className={`font-mono text-[11px] pt-0.5 w-4.5 shrink-0 ${activeBranchId === section.id ? 'text-gold-600' : 'text-gray-600'}`}>
                  {number}
                </span>
                {section.title}
              </a>
              {children.length > 0 && (
                <div className="flex flex-col gap-px ml-1.5 pl-5 pt-0.5 pb-1.5 border-l border-navy-600">
                  {children.map(c => (
                    <a
                      key={c.id}
                      href={`#${c.id}`}
                      className={`text-xs py-0.75 transition-colors ${
                        activeId === c.id ? 'text-gold-300' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {c.title}
                    </a>
                  ))}
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main
        ref={contentRef}
        className="min-w-0 px-6 py-8 md:px-10 lg:ml-68 lg:px-14 lg:pt-11 lg:pb-16"
        onClick={handleKeywordClick}
      >
        <div className="max-w-4xl">
        {/* Masthead */}
        <div>
          <span className="block text-[11px] uppercase tracking-[.2em] text-gold-500 mb-3">
            Version {versionInfo.version}{versionInfo.updated ? ` · Updated ${versionInfo.updated}` : ''}
          </span>
          <PageTitle className="mb-8">OpenZoo Rulebook</PageTitle>
        </div>

        {/* Mobile TOC */}
        <details className="lg:hidden mb-8 bg-navy-800 border border-navy-600">
          <summary className="px-4 py-3 text-sm font-bold text-gold-300 cursor-pointer">Table of Contents</summary>
          <ul className="px-4 pb-3 space-y-1">
            {tocTree.map(({ section, number }) => (
              <li key={section.id} className="flex gap-2">
                <span className="font-mono text-xs text-gray-600 pt-0.5">{number}</span>
                <a href={`#${section.id}`} className="text-sm text-gray-400 hover:text-white">{section.title}</a>
              </li>
            ))}
          </ul>
        </details>

        {/* How to Use This Rulebook */}
        {sections[0] && (
          <section id={sections[0].id} data-section-id className="scroll-mt-4 mb-6">
            {sectionHeader(sections[0])}
            {renderContent(howToUseContent, kwRegex)}
            {/* Entry-point callouts */}
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <div className="flex-1 px-4.5 py-4 bg-navy-900 border-gold">
                <span className="block text-[10px] uppercase tracking-[.16em] text-gold-500 mb-1.75">New player</span>
                <p className="text-sm leading-relaxed text-gray-300 m-0">
                  Start with <a href="#basic-openzoo-language" className="text-gold-400 hover:text-gold-300">Basic OpenZoo Language</a>,
                  then read straight through to <a href="#playing-openzoo" className="text-gold-400 hover:text-gold-300">Playing OpenZoo</a>.
                </p>
              </div>
              <div className="flex-1 px-4.5 py-4 bg-navy-900 border border-navy-600">
                <span className="block text-[10px] uppercase tracking-[.16em] text-gray-500 mb-1.75">Veteran Caster</span>
                <p className="text-sm leading-relaxed text-gray-400 m-0">
                  Jump to <a href="#advanced-rules" className="text-gold-400 hover:text-gold-300">Advanced Rules</a> for the full details.
                </p>
              </div>
            </div>
          </section>
        )}

        {mainSections.slice(1).map(section => (
          <section
            key={section.id}
            id={section.id}
            data-section-id
            className={`scroll-mt-4 ${section.level === 2 ? 'mt-13 first:mt-0' : 'mt-0'} mb-6`}
          >
            {sectionHeader(section)}
            {section.id === 'page-layout' && <CardLayoutDiagram />}
            {renderContent(section.content, kwRegex)}
            {section.id === 'aura-types' && <AuraWheel />}
            {section.id === 'determining-a-pages-aura-types' && <AuraCostExamples />}
            {section.id === 'terra-bonuses' && <IconGrid items={TERRAS} folder="TerraNoGlow" />}
            {section.id === 'traits' && <IconGrid items={TRAITS} folder="TraitsNoGlow" />}
            {section.id === 'status-effects' && <IconGrid items={STATUS_EFFECTS} folder="StatusEffects" />}
          </section>
        ))}

        {/* Glossary */}
        {glossaryTerms.length > 0 && (
          <div className="space-y-4 mt-4 mb-8">
            {glossaryTerms.map(entry => (
              <div key={entry.id} id={entry.id} data-section-id className="scroll-mt-4">
                <dt className="text-[17px] font-bold text-gold-300">{entry.title}</dt>
                <dd className="text-[15px] text-gray-300 leading-relaxed mt-0.5 ml-0">
                  {renderInline(entry.content.trim(), null)}
                </dd>
              </div>
            ))}
          </div>
        )}

        {/* Changelog */}
        {postGlossarySections.map(section => (
          <section
            key={section.id}
            id={section.id}
            data-section-id
            className={`scroll-mt-4 ${section.level === 2 ? 'mt-13' : 'mt-0'} mb-6`}
          >
            {sectionHeader(section)}
            {renderContent(section.content, kwRegex)}
          </section>
        ))}

        </div>
      </main>

      <SiteFooter className="lg:pl-68" />

      {popover && (
        <GlossaryPopover
          term={popover.term}
          definition={popover.definition}
          rect={popover.rect}
          onClose={closePopover}
        />
      )}
    </div>
  );
}
