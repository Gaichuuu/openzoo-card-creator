import { describe, it, expect } from 'vitest';
import {
  isSafeColor, gradientCss, sanitizeCustomStyle, availableStyleItems, cssGradientLine,
  customZoneStyle, resolveCustomStyle, customNameFill, customTextOutline, sanitizePopOutUrl, parseColor,
  contrastOutline, backgroundAreaStyle, resolveBackgroundTexture, BACKGROUND_INNER_SHADOW, DEFAULT_BACKGROUND_TEXTURE, CUSTOM_STYLE_ITEMS, STYLE_ITEM_ZONES, styleItemTargets, TEXT_KEYS, outlineItems, GRADIENT_MIN_STOPS, GRADIENT_MAX_STOPS,
  customPillVars, hasCustomStyle, STYLE_ITEM_INLINE_CLASS, GRADIENT_FIELDS,
} from '@/lib/customStyle';
import { INLINE_CLASSES, INLINE_CLASS_OUTLINES, PILL_VARS } from '@/data/inlineClasses';
import type { CustomStyle } from '@/types/card';
import type { Zone } from '@/types/layout';
import { LAYOUTS } from '@/data/layouts';
import { analyseShadowStack, entersBorderlessTextScope } from '@/lib/outlineUtils';

describe('isSafeColor', () => {
  it('accepts hex and rgb forms', () => {
    for (const c of ['#fff', '#ffff', '#a1b2c3', '#a1b2c3cc', 'rgb(1, 2, 3)', 'rgba(10,20,30,0.5)']) expect(isSafeColor(c)).toBe(true);
  });
  it('rejects injection and named/other forms', () => {
    for (const c of ['red;background:url(x)', 'url(x)', '#ggg', 'rgb(1,2)', '{color:red}', '', 'linear-gradient(red, blue)']) expect(isSafeColor(c)).toBe(false);
  });
});

describe('gradientCss', () => {
  it('spaces stops evenly', () => {
    expect(gradientCss({ angle: 90, stops: ['#f00', '#0f0', '#00f'] })).toBe('linear-gradient(90deg, #f00 0%, #0f0 50%, #00f 100%)');
  });
});

describe('gradient stop bounds', () => {
  it('sanitize accepts exactly GRADIENT_MIN_STOPS..GRADIENT_MAX_STOPS stops', () => {
    expect(GRADIENT_MIN_STOPS).toBe(2);
    expect(GRADIENT_MAX_STOPS).toBe(8);
    const g = (n: number) => ({ colors: {}, borderGradient: { angle: 0, stops: Array(n).fill('#ffffff') } });
    expect(sanitizeCustomStyle(g(GRADIENT_MIN_STOPS - 1))).toBeNull();
    expect(sanitizeCustomStyle(g(GRADIENT_MIN_STOPS))?.borderGradient?.stops).toHaveLength(GRADIENT_MIN_STOPS);
    expect(sanitizeCustomStyle(g(GRADIENT_MAX_STOPS))?.borderGradient?.stops).toHaveLength(GRADIENT_MAX_STOPS);
    expect(sanitizeCustomStyle(g(GRADIENT_MAX_STOPS + 1))).toBeNull();
  });
});

