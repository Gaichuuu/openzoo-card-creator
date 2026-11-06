import { describe, it, expect } from 'vitest';
import { sanitizeHolo } from '@/lib/holo/holoSettings';
import { HOLO_AREAS, REVERSE_RECT, availableHoloAreas, effectiveHoloAreas, holoAreasOf, holoAreaOfZone, shimmerRegions, toggleHoloArea, usesReverseLayer, effectRegion, reverseClipPath, intersectRects } from '@/lib/holo/holoAreas';
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
    expect(sanitizeHolo({ ...base, areas: ['ground', 'art', 'border', 'art'] }))
      .toEqual({ ...base, areas: ['art', 'border', 'ground'] });
  });
  it('reads reverse foil and the earlier ids as all three parts', () => {
    expect(sanitizeHolo({ ...base, areas: ['reverse'] })).toEqual({ ...base, areas: ['effectBox', 'setIcon', 'ground'] });
    expect(sanitizeHolo({ ...base, areas: ['background', 'textBox'] })).toEqual({ ...base, areas: ['effectBox', 'setIcon', 'ground'] });
    expect(sanitizeHolo({ ...base, areas: ['ground', 'art', 'reverse'] })).toEqual({ ...base, areas: ['art', 'effectBox', 'setIcon', 'ground'] });
  });
  it('drops unknown entries and falls back to art when nothing valid is left', () => {
    expect(sanitizeHolo({ ...base, areas: ['frame', 3] })).toEqual(base);
    expect(sanitizeHolo({ ...base, areas: [] })).toEqual(base);
    expect(sanitizeHolo({ ...base, areas: 'border' })).toEqual(base);
    expect(sanitizeHolo({ ...base, areas: ['frame', 'border'] })).toEqual({ ...base, areas: ['border'] });
  });
  it('keeps the pop-out layer in canonical order', () => {
    expect(sanitizeHolo({ ...base, areas: ['popout', 'art'] })).toEqual({ ...base, areas: ['art', 'popout'] });
  });
  it('collapses anything with card to card alone', () => {
    expect(sanitizeHolo({ ...base, areas: ['art', 'card'] })).toEqual({ ...base, areas: ['card'] });
  });
});

describe('usesReverseLayer', () => {
  it('is on for ground or effect box only', () => {
    expect(usesReverseLayer(['ground'])).toBe(true);
    expect(usesReverseLayer(['effectBox'])).toBe(true);
    expect(usesReverseLayer(['setIcon', 'art'])).toBe(false);
  });
  it('maps the set symbol zone to the set icon area', () => {
    expect(holoAreaOfZone({ type: 'image', imageDataKey: 'SetSymbol' })).toBe('setIcon');
  });
});

describe('holoAreasOf', () => {
  it('defaults to art when areas is missing', () => {
    expect(holoAreasOf(base)).toEqual(['art']);
    expect(holoAreasOf({ ...base, areas: ['border', 'ground'] })).toEqual(['border', 'ground']);
  });
});

describe('availableHoloAreas', () => {
  it('offers every area on a bordered Basic card with a pop-out', () => {
    expect(availableHoloAreas('BasicNoAttack', false, true)).toEqual(HOLO_AREAS.map((a) => a.id));
  });
  it('offers the pop-out layer only when the card has a pop-out', () => {
    expect(availableHoloAreas('BasicNoAttack', false)).toEqual(['art', 'border', 'effectBox', 'setIcon', 'ground', 'card']);
    expect(availableHoloAreas('Aura', false)).toEqual(['art', 'border', 'effectBox', 'setIcon', 'ground', 'card']);
    expect(availableHoloAreas('Aura', true, true)).toEqual(['art', 'popout', 'card']);
  });
  it('hides border and reverse foil on borderless cards, where the art is the whole card', () => {
    expect(availableHoloAreas('Aura', true)).toEqual(['art', 'card']);
  });
  it('hides reverse foil on Terra, whose art is the whole card', () => {
    expect(availableHoloAreas('Terra', false)).toEqual(['art', 'border', 'card']);
    expect(availableHoloAreas('BasicNoAttack', true)).toEqual(['art', 'card']);
  });
});

