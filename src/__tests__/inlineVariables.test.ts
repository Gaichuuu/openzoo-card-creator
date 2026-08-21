import { describe, it, expect } from 'vitest';
import { ELEMENTS, TERRAS, TRAITS, STATUS_EFFECTS } from '@/data/constants';
import { getVariables } from '@/data/inlineClasses';
import { expandVariables, isInlineImage } from '@/lib/textParserUtils';
import { resolveImagePath } from '@/lib/imagePathResolver';

const ADVERTISED: [string, readonly string[]][] = [
  ['element', ELEMENTS],
  ['terra', TERRAS],
  ['trait', TRAITS],
  ['status effect', STATUS_EFFECTS],
];

describe('icon variables advertised by the Help panel', () => {
  const vars = getVariables('en');

  for (const [kind, names] of ADVERTISED) {
    describe(kind, () => {
      it('defines a variable for every name', () => {
        const missing = names.filter((n) => !(n in vars));
        expect(missing).toEqual([]);
      });

      it('expands every name instead of leaving the literal token', () => {
        const unexpanded = names.filter((n) => expandVariables(`{${n}}`, vars) === `{${n}}`);
        expect(unexpanded).toEqual([]);
      });

      it('expands to an inline image that resolves to an asset path', () => {
        const broken: string[] = [];
        for (const n of names) {
          const expanded = expandVariables(`{${n}}`, vars);
          const inner = expanded.slice(1, -1);
          if (!isInlineImage(inner)) { broken.push(`${n}: not an inline image (${expanded})`); continue; }
          const file = inner.split(',')[0].trim();
          if (!resolveImagePath(file)) broken.push(`${n}: unresolved path (${file})`);
        }
        expect(broken).toEqual([]);
      });
    });
  }

  it('does not let one list shadow a name from another', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const [kind, names] of ADVERTISED) {
      for (const n of names) {
        const prev = seen.get(n);
        if (prev) dupes.push(`${n} is both a ${prev} and a ${kind}`);
        else seen.set(n, kind);
      }
    }
    expect(dupes).toEqual([]);
  });
});
