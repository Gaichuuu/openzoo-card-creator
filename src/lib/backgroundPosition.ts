export interface PositionLonghands {
  backgroundPositionX: string;
  backgroundPositionY: string;
}

const KEYWORDS = new Set(['left', 'right', 'top', 'bottom', 'center']);
const isVertical = (v: string) => v === 'top' || v === 'bottom';
const isHorizontal = (v: string) => v === 'left' || v === 'right';

function splitTopLevel(value: string, separator: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && separator.test(ch)) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function layerLonghands(layer: string): [string, string] {
  const tokens = splitTopLevel(layer, /\s/);
  if (tokens.length === 1) {
    const [a] = tokens;
    return isVertical(a) ? ['center', a] : [a, 'center'];
  }
  if (tokens.length === 2) {
    const [a, b] = tokens;
    return isVertical(a) || isHorizontal(b) ? [b, a] : [a, b];
  }
  // 3 or 4 values: each edge keyword may carry an offset ("right 10px bottom 5px").
  const groups: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const next = tokens[i + 1];
    if (KEYWORDS.has(tokens[i]) && tokens[i] !== 'center' && next !== undefined && !KEYWORDS.has(next)) {
      groups.push(`${tokens[i]} ${next}`);
      i++;
    } else {
      groups.push(tokens[i]);
    }
  }
  const edge = (g: string) => g.split(' ')[0];
  const y = groups.find((g) => isVertical(edge(g)));
  const x = groups.find((g) => isHorizontal(edge(g)));
  return [x ?? groups.find((g) => g !== y) ?? 'center', y ?? groups.find((g) => g !== x) ?? 'center'];
}

export function positionLonghands(value: string): PositionLonghands {
  const layers = splitTopLevel(value, /,/).map(layerLonghands);
  return {
    backgroundPositionX: layers.map(([x]) => x).join(', '),
    backgroundPositionY: layers.map(([, y]) => y).join(', '),
  };
}
