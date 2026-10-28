import type { HoloSettings } from '@/types/card';
import { ensureFoil } from './foilImage';
import { isHoloActive } from './holoSettings';

const MAX_FRAMES = 20;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, 100);
    requestAnimationFrame(() => { clearTimeout(t); resolve(); });
  });
}

type ForcedProp = 'backgroundImage' | 'opacity' | 'display';

function holoLayers(card: HTMLElement): HTMLElement[] {
  return Array.from(card.querySelectorAll<HTMLElement>('.oz-holo'));
}

function showsFoil(el: HTMLElement, url: string, opacity: string): boolean {
  return el.style.backgroundImage.includes(url) && el.style.opacity === opacity && el.style.backgroundPosition !== '';
}

export async function prepareHoloExport(
  card: HTMLElement,
  holo: HoloSettings | null | undefined,
): Promise<() => void> {
  if (!isHoloActive(holo)) return () => {};
  const forced: { el: HTMLElement; prop: ForcedProp; prev: string; set: string }[] = [];
  const force = (el: HTMLElement, prop: ForcedProp, value: string) => {
    const prev = el.style[prop];
    el.style[prop] = value;
    forced.push({ el, prop, prev, set: el.style[prop] });
  };
  const undo = () => {
    for (const { el, prop, prev, set } of forced) {
      if (el.style[prop] === set) el.style[prop] = prev;
    }
  };

  let url: string;
  try {
    ({ url } = await ensureFoil(holo));
  } catch (err) {
    console.warn('Holo foil unavailable, exporting without it:', err);
    for (const el of holoLayers(card)) force(el, 'display', 'none');
    return undo;
  }
  const opacity = String(holo.strength / 100);
  const ready = () => {
    const layers = holoLayers(card);
    if (card.classList.contains('oz-holo-reverse') && !card.querySelector('.oz-holo-ground')) return false;
    return layers.length > 0 && layers.every((el) => showsFoil(el, url, opacity));
  };
  if (!ready()) {
    await nextFrame();
    await nextFrame();
    for (let i = 0; i < MAX_FRAMES && !ready(); i++) await nextFrame();
  }

  for (const el of holoLayers(card)) {
    if (!el.style.backgroundImage.includes(url)) force(el, 'backgroundImage', `url('${url}')`);
    if (el.style.opacity !== opacity) force(el, 'opacity', opacity);
  }
  return undo;
}
