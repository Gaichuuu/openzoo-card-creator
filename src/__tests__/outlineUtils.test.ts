import { describe, it, expect } from 'vitest';
import { analyseShadowStack, applyStrokeOutline, stripInvisibleOutlines } from '@/lib/outlineUtils';
import type { CSSProperties } from 'react';

function circularStack(radius: number, color: string, count: number): string {
  const stops: string[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    const x = (radius * Math.cos(angle)).toFixed(3);
    const y = (radius * Math.sin(angle)).toFixed(3);
    stops.push(`${x}em ${y}em 0em ${color}`);
  }
  return stops.join(', ');
}

const WHITE_32 = circularStack(0.1, 'rgba(255, 255, 255, 1)', 32);
const BLACK_16 = circularStack(0.15, 'rgba(0, 0, 0, 1)', 16);

describe('analyseShadowStack', () => {
  it('derives radius and colour from a 32-point white stack', () => {
    const info = analyseShadowStack(WHITE_32);
    expect(info).not.toBeNull();
    expect(info!.radius).toBeCloseTo(0.1, 2);
    expect(info!.color).toBe('rgba(255, 255, 255, 1)');
  });

  it('derives radius and colour from a 16-point black stack', () => {
    const info = analyseShadowStack(BLACK_16);
    expect(info).not.toBeNull();
    expect(info!.radius).toBeCloseTo(0.15, 2);
    expect(info!.color).toBe('rgba(0, 0, 0, 1)');
  });

  it('handles the real Dextrous 32-point stack format', () => {
    const real = '0.1em 0em 0em rgba(0, 0, 0, 1), 0.098em 0.02em 0em rgba(0, 0, 0, 1), '
      + '0.092em 0.038em 0em rgba(0, 0, 0, 1), 0.083em 0.056em 0em rgba(0, 0, 0, 1), '
      + '0.071em 0.071em 0em rgba(0, 0, 0, 1), 0.056em 0.083em 0em rgba(0, 0, 0, 1), '
      + '0.038em 0.092em 0em rgba(0, 0, 0, 1), 0.02em 0.098em 0em rgba(0, 0, 0, 1), '
      + '0em 0.1em 0em rgba(0, 0, 0, 1), -0.02em 0.098em 0em rgba(0, 0, 0, 1), '
      + '-0.038em 0.092em 0em rgba(0, 0, 0, 1), -0.056em 0.083em 0em rgba(0, 0, 0, 1), '
      + '-0.071em 0.071em 0em rgba(0, 0, 0, 1), -0.083em 0.056em 0em rgba(0, 0, 0, 1), '
      + '-0.092em 0.038em 0em rgba(0, 0, 0, 1), -0.098em 0.02em 0em rgba(0, 0, 0, 1), '
      + '-0.1em 0em 0em rgba(0, 0, 0, 1), -0.098em -0.02em 0em rgba(0, 0, 0, 1), '
      + '-0.092em -0.038em 0em rgba(0, 0, 0, 1), -0.083em -0.056em 0em rgba(0, 0, 0, 1), '
      + '-0.071em -0.071em 0em rgba(0, 0, 0, 1), -0.056em -0.083em 0em rgba(0, 0, 0, 1), '
      + '-0.038em -0.092em 0em rgba(0, 0, 0, 1), -0.02em -0.098em 0em rgba(0, 0, 0, 1), '
      + '0em -0.1em 0em rgba(0, 0, 0, 1), 0.02em -0.098em 0em rgba(0, 0, 0, 1), '
      + '0.038em -0.092em 0em rgba(0, 0, 0, 1), 0.056em -0.083em 0em rgba(0, 0, 0, 1), '
      + '0.071em -0.071em 0em rgba(0, 0, 0, 1), 0.083em -0.056em 0em rgba(0, 0, 0, 1), '
      + '0.092em -0.038em 0em rgba(0, 0, 0, 1), 0.098em -0.02em 0em rgba(0, 0, 0, 1)';
    const info = analyseShadowStack(real);
    expect(info).not.toBeNull();
    expect(info!.radius).toBeCloseTo(0.1, 2);
    expect(info!.color).toBe('rgba(0, 0, 0, 1)');
  });

  it('returns null for the transparent Dextrous default (single shadow)', () => {
    expect(analyseShadowStack('0.1em 0.1em 0.1em rgba(100, 100, 100, 0)')).toBeNull();
  });

  it('returns null for undefined / empty input', () => {
    expect(analyseShadowStack(undefined)).toBeNull();
    expect(analyseShadowStack('')).toBeNull();
  });

  it('returns null when stops use mixed colours', () => {
    const mixed = circularStack(0.1, 'rgba(0, 0, 0, 1)', 16) + ', '
      + circularStack(0.1, 'rgba(255, 255, 255, 1)', 16);
    expect(analyseShadowStack(mixed)).toBeNull();
  });

  it('returns null for px-based stacks (not em)', () => {
    const px = Array.from({ length: 16 }, () => '2px 2px 0px rgba(0, 0, 0, 1)').join(', ');
    expect(analyseShadowStack(px)).toBeNull();
  });
});

