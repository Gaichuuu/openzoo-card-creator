const EBG_DESCENT_EM = 0.298;

const PROBE_SIZES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 19];

function measureDescent(size: number): number | null {
  const outer = document.createElement('span');
  outer.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;'
    + `font-family:"EB Garamond";font-weight:400;font-style:normal;font-size:${size}px;line-height:normal`;
  outer.textContent = 'Hxg';
  const strut = document.createElement('span');
  strut.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  outer.appendChild(strut);
  document.body.appendChild(outer);
  const box = outer.getBoundingClientRect();
  const base = strut.getBoundingClientRect();
  outer.remove();
  return box.height ? box.bottom - base.top : null;
}

export function classifyDescent(measuredDevicePx: number, idealDevicePx: number): 'ceil' | 'round' | null {
  const ceilPx = Math.ceil(idealDevicePx);
  const roundPx = Math.round(idealDevicePx);
  if (ceilPx === roundPx) return null;
  if (measuredDevicePx === ceilPx) return 'ceil';
  if (measuredDevicePx === roundPx) return 'round';
  return null;
}

export function idealDescentPx(size: number, dpr: number): number {
  return EBG_DESCENT_EM * size * dpr;
}

let cached: boolean | null = null;

export function usesCeilDescent(): boolean {
  if (cached !== null) return cached;
  try {
    if (typeof document === 'undefined' || !document.body) return false;
    if (!document.fonts?.check('400 9px "EB Garamond"')) return false;
    const dpr = window.devicePixelRatio || 1;
    let ceilVotes = 0;
    let roundVotes = 0;
    for (const size of PROBE_SIZES) {
      const ideal = idealDescentPx(size, dpr);
      if (Math.ceil(ideal) === Math.round(ideal)) continue;
      const measured = measureDescent(size);
      if (measured === null) continue;
      const verdict = classifyDescent(Math.round(measured * dpr), ideal);
      if (verdict === 'ceil') ceilVotes++;
      else if (verdict === 'round') roundVotes++;
    }
    cached = ceilVotes + roundVotes >= 3 && ceilVotes > roundVotes;
    return cached;
  } catch {
    return false;
  }
}
