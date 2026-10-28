import { describe, it, expect } from 'vitest';
import { sanitizeHolo } from '@/lib/holo/holoSettings';
import { HOLO_AREAS, REVERSE_RECT, availableHoloAreas, effectiveHoloAreas, holoAreasOf, holoAreaOfZone, shimmerRegions, toggleHoloArea } from '@/lib/holo/holoAreas';
import { LAYOUTS } from '@/data/layouts';
import type { Zone } from '@/types/layout';
import type { LayoutType } from '@/types/layout';

const base = { pattern: 'sand', strength: 50, angle: 10 } as const;

describe('holo areas in sanitizeHolo', () => {
  it('omits the default art-only area so old cards round-trip unchanged', () => {
    expect(sanitizeHolo(base)).toEqual(base);
    expect(sanitizeHolo({ ...base, areas: ['art'] })).toEqual(base);
  });
  it('keeps known areas in canonical order, deduped', () => {
    expect(sanitizeHolo({ ...base, areas: ['reverse', 'art', 'border', 'art'] }))
      .toEqual({ ...base, areas: ['art', 'border', 'reverse'] });
  });
  it('reads the earlier background/text box areas as reverse foil', () => {
    expect(sanitizeHolo({ ...base, areas: ['background', 'textBox'] })).toEqual({ ...base, areas: ['reverse'] });
  });
  it('drops unknown entries and falls back to art when nothing valid is left', () => {
    expect(sanitizeHolo({ ...base, areas: ['frame', 3] })).toEqual(base);
    expect(sanitizeHolo({ ...base, areas: [] })).toEqual(base);
    expect(sanitizeHolo({ ...base, areas: 'border' })).toEqual(base);
    expect(sanitizeHolo({ ...base, areas: ['frame', 'border'] })).toEqual({ ...base, areas: ['border'] });
  });
  it('collapses anything with card to card alone', () => {
    expect(sanitizeHolo({ ...base, areas: ['art', 'card'] })).toEqual({ ...base, areas: ['card'] });
  });
});

describe('holoAreasOf', () => {
  it('defaults to art when areas is missing', () => {
    expect(holoAreasOf(base)).toEqual(['art']);
    expect(holoAreasOf({ ...base, areas: ['border', 'reverse'] })).toEqual(['border', 'reverse']);
  });
});

describe('availableHoloAreas', () => {
  it('offers every area on a bordered Basic card', () => {
    expect(availableHoloAreas('BasicNoAttack', false)).toEqual(HOLO_AREAS.map((a) => a.id));
  });
  it('hides border and reverse foil on borderless cards, where the art is the whole card', () => {
    expect(availableHoloAreas('Aura', true)).toEqual(['art', 'card']);
  });
  it('hides reverse foil on Terra, whose art is the whole card', () => {
    expect(availableHoloAreas('Terra', false)).toEqual(['art', 'border', 'card']);
  });
});

describe('effectiveHoloAreas', () => {
  it('drops areas the card cannot show but keeps the rest', () => {
    expect(effectiveHoloAreas({ ...base, areas: ['art', 'border'] }, 'BasicNoAttack', true)).toEqual(['art']);
  });
  it('falls back to the art box when every chosen area is hidden', () => {
    expect(effectiveHoloAreas({ ...base, areas: ['reverse'] }, 'Terra', false)).toEqual(['art']);
    expect(effectiveHoloAreas({ ...base, areas: ['border'] }, 'Aura', true)).toEqual(['art']);
  });
  it('is just card when card is chosen', () => {
    expect(effectiveHoloAreas({ ...base, areas: ['card'] }, 'Aura', true)).toEqual(['card']);
  });
  it('is empty when the holo is off', () => {
    expect(effectiveHoloAreas(null, 'Aura', false)).toEqual([]);
    expect(effectiveHoloAreas({ ...base, strength: 0 }, 'Aura', false)).toEqual([]);
  });
});

describe('toggleHoloArea', () => {
  it('adds and removes areas, keeping hidden ones', () => {
    expect(toggleHoloArea({ ...base }, 'border', true, 'BasicNoAttack', false)).toEqual(['art', 'border']);
    expect(toggleHoloArea({ ...base, areas: ['art', 'border'] }, 'art', false, 'BasicNoAttack', false)).toEqual(['border']);
    expect(toggleHoloArea({ ...base, areas: ['border', 'reverse'] }, 'art', true, 'Aura', true)).toEqual(['art', 'border', 'reverse']);
  });
  it('never removes the last visible area', () => {
    expect(toggleHoloArea({ ...base }, 'art', false, 'BasicNoAttack', false)).toEqual(['art']);
  });
  it('turns the visible fallback into a real choice when adding to it', () => {
    expect(toggleHoloArea({ ...base, areas: ['border'] }, 'card', true, 'Aura', true)).toEqual(['card']);
  });
  it('resets to the art box when Entire card is turned off', () => {
    expect(toggleHoloArea({ ...base, areas: ['card'] }, 'card', false, 'Aura', false)).toEqual(['art']);
  });
});

