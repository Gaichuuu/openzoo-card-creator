import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { dataUrlToBlob } from './exportUtils';
import type { SavedCard, CardSnapshot, CardTag } from '@/types/card';
import type { CardType, Element } from '@/types/card';
import type { LayoutType } from '@/types/layout';
import type { EffectBlock } from '@/types/effects';

type Locale = 'en' | 'ja';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface PublishOptions {
  creatorName: string;
  tags: CardTag[];
  remixedFrom: string | null;
  remixedFromName: string;
}

export async function publishCard(
  snapshot: CardSnapshot,
  thumbnailDataUrl: string,
  options: PublishOptions,
): Promise<string> {
  const cardId = generateId();

  const cardData = { ...snapshot.cardData };

  for (const key of Object.keys(cardData)) {
    const value = cardData[key];
    if (value && value.startsWith('data:image/')) {
      const blob = dataUrlToBlob(value);
      const storageRef = ref(storage, `cards/${cardId}/zone-${key}.png`);
      await uploadBytes(storageRef, blob);
      cardData[key] = await getDownloadURL(storageRef);
    }
  }

  let cardArtUrl = snapshot.cardArtUrl || '';
  if (cardArtUrl.startsWith('data:image/')) {
    const blob = dataUrlToBlob(cardArtUrl);
    const storageRef = ref(storage, `cards/${cardId}/art.png`);
    await uploadBytes(storageRef, blob);
    cardArtUrl = await getDownloadURL(storageRef);
  }

  let thumbnailUrl = '';
  if (thumbnailDataUrl) {
    const blob = dataUrlToBlob(thumbnailDataUrl);
    const ext = thumbnailDataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png';
    const storageRef = ref(storage, `cards/${cardId}/thumb.${ext}`);
    await uploadBytes(storageRef, blob);
    thumbnailUrl = await getDownloadURL(storageRef);
  }

  const now = Timestamp.now();
  const savedCard = {
    id: cardId,
    cardType: snapshot.cardType,
    layoutType: snapshot.layoutType,
    cardData,
    cardName: snapshot.cardName,
    tribe: snapshot.tribe,
    spellbookLimit: snapshot.spellbookLimit,
    primaryElement: snapshot.primaryElement,
    secondaryElement: snapshot.secondaryElement,
    traits: snapshot.traits,
    terras: snapshot.terras,
    strongAgainst: snapshot.strongAgainst,
    effectBlocks: snapshot.effectBlocks.map(blockToPlain),
    locale: snapshot.locale || 'en',
    borderless: snapshot.borderless || false,
    thumbnailUrl,
    cardArtUrl,
    creatorName: options.creatorName,
    tags: options.tags,
    remixedFrom: options.remixedFrom,
    remixedFromName: options.remixedFromName,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'cards', cardId), savedCard);
  return cardId;
}

function blockToPlain(block: EffectBlock): Record<string, unknown> {
  return { ...block };
}

function docToSavedCard(data: Record<string, unknown>): SavedCard {
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
    thumbnailUrl: (data.thumbnailUrl || '') as string,
    cardArtUrl: (data.cardArtUrl || '') as string,
    creatorName: (data.creatorName || '') as string,
    tags: Array.isArray(data.tags) ? data.tags as CardTag[]
      : data.status === 'testing' ? ['Playtesting' as CardTag] : [],
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
}

export async function fetchCards(filters?: FetchFilters): Promise<SavedCard[]> {
  const constraints: QueryConstraint[] = [];

  if (filters?.cardType) {
    constraints.push(where('cardType', '==', filters.cardType));
  }
  if (filters?.element) {
    constraints.push(where('primaryElement', '==', filters.element));
  }
  if (filters?.tag) {
    constraints.push(where('tags', 'array-contains', filters.tag));
  }
  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, 'cards'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToSavedCard(d.data()));
}

export async function fetchCard(id: string): Promise<SavedCard | null> {
  const snap = await getDoc(doc(db, 'cards', id));
  if (!snap.exists()) return null;
  return docToSavedCard(snap.data());
}

export async function fetchRandomCard(): Promise<SavedCard | null> {
  try {
    const q = query(
      collection(db, 'cards'),
      orderBy('createdAt', 'desc'),
      limit(20),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docs = snap.docs.map((d) => docToSavedCard(d.data()));
    return docs[Math.floor(Math.random() * docs.length)];
  } catch {
    return null;
  }
}
