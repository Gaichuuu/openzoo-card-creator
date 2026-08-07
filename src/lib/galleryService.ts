import {
  and,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  or,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  type DocumentSnapshot,
  type QueryCompositeFilterConstraint,
  type QueryFilterConstraint,
  type QueryNonFilterConstraint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { readSessionStorage, writeSessionStorage, removeSessionStorage } from './safeStorage';
import { dataUrlToBlob, MAX_UPLOAD_BYTES } from './exportUtils';
import type { SavedCard, CardSnapshot, CardTag } from '@/types/card';
import type { CardType, Element } from '@/types/card';
import type { LayoutType } from '@/types/layout';
import type { EffectBlock } from '@/types/effects';
import type { Locale } from '@/data/locales';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface PublishOptions {
  creatorName: string;
  tags: CardTag[];
  remixedFrom: string | null;
  remixedFromName: string;
}

async function uploadBlob(blob: Blob, storageRef: ReturnType<typeof ref>): Promise<void> {
  if (blob.size > MAX_UPLOAD_BYTES) {
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
    const limitMB = MAX_UPLOAD_BYTES / (1024 * 1024);
    throw new Error(`Image too large (${sizeMB}MB). Maximum upload size is ${limitMB}MB.`);
  }
  await uploadBytes(storageRef, blob);
}

export async function publishCard(
  snapshot: CardSnapshot,
  thumbnailDataUrl: string,
  options: PublishOptions,
): Promise<string> {
  const cardId = generateId();

  const cardData = { ...snapshot.cardData };

  const uploads: Promise<void>[] = [];

  for (const key of Object.keys(cardData)) {
    const value = cardData[key];
    if (value && value.startsWith('data:image/')) {
      uploads.push((async () => {
        const blob = dataUrlToBlob(value);
        const storageRef = ref(storage, `cards/${cardId}/zone-${key}.png`);
        await uploadBlob(blob, storageRef);
        cardData[key] = await getDownloadURL(storageRef);
      })());
    }
  }

  let cardArtUrl = snapshot.cardArtUrl || '';
  if (cardArtUrl.startsWith('data:image/')) {
    uploads.push((async () => {
      const blob = dataUrlToBlob(cardArtUrl);
      const storageRef = ref(storage, `cards/${cardId}/art.png`);
      await uploadBlob(blob, storageRef);
      cardArtUrl = await getDownloadURL(storageRef);
    })());
  }

  let thumbnailUrl = '';
  if (thumbnailDataUrl) {
    uploads.push((async () => {
      const blob = dataUrlToBlob(thumbnailDataUrl);
      const ext = thumbnailDataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png';
      const storageRef = ref(storage, `cards/${cardId}/thumb.${ext}`);
      await uploadBlob(blob, storageRef);
      thumbnailUrl = await getDownloadURL(storageRef);
    })());
  }

  await Promise.all(uploads);

  const now = Timestamp.now();
  const savedCard = {
    ...snapshot,
    id: cardId,
    cardData,
    cardArtUrl,
    effectBlocks: snapshot.effectBlocks.map(blockToPlain),
    locale: snapshot.locale || 'en',
    borderless: snapshot.borderless || false,
    thumbnailUrl,
    creatorName: options.creatorName,
    tags: options.tags,
    remixedFrom: options.remixedFrom,
    remixedFromName: options.remixedFromName,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'cards', cardId), savedCard);
  invalidateCountsCache();
  return cardId;
}

function blockToPlain(block: EffectBlock): Record<string, unknown> {
  return { ...block };
}

function docToSavedCard(data: Record<string, unknown>): SavedCard {
  const tags: CardTag[] = Array.isArray(data.tags) ? data.tags as CardTag[]
    : data.status === 'testing' ? ['Playtesting' as CardTag] : [];
  return {
    id: data.id as string,
    cardType: data.cardType as CardType,
    layoutType: data.layoutType as LayoutType,
    cardData: (data.cardData || {}) as SavedCard['cardData'],
    cardName: (data.cardName || '') as string,
    tribe: (data.tribe || '') as string,
    spellbookLimit: (data.spellbookLimit || '1') as string,
    primaryElement: (data.primaryElement || null) as Element | null,
    secondaryElement: (data.secondaryElement || null) as Element | null,
    traits: (data.traits || [null, null, null]) as (string | null)[],
    terras: (data.terras || [null, null]) as (string | null)[],
    strongAgainst: (data.strongAgainst || [null, null, null, null]) as (Element | null)[],
    effectBlocks: (data.effectBlocks || []) as EffectBlock[],
    locale: (data.locale || 'en') as Locale,
    borderless: (data.borderless ?? false) as boolean,
    mainTextBoxNudge: (data.mainTextBoxNudge ?? 0) as number,
    mainTextBoxExtraShrink: (data.mainTextBoxExtraShrink ?? 0) as number,
    cardArtPositionX: (data.cardArtPositionX ?? 0) as number,
    cardArtPositionY: (data.cardArtPositionY ?? 0) as number,
    artNeeded: (data.artNeeded ?? tags.includes('Art Needed')) as boolean,
    thumbnailUrl: (data.thumbnailUrl || '') as string,
    cardArtUrl: (data.cardArtUrl || '') as string,
    creatorName: (data.creatorName || '') as string,
    tags,
    remixedFrom: (data.remixedFrom || null) as string | null,
    remixedFromName: (data.remixedFromName || '') as string,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
  };
}