describe('sanitizeCustomStyle', () => {
  it('drops unsafe colors and unknown keys', () => {
    expect(sanitizeCustomStyle({ colors: { border: 'red;x', effectBox: '#123456', bogus: '#fff' } }))
      .toEqual({ colors: { effectBox: '#123456' } });
  });
  it('makes translucent gradient stops opaque and leaves opaque ones as written', () => {
    const g = sanitizeCustomStyle({ colors: {}, pillGradient: { angle: 90, stops: ['rgba(30, 58, 138, 0.5)', '#ff000080', '#fff', 'rgb(1, 2, 3)'] } });
    expect(g?.pillGradient?.stops).toEqual(['#1e3a8a', '#ff0000', '#fff', 'rgb(1, 2, 3)']);
  });

  it('drops gradients outside 2..8 stops or with a bad stop', () => {
    expect(sanitizeCustomStyle({ colors: {}, borderGradient: { angle: 0, stops: ['#fff'] } })).toBeNull();
    expect(sanitizeCustomStyle({ colors: {}, borderGradient: { angle: 0, stops: Array(9).fill('#fff') } })).toBeNull();
    expect(sanitizeCustomStyle({ colors: {}, nameGradient: { angle: 0, stops: ['#fff', 'url(x)'] } })).toBeNull();
  });
  it('wraps the angle into 0..359', () => {
    expect(sanitizeCustomStyle({ colors: {}, borderGradient: { angle: 450.4, stops: ['#fff', '#000'] } })?.borderGradient?.angle).toBe(90);
    expect(sanitizeCustomStyle({ colors: {}, borderGradient: { angle: -90, stops: ['#fff', '#000'] } })?.borderGradient?.angle).toBe(270);
  });
  it('drops stray cardNameOutline and damage colors as unknown keys', () => {
    expect(sanitizeCustomStyle({ colors: { cardNameOutline: '#fff', damage: '#123456', cardName: '#000' } }))
      .toEqual({ colors: { cardName: '#000' } });
    expect(sanitizeCustomStyle({ colors: { damage: '#123456' } })).toBeNull();
  });
  it('validates the outlines map and drops unknown or unsafe entries', () => {
    expect(sanitizeCustomStyle({ colors: {}, outlines: { cardName: '#ffffff', typeLine: 'red;x', border: '#000', bogus: '#000' } }))
      .toEqual({ colors: {}, outlines: { cardName: '#ffffff' } });
    expect(sanitizeCustomStyle({ colors: { effectBox: '#123' }, outlines: { typeLine: 'url(x)' } }))
      .toEqual({ colors: { effectBox: '#123' } });
    expect(sanitizeCustomStyle({ colors: {}, outlines: 'x' })).toBeNull();
  });
  it('returns null for garbage', () => {
    expect(sanitizeCustomStyle(null)).toBeNull();
    expect(sanitizeCustomStyle('x')).toBeNull();
    expect(sanitizeCustomStyle({ colors: {} })).toBeNull();
  });
});

describe('availableStyleItems', () => {
  it('Basic with attack+main exposes divider, attack and boost items', () => {
    const items = availableStyleItems('BasicAttackMain');
    for (const k of ['divider', 'attackName', 'boostBar', 'bottomBar', 'backgroundTint']) expect(items).toContain(k);
    expect(items).not.toContain('damage');
    expect(items).not.toContain('titleArea');
  });
  it('BasicNoAttack has no attack items', () => {
    const items = availableStyleItems('BasicNoAttack');
    for (const k of ['divider', 'attackName']) expect(items).not.toContain(k);
  });
  it('Terra has no art frame, boost or bottom bar', () => {
    const items = availableStyleItems('Terra');
    for (const k of ['artFrame', 'boostBar', 'bottomBar']) expect(items).not.toContain(k);
    for (const k of ['border', 'cardName', 'effectBox', 'effectText', 'credits']) expect(items).toContain(k);
  });
  it('Terra hides Background, whose zone sits on top of the full-card art', () => {
    expect(availableStyleItems('Terra')).not.toContain('backgroundTint');
    for (const lt of ['BasicNoAttack', 'BasicOnlyAttack', 'BasicAttackMain', 'Aura'] as const) {
      expect(availableStyleItems(lt)).toContain('backgroundTint');
    }
  });
});

describe('cssGradientLine', () => {
  it('90deg runs left to right through the middle', () => {
    expect(cssGradientLine(90, 238, 333)).toEqual({ x0: 0, y0: 166.5, x1: 238, y1: 166.5 });
  });
  it('0deg runs bottom to top', () => {
    expect(cssGradientLine(0, 238, 333)).toEqual({ x0: 119, y0: 333, x1: 119, y1: 0 });
  });
  it('45deg on a square runs corner to corner', () => {
    const l = cssGradientLine(45, 100, 100);
    expect(l.x0).toBeCloseTo(0); expect(l.y0).toBeCloseTo(100);
    expect(l.x1).toBeCloseTo(100); expect(l.y1).toBeCloseTo(0);
  });
});

const cs = (colors: CustomStyle['colors'], extra: Partial<CustomStyle> = {}): CustomStyle => ({ colors, ...extra });

