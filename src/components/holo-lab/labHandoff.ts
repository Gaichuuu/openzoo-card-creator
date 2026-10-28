import type { CardSnapshot } from '@/types/card';

const DB_NAME = 'openzoo-holo-lab';
const STORE = 'kv';
const KEY = 'card';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface LabCard {
  snapshot: CardSnapshot;
  savedAt: number;
}

export async function saveLabCard(snapshot: CardSnapshot, savedAt = Date.now()): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ snapshot, savedAt } satisfies LabCard, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Best effort: without IndexedDB the lab just opens without the card.
  }
}

export async function loadLabCard(): Promise<LabCard | null> {
  try {
    const db = await openDb();
    const value = await new Promise<unknown>((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    const entry = value as LabCard | undefined;
    if (entry && !('snapshot' in entry)) return { snapshot: value as CardSnapshot, savedAt: 0 };
    return entry ?? null;
  } catch {
    return null;
  }
}

const HANDOFF_WAIT_MS = 5000;
const HANDOFF_POLL_MS = 100;

export async function loadLabCardFor(handoffId: number | null): Promise<LabCard | null> {
  const deadline = Date.now() + HANDOFF_WAIT_MS;
  for (;;) {
    const saved = await loadLabCard();
    if (handoffId === null || (saved && saved.savedAt >= handoffId) || Date.now() > deadline) return saved;
    await new Promise((r) => setTimeout(r, HANDOFF_POLL_MS));
  }
}

const imageCount = (s: Partial<Pick<CardSnapshot, 'cardData' | 'popOutUrl'>>) =>
  Object.values(s.cardData ?? {}).filter((v) => typeof v === 'string' && v.startsWith('data:image')).length
  + (typeof s.popOutUrl === 'string' && s.popOutUrl ? 1 : 0);

export function shouldRestoreLabCard(saved: LabCard, current: CardSnapshot, handoffId: number | null): boolean {
  if (handoffId !== null && saved.savedAt === handoffId) return true;
  const snap = saved.snapshot as Partial<CardSnapshot> | null;
  if (!snap || typeof snap !== 'object') return false;
  return snap.cardName === current.cardName && snap.layoutType === current.layoutType
    && imageCount(snap) > imageCount(current);
}

export function handoffIdFrom(search: string): number | null {
  const v = Number(new URLSearchParams(search).get('handoff'));
  return Number.isSafeInteger(v) && v > 0 ? v : null;
}
