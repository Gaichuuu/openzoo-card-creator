export type FitMode = 'zoom' | 'ladder';

const STORAGE_KEY = 'openzoo-fit-mode';
const DEFAULT_MODE: FitMode = 'ladder';

function readMode(): FitMode {
  const param = new URLSearchParams(window.location.search).get('fit');
  if (param === 'ladder' || param === 'zoom') return param;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'ladder' || stored === 'zoom') return stored;
  } catch {
    // private browsing
  }
  return DEFAULT_MODE;
}

let cachedSearch: string | null = null;
let cachedMode: FitMode = DEFAULT_MODE;

export function getFitMode(): FitMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  const search = window.location.search;
  if (search !== cachedSearch) {
    cachedSearch = search;
    cachedMode = readMode();
  }
  return cachedMode;
}