describe('customZoneStyle', () => {
  it('returns null for untargeted zones', () => {
    expect(customZoneStyle('Banner', 'image', cs({ border: '#000' }), {})).toBeNull();
  });
  it('solid border sets outline and background', () => {
    expect(customZoneStyle('CardBorder', 'image', cs({ border: '#00ff00' }), {}))
      .toEqual({ outlineColor: '#00ff00', backgroundColor: '#00ff00', backgroundImage: 'none' });
  });
  it('border gradient wins over solid', () => {
    const r = customZoneStyle('CardBorder', 'image', cs({ border: '#000' }, { borderGradient: { angle: 90, stops: ['#f00', '#00f'] } }), {});
    expect(r).toEqual({ outlineStyle: 'none', backgroundImage: 'linear-gradient(90deg, #f00 0%, #00f 100%)', backgroundColor: 'transparent' });
  });
  it('MainTextBox container gets the box color, MainTextBox text gets the text color', () => {
    const s = cs({ effectBox: '#123', effectText: '#fff' });
    expect(customZoneStyle('MainTextBox', 'container', s, {})).toEqual({ backgroundImage: 'none', backgroundColor: '#123' });
    expect(customZoneStyle('MainTextBox', 'text', s, {})).toEqual({ color: '#fff' });
  });
  it('Aura text box gets both box and text color', () => {
    expect(customZoneStyle('Aura/Terra Text Box', 'text', cs({ effectBox: '#123', effectText: '#fff' }), {}))
      .toEqual({ backgroundImage: 'none', backgroundColor: '#123', color: '#fff' });
  });
  it('background without a resolved area stays a flat color with opacity 1', () => {
    expect(customZoneStyle('BackgroundColor', 'text', cs({ backgroundTint: 'rgba(1,2,3,0.5)' }), { opacity: 0.65 }))
      .toEqual({ backgroundImage: 'none', backgroundColor: 'rgba(1,2,3,0.5)', opacity: 1 });
    expect(customZoneStyle('BackgroundColor', 'text', cs({ backgroundTint: '#123' }), {}, null))
      .toEqual({ backgroundImage: 'none', backgroundColor: '#123', opacity: 1 });
  });
  it('routes the Background item through backgroundAreaStyle', () => {
    expect(customZoneStyle('BackgroundColor', 'text', cs({ backgroundTint: '#243321' }), { opacity: 0.65 }, { texture: '/assets/BlankBackground.png' }))
      .toEqual(backgroundAreaStyle('#243321', '/assets/BlankBackground.png'));
    expect(customZoneStyle('CardBackground', 'image', cs({ backgroundTint: '#243321' }), {}, { texture: '/x.png' })).toBeNull();
  });
  it('does not reveal a hidden divider', () => {
    const s = cs({ divider: '#00f' });
    expect(customZoneStyle('AttackDivider', 'text', s, { backgroundImage: 'none' })).toBeNull();
    expect(customZoneStyle('AttackDivider', 'text', s, { display: 'none', backgroundImage: 'linear-gradient(red, red)' })).toBeNull();
    expect(customZoneStyle('AttackDivider', 'text', s, { backgroundImage: 'linear-gradient(90deg, red, red)' }))
      .toEqual({ backgroundImage: 'linear-gradient(90deg, transparent 0%, #00f 45%, #00f 60%, transparent 100%)' });
  });
  it('bottom bar text covers flavor and strong against', () => {
    const s = cs({ bottomBarText: '#fff' });
    expect(customZoneStyle('FlavorText', 'text', s, {})).toEqual({ color: '#fff' });
    expect(customZoneStyle('StrongAgainst', 'text', s, {})).toEqual({ color: '#fff' });
  });
  it('never styles the damage number', () => {
    const s = { colors: { attackName: '#fff', effectText: '#fff', damage: '#123456' } } as unknown as CustomStyle;
    expect(customZoneStyle('ATKDMG', 'text', s, {})).toBeNull();
    expect(customZoneStyle('ATKDMG 1', 'text', s, {})).toBeNull();
  });
  it('name color is skipped when a name gradient exists', () => {
    expect(customZoneStyle('CardName', 'text', cs({ cardName: '#fff' }, { nameGradient: { angle: 90, stops: ['#f00', '#00f'] } }), {})).toBeNull();
  });
});

describe('removed art box outline', () => {
  it('is not an item and is dropped by sanitize', () => {
    expect(CUSTOM_STYLE_ITEMS.some((i) => (i.key as string) === 'artOutline')).toBe(false);
    expect(sanitizeCustomStyle({ colors: { artOutline: '#000000' } })).toBeNull();
    expect(customZoneStyle('CardArt', 'image', cs({ artFrame: '#123456' }), {})).toBeNull();
  });
});

