import { describe, it, expect } from 'vitest';
import { trimSnapshotForAutosave } from '@/lib/autosave';
import type { CardSnapshot } from '@/types/card';

const base = { cardData: {}, cardArtUrl: 'data:image/png;base64,AAAA' } as unknown as CardSnapshot;

describe('trimSnapshotForAutosave', () => {
  it('nulls cardArtUrl as before', () => {
    expect(trimSnapshotForAutosave(base, 100).cardArtUrl).toBeNull();
  });
  it('keeps a small pop-out and drops a large one', () => {
    expect(trimSnapshotForAutosave({ ...base, popOutUrl: 'data:image/png;base64,' + 'A'.repeat(10) }, 100).popOutUrl).toMatch(/^data:/);
    expect(trimSnapshotForAutosave({ ...base, popOutUrl: 'data:image/png;base64,' + 'A'.repeat(200) }, 100).popOutUrl).toBeNull();
  });
  it('keeps an https pop-out', () => {
    expect(trimSnapshotForAutosave({ ...base, popOutUrl: 'https://x/y.png' }, 100).popOutUrl).toBe('https://x/y.png');
  });
  it('drops large cardData data URLs as before', () => {
    const s = trimSnapshotForAutosave({ ...base, cardData: { i6: 'data:' + 'A'.repeat(200), t1: 'hi' } }, 100);
    expect(s.cardData).toEqual({ t1: 'hi' });
  });
});
