import { describe, it, expect, beforeEach } from 'vitest';
import { useCardStore } from '@/lib/store';

beforeEach(() => useCardStore.getState().resetCard());

describe('custom style store', () => {
  it('setCustomColor ignores unsafe values and collapses to null', () => {
    const s = useCardStore.getState();
    s.setCustomColor('border', 'red;x');
    expect(useCardStore.getState().customStyle).toBeNull();
    s.setCustomColor('border', '#00ff00');
    expect(useCardStore.getState().customStyle?.colors.border).toBe('#00ff00');
    s.setCustomColor('border', null);
    expect(useCardStore.getState().customStyle).toBeNull();
  });
  it('survives a card type change', () => {
    const s = useCardStore.getState();
    s.setCustomColor('boostBar', '#1e90ff');
    s.setCardType('Aura');
    s.setCardType('Beastie');
    expect(useCardStore.getState().customStyle?.colors.boostBar).toBe('#1e90ff');
  });
  it('round-trips through getSnapshot/loadSnapshot and sanitizes on load', () => {
    const s = useCardStore.getState();
    s.setCustomColor('effectBox', '#123456');
    s.setPopOut('data:image/png;base64,AAAA');
    const snap = s.getSnapshot();
    s.resetCard();
    useCardStore.getState().loadSnapshot({ ...snap, customStyle: { colors: { ...snap.customStyle!.colors, border: 'url(x)' } } });
    const st = useCardStore.getState();
    expect(st.customStyle).toEqual({ colors: { effectBox: '#123456' } });
    expect(st.popOutUrl).toBe('data:image/png;base64,AAAA');
  });
  it('resetCard clears both fields', () => {
    const s = useCardStore.getState();
    s.setCustomColor('border', '#000');
    s.setPopOut('data:image/png;base64,AAAA');
    s.resetCard();
    expect(useCardStore.getState().customStyle).toBeNull();
    expect(useCardStore.getState().popOutUrl).toBeNull();
  });
  it('setCustomGradient stores and clears a border gradient', () => {
    const s = useCardStore.getState();
    s.setCustomGradient('border', { angle: 90, stops: ['#ff0000', '#0000ff'] });
    expect(useCardStore.getState().customStyle?.borderGradient).toBeTruthy();
    s.setCustomGradient('border', null);
    expect(useCardStore.getState().customStyle).toBeNull();
  });
  it('setCustomGradient stores and clears a Power pill fill gradient', () => {
    const s = useCardStore.getState();
    s.setCustomGradient('pillFill', { angle: 90, stops: ['#222222', '#eccb0d'] });
    expect(useCardStore.getState().customStyle).toEqual({ colors: {}, pillGradient: { angle: 90, stops: ['#222222', '#eccb0d'] } });
    s.setCustomGradient('pillFill', null);
    expect(useCardStore.getState().customStyle).toBeNull();
  });
  it('loadSnapshot nulls unsafe popOutUrl values', () => {
    const snap = useCardStore.getState().getSnapshot();
    for (const bad of ['javascript:alert(1)', 'http://x/y.png']) {
      useCardStore.getState().loadSnapshot({ ...snap, popOutUrl: bad });
      expect(useCardStore.getState().popOutUrl).toBeNull();
    }
  });
});

describe('custom outline store', () => {
  it('setCustomOutline ignores unsafe values and collapses to null', () => {
    const s = useCardStore.getState();
    s.setCustomOutline('typeLine', 'red;x');
    expect(useCardStore.getState().customStyle).toBeNull();
    s.setCustomOutline('typeLine', '#000000');
    expect(useCardStore.getState().customStyle).toEqual({ colors: {}, outlines: { typeLine: '#000000' } });
    s.setCustomOutline('typeLine', null);
    expect(useCardStore.getState().customStyle).toBeNull();
  });
  it('keeps colors when an outline is cleared', () => {
    const s = useCardStore.getState();
    s.setCustomColor('typeLine', '#f8d232');
    s.setCustomOutline('typeLine', '#ffffff');
    s.setCustomOutline('typeLine', null);
    expect(useCardStore.getState().customStyle).toEqual({ colors: { typeLine: '#f8d232' } });
  });
  it('round-trips outlines through getSnapshot/loadSnapshot and sanitizes on load', () => {
    const s = useCardStore.getState();
    s.setCustomOutline('cardName', '#1e90ff');
    const snap = s.getSnapshot();
    s.resetCard();
    useCardStore.getState().loadSnapshot({ ...snap, customStyle: { ...snap.customStyle!, outlines: { ...snap.customStyle!.outlines, credits: 'url(x)' } } });
    expect(useCardStore.getState().customStyle).toEqual({ colors: {}, outlines: { cardName: '#1e90ff' } });
  });
  it('resetCustomStyle clears outlines', () => {
    const s = useCardStore.getState();
    s.setCustomOutline('boostText', '#ffffff');
    s.resetCustomStyle();
    expect(useCardStore.getState().customStyle).toBeNull();
  });
});