describe('applyStrokeOutline', () => {
  it('converts a shadow stack into a stroke outline and strips the shadow', () => {
    const style: CSSProperties = { textShadow: WHITE_32, color: 'black', fontSize: '12px' };
    const { style: out, outline } = applyStrokeOutline(style);
    expect(out.textShadow).toBe('none');
    expect(out.color).toBe('black');
    expect(outline).not.toBeNull();
    expect(parseFloat(String(outline!.WebkitTextStrokeWidth))).toBeCloseTo(0.22, 2);
    expect(outline!.WebkitTextStrokeColor).toBe('rgba(255, 255, 255, 1)');
    expect(outline!.paintOrder).toBe('stroke fill');
  });

  it('leaves styles without a stack untouched', () => {
    const style: CSSProperties = { textShadow: '0.1em 0.1em 0.1em rgba(100, 100, 100, 0)' };
    const { style: out, outline } = applyStrokeOutline(style);
    expect(outline).toBeNull();
    expect(out).toBe(style);
    expect(out.textShadow).toBe('0.1em 0.1em 0.1em rgba(100, 100, 100, 0)');
  });

  it('leaves styles with no textShadow untouched', () => {
    const style: CSSProperties = { color: 'red' };
    const { style: out, outline } = applyStrokeOutline(style);
    expect(outline).toBeNull();
    expect(out).toBe(style);
  });

  it('does not mutate the input style', () => {
    const style: CSSProperties = { textShadow: BLACK_16 };
    applyStrokeOutline(style);
    expect(style.textShadow).toBe(BLACK_16);
  });
});

describe('stripInvisibleOutlines', () => {
  it('removes the transparent Dextrous stroke (width kept, color alpha 0)', () => {
    const style: CSSProperties = {
      WebkitTextStrokeWidth: '0.1em',
      WebkitTextStrokeColor: 'rgba(100, 100, 100, 0)',
      color: 'black',
    };
    stripInvisibleOutlines(style);
    expect(style.WebkitTextStrokeWidth).toBeUndefined();
    expect(style.WebkitTextStrokeColor).toBeUndefined();
    expect(style.color).toBe('black');
  });

  it('removes zero-width strokes even with an opaque color', () => {
    const style: CSSProperties = {
      WebkitTextStrokeWidth: '0em',
      WebkitTextStrokeColor: 'rgba(255, 255, 255, 1)',
    };
    stripInvisibleOutlines(style);
    expect(style.WebkitTextStrokeWidth).toBeUndefined();
    expect(style.WebkitTextStrokeColor).toBeUndefined();
  });

  it('keeps a visible stroke (opaque color, non-zero width)', () => {
    const style: CSSProperties = {
      WebkitTextStrokeWidth: '0.1em',
      WebkitTextStrokeColor: 'rgba(255, 255, 255, 1)',
    };
    stripInvisibleOutlines(style);
    expect(style.WebkitTextStrokeWidth).toBe('0.1em');
    expect(style.WebkitTextStrokeColor).toBe('rgba(255, 255, 255, 1)');
  });

  it('removes the transparent Dextrous default text-shadow', () => {
    const style: CSSProperties = { textShadow: '0.1em 0.1em 0.1em rgba(100, 100, 100, 0)' };
    stripInvisibleOutlines(style);
    expect(style.textShadow).toBeUndefined();
  });

  it('keeps visible shadow stacks (white and black)', () => {
    const white: CSSProperties = { textShadow: WHITE_32 };
    stripInvisibleOutlines(white);
    expect(white.textShadow).toBe(WHITE_32);

    const black: CSSProperties = { textShadow: BLACK_16 };
    stripInvisibleOutlines(black);
    expect(black.textShadow).toBe(BLACK_16);
  });

  it('keeps shadows whose stops omit a color (currentColor is visible)', () => {
    const style: CSSProperties = { textShadow: '1px 1px 2px' };
    stripInvisibleOutlines(style);
    expect(style.textShadow).toBe('1px 1px 2px');
  });

  it('ignores styles with no outline machinery', () => {
    const style: CSSProperties = { color: 'red', fontSize: '12px' };
    stripInvisibleOutlines(style);
    expect(style).toEqual({ color: 'red', fontSize: '12px' });
  });
});