interface FetchFilters {
  cardType?: string;
  element?: string;
  tag?: string;
  terra?: string;
  trait?: string;
}

export type GallerySort = 'newest' | 'name';

export type PageCursor = DocumentSnapshot;

export interface FetchResult {
  cards: SavedCard[];
  cursor: PageCursor | null;
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 24;

function elementFilter(element: string): QueryCompositeFilterConstraint {
  return or(
    where('primaryElement', '==', element),
    where('secondaryElement', '==', element),
  );
}

function filterClauses(filters?: FetchFilters): QueryFilterConstraint[] {
  const clauses: QueryFilterConstraint[] = [];
  if (filters?.cardType) {
    clauses.push(where('cardType', '==', filters.cardType));
  }
  if (filters?.element) {
    clauses.push(elementFilter(filters.element));
  }
  if (filters?.tag) {
    clauses.push(where('tags', 'array-contains', filters.tag));
  } else if (filters?.terra) {
    clauses.push(where('terras', 'array-contains', filters.terra));
  } else if (filters?.trait) {
    clauses.push(where('traits', 'array-contains', filters.trait));
  }
  return clauses;
}

export async function fetchCards(
  filters?: FetchFilters,
  cursor?: PageCursor | null,
  pageSize: number = DEFAULT_PAGE_SIZE,
  sort: GallerySort = 'newest',
): Promise<FetchResult> {
  const clauses = filterClauses(filters);
  const constraints: QueryNonFilterConstraint[] = [
    sort === 'name' ? orderBy('cardName', 'asc') : orderBy('createdAt', 'desc'),
  ];
  if (cursor) {
    constraints.push(startAfter(cursor));
  }
  constraints.push(limit(pageSize));

  const cards = collection(db, 'cards');
  const q = clauses.length > 0
    ? query(cards, and(...clauses), ...constraints)
    : query(cards, ...constraints);
  const snap = await getDocs(q);
  const last = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return {
    cards: snap.docs.map((d) => docToSavedCard(d.data())),
    cursor: last,
    hasMore: snap.docs.length === pageSize,
  };
}

export interface GalleryFacetValues {
  tags: readonly string[];
  cardTypes: readonly string[];
  elements: readonly string[];
  terras: readonly string[];
  traits: readonly string[];
}

export interface GalleryCounts {
  total?: number;
  byTag: Record<string, number>;
  byType: Record<string, number>;
  byElement: Record<string, number>;
  byTerra: Record<string, number>;
  byTrait: Record<string, number>;
}

const COUNTS_CACHE_KEY = 'openzoo-gallery-counts-v2';
const COUNTS_TTL_MS = 5 * 60 * 1000;

function readCachedCounts(): GalleryCounts | null {
  const raw = readSessionStorage(COUNTS_CACHE_KEY);
  if (!raw) return null;
  try {
    const { at, counts } = JSON.parse(raw) as { at: number; counts: GalleryCounts };
    return Date.now() - at < COUNTS_TTL_MS ? counts : null;
  } catch {
    return null;
  }
}

function invalidateCountsCache(): void {
  removeSessionStorage(COUNTS_CACHE_KEY);
}

export async function fetchGalleryCounts(facets: GalleryFacetValues): Promise<GalleryCounts> {
  const cached = readCachedCounts();
  if (cached) return cached;

  const cards = collection(db, 'cards');
  let failures = 0;
  const count = async (filter?: QueryCompositeFilterConstraint) => {
    try {
      return (await getCountFromServer(filter ? query(cards, filter) : query(cards))).data().count;
    } catch (err) {
      failures++;
      console.error('Gallery count query failed:', err);
      return undefined;
    }
  };
  const countAll = async (values: readonly string[], build: (v: string) => QueryCompositeFilterConstraint) => {
    const counts = await Promise.all(values.map((v) => count(build(v))));
    const record: Record<string, number> = {};
    values.forEach((v, i) => {
      const n = counts[i];
      if (n !== undefined) record[v] = n;
    });
    return record;
  };

  const [total, byTag, byType, byElement, byTerra, byTrait] = await Promise.all([
    count(),
    countAll(facets.tags, (v) => and(where('tags', 'array-contains', v))),
    countAll(facets.cardTypes, (v) => and(where('cardType', '==', v))),
    countAll(facets.elements, elementFilter),
    countAll(facets.terras, (v) => and(where('terras', 'array-contains', v))),
    countAll(facets.traits, (v) => and(where('traits', 'array-contains', v))),
  ]);

  const counts: GalleryCounts = { total, byTag, byType, byElement, byTerra, byTrait };
  if (failures === 0) {
    writeSessionStorage(COUNTS_CACHE_KEY, JSON.stringify({ at: Date.now(), counts }));
  }
  return counts;
}

export async function fetchFilteredCount(filters?: FetchFilters): Promise<number> {
  const clauses = filterClauses(filters);
  const cards = collection(db, 'cards');
  const q = clauses.length > 0 ? query(cards, and(...clauses)) : query(cards);
  return (await getCountFromServer(q)).data().count;
}

export async function fetchCard(id: string): Promise<SavedCard | null> {
  const snap = await getDoc(doc(db, 'cards', id));
  if (!snap.exists()) return null;
  return docToSavedCard(snap.data());
}
