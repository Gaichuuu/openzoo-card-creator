export interface EffectTextViolation {
  rule: string
  match: string
  fix: string
}

interface Rule {
  name: string
  pattern: RegExp
  replace: (match: RegExpExecArray) => string
  guard?: (text: string, match: RegExpExecArray) => boolean
  operatesOnBold?: boolean
}

const AMOUNT = String.raw`[+-]?(?:\d+X?|X)`

function protectedRanges(text: string, includeBoldSpans = true): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  const patterns = [
    ...(includeBoldSpans ? [/\{BI?:[^{}]*\}/g] : []),
    /\{[^{}]+\}\(\s*(?:\d+|X)\s*\)/g,
    /(?:^|\n)\s*\d+\./g,
  ]
  for (const p of patterns) {
    for (const m of text.matchAll(p)) {
      ranges.push([m.index, m.index + m[0].length])
    }
  }
  return ranges
}

function isProtected(ranges: Array<[number, number]>, index: number): boolean {
  return ranges.some(([start, end]) => index >= start && index < end)
}

function liveMatches(text: string, rule: Rule): RegExpExecArray[] {
  const ranges = protectedRanges(text, !rule.operatesOnBold)
  const out: RegExpExecArray[] = []
  for (const m of text.matchAll(rule.pattern)) {
    const match = m as RegExpExecArray
    if (isProtected(ranges, match.index)) continue
    if (rule.guard && !rule.guard(text, match)) continue
    if (rule.replace(match) === match[0]) continue
    out.push(match)
  }
  return out
}

function applyRule(text: string, rule: Rule): string {
  let out = ''
  let last = 0
  for (const m of liveMatches(text, rule)) {
    out += text.slice(last, m.index) + rule.replace(m)
    last = m.index + m[0].length
  }
  return out + text.slice(last)
}

function nearDamageClause(text: string, index: number): boolean {
  return /\b(?:Damage|deal|dealt|deals)\b/i.test(text.slice(Math.max(0, index - 70), index))
}