describe('resolveCustomStyle', () => {
  it('is null when nothing is set', () => {
    expect(resolveCustomStyle(null, 'Aura', false)).toBeNull();
  });
  it('resolves the background area on layouts with a CardBackground, not on Terra', () => {
    const s = cs({ backgroundTint: '#c8a2e8' });
    expect(resolveCustomStyle(s, 'BasicNoAttack', false, '/assets/BlankBackground.png')?.background)
      .toEqual({ texture: '/assets/BlankBackground.png' });
    expect(resolveCustomStyle(s, 'Aura', false, null)?.background).toEqual({ texture: null });
    expect(resolveCustomStyle(cs({ effectBox: '#123456' }), 'Terra', false, '/assets/BlankBackground.png')?.background).toBeNull();
  });
  it('ignores a stored Background on Terra so it cannot paint over the art', () => {
    expect(resolveCustomStyle(cs({ backgroundTint: '#c8a2e8' }), 'Terra', false)).toBeNull();
    const s = cs({ backgroundTint: '#c8a2e8', effectBox: '#111111' });
    const r = resolveCustomStyle(s, 'Terra', false);
    expect(r?.style.colors).toEqual({ effectBox: '#111111' });
    expect(customZoneStyle('BackgroundColor', 'text', r!.style, {}, r!.background)).toBeNull();
    expect(s.colors.backgroundTint).toBe('#c8a2e8');
    expect(resolveCustomStyle(s, 'Aura', false)?.style.colors.backgroundTint).toBe('#c8a2e8');
  });
  it('has no title fill any more', () => {
    expect(resolveCustomStyle(cs({ effectBox: '#123456' }), 'Aura', false)).not.toHaveProperty('titleFill');
  });
  it('drops the border on borderless cards so it cannot cover the print art', () => {
    const g = { angle: 135, stops: ['#f00', '#00f'] };
    const s = cs({ border: '#00ff00', effectBox: '#111111' }, { borderGradient: g });
    const r = resolveCustomStyle(s, 'BasicNoAttack', true);
    expect(r?.style.colors).toEqual({ effectBox: '#111111' });
    expect(r?.style.borderGradient).toBeUndefined();
    expect(customZoneStyle('CardBorder', 'container', r!.style, {})).toBeNull();
    expect(resolveCustomStyle(cs({}, { borderGradient: g }), 'BasicNoAttack', true)).toBeNull();
    expect(resolveCustomStyle(s, 'BasicNoAttack', false)?.style).toBe(s);
  });
});

describe('background area', () => {
  const rectOf = (z: Zone) => ['top', 'left', 'width', 'height'].map(k => z.style[k as keyof typeof z.style]);
  const findZone = (z: Zone, key: string): Zone | null => {
    if ((z.imageDataKey || z.textDataKey) === key) return z;
    for (const c of z.childZones) { const f = findZone(c, key); if (f) return f; }
    return null;
  };
  it('BackgroundColor and CardBackground share one rect in every layout with a CardBackground', () => {
    let checked = 0;
    for (const [name, layout] of Object.entries(LAYOUTS)) {
      const bg = findZone(layout.rootZone, 'CardBackground');
      if (!bg) { expect(name).toBe('Terra'); continue; }
      const tint = findZone(layout.rootZone, 'BackgroundColor');
      expect(tint, name).not.toBeNull();
      expect(rectOf(tint!), name).toEqual(rectOf(bg));
      expect(rectOf(bg), name).toEqual(['13px', '13px', '212px', '307px']);
      checked++;
    }
    expect(checked).toBe(4);
  });
  it('multiplies the color over a custom pattern with the inner shadow', () => {
    expect(backgroundAreaStyle('#243321', 'data:image/png;base64,AAAA')).toEqual({
      backgroundImage: "linear-gradient(#243321, #243321), url('data:image/png;base64,AAAA')",
      backgroundBlendMode: 'multiply',
      backgroundColor: 'transparent',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: 1,
      boxShadow: BACKGROUND_INNER_SHADOW,
    });
  });
  it('adds no shadow on the default paper texture, whose bevel is baked in', () => {
    expect(resolveBackgroundTexture('BasicNoAttack', {})).toBe(DEFAULT_BACKGROUND_TEXTURE);
    const r = backgroundAreaStyle('#243321', DEFAULT_BACKGROUND_TEXTURE);
    expect(r).not.toHaveProperty('boxShadow');
    expect(r.backgroundImage).toBe("linear-gradient(#243321, #243321), url('/assets/BlankBackground.png')");
    expect(r.backgroundBlendMode).toBe('multiply');
  });
  it('reads a CardBackground default from the zone id, in every textured layout', () => {
    for (const lt of ['BasicNoAttack', 'BasicOnlyAttack', 'BasicAttackMain', 'Aura'] as const) {
      expect(resolveBackgroundTexture(lt, {})).toBe(DEFAULT_BACKGROUND_TEXTURE);
      expect(resolveBackgroundTexture(lt, { i3: 'data:image/png;base64,BBBB' })).toBe('data:image/png;base64,BBBB');
    }
  });
  it('falls back to a flat color with the inner shadow when no texture resolves', () => {
    expect(backgroundAreaStyle('#243321', null)).toEqual({
      backgroundImage: 'none', backgroundColor: '#243321', opacity: 1, boxShadow: BACKGROUND_INNER_SHADOW,
    });
  });
  it('the inner shadow is inset only', () => {
    for (const layer of BACKGROUND_INNER_SHADOW.split(/,(?![^(]*\))/)) expect(layer.trim().startsWith('inset ')).toBe(true);
  });
  it('resolves the CardBackground texture: custom pattern, then layout default, none on Terra', () => {
    expect(resolveBackgroundTexture('BasicNoAttack', {})).toBe('/assets/BlankBackground.png');
    expect(resolveBackgroundTexture('Aura', { i3: 'data:image/png;base64,AAAA' })).toBe('data:image/png;base64,AAAA');
    expect(resolveBackgroundTexture('Terra', {})).toBeNull();
  });
});