describe('holoAreaOfZone against the layout data', () => {
  const zonesOf = (layout: LayoutType) => {
    const out: Zone[] = [];
    const walk = (z: Zone) => { out.push(z); z.childZones.forEach(walk); };
    walk(LAYOUTS[layout].rootZone);
    return out;
  };
  it.each(Object.keys(LAYOUTS) as LayoutType[])('%s has exactly one zone for each zone-hosted area', (layout) => {
    const zones = zonesOf(layout);
    for (const area of ['art', 'border'] as const) {
      expect(zones.filter((z) => holoAreaOfZone(z) === area)).toHaveLength(1);
    }
  });
  it.each((Object.keys(LAYOUTS) as LayoutType[]).filter((l) => availableHoloAreas(l, false).includes('reverse')))(
    '%s: the reverse foil rect is the CardBackground rect', (layout) => {
      const bg = zonesOf(layout).find((z) => z.imageDataKey === 'CardBackground');
      expect(bg).toBeDefined();
      const px = (v: unknown) => parseFloat(String(v));
      expect({ left: px(bg!.style.left), top: px(bg!.style.top), width: px(bg!.style.width), height: px(bg!.style.height) })
        .toEqual(REVERSE_RECT);
    });
});

describe('shimmerRegions', () => {
  const art = { left: 21, top: 47, width: 197, height: 159 };
  const area = (rs: { width: number; height: number }[]) => rs.reduce((n, r) => n + r.width * r.height, 0);
  it('covers only the border strips for card border', () => {
    const rs = shimmerRegions(['border'], art, false)!;
    expect(area(rs)).toBe(238 * 333 - REVERSE_RECT.width * REVERSE_RECT.height);
    for (const r of rs) {
      const inside = r.left >= REVERSE_RECT.left && r.top >= REVERSE_RECT.top
        && r.left + r.width <= REVERSE_RECT.left + REVERSE_RECT.width && r.top + r.height <= REVERSE_RECT.top + REVERSE_RECT.height;
      expect(inside).toBe(false);
    }
  });
  it('leaves the art window out of reverse foil', () => {
    const rs = shimmerRegions(['reverse'], art, false)!;
    expect(area(rs)).toBe(REVERSE_RECT.width * REVERSE_RECT.height - art.width * art.height);
  });
  it('clips the reverse bands to the reverse rect when the art window reaches past it', () => {
    const wide = { left: 5, top: 40, width: 230, height: 100 };
    const rs = shimmerRegions(['reverse'], wide, false)!;
    expect(area(rs)).toBe(REVERSE_RECT.width * (REVERSE_RECT.height - wide.height));
    for (const r of rs) expect(r.left >= REVERSE_RECT.left && r.left + r.width <= REVERSE_RECT.left + REVERSE_RECT.width).toBe(true);
  });
  it('keeps the bookmark that overlaps the art window in reverse foil', () => {
    const bookmark = { left: 13, top: 13, width: 26, height: 188 };
    const rs = shimmerRegions(['reverse'], art, false, bookmark)!;
    const overlap = (39 - 21) * (201 - 47);
    expect(area(rs)).toBe(REVERSE_RECT.width * REVERSE_RECT.height - art.width * art.height + overlap);
  });
  it('covers art and reverse as one rect, and art alone as the art rect', () => {
    expect(shimmerRegions(['art', 'reverse'], art, false)).toEqual([{ ...REVERSE_RECT }]);
    expect(shimmerRegions(['art'], art, false)).toEqual([art]);
  });
  it('leaves the bookmark out of the art box: it is printed over the art window', () => {
    const bookmark = { left: 13, top: 13, width: 26, height: 188 };
    const rs = shimmerRegions(['art'], art, false, bookmark)!;
    const overlap = (39 - 21) * (201 - 47);
    expect(area(rs)).toBe(art.width * art.height - overlap);
    for (const r of rs) expect(r.left >= 39 || r.top >= 201).toBe(true);
  });
  it('is the whole card for entire card and borderless art', () => {
    expect(shimmerRegions(['card'], art, false)).toBeNull();
    expect(shimmerRegions(['art'], null, true)).toBeNull();
  });
  it('leaves the bookmark out of borderless art', () => {
    const bookmark = { left: 13, top: 13, width: 26, height: 188 };
    expect(area(shimmerRegions(['art'], null, true, bookmark)!)).toBe(238 * 333 - 26 * 188);
  });
});
