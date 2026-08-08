import { describe, it, expect } from 'vitest';
import { versionedName, isMeaningfullyUpdated } from '@/lib/publishUtils';

describe('versionedName', () => {
  it('builds a timestamped filename', () => {
    expect(versionedName('zone-i6', 'png', 1754650000000)).toBe('zone-i6-1754650000000.png');
  });

  it('works for thumbnails', () => {
    expect(versionedName('thumb', 'jpg', 42)).toBe('thumb-42.jpg');
  });
});

describe('isMeaningfullyUpdated', () => {
  const base = new Date('2026-08-08T12:00:00Z');

  it('false when timestamps are equal', () => {
    expect(isMeaningfullyUpdated(base, base)).toBe(false);
  });

  it('false within the 60s grace window (publish-time skew)', () => {
    expect(isMeaningfullyUpdated(base, new Date(base.getTime() + 59_000))).toBe(false);
  });

  it('true when updated more than 60s later', () => {
    expect(isMeaningfullyUpdated(base, new Date(base.getTime() + 61_000))).toBe(true);
  });
});
