import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

/** Never signs in */
export function getCurrentUid(): Promise<string | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => { unsub(); resolve(user?.uid ?? null); },
      () => { unsub(); resolve(null); },
    );
  });
}

/** Signs in anonymously if needed */
export async function ensureAnonymousUser(): Promise<string | null> {
  try {
    const existing = await getCurrentUid();
    if (existing) return existing;
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch {
    return null;
  }
}

/** Live uid for UI */
export function useAuthUid(): string | null {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);
  return uid;
}
