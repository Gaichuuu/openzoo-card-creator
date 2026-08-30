import { describe, it, expect } from 'vitest';
import {
  FIT_CANDIDATES,
  FONT_STARTS,
  BASE_INDEX,
  BASE_FONT_INDEX,
  pickCandidate,
  TIERS_PER_CELL,
  type FitCandidate,
} from '@/lib/textBoxLadder';


describe('FIT_CANDIDATES', () => {
  it('starts the auto-fit at the largest rung (attack effect steps down from the layout 9px)', () => {
    expect(FIT_CANDIDATES[BASE_INDEX]).toEqual({
      main: { font: 9, pitch: 8 },
      effect: { font: 8, pitch: 7 },
      attack: { name: 10, dmg: 12, pitch: 13 },
    });
  });

  it('keeps oversize rungs above the auto-fit ceiling', () => {
    expect(BASE_INDEX).toBeGreaterThan(0);
    expect(FIT_CANDIDATES[0].main).toEqual({ font: 11, pitch: 10 });
  });

  it('sets the attack effect no looser than the main text', () => {
    for (const c of FIT_CANDIDATES) {
      expect(c.effect.pitch).toBeLessThanOrEqual(c.main.pitch);
      if (c.effect.pitch > 5) {
        expect(c.effect.pitch / c.effect.font)
          .toBeLessThanOrEqual(c.main.pitch / c.main.font + 0.001);
      }
    }
  });

  it('has every value on the half-pixel grid', () => {
    for (const c of FIT_CANDIDATES) {
      for (const v of [c.main.font, c.main.pitch, c.effect.font, c.effect.pitch, c.attack.name, c.attack.dmg, c.attack.pitch]) {
        expect(v * 2).toBe(Math.round(v * 2));
      }
    }
  });

  it('orders candidates by font, then pitch, then attack, all descending', () => {
    for (let i = 1; i < FIT_CANDIDATES.length; i++) {
      const a = FIT_CANDIDATES[i - 1];
      const b = FIT_CANDIDATES[i];
      const rank = (c: FitCandidate) =>
        c.main.font * 10000 + c.main.pitch * 100 + c.attack.pitch;
      expect(rank(b)).toBeLessThan(rank(a));
    }
  });

  it('keeps leading between font - 1 and font - 3', () => {
    for (const c of FIT_CANDIDATES) {
      expect(c.main.pitch).toBeLessThanOrEqual(c.main.font - 1);
      expect(c.main.pitch).toBeGreaterThanOrEqual(Math.max(5, c.main.font - 3));
    }
  });

  it('covers the three combinations the hand-written tables could not hold at once', () => {
    const has = (font: number, pitch: number) =>
      FIT_CANDIDATES.some((c) => c.main.font === font && c.main.pitch === pitch);
    expect(has(9, 6.5)).toBe(true);
    expect(has(8.5, 6)).toBe(true);
    expect(has(8, 6.5)).toBe(true);
  });

  it('offers every attack tier at the base main metrics', () => {
    const atBase = FIT_CANDIDATES.filter((c) => c.main.font === 9 && c.main.pitch === 8);
    expect(atBase.map((c) => c.attack.pitch)).toEqual([13, 12, 11]);
  });
});

describe('pickCandidate', () => {
  const cellsFromBase = (FIT_CANDIDATES.length - BASE_INDEX) / TIERS_PER_CELL;

  it('returns BASE_INDEX when the first candidate fits', () => {
    // The regression guard for existing cards: with no Shrink applied the ladder must
    // still top out at 9px/8, never reaching into the oversize rungs above it.
    expect(pickCandidate(() => true)).toBe(BASE_INDEX);
  });

  it('returns the first index that fits', () => {
    expect(pickCandidate((_candidate, i) => i >= BASE_INDEX + 5)).toBe(BASE_INDEX + 5);
  });

  it('returns the last index when nothing fits', () => {
    expect(pickCandidate(() => false)).toBe(FIT_CANDIDATES.length - 1);
  });

  it('probes each cell top-down but only its last index until the winning cell', () => {
    const seen: number[] = [];
    const result = pickCandidate((_candidate, i) => { seen.push(i); return i === BASE_INDEX + 3; });
    const lastOfEachCell = Array.from(
      { length: cellsFromBase },
      (_, cell) => BASE_INDEX + cell * TIERS_PER_CELL + TIERS_PER_CELL - 1,
    );
    expect(seen).toEqual(lastOfEachCell);
    expect(result).toBe(FIT_CANDIDATES.length - 1);
  });

  it('probes each font/pitch cell at most once when the cell cannot fit', () => {
    let probes = 0;
    pickCandidate(() => { probes++; return false; });
    expect(probes).toBe(cellsFromBase);
  });

  it('returns the same index as a naive first-fit scan for any attack-monotone predicate', () => {
    const naive = (fits: (c: FitCandidate, i: number) => boolean) => {
      for (let i = BASE_INDEX; i < FIT_CANDIDATES.length; i++) {
        if (fits(FIT_CANDIDATES[i], i)) return i;
      }
      return FIT_CANDIDATES.length - 1;
    };
    let seed = 1;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let trial = 0; trial < 200; trial++) {
      const wFont = rand() * 6;
      const wPitch = rand() * 6;
      const wAttack = rand() * 3;
      const noise = FIT_CANDIDATES.map(() => rand() * 0.5);
      const height = (c: FitCandidate, i: number) =>
        c.main.font * wFont + c.main.pitch * wPitch + c.attack.pitch * wAttack
        + noise[i - (i % TIERS_PER_CELL)];
      const budget = 20 + rand() * 80;
      const fits = (c: FitCandidate, i: number) => height(c, i) <= budget;
      expect(pickCandidate(fits)).toBe(naive(fits));
    }
  });

  it('reaches the larger fonts when started above the base', () => {
    const sizes = [1, 2, 3, 4].map((step) =>
      FIT_CANDIDATES[pickCandidate(() => true, FONT_STARTS[BASE_FONT_INDEX - step])].main.font
    );
    expect(sizes).toEqual([9.5, 10, 10.5, 11]);
  });

  it('falls back past the oversize rungs when nothing large fits', () => {
    const onlySmall = (_c: FitCandidate, i: number) => i >= BASE_INDEX + TIERS_PER_CELL;
    const picked = pickCandidate(onlySmall, FONT_STARTS[0]);
    expect(picked).toBe(BASE_INDEX + TIERS_PER_CELL);
    expect(FIT_CANDIDATES[picked].main).toEqual({ font: 9, pitch: 7.5 });
  });
});
