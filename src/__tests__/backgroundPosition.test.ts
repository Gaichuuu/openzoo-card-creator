import { describe, expect, it } from 'vitest';
import { positionLonghands } from '@/lib/backgroundPosition';

const xy = (value: string) => {
  const { backgroundPositionX, backgroundPositionY } = positionLonghands(value);
  return [backgroundPositionX, backgroundPositionY];
};

describe('positionLonghands', () => {
  it('handles one value', () => {
    expect(xy('center')).toEqual(['center', 'center']);
    expect(xy('top')).toEqual(['center', 'top']);
    expect(xy('left')).toEqual(['left', 'center']);
    expect(xy('30%')).toEqual(['30%', 'center']);
  });

  it('handles two values in either keyword order', () => {
    expect(xy('70% 35%')).toEqual(['70%', '35%']);
    expect(xy('left top')).toEqual(['left', 'top']);
    expect(xy('top left')).toEqual(['left', 'top']);
    expect(xy('center bottom')).toEqual(['center', 'bottom']);
    expect(xy('left 10px')).toEqual(['left', '10px']);
  });

  it('pairs edge keywords with their offsets in three and four value forms', () => {
    expect(xy('right 10px bottom 5px')).toEqual(['right 10px', 'bottom 5px']);
    expect(xy('bottom 5px right 10px')).toEqual(['right 10px', 'bottom 5px']);
    expect(xy('right 10px top')).toEqual(['right 10px', 'top']);
    expect(xy('center bottom 4px')).toEqual(['center', 'bottom 4px']);
  });

  it('keeps calc() with spaces intact', () => {
    expect(xy('calc(50% - 2px) calc(10% + 1px)')).toEqual(['calc(50% - 2px)', 'calc(10% + 1px)']);
  });

  it('maps each comma-separated layer', () => {
    expect(xy('center, left top')).toEqual(['center, left', 'center, top']);
  });
});