describe('sanitize drops the removed title area', () => {
  it('drops a stray colors.titleArea', () => {
    expect(sanitizeCustomStyle({ colors: { titleArea: '#123456', backgroundTint: '#243321' } }))
      .toEqual({ colors: { backgroundTint: '#243321' } });
    expect(sanitizeCustomStyle({ colors: { titleArea: '#123456' } })).toBeNull();
  });
});

describe('contrastOutline', () => {
  it('uses perceived brightness of gamma-encoded sRGB', () => {
    for (const c of ['rgb(230, 165, 10)', '#eccb0d', '#ffffff']) expect(contrastOutline(c)).toBe('#000000');
    for (const c of ['#ff0000', '#743ecb', '#000000']) expect(contrastOutline(c)).toBe('#ffffff');
  });
});

describe('customTextOutline', () => {
  it('is null for an unstyled item', () => {
    expect(customTextOutline('CardName', 'text', cs({ border: '#000' }))).toBeNull();
    expect(customTextOutline('Boost 1', 'text', cs({ boostBar: '#000000' }))).toBeNull();
  });
  it('an explicit outline wins over the auto contrast', () => {
    expect(customTextOutline('TypesTribes', 'text', cs({ typeLine: '#f8d232' }, { outlines: { typeLine: '#ffffff' } }))).toBe('#ffffff');
    expect(customTextOutline('CardName', 'text', cs({}, { outlines: { cardName: '#1e90ff' } }))).toBe('#1e90ff');
  });
  it('auto contrasts with the fill', () => {
    expect(customTextOutline('SpellbookLimit', 'text', cs({ spellbookText: '#f8d232' }))).toBe('#000000');
    expect(customTextOutline('Boost 2', 'text', cs({ boostText: '#000000' }))).toBe('#ffffff');
    expect(customTextOutline('Copyright', 'text', cs({ credits: '#ffffff' }))).toBe('#000000');
  });
  it('uses the mean luminance of a name gradient', () => {
    expect(customTextOutline('CardName', 'text', cs({}, { nameGradient: { angle: 90, stops: ['#ffffff', '#ffff00'] } }))).toBe('#000000');
    expect(customTextOutline('CardName', 'text', cs({ cardName: '#ffffff' }, { nameGradient: { angle: 90, stops: ['#000000', '#000080'] } }))).toBe('#ffffff');
  });
  it('splits MainTextBox text from its container', () => {
    const s = cs({ effectText: '#000000' });
    expect(customTextOutline('MainTextBox', 'text', s)).toBe('#ffffff');
    expect(customTextOutline('MainTextBox', 'container', s)).toBeNull();
  });
  it('never targets the damage number', () => {
    expect(customTextOutline('ATKDMG', 'text', cs({ attackName: '#000000', effectText: '#000000' }))).toBeNull();
  });
});

