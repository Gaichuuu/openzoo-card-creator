import {
  and,
  collection,
  deleteDoc,
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
import { ensureAnonymousUser } from './auth';
import { generateId, versionedName } from './publishUtils';
import type { SavedCard, CardSnapshot, CardTag } from '@/types/card';
import type { CardType, Element, ElementOrCustom } from '@/types/card';
import type { CustomElementDef } from '@/types/customIcons';
import type { LayoutType } from '@/types/layout';
import type { EffectBlock } from '@/types/effects';
import type { Locale } from '@/data/locales';

interface PublishOptions {
  creatorName: string;
  tags: CardTag[];
  remixedFrom: string | null;
  remixedFromName: string;
  existingCard?: SavedCard;
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
  const existing = options.existingCard;
  const cardId = existing?.id ?? generateId();
  const ts = Date.now();

  const cardData = { ...snapshot.cardData };
  const ownerUidPromise = existing ? null : ensureAnonymousUser();

  const uploadedUrls = new Map<string, Promise<string>>();
  const uploadDataUrl = (dataUrl: string, name: string, ext = 'png'): Promise<string> => {
    let pending = uploadedUrls.get(dataUrl);
    if (!pending) {
      pending = (async () => {
        const storageRef = ref(storage, `cards/${cardId}/${versionedName(name, ext, ts)}`);
        await uploadBlob(dataUrlToBlob(dataUrl), storageRef);
        return getDownloadURL(storageRef);
      })();
      uploadedUrls.set(dataUrl, pending);
    }
    return pending;
  };

  const uploads: Promise<void>[] = [];

  for (const key of Object.keys(cardData)) {
    const value = cardData[key];
    if (value && value.startsWith('data:image/')) {
      uploads.push(uploadDataUrl(value, `zone-${key}`).then((url) => { cardData[key] = url; }));
    }
  }

  const customPrimary = snapshot.customPrimary ? { ...snapshot.customPrimary } : null;
  const customSecondary = snapshot.customSecondary ? { ...snapshot.customSecondary } : null;
  for (const [def, name] of [[customPrimary, 'custom-primary'], [customSecondary, 'custom-secondary']] as const) {
    if (def && def.icon.startsWith('data:image/')) {
      uploads.push(uploadDataUrl(def.icon, name).then((url) => { def.icon = url; }));
    }
  }

  let cardArtUrl = snapshot.cardArtUrl || '';
  if (cardArtUrl.startsWith('data:image/')) {
    uploads.push(uploadDataUrl(cardArtUrl, 'art').then((url) => { cardArtUrl = url; }));
  }

  let thumbnailUrl = '';
  if (thumbnailDataUrl) {
    const ext = thumbnailDataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png';
    uploads.push(uploadDataUrl(thumbnailDataUrl, 'thumb', ext).then((url) => { thumbnailUrl = url; }));
  }

  await Promise.all(uploads);

  const ownerUid = existing ? existing.ownerUid : await ownerUidPromise;

  const now = Timestamp.now();
  const savedCard = {
    ...snapshot,
    id: cardId,
    cardData,
    cardArtUrl,
    customPrimary,
    customSecondary,
    effectBlocks: snapshot.effectBlocks.map(blockToPlain),
    locale: snapshot.locale || 'en',
    borderless: snapshot.borderless || false,
    thumbnailUrl,
    creatorName: options.creatorName,
    tags: options.tags,
    remixedFrom: existing ? existing.remixedFrom : options.remixedFrom,
    remixedFromName: existing ? existing.remixedFromName : options.remixedFromName,
    ...(ownerUid ? { ownerUid } : {}),
    createdAt: existing ? Timestamp.fromDate(existing.createdAt) : now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'cards', cardId), savedCard);
  invalidateCountsCache();
  return cardId;
}

export async function deleteCard(cardId: string): Promise<void> {
  await deleteDoc(doc(db, 'cards', cardId));
  invalidateCountsCache();
}

function blockToPlain(block: EffectBlock): Record<string, unknown> {
  return { ...block };
}

function docToSavedCard(data: Record<string, unknown>): SavedCard {
  const tags: CardTag[] = Array.isArray(data.tags) ? data.tags as CardTag[]
    : data.status === 'testing' ? ['Playtesting' as CardTag] : [];
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
  return {
    id: data.id as string,
    cardType: data.cardType as CardType,
    layoutType: data.layoutType as LayoutType,
    cardData: (data.cardData || {}) as SavedCard['cardData'],
    cardName: (data.cardName || '') as string,
    tribe: (data.tribe || '') as string,
    spellbookLimit: (data.spellbookLimit || '1') as string,
    primaryElement: (data.primaryElement || null) as ElementOrCustom | null,
    secondaryElement: (data.secondaryElement || null) as ElementOrCustom | null,
    customPrimary: (data.customPrimary || null) as CustomElementDef | null,
    customSecondary: (data.customSecondary || null) as CustomElementDef | null,
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
    ownerUid: (data.ownerUid || null) as string | null,
    tags,
    remixedFrom: (data.remixedFrom || null) as string | null,
    remixedFromName: (data.remixedFromName || '') as string,
    createdAt,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : createdAt,
  };
}

interface FetchFilters {
  cardType?: string;
  element?: string;
  tag?: string;
  terra?: string;
  trait?: string;
  ownerUid?: string;
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
  if (filters?.ownerUid) {
    clauses.push(where('ownerUid', '==', filters.ownerUid));
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
const PARTIAL_COUNTS_TTL_MS = 60 * 1000;

function readCachedCounts(): GalleryCounts | null {
  const raw = readSessionStorage(COUNTS_CACHE_KEY);
  if (!raw) return null;
  try {
    const { at, counts, partial } = JSON.parse(raw) as { at: number; counts: GalleryCounts; partial?: boolean };
    return Date.now() - at < (partial ? PARTIAL_COUNTS_TTL_MS : COUNTS_TTL_MS) ? counts : null;
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
  writeSessionStorage(COUNTS_CACHE_KEY, JSON.stringify({ at: Date.now(), counts, partial: failures > 0 }));
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
