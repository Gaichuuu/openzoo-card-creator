import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CardEditor } from './CardEditor';
import { useCardStore } from '@/lib/store';
import { fetchCard } from '@/lib/galleryService';

export function CreatePage() {
  const [searchParams] = useSearchParams();
  const remixId = searchParams.get('remix');
  const [loading, setLoading] = useState(!!remixId);
  const [error, setError] = useState<string | null>(null);
  const loadSnapshot = useCardStore((s) => s.loadSnapshot);
  const snapshotVersion = useCardStore((s) => s._snapshotVersion);

  const resetCard = useCardStore((s) => s.resetCard);
  useEffect(() => {
    if (!remixId) {
      resetCard();
    }
  }, [remixId, resetCard]);

  useEffect(() => {
    if (!remixId) return;
    let cancelled = false;

    fetchCard(remixId)
      .then(async (card) => {
        if (cancelled) return;
        if (!card) {
          setError('Card not found');
          setLoading(false);
          return;
        }
        let cardArtUrl = card.cardArtUrl;
        if (cardArtUrl && cardArtUrl.startsWith('http')) {
          try {
            const r = await fetch(cardArtUrl);
            const blob = await r.blob();
            if (cancelled) return;
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            if (cancelled) return;
            cardArtUrl = dataUrl;
          } catch {
            console.warn(
              'Could not fetch card art for remix (CORS). ' +
              'Run: gsutil cors set cors.json gs://openzoo.firebasestorage.app'
            );
          }
        }
        if (cancelled) return;
        loadSnapshot({ ...card, cardArtUrl });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load card');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [remixId, loadSnapshot]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy-950 text-gold-400">
        Loading card...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy-950 text-red-400">
        {error}
      </div>
    );
  }

  return <CardEditor key={snapshotVersion} />;
}