describe('outline flags', () => {
  it('match the text items whose zones can carry an outline in the layout data', () => {
    const derived = new Set<string>();
    for (const layout of Object.values(LAYOUTS)) {
      const walk = (z: Zone, scoped: boolean) => {
        const inScope = scoped || entersBorderlessTextScope(z);
        const key = z.imageDataKey || z.textDataKey;
        const stroked = !!analyseShadowStack(z.style.textShadow as string | undefined)
          || (inScope && (z.type === 'text' || !!z.textDataKey));
        if (key && stroked) {
          for (const item of CUSTOM_STYLE_ITEMS) {
            if (item.group === 'text' && styleItemTargets(item.key, key, z.type)) derived.add(item.key);
          }
        }
        z.childZones.forEach(c => walk(c, inScope));
      };
      walk(layout.rootZone, false);
    }
    for (const item of CUSTOM_STYLE_ITEMS) {
      const cls = STYLE_ITEM_INLINE_CLASS[item.key];
      if (item.group === 'text' && cls && INLINE_CLASS_OUTLINES[cls]) derived.add(item.key);
    }
    const flagged = new Set(CUSTOM_STYLE_ITEMS.filter(i => i.outline).map(i => i.key));
    expect(flagged).toEqual(derived);
    expect(flagged.has('pillText')).toBe(true);
    expect(flagged.has('cardName')).toBe(true);
    expect(flagged.has('boostText')).toBe(true);
  });
  it('outlineItems shows effect text and attack name outlines on Basic layouts only when borderless', () => {
    const bordered = outlineItems('BasicAttackMain', false);
    expect(bordered.has('effectText')).toBe(false);
    expect(bordered.has('attackName')).toBe(false);
    for (const k of ['cardName', 'typeLine', 'spellbookText', 'boostText', 'credits'] as const) expect(bordered.has(k)).toBe(true);
    const borderless = outlineItems('BasicAttackMain', true);
    expect(borderless.has('effectText')).toBe(true);
    expect(borderless.has('attackName')).toBe(true);
  });
  it('outlineItems keeps the effect text outline on bordered Aura and Terra cards', () => {
    expect(outlineItems('Aura', false).has('effectText')).toBe(true);
    expect(outlineItems('Terra', false).has('effectText')).toBe(true);
  });
  it('every outlineItems result is a flagged item', () => {
    const flagged = new Set(CUSTOM_STYLE_ITEMS.filter(i => i.outline).map(i => i.key));
    for (const l of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) {
      for (const b of [false, true]) for (const k of outlineItems(l, b)) expect(flagged.has(k)).toBe(true);
    }
  });
  it('TEXT_KEYS matches the text items, so sanitize cannot drop a new one', () => {
    expect([...TEXT_KEYS].sort()).toEqual(CUSTOM_STYLE_ITEMS.filter(i => i.group === 'text').map(i => i.key).sort());
  });
  it('has no damage item', () => {
    expect(CUSTOM_STYLE_ITEMS.map(i => i.key)).not.toContain('damage');
    expect(Object.keys(STYLE_ITEM_ZONES)).not.toContain('damage');
  });
});

describe('customNameFill', () => {
  it('only targets CardName', () => {
    const s = cs({}, { nameGradient: { angle: 90, stops: ['#f00', '#00f'] } });
    expect(customNameFill('CardName', s)?.backgroundImage).toBe('linear-gradient(90deg, #f00 0%, #00f 100%)');
    expect(customNameFill('Artist', s)).toBeNull();
  });
});

