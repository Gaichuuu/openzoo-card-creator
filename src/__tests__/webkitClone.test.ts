import { describe, expect, it } from 'vitest';
import { fixWebKitClone, isWebKitClone } from '@/lib/webkitClone';

const WEBKIT_TEXT = '<span data-oz-text="" style="color: rgb(0, 0, 0); paint-order: stroke; stroke: none; stroke-color: rgba(0, 0, 0, 0); stroke-width: 1px; -webkit-text-stroke-color: rgb(0, 0, 0); -webkit-text-stroke-width: 0.07px">x</span>';
const WEBKIT_PILL = '<span data-oz-pill="" style="background: 0% 0% repeat rgb(155, 180, 216); box-shadow: rgba(0, 0, 0, 0.25) 0px 0.5px 1px 0px; filter: none; stroke-color: rgba(0, 0, 0, 0); border: 1px solid rgb(0, 0, 0)">';
const BLINK_PILL = '<span data-oz-pill="" style="box-shadow: rgba(0, 0, 0, 0.25) 0px 0.5px 1px 0px; filter: none; -webkit-text-stroke-color: rgb(0, 0, 0)">';

describe('isWebKitClone', () => {
  it('detects the WebKit-only stroke-color declaration', () => {
    expect(isWebKitClone(WEBKIT_TEXT)).toBe(true);
  });

  it('does not mistake -webkit-text-stroke-color for it', () => {
    expect(isWebKitClone(BLINK_PILL)).toBe(false);
  });
});

describe('fixWebKitClone', () => {
  it('drops stroke-color and keeps the -webkit-text-stroke longhands', () => {
    const out = fixWebKitClone(WEBKIT_TEXT);
    expect(out).not.toMatch(/(?<![a-z-])stroke-color:/);
    expect(out).toContain('-webkit-text-stroke-color: rgb(0, 0, 0)');
    expect(out).toContain('-webkit-text-stroke-width: 0.07px');
    expect(out).toContain('stroke-width: 1px');
  });

  it('drops the pill box-shadow without adding a filter', () => {
    const out = fixWebKitClone(WEBKIT_PILL);
    expect(out).toContain('box-shadow: none;');
    expect(out).toContain('filter: none');
    expect(out).toContain('border: 1px solid rgb(0, 0, 0)');
  });

  it('leaves a Blink or Gecko clone byte-identical', () => {
    expect(fixWebKitClone(BLINK_PILL)).toBe(BLINK_PILL);
  });

  it('leaves non-pill box-shadows alone', () => {
    const inset = '<div data-zone-key="SAura1" style="box-shadow: rgb(0, 0, 0) 0px 0px 0px 1px inset; filter: none; stroke-color: rgba(0, 0, 0, 0)">';
    expect(fixWebKitClone(inset)).toContain('box-shadow: rgb(0, 0, 0) 0px 0px 0px 1px inset');
  });
});
