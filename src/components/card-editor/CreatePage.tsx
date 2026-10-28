import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CardEditor } from './CardEditor';
import { useCardStore } from '@/lib/store';
import { fetchCard, rememberUploadedImage } from '@/lib/galleryService';
import { fetchAsDataUrl } from '@/lib/exportUtils';
import { getCurrentUid } from '@/lib/auth';

async function toLocalDataUrl(url: string, what: string): Promise<string> {
  try {
    const dataUrl = await fetchAsDataUrl(url);
    rememberUploadedImage(dataUrl, url);
    return dataUrl;
  } catch {
    console.warn(
      `Could not fetch ${what} for remix (CORS). ` +
      'Run: gsutil cors set cors.json gs://openzoo.firebasestorage.app'
    );
    return url;
  }
}

const localize = <T extends string | null | undefined>(url: T, what: string): Promise<T | string> | T =>
  url && url.startsWith('http') ? toLocalDataUrl(url, what) : url;

export function CreatePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const remixId = searchParams.get('remix');
  const editId = searchParams.get('edit');
  const loadId = editId || remixId;
  const [loading, setLoading] = useState(!!loadId);
  const [error, setError] = useState<string | null>(null);
  const loadSnapshot = useCardStore((s) => s.loadSnapshot);
  const snapshotVersion = useCardStore((s) => s._snapshotVersion);

  const resetCard = useCardStore((s) => s.resetCard);
  const enteredBlank = useRef(!loadId);
  useEffect(() => {
    if (enteredBlank.current) {
      resetCard();
    }
  }, [resetCard]);

  useEffect(() => {
    if (!loadId) return;
    let cancelled = false;

    const uidPromise = editId ? getCurrentUid() : null;
    const cached = useCardStore.getState().sourceCard;
    const cardPromise = cached?.id === loadId ? Promise.resolve(cached) : fetchCard(loadId);
    cardPromise
      .then(async (card) => {
        if (cancelled) return;
        if (!card) {
          setError('Card not found');
          setLoading(false);
          return;
        }
        useCardStore.getState().setSourceCard(card);
        if (editId) {
          const uid = await uidPromise;
          if (cancelled) return;
          if (!card.ownerUid || card.ownerUid !== uid) {
            setSearchParams({ remix: editId }, { replace: true });
            return;
          }
        }
        const [cardArtUrl, popOutUrl] = await Promise.all([
          localize(card.cardArtUrl, 'card art'),
          localize(card.popOutUrl ?? null, 'pop-out layer'),
        ]);
        if (cancelled) return;
        loadSnapshot({ ...card, cardArtUrl, popOutUrl });
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Card load failed:', err);
          setError('Failed to load card');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [loadId, editId, loadSnapshot, setSearchParams]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-navy-950 text-gold-400">
        Loading card...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-dvh items-center justify-center bg-navy-950 text-red-400">
        {error}
      </div>
    );
  }

  return <CardEditor key={snapshotVersion} />;
}
