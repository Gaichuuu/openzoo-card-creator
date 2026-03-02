import { describe, it, expect } from 'vitest';
import { expandVariables, isInlineImage, parseSegments, stripHtml } from '@/lib/textParserUtils';

describe('expandVariables', () => {
  it('replaces a single variable', () => {
    expect(expandVariables('{Star}hello', { Star: '★' })).toBe('★hello');
  });

  it('replaces multiple variables', () => {
    expect(expandVariables('{A} and {B}', { A: '1', B: '2' })).toBe('1 and 2');
  });

  it('replaces all occurrences of the same variable', () => {
    expect(expandVariables('{X}{X}', { X: 'a' })).toBe('aa');
  });

  it('leaves unmatched variables unchanged', () => {
    expect(expandVariables('{Unknown}', {})).toBe('{Unknown}');
  });

  it('returns text unchanged when no variables', () => {
    expect(expandVariables('plain text', {})).toBe('plain text');
  });
});

describe('isInlineImage', () => {
  it('returns true for .png', () => {
    expect(isInlineImage('icon.png')).toBe(true);
  });

  it('returns true for .jpg', () => {
    expect(isInlineImage('photo.jpg')).toBe(true);
  });

  it('returns true for .webp', () => {
    expect(isInlineImage('image.webp')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(isInlineImage('hello world')).toBe(false);
  });

  it('returns true for path with .png', () => {
    expect(isInlineImage('OpenZoo Aura/Water.png, 0.9, 0.1')).toBe(true);
  });
});

describe('parseSegments', () => {
  it('parses plain text', () => {
    expect(parseSegments('hello')).toEqual([
      { type: 'text', content: 'hello' },
    ]);
  });

  it('parses known inline class', () => {
    const result = parseSegments('{SC:text}');
    expect(result).toEqual([
      { type: 'class', className: 'SC', content: 'text' },
    ]);
  });

  it('parses inline image', () => {
    const result = parseSegments('{Water.png, 0.9, 0.1}');
    expect(result).toEqual([
      { type: 'image', content: 'Water.png, 0.9, 0.1' },
    ]);
  });

  it('parses mixed text and class', () => {
    const result = parseSegments('hello {B:bold} world');
    expect(result).toEqual([
      { type: 'text', content: 'hello ' },
      { type: 'class', className: 'B', content: 'bold' },
      { type: 'text', content: ' world' },
    ]);
  });

  it('handles unmatched opening brace', () => {
    const result = parseSegments('hello { world');
    expect(result).toEqual([
      { type: 'text', content: 'hello ' },
      { type: 'text', content: '{' },
      { type: 'text', content: ' world' },
    ]);
  });

  it('handles nested braces', () => {
    const result = parseSegments('{I:text with {B:bold}}');
    expect(result).toEqual([
      { type: 'class', className: 'I', content: 'text with {B:bold}' },
    ]);
  });

  it('treats unknown class name as text', () => {
    const result = parseSegments('{Unknown:content}');
    expect(result).toEqual([
      { type: 'text', content: '{Unknown:content}' },
    ]);
  });

  it('parses empty string', () => {
    expect(parseSegments('')).toEqual([]);
  });
});

describe('stripHtml', () => {
  it('converts <br/> to newline', () => {
    expect(stripHtml('line1<br/>line2')).toBe('line1\nline2');
  });

  it('converts <br> to newline', () => {
    expect(stripHtml('a<br>b')).toBe('a\nb');
  });

  it('converts </p><p> to newline', () => {
    expect(stripHtml('<p>first</p><p>second</p>')).toBe('first\nsecond');
  });

  it('strips other HTML tags', () => {
    expect(stripHtml('<span>text</span>')).toBe('text');
  });

  it('trims result', () => {
    expect(stripHtml('  hello  ')).toBe('hello');
  });

  it('handles combined HTML', () => {
    expect(stripHtml('<p><b>bold</b><br/>next</p>')).toBe('bold\nnext');
  });
});
