import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

/** Never signs in */
export async function getCurrentUid(): Promise<string | null> {
  await auth.authStateReady();
  return auth.currentUser?.uid ?? null;
}

/** Signs in anonymously if needed */
export async function ensureAnonymousUser(): Promise<string | null> {
  try {
    const existing = await getCurrentUid();
    if (existing) return existing;
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (err) {
    console.warn('Anonymous sign-in failed; publishing without ownership (card will not be editable):', err);
    return null;
  }
}

/** Live uid for UI */
export function useAuthUid(): string | null {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);
  return uid;
}

/** True once Firebase has finished restoring any persisted session */
export function useAuthReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stale = false;
    auth.authStateReady().then(() => { if (!stale) setReady(true); });
    return () => { stale = true; };
  }, []);
  return ready;
}