describe('effectiveHoloAreas', () => {
  it('drops areas the card cannot show but keeps the rest', () => {
    expect(effectiveHoloAreas({ ...base, areas: ['art', 'border'] }, 'BasicNoAttack', true)).toEqual(['art']);
  });
  it('keeps a pop-out foil only while the card has a pop-out', () => {
    expect(effectiveHoloAreas({ ...base, areas: ['art', 'popout'] }, 'BasicNoAttack', false, true)).toEqual(['art', 'popout']);
    expect(effectiveHoloAreas({ ...base, areas: ['popout'] }, 'BasicNoAttack', false, false)).toEqual(['art']);
  });
  it('falls back to the art box when every chosen area is hidden', () => {
    expect(effectiveHoloAreas({ ...base, areas: ['ground'] }, 'Terra', false)).toEqual(['art']);
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
    expect(toggleHoloArea({ ...base, areas: ['border', 'ground'] }, 'art', true, 'Aura', true)).toEqual(['art', 'border', 'ground']);
  });
  it('keeps hidden parts stored when toggling on Terra', () => {
    expect(toggleHoloArea({ ...base, areas: ['ground', 'effectBox'] }, 'border', true, 'Terra', false)).toEqual(['art', 'border', 'effectBox', 'ground']);
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
  it.each(Object.keys(LAYOUTS) as LayoutType[])('%s maps its set symbol zone to the set icon area', (layout) => {
    const zones = zonesOf(layout);
    expect(zones.filter((z) => holoAreaOfZone(z) === 'setIcon')).toEqual(zones.filter((z) => z.imageDataKey === 'SetSymbol'));
  });
  it.each((Object.keys(LAYOUTS) as LayoutType[]).filter((l) => availableHoloAreas(l, false).includes('ground')))(
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
    const rs = shimmerRegions(['ground'], art, false)!;
    expect(area(rs)).toBe(REVERSE_RECT.width * REVERSE_RECT.height - art.width * art.height);
  });
  it('clips the reverse bands to the reverse rect when the art window reaches past it', () => {
    const wide = { left: 5, top: 40, width: 230, height: 100 };
    const rs = shimmerRegions(['ground'], wide, false)!;
    expect(area(rs)).toBe(REVERSE_RECT.width * (REVERSE_RECT.height - wide.height));
    for (const r of rs) expect(r.left >= REVERSE_RECT.left && r.left + r.width <= REVERSE_RECT.left + REVERSE_RECT.width).toBe(true);
  });
  it('keeps the bookmark that overlaps the art window in reverse foil', () => {
    const bookmark = { left: 13, top: 13, width: 26, height: 188 };
    const rs = shimmerRegions(['ground'], art, false, bookmark)!;
    const overlap = (39 - 21) * (201 - 47);
    expect(area(rs)).toBe(REVERSE_RECT.width * REVERSE_RECT.height - art.width * art.height + overlap);
  });
  it('covers art and reverse as one rect, and art alone as the art rect', () => {
    expect(shimmerRegions(['art', 'ground'], art, false)).toEqual([{ ...REVERSE_RECT }]);
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

describe('reverse foil split geometry', () => {
  const art = { left: 21, top: 47, width: 197, height: 159 };
  const bookmark = { left: 13, top: 13, width: 26, height: 188 };
  const box = { left: 19, top: 210, width: 201, height: 96 };
  const info = { left: 19, top: 207, width: 201, height: 10 };
  const effect = effectRegion(box, info);
  const icon = { left: 9, top: 9, width: 34, height: 34 };
  const OLD_REVERSE_PATH = 'M13 13H225V320H13Z' + 'M21 47V206H218V47Z' + 'M21 47H39V201H21Z';
  const HOLE = 'M19 217V306H220V217Z';

  it('cuts the info bar overlap off the effect region', () => {
    expect(effect).toEqual([{ left: 19, top: 217, width: 201, height: 89 }]);
    expect(effectRegion(box, null)).toEqual([box]);
    expect(effectRegion(null, info)).toEqual([]);
  });

  it('matches the old reverse path when ground and effect box are both on', () => {
    expect(reverseClipPath({ areas: ['effectBox', 'setIcon', 'ground'], includeBorder: false, art, bookmark, effect })).toBe(OLD_REVERSE_PATH);
  });
  it('adds a counter-clockwise hole for the effect region when effect box is off', () => {
    expect(reverseClipPath({ areas: ['ground'], includeBorder: false, art, bookmark, effect })).toBe(OLD_REVERSE_PATH + HOLE);
  });
  it('keeps the hole on the merged border layer', () => {
    const p = reverseClipPath({ areas: ['border', 'ground'], includeBorder: true, art, bookmark, effect })!;
    expect(p.startsWith('M0 0H238V333H0Z')).toBe(true);
    expect(p.endsWith(HOLE)).toBe(true);
  });
  it('is the effect region alone without ground', () => {
    expect(reverseClipPath({ areas: ['effectBox'], includeBorder: false, art, bookmark, effect })).toBe('M19 217H220V306H19Z');
  });
  it('waits for measurements', () => {
    expect(reverseClipPath({ areas: ['effectBox'], includeBorder: false, art, bookmark, effect: [] })).toBeNull();
    expect(reverseClipPath({ areas: ['ground'], includeBorder: false, art: null, bookmark, effect })).toBeNull();
    expect(reverseClipPath({ areas: ['art', 'ground'], includeBorder: false, art: null, bookmark, effect })).toBe('M13 13H225V320H13Z' + HOLE);
  });

  it('equals the old reverse regions with all three on, plus the icon outside the reverse rect', () => {
    const old = shimmerRegions(['ground'], art, false, bookmark)!;
    expect(shimmerRegions(['effectBox', 'setIcon', 'ground'], art, false, bookmark, { effect, setIcon: icon })).toEqual([
      ...old,
      { left: 9, top: 9, width: 34, height: 4 },
      { left: 9, top: 13, width: 4, height: 30 },
    ]);
  });
  it('leaves the effect region out of ground', () => {
    const rs = shimmerRegions(['ground'], art, false, bookmark, { effect })!;
    expect(rs.some((r) => intersectRects(r, effect[0]))).toBe(false);
    const area = (xs: { width: number; height: number }[]) => xs.reduce((n, r) => n + r.width * r.height, 0);
    expect(area(rs)).toBe(area(shimmerRegions(['ground'], art, false, bookmark)!) - 201 * 89);
  });
  it('is the effect region alone, and the icon alone', () => {
    expect(shimmerRegions(['effectBox'], art, false, null, { effect })).toEqual(effect);
    expect(shimmerRegions(['setIcon'], art, false, null, { setIcon: icon })).toEqual([icon]);
  });
});
