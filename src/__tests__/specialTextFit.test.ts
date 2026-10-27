import { describe, it, expect } from 'vitest';
import { artWindowHeight, pickSpecialTextFont, specialTextPitch, SPECIAL_TEXT_MIN_FONT } from '@/lib/specialTextFit';

describe('specialTextPitch', () => {
  it('uses font + 1 on a half-pixel grid', () => {
    expect(specialTextPitch(8, 0)).toBe(9);
    expect(specialTextPitch(7.5, 1)).toBe(9);
    expect(specialTextPitch(8, -2)).toBe(8);
  });

  it('never drops below 4px', () => {
    expect(specialTextPitch(5, -6)).toBe(4);
  });
});

describe('pickSpecialTextFont', () => {
  it('keeps the base font when the text fits', () => {
    expect(pickSpecialTextFont(8, 0, () => true)).toBe(8);
  });

  it('steps down by half pixels until the text fits', () => {
    expect(pickSpecialTextFont(8, 0, (f) => f <= 7)).toBe(7);
  });

  it('stops at the minimum font', () => {
    expect(pickSpecialTextFont(8, 0, () => false)).toBe(SPECIAL_TEXT_MIN_FONT);
  });

  it('applies positive shrink after the auto pick', () => {
    expect(pickSpecialTextFont(8, 10, (f) => f <= 7.5)).toBe(6.5);
  });

  it('raises the start font with negative shrink', () => {
    expect(pickSpecialTextFont(8, -10, () => true)).toBe(9);
    expect(pickSpecialTextFont(8, -10, (f) => f <= 8.5)).toBe(8.5);
  });
});

describe('artWindowHeight', () => {
  it('keeps the base height when the text box has not grown', () => {
    expect(artWindowHeight(238, 0)).toBe(238);
  });

  it('shrinks by the growth so the art window ends where the grown box starts', () => {
    expect(artWindowHeight(238, 7)).toBe(231);
    expect(artWindowHeight(234, 18)).toBe(216);
  });

  it('ignores negative growth', () => {
    expect(artWindowHeight(238, -3)).toBe(238);
  });
});
