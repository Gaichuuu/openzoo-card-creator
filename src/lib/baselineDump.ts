const PANEL_ID = 'oz-baseline-dump';

interface RunRow {
  zone: string;
  family: string;
  weight: string;
  style: string;
  size: number;
  lineHeight: string;
  top: number;
  baseline: number;
  pinned: string;
}

function measureBaseline(el: HTMLElement, rootTop: number, scale: number): number | null {
  const strut = document.createElement('span');
  strut.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  el.appendChild(strut);
  const r = strut.getBoundingClientRect();
  const measurable = strut.isConnected || r.width !== 0 || r.height !== 0 || r.top !== 0;
  strut.remove();
  return measurable ? (r.top - rootTop) / scale : null;
}

function collect(root: HTMLElement, scale: number): RunRow[] {
  const rootTop = root.getBoundingClientRect().top;
  const rows: RunRow[] = [];
  for (const el of Array.from(root.querySelectorAll('[data-oz-text]')) as HTMLElement[]) {
    const box = el.getBoundingClientRect();
    if (!box.height) continue;
    const cs = getComputedStyle(el);
    const zone = el.closest('[data-zone-key]');
    const baseline = measureBaseline(el, rootTop, scale);
    if (baseline === null) continue;
    rows.push({
      zone: zone ? zone.getAttribute('data-zone-key') || '?' : '?',
      family: cs.fontFamily.split(',')[0].replace(/["']/g, ''),
      weight: cs.fontWeight,
      style: cs.fontStyle,
      size: parseFloat(cs.fontSize),
      lineHeight: cs.lineHeight,
      top: (box.top - rootTop) / scale,
      baseline,
      pinned: el.style.top || '-',
    });
  }
  return rows;
}

function render(rows: RunRow[], scale: number): string {
  const out: string[] = [];
  out.push('ua    ' + navigator.userAgent);
  out.push('dpr   ' + window.devicePixelRatio + '   scale ' + scale + '   runs ' + rows.length);
  out.push('');
  out.push('zone                     fam wt sty  size      lh      top  baseline   within  pinned');
  const seen = new Set<string>();
  for (const r of rows) {
    const key = r.zone + '|' + r.top.toFixed(3) + '|' + r.size;
    if (seen.has(key)) continue;
    seen.add(key);
    const fam = r.family === 'Archivo Black' ? 'AB' : r.family === 'EB Garamond' ? 'EBG' : r.family.slice(0, 3);
    const lh = r.lineHeight.replace('px', '');
    out.push(
      r.zone.slice(0, 24).padEnd(24)
      + fam.padStart(4) + r.weight.padStart(3) + r.style.slice(0, 3).padStart(4)
      + r.size.toFixed(1).padStart(6)
      + (Number.isNaN(parseFloat(lh)) ? lh : parseFloat(lh).toFixed(2)).padStart(8)
      + r.top.toFixed(3).padStart(9)
      + r.baseline.toFixed(3).padStart(10)
      + (r.baseline - r.top).toFixed(3).padStart(9)
      + r.pinned.padStart(8));
  }
  return out.join('\n');
}

function panel(): HTMLElement {
  let el = document.getElementById(PANEL_ID);
  if (el) return el;
  el = document.createElement('div');
  el.id = PANEL_ID;
  el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;max-height:55vh;overflow:auto;z-index:99999;'
    + 'background:#0b1220;color:#e8eef8;font:11px/1.45 ui-monospace,Menlo,monospace;padding:8px;'
    + 'border-top:1px solid #3c527d';
  const btn = document.createElement('button');
  btn.textContent = 'Copy';
  btn.style.cssText = 'font:inherit;padding:6px 12px;margin-bottom:6px;background:#1e2b45;color:#e8eef8;'
    + 'border:1px solid #3c527d;border-radius:6px';
  const pre = document.createElement('pre');
  pre.style.cssText = 'margin:0;white-space:pre';
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(pre.textContent || '').then(
      () => { btn.textContent = 'Copied'; },
      () => {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const sel = getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      },
    );
  });
  el.appendChild(btn);
  el.appendChild(pre);
  document.body.appendChild(el);
  return el;
}

export function dumpBaselines(root: HTMLElement, scale: number): void {
  try {
    const rows = collect(root, scale);
    if (!rows.length) return;
    const el = panel();
    const pre = el.querySelector('pre');
    if (pre) pre.textContent = render(rows, scale);
  } catch (err) {
    console.warn('[openzoo] baseline dump failed:', err);
  }
}
