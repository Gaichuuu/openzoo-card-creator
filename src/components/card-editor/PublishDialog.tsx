import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCardStore } from '@/lib/store';
import { publishCard } from '@/lib/galleryService';
import { exportStandardPng } from '@/lib/exportUtils';
import { CARD_TAGS, TAG_COLORS } from '@/types/card';
import type { CardTag } from '@/types/card';

interface PublishDialogProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  remixedFrom?: string | null;
  remixedFromName?: string;
  initialTags?: CardTag[];
}

export function PublishDialog({ cardRef, onClose, remixedFrom, remixedFromName, initialTags }: PublishDialogProps) {
  const navigate = useNavigate();
  const getSnapshot = useCardStore((s) => s.getSnapshot);
  const [creatorName, setCreatorName] = useState(() => localStorage.getItem('openzoo-creator-name') || '');
  const [selectedTags, setSelectedTags] = useState<CardTag[]>(initialTags || []);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  async function handlePublish() {
    if (!cardRef.current) return;
    setPublishing(true);
    setError(null);

    try {
      cardRef.current.classList.add('card-exporting');
      const rawDataUrl = await exportStandardPng(cardRef.current, false);
      const thumbnailDataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext('2d');
          if (!ctx) { reject(new Error('canvas context')); return; }
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = rawDataUrl;
      });

      const snapshot = getSnapshot();

      const cardId = await publishCard(snapshot, thumbnailDataUrl, {
        creatorName: creatorName.trim(),
        tags: selectedTags,
        remixedFrom: remixedFrom || null,
        remixedFromName: remixedFromName || '',
      });

      const trimmed = creatorName.trim();
      if (trimmed) localStorage.setItem('openzoo-creator-name', trimmed);

      setPublishedId(cardId);
      setSuccess(true);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Publish failed:', err);
      setError('Failed to publish. Make sure Firebase is configured.');
    } finally {
      cardRef.current?.classList.remove('card-exporting');
      setPublishing(false);
    }
  }

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        onClick={(e) => { if (e.target === e.currentTarget) { useCardStore.getState().resetCard(); onClose(); } }}
      >
        <div className="relative bg-navy-900 p-6 max-w-sm w-full mx-4 text-center space-y-4 border-gold">
          <button
            onClick={() => { useCardStore.getState().resetCard(); onClose(); }}
            className="absolute top-3 right-3 text-gold-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
          <div className="text-green-400 text-lg font-semibold">Published!</div>
          <p className="text-gold-400 text-sm">Your card is now in the gallery.</p>
          <button
            onClick={() => navigate(publishedId ? `/gallery/${publishedId}` : '/gallery')}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors text-sm border-gold"
          >
            View in Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-navy-900 p-6 max-w-sm w-full mx-4 space-y-4 border-gold">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gold-400 hover:text-white transition-colors text-xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-lg font-bold text-white">Publish to Gallery</h2>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
            Created by (optional)
          </label>
          <input
            type="text"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="Nickname"
            maxLength={40}
            className="w-full bg-navy-800 border border-navy-600 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
            Tags (optional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CARD_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              const colors = TAG_COLORS[tag];
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTags((prev) =>
                    active ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    active
                      ? `${colors.bg} ${colors.text} border-transparent`
                      : 'bg-navy-800 text-gold-400 border-navy-600 hover:border-navy-600'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <div className="pt-2">
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-navy-600 disabled:cursor-not-allowed text-white font-semibold transition-colors text-sm border-gold"
          >
            {publishing ? (
              <>
                <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Publishing...
              </>
            ) : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