const RULES: Rule[] = [
  {
    name: 'bold-extent-attack',
    operatesOnBold: true,
    pattern: new RegExp(String.raw`\{B:(${AMOUNT}\s+Damage)\s+Attack\}`, 'g'),
    replace: (m) => `{B:${m[1]}} Attack`,
  },
  {
    name: 'bold-bare-unit',
    operatesOnBold: true,
    pattern: /\{B:(?:LP|Life Points|Damage)\}/g,
    replace: (m) => (m[0] === '{B:Damage}' ? 'Damage' : 'LP'),
  },

  {
    name: 'bold-split-unit',
    operatesOnBold: true,
    pattern: new RegExp(String.raw`\{B:(${AMOUNT})\}(\s+)(Damage|ATK DMG|LP)\b`, 'g'),
    replace: (m) => `{B:${m[1]}${m[2]}${m[3]}}`,
  },

  {
    name: 'damage-amount',
    pattern: new RegExp(String.raw`(?<![\w+-])(${AMOUNT})\s+(Damage|ATK DMG)\b`, 'g'),
    replace: (m) => `{B:${m[1]} ${m[2]}}`,
  },
  {
    name: 'lp-amount',
    pattern: new RegExp(String.raw`(?<![\w+-])(${AMOUNT})\s+LP\b`, 'g'),
    replace: (m) => `{B:${m[1]} LP}`,
  },
  {
    name: 'maximum-lp',
    pattern: new RegExp(String.raw`(?<![\w+-])(${AMOUNT})(\s+maximum LP\b)`, 'g'),
    replace: (m) => `{B:${m[1]}}${m[2]}`,
  },
  {
    name: 'bookmark-count',
    pattern: /\bBookmark\s+(\d+)\b/g,
    replace: (m) => `Bookmark {B:${m[1]}}`,
  },
  {
    name: 'page-count',
    pattern: new RegExp(String.raw`(?<![\w+-])(${AMOUNT})(\s+(?:target\s+)?Pages?\b)`, 'g'),
    replace: (m) => `{B:${m[1]}}${m[2]}`,
  },
  {
    name: 'counter-count',
    pattern: new RegExp(
      String.raw`(?<![\w+-])(${AMOUNT})(\s+(?:[A-Za-z]+\s+)?Counters?\b)`,
      'g',
    ),
    replace: (m) => `{B:${m[1]}}${m[2]}`,
  },
  {
    name: 'token-count',
    pattern: new RegExp(
      String.raw`(?<![\w+-])(${AMOUNT})(\s+(?:\{[^{}]+\}\s+|[A-Z][A-Za-z]*\s+){0,3}Tokens?\b)`,
      'g',
    ),
    replace: (m) => `{B:${m[1]}}${m[2]}`,
  },
  {
    name: 'aura-cost-of',
    pattern: /\bAura Cost of\s+(\d+)/g,
    replace: (m) => `Aura Cost of {B:${m[1]}}`,
  },
  {
    name: 'aura-payment',
    pattern: /\b(pay|generate|Contracted for|for)\s+(\d+)(\s+(?:\{|Aura\b))/gi,
    replace: (m) => `${m[1]} {B:${m[2]}}${m[3]}`,
  },
  {
    name: 'aura-payment-and',
    pattern: /\b(and)\s+(\d+)(\s+\{(?:[A-Z]))/g,
    replace: (m) => `${m[1]} {B:${m[2]}}${m[3]}`,
  },
  {
    name: 'aura-discount',
    pattern: /\b(costs?|for)\s+(\d+)(\s+(?:less\b|Aura\b))/g,
    replace: (m) => `${m[1]} {B:${m[2]}}${m[3]}`,
  },
  {
    name: 'aura-cost-icon',
    pattern: /\b(costs?)\s+(\d+)(\s+\{(?:[A-Z]))/g,
    replace: (m) => `${m[1]} {B:${m[2]}}${m[3]}`,
  },
  {
    name: 'aura-minimum',
    pattern: /\bminimum of\s+(\d+)/g,
    replace: (m) => `minimum of {B:${m[1]}}`,
  },
  {
    name: 'terra-bonus',
    pattern: /(\(\s*\{[^{}]+\}\s*)([+-])\s*(\d+)(\s*\))/g,
    replace: (m) => `${m[1]}{B:${m[2]}${m[3]}}${m[4]}`,
  },
  {
    name: 'terra-bonus-increase',
    pattern: /\bincreased by\s+([+-]?\d+)/g,
    replace: (m) => `increased by {B:${m[1]}}`,
  },
  {
    name: 'die-roll-action',
    pattern: /\broll a DICE\b/g,
    replace: () => 'Die Roll',
  },
  {
    name: 'coin-flip-term',
    pattern: /\b(?:FLIP COIN|COIN FLIP)\b/g,
    replace: () => 'Coin Flip',
  },
  {
    name: 'die-roll-term',
    pattern: /\bDICE(?:\s+roll(?:ed)?)?\b/g,
    replace: () => 'Die Roll',
  },

  {
    name: 'variable-x',
    pattern: /(?<![\w{:+-])X(?![\w])/g,
    replace: () => '{B:X}',
  },
  {
    name: 'damage-floor',
    pattern: /\b(to|is)\s+(\d+)\b(?!\s+times\b)/g,
    replace: (m) => `${m[1]} {B:${m[2]}}`,
    guard: (text, m) => nearDamageClause(text, m.index),
  },
]

export function fixEffectText(text: string): string {
  let out = text
  for (const rule of RULES) {
    out = applyRule(out, rule)
  }
  return out
}

export function findEffectTextViolations(text: string): EffectTextViolation[] {
  const violations: EffectTextViolation[] = []
  let out = text
  for (const rule of RULES) {
    for (const m of liveMatches(out, rule)) {
      violations.push({ rule: rule.name, match: m[0], fix: rule.replace(m) })
    }
    out = applyRule(out, rule)
  }
  return violations
}
