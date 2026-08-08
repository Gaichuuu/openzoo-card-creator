import {
  collection, doc, getDocs, limit, orderBy, query, setDoc, where, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { dataUrlToBlob } from './exportUtils';
import type { CustomAuraSettings, CustomIcon, CustomIconType } from '@/types/customIcons';

const LOCAL_KEY = 'openzoo-custom-icons';
const MAX_LOCAL_ICONS = 60;
const COMMUNITY_FETCH_LIMIT = 60;

export const ICON_MAX_DIM = 256;
export const BACKGROUND_MAX_DIM = 1600;

export function loadLocalIcons(type: CustomIconType): CustomIcon[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as CustomIcon[];
    return all.filter((i) => i.type === type);
  } catch {
    return [];
  }
}

export function saveLocalIcon(icon: CustomIcon): boolean {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const all = raw ? (JSON.parse(raw) as CustomIcon[]) : [];
    const next = [icon, ...all.filter((i) => i.id !== icon.id)].slice(0, MAX_LOCAL_ICONS);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function deleteLocalIcon(id: string): void {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return;
    const all = JSON.parse(raw) as CustomIcon[];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all.filter((i) => i.id !== id)));
  } catch { /* storage unavailable */ }
}

export function processIconFile(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = w > maxDim || h > maxDim ? Math.min(maxDim / w, maxDim / h) : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(objectUrl);
      if (!ctx) { reject(new Error('Canvas 2D not supported')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

export async function fetchCommunityIcons(type: CustomIconType): Promise<CustomIcon[]> {
  const q = query(
    collection(db, 'customIcons'),
    where('type', '==', type),
    orderBy('createdAt', 'desc'),
    limit(COMMUNITY_FETCH_LIMIT),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
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
}

export async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}
