import {
  collection, doc, getDocs, limit, orderBy, query, setDoc, where, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { dataUrlToBlob } from './exportUtils';
import { readLocalStorage, writeLocalStorage } from './safeStorage';
import type { CustomAuraSettings, CustomIcon, CustomIconType } from '@/types/customIcons';

const LOCAL_KEY = 'openzoo-custom-icons';
const MAX_LOCAL_ICONS = 60;
const COMMUNITY_FETCH_LIMIT = 60;
const COMMUNITY_TTL_MS = 5 * 60 * 1000;

export const ICON_MAX_DIM = 256;
export const BACKGROUND_MAX_DIM = 1600;

function readAllLocalIcons(): CustomIcon[] {
  const raw = readLocalStorage(LOCAL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CustomIcon[];
  } catch {
    return [];
  }
}

export function loadLocalIcons(type: CustomIconType): CustomIcon[] {
  return readAllLocalIcons().filter((i) => i.type === type);
}

export function saveLocalIcon(icon: CustomIcon): boolean {
  const next = [icon, ...readAllLocalIcons().filter((i) => i.id !== icon.id)].slice(0, MAX_LOCAL_ICONS);
  return writeLocalStorage(LOCAL_KEY, JSON.stringify(next));
}

export function deleteLocalIcon(id: string): void {
  writeLocalStorage(LOCAL_KEY, JSON.stringify(readAllLocalIcons().filter((i) => i.id !== id)));
}

const communityCache = new Map<CustomIconType, { at: number; icons: CustomIcon[] }>();

export async function fetchCommunityIcons(type: CustomIconType): Promise<CustomIcon[]> {
  const cached = communityCache.get(type);
  if (cached && Date.now() - cached.at < COMMUNITY_TTL_MS) return cached.icons;
  const q = query(
    collection(db, 'customIcons'),
    where('type', '==', type),
    orderBy('createdAt', 'desc'),
    limit(COMMUNITY_FETCH_LIMIT),
  );
  const snap = await getDocs(q);
  const icons = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: (data.id || d.id) as string,
      type: data.type as CustomIconType,
      name: (data.name || '') as string,
      image: (data.imageUrl || '') as string,
      aura: (data.aura ?? undefined) as CustomAuraSettings | undefined,
      creatorName: (data.creatorName || '') as string,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0,
    };
  });
  communityCache.set(type, { at: Date.now(), icons });
  return icons;
}

export async function shareIcon(icon: CustomIcon): Promise<void> {
  const storageRef = ref(storage, `customIcons/${icon.id}.png`);
  await uploadBytes(storageRef, dataUrlToBlob(icon.image));
  const imageUrl = await getDownloadURL(storageRef);
  await setDoc(doc(db, 'customIcons', icon.id), {
    id: icon.id,
    type: icon.type,
    name: icon.name,
    imageUrl,
    ...(icon.aura ? { aura: icon.aura } : {}),
    ...(icon.creatorName ? { creatorName: icon.creatorName } : {}),
    createdAt: Timestamp.now(),
  });
  communityCache.delete(icon.type);
}