describe('sanitizePopOutUrl', () => {
  it('accepts data:image and https', () => {
    expect(sanitizePopOutUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    expect(sanitizePopOutUrl('https://x/y.png')).toBe('https://x/y.png');
  });
  it('rejects http, javascript and non-strings', () => {
    expect(sanitizePopOutUrl('http://x/y.png')).toBeNull();
    expect(sanitizePopOutUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizePopOutUrl(5)).toBeNull();
    expect(sanitizePopOutUrl(null)).toBeNull();
  });
  it('rejects quotes, parens, backslashes and whitespace', () => {
    expect(sanitizePopOutUrl("https://x/a')b.png")).toBeNull();
    expect(sanitizePopOutUrl('https://x/a b.png')).toBeNull();
    expect(sanitizePopOutUrl('https://x/a"b.png')).toBeNull();
    expect(sanitizePopOutUrl('https://x/a(b.png')).toBeNull();
    expect(sanitizePopOutUrl('https://x/a\\b.png')).toBeNull();
    expect(sanitizePopOutUrl('https://x/a\nb.png')).toBeNull();
  });
  it('rejects svg data URLs', () => {
    expect(sanitizePopOutUrl('data:image/svg+xml;base64,AAAA')).toBeNull();
    expect(sanitizePopOutUrl('DATA:IMAGE/SVG+xml,AAAA')).toBeNull();
  });
  it('keeps a Firebase download URL unchanged', () => {
    const u = 'https://firebasestorage.googleapis.com/v0/b/openzoo.firebasestorage.app/o/cards%2Fabc%2Fpopout-1.png?alt=media&token=1a2b';
    expect(sanitizePopOutUrl(u)).toBe(u);
  });
});

describe('parseColor', () => {
  it('reads rgba() into hex + alpha', () => {
    expect(parseColor('rgba(255, 128, 0, 0.5)')).toEqual({ hex: '#ff8000', alpha: 0.5 });
    expect(parseColor('rgba(10,20,30,1)')).toEqual({ hex: '#0a141e', alpha: 1 });
  });
  it('reads rgb() and hex forms as opaque', () => {
    expect(parseColor('rgb(1, 2, 3)')).toEqual({ hex: '#010203', alpha: 1 });
    expect(parseColor('#A1B2C3')).toEqual({ hex: '#a1b2c3', alpha: 1 });
    expect(parseColor('#fa0')).toEqual({ hex: '#ffaa00', alpha: 1 });
  });
  it('reads alpha from 4 and 8 digit hex', () => {
    expect(parseColor('#ff000080')).toEqual({ hex: '#ff0000', alpha: 0.5 });
    expect(parseColor('#f008')).toEqual({ hex: '#ff0000', alpha: 0.53 });
  });
  it('clamps channels and alpha', () => {
    expect(parseColor('rgba(300, 0, 0, 2)')).toEqual({ hex: '#ff0000', alpha: 1 });
  });
  it('returns null for anything unsafe or unknown', () => {
    for (const c of ['', 'red', 'url(x)', 'rgb(1,2)', '#ggg', 'linear-gradient(red, blue)']) expect(parseColor(c)).toBeNull();
  });
});

describe('spellbook bar', () => {
  it('sits right after the Border item, as an alpha box item', () => {
    const keys = CUSTOM_STYLE_ITEMS.map(i => i.key);
    expect(keys.indexOf('spellbookBar')).toBe(keys.indexOf('border') + 1);
    const item = CUSTOM_STYLE_ITEMS.find(i => i.key === 'spellbookBar')!;
    expect(item).toMatchObject({ label: 'Spellbook bar', group: 'box', alpha: true });
  });
  it('is available on every layout', () => {
    for (const lt of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) expect(availableStyleItems(lt)).toContain('spellbookBar');
  });
  it('hugs the spellbook text with a filled bar', () => {
    expect(customZoneStyle('SpellbookLimit', 'text', cs({ spellbookBar: 'rgba(1, 2, 3, 0.5)' }), {}))
      .toEqual({ backgroundImage: 'none', backgroundColor: 'rgba(1, 2, 3, 0.5)', width: 'fit-content', paddingRight: '3px' });
  });
  it('combines with the spellbook text color', () => {
    expect(customZoneStyle('SpellbookLimit', 'text', cs({ spellbookBar: '#123456', spellbookText: '#ffffff' }), {}))
      .toEqual({ backgroundImage: 'none', backgroundColor: '#123456', width: 'fit-content', paddingRight: '3px', color: '#ffffff' });
  });
  it('touches no other zone', () => {
    for (const k of ['TypesTribes', 'CardName', 'TNL', 'CardTop']) expect(customZoneStyle(k, 'text', cs({ spellbookBar: '#123456' }), {})).toBeNull();
  });
  it('has no outline and is not a text key', () => {
    expect(TEXT_KEYS).not.toContain('spellbookBar');
    expect(customTextOutline('SpellbookLimit', 'text', cs({ spellbookBar: '#ffffff' }))).toBeNull();
  });
});

describe('power pill items', () => {
  const pill = (k: string) => CUSTOM_STYLE_ITEMS.find(i => i.key === k)!;
  it('are declared with the right groups and flags', () => {
    expect(pill('pillFill')).toMatchObject({ label: 'Power pill fill', group: 'box', gradient: true, alpha: true });
    expect(pill('pillBorder')).toMatchObject({ label: 'Power pill border', group: 'box' });
    expect(pill('pillBorder').alpha).toBeUndefined();
    expect(pill('pillText')).toMatchObject({ label: 'Power pill text', group: 'text', outline: true });
    expect(TEXT_KEYS).toContain('pillText');
    expect(GRADIENT_FIELDS.pillFill).toBe('pillGradient');
  });
  it('are available on every layout', () => {
    for (const lt of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) {
      for (const k of ['pillFill', 'pillBorder', 'pillText']) expect(availableStyleItems(lt)).toContain(k);
    }
  });
  it('the pill text outline row shows on every layout, bordered or not', () => {
    for (const lt of Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[]) {
      for (const b of [false, true]) expect(outlineItems(lt, b).has('pillText')).toBe(true);
    }
  });
  it('never style a zone', () => {
    const s = cs({ pillFill: '#222222', pillBorder: '#ffffff', pillText: '#eccb0d' }, { pillGradient: { angle: 90, stops: ['#f00', '#00f'] } });
    for (const k of ['MainTextBox', 'MainText', 'AttackEffect', 'Aura/Terra Text Box', 'Aura/Terra Text Box 1', 'CardBorder']) {
      for (const t of ['text', 'container', 'image'] as const) {
        expect(customZoneStyle(k, t, s, {})).toBeNull();
        expect(customTextOutline(k, t, s)).toBeNull();
      }
    }
  });
  it('sanitize keeps a valid pill gradient and drops a bad one', () => {
    const g = { angle: 450, stops: ['#222222', '#eccb0d'] };
    expect(sanitizeCustomStyle({ colors: {}, pillGradient: g })).toEqual({ colors: {}, pillGradient: { angle: 90, stops: ['#222222', '#eccb0d'] } });
    expect(sanitizeCustomStyle({ colors: {}, pillGradient: { angle: 0, stops: ['#fff', 'url(x)'] } })).toBeNull();
    expect(sanitizeCustomStyle({ colors: { pillFill: 'red;x', pillBorder: '#000000' } })).toEqual({ colors: { pillBorder: '#000000' } });
    expect(hasCustomStyle({ colors: {}, pillGradient: g })).toBe(true);
  });
});

describe('customPillVars', () => {
  it('is null when no pill item is set', () => {
    expect(customPillVars(null)).toBeNull();
    expect(customPillVars(cs({ effectBox: '#123456', effectText: '#ffffff' }))).toBeNull();
  });
  it('publishes only the properties that are set', () => {
    expect(customPillVars(cs({ pillFill: 'rgba(34, 34, 34, 0.5)' }))).toEqual({ [PILL_VARS.fill]: 'rgba(34, 34, 34, 0.5)' });
    expect(customPillVars(cs({ pillBorder: '#ffffff' }))).toEqual({ [PILL_VARS.border]: '#ffffff' });
  });
  it('a gradient fill wins over the solid one', () => {
    expect(customPillVars(cs({ pillFill: '#222222' }, { pillGradient: { angle: 90, stops: ['#f00', '#00f'] } }))).toEqual({
      [PILL_VARS.fill]: 'transparent',
      [PILL_VARS.fillImage]: 'linear-gradient(90deg, #f00 0%, #00f 100%)',
    });
  });
  it('text gets an auto contrast outline unless one is set', () => {
    expect(customPillVars(cs({ pillText: '#eccb0d' }))).toEqual({ [PILL_VARS.text]: '#eccb0d', [PILL_VARS.outline]: '#000000' });
    expect(customPillVars(cs({ pillText: '#222222' }))).toEqual({ [PILL_VARS.text]: '#222222', [PILL_VARS.outline]: '#ffffff' });
    expect(customPillVars(cs({ pillText: '#222222' }, { outlines: { pillText: '#ff0000' } })))
      .toEqual({ [PILL_VARS.text]: '#222222', [PILL_VARS.outline]: '#ff0000' });
    expect(customPillVars(cs({}, { outlines: { pillText: '#ff0000' } }))).toEqual({ [PILL_VARS.outline]: '#ff0000' });
  });
  it('the default pill colors agree with the auto outline rule', () => {
    expect(contrastOutline('rgba(255, 255, 255, 1)')).toBe('#000000');
  });
});

describe('Power pill var() fallbacks', () => {
  it('each pill variable falls back to the pre-change literal', () => {
    const power = INLINE_CLASSES.Power;
    expect(power.borderColor).toBe(`var(${PILL_VARS.border}, rgba(0, 0, 0, 1))`);
    expect(power.backgroundColor).toBe(`var(${PILL_VARS.fill}, rgba(155, 180, 216, 1))`);
    expect(power.backgroundImage).toBe(`var(${PILL_VARS.fillImage}, none)`);
    expect(power.color).toBe(`var(${PILL_VARS.text}, rgba(255, 255, 255, 1))`);
    expect(INLINE_CLASS_OUTLINES.Power.WebkitTextStrokeColor).toBe(`var(${PILL_VARS.outline}, rgba(0, 0, 0, 1))`);
  });
  it('every pill variable is read by the Power class', () => {
    const css = JSON.stringify(INLINE_CLASSES.Power) + JSON.stringify(INLINE_CLASS_OUTLINES.Power);
    for (const v of Object.values(PILL_VARS)) expect(css).toContain(`var(${v},`);
  });
});
