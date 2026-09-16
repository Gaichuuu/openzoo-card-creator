import { describe, it, expect } from 'vitest';
import { hasFourthWall, setFourthWall } from '@/lib/fourthWallText';

describe('hasFourthWall', () => {
  it('detects a leading star', () => {
    expect(hasFourthWall('{Star}**ARENA:** {I:text}')).toBe(true);
    expect(hasFourthWall('**ARENA:** text')).toBe(false);
  });
});

describe('setFourthWall', () => {
  it('stars and italicizes the body after the keyword', () => {
    expect(setFourthWall('**ARENA:** Draw a Page.', true, true)).toBe('{Star}**ARENA:** {I:Draw a Page.}');
  });

  it('removes the star without touching italics', () => {
    const starred = setFourthWall('**ARENA:** Draw a Page.', true, true);
    expect(starred).toBe('{Star}**ARENA:** {I:Draw a Page.}');
    expect(setFourthWall(starred, false, true)).toBe('**ARENA:** {I:Draw a Page.}');
  });

  it('never strips the italics Special Terra seeds', () => {
    const seeded = '{I:You may Fatigue this Terra Page at any time.}';
    const starred = setFourthWall(seeded, true, true);
    expect(starred).toBe(`{Star}${seeded}`);
    expect(setFourthWall(starred, false, true)).toBe(seeded);
  });

  it('keeps the author\'s leading whitespace', () => {
    expect(setFourthWall('\n  Draw a Page.', true, false)).toBe('\n  {Star}Draw a Page.');
    expect(setFourthWall('\n  {Star}Draw a Page.', false, false)).toBe('\n  Draw a Page.');
  });

  it('italicizes text without a keyword', () => {
    expect(setFourthWall('Draw a Page.', true, true)).toBe('{Star}{I:Draw a Page.}');
  });

  it('does not double-wrap text that is already italic', () => {
    expect(setFourthWall('{I:Draw a Page.}', true, true)).toBe('{Star}{I:Draw a Page.}');
  });

  it('only toggles the star when italicize is off', () => {
    expect(setFourthWall('{I:**ARENA:** Draw.}', true, false)).toBe('{Star}{I:**ARENA:** Draw.}');
    expect(setFourthWall('{Star}{I:**ARENA:** Draw.}', false, false)).toBe('{I:**ARENA:** Draw.}');
  });

  it('leaves partial italics alone when removing', () => {
    expect(setFourthWall('{Star}{I:One} two', false, true)).toBe('{I:One} two');
  });

  it('is a no-op when already in the requested state', () => {
    expect(setFourthWall('plain', false, true)).toBe('plain');
    expect(setFourthWall('{Star}{I:x}', true, true)).toBe('{Star}{I:x}');
  });
});
