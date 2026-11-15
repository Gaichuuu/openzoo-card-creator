interface Origin {
  id: string;
  el: HTMLElement;
  at: number;
}

let origin: Origin | null = null;

export const FLIGHT_EASE = 'cubic-bezier(.16, 1, .3, 1)';
const ORIGIN_TTL_MS = 4000;

export function rememberCardOrigin(id: string, el: HTMLElement | null): void {
  origin = el ? { id, el, at: performance.now() } : null;
}

export function peekCardOrigin(id: string): HTMLElement | null {
  const o = origin;
  if (!o || o.id !== id || performance.now() - o.at > ORIGIN_TTL_MS || !o.el.isConnected) return null;
  return o.el;
}

export function clearCardOrigin(): void {
  origin = null;
}

export function flightTransform(from: DOMRect, to: DOMRect): string {
  const scale = from.width / to.width;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${scale})`;
}

export function isOnScreen(rect: DOMRect): boolean {
  return rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}

export function setTileLifted(el: HTMLElement, lifted: boolean): void {
  el.style.visibility = lifted ? 'hidden' : '';
}
