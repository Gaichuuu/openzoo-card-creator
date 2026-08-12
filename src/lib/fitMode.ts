export type FitMode = 'zoom' | 'ladder';

const STORAGE_KEY = 'openzoo-fit-mode';

function readMode(): FitMode {
  if (typeof window === 'undefined') return 'ladder';
  const param = new URLSearchParams(window.location.search).get('fit');
  if (param === 'ladder' || param === 'zoom') return param;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'ladder' || stored === 'zoom') return stored;
  } catch {
    // private browsing
  }
  return 'ladder';
}

const MODE = readMode();

export function getFitMode(): FitMode {
  return MODE;
}
