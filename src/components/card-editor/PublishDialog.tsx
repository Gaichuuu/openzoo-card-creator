import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCardStore } from '@/lib/store';
import { publishCard } from '@/lib/galleryService';
import { exportStandardPng, displayCardName } from '@/lib/exportUtils';
import { CARD_TAGS, TAG_COLORS } from '@/types/card';
import type { CardTag, SavedCard } from '@/types/card';
import { readLocalStorage, writeLocalStorage } from '@/lib/safeStorage';
import { applyTextStroke } from '@/lib/textWeightCalibration';

interface PublishDialogProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  remixedFrom?: string | null;
  remixedFromName?: string;
  initialTags?: CardTag[];
  editCard?: SavedCard | null;
}

export function PublishDialog({ cardRef, onClose, remixedFrom, remixedFromName, initialTags, editCard }: PublishDialogProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const isUpdate = !!editCard;
  const getSnapshot = useCardStore((s) => s.getSnapshot);
  const artNeeded = useCardStore((s) => s.artNeeded);
  const cardName = useCardStore((s) => s.cardName);
  const [creatorName, setCreatorName] = useState(() =>
    editCard?.creatorName || readLocalStorage('openzoo-creator-name') || '');
  const [selectedTags, setSelectedTags] = useState<CardTag[]>(() => {
    const tags = [...(editCard ? editCard.tags : (initialTags || []))];
    if (artNeeded && !tags.includes('Art Needed')) tags.push('Art Needed');
    if (!artNeeded) return tags.filter(t => t !== 'Art Needed');
    return tags;
  });
  const [publishing, setPublishing] = useState(false);
  const publishingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  async function handlePublish() {
    if (!cardRef.current || publishingRef.current) return;
    publishingRef.current = true;
    setPublishing(true);
    setError(null);

    try {
      cardRef.current.classList.add('card-exporting');
      await applyTextStroke(cardRef.current);
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
        existingCard: editCard ?? undefined,
      });

      const prevSource = useCardStore.getState().sourceCard;
      if (prevSource && prevSource.id === cardId) {
        useCardStore.getState().setSourceCard({
          ...prevSource,
          ...snapshot,
          creatorName: creatorName.trim(),
          tags: selectedTags,
          updatedAt: new Date(),
        });
      }

      if (!import.meta.env.DEV && !isUpdate) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId }),
        }).catch(() => {});
      }

      const trimmed = creatorName.trim();
      if (trimmed) writeLocalStorage('openzoo-creator-name', trimmed);

      setPublishedId(cardId);
      setSuccess(true);
    } catch (err) {
      console.error('Publish failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to ${isUpdate ? 'update' : 'publish'}: ${msg}`);
    } finally {
      cardRef.current?.classList.remove('card-exporting');
      publishingRef.current = false;
      setPublishing(false);
    }
  }

  function closeAfterSuccess() {
    setSearchParams({}, { replace: true });
    useCardStore.getState().resetCard();
    onClose();
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape' || publishingRef.current) return;
      if (success) closeAfterSuccess();
      else onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [success, onClose]);

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        onClick={(e) => { if (e.target === e.currentTarget) closeAfterSuccess(); }}
      >
        <div className="relative bg-navy-900 max-w-140 w-full mx-4 border-gold">
          <div className="flex items-center justify-end pt-3 px-3.5">
            <button
              onClick={closeAfterSuccess}
              className="w-7.5 h-7.5 flex items-center justify-center text-gold-400 hover:text-white transition-colors text-[22px] leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <div className="px-8.5 pt-1.5 pb-8.5 text-center">
            <h3 className="text-gold-gradient font-title font-normal text-[28px] m-0 mb-3">{isUpdate ? 'Updated' : 'Published'}</h3>
            <p className="text-sm text-gray-400 m-0 mb-6">
              {displayCardName(cardName) || 'Your card'} {isUpdate ? 'has been updated in the gallery.' : 'has been published to the gallery.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate(publishedId ? `/gallery/${publishedId}` : '/gallery')}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors border-gold"
              >
                View in Gallery
              </button>
              <button
                onClick={closeAfterSuccess}
                className="px-6 py-2.5 bg-navy-800 hover:bg-navy-700 text-gold-300 text-sm font-semibold transition-colors border-gold"
              >
                Make another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget && !publishing) onClose(); }}
    >
      <div className="relative bg-navy-900 max-w-140 w-full mx-4 border-gold">
        <button
          onClick={() => { if (!publishing) onClose(); }}
          className="absolute top-2 right-2.5 w-7.5 h-7.5 flex items-center justify-center text-gold-400 hover:text-white transition-colors text-[22px] leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <div className="pt-5 px-6.5 pb-4 border-b border-navy-600">
          <h2 className="text-gold-gradient font-title font-normal text-2xl m-0 mr-8.5">{isUpdate ? 'Update your Card' : 'Add to the Gallery'}</h2>
        </div>

        <div className="pt-5.5 px-6.5 pb-6 flex flex-col gap-5.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gold-400 uppercase tracking-widest">
              Created by (optional)
            </label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="Nickname"
              maxLength={40}
              className="w-full bg-navy-950 text-white text-[15px] px-3 py-2.5"
            />
            <p className="text-[11px] text-gray-500 m-0">Username shown on the published card.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-gold-400 uppercase tracking-widest">
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-1.75">
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
                    className={`text-xs px-3 py-1.25 border transition-colors ${
                      active
                        ? `${colors.bg} ${colors.text} border-transparent`
                        : 'bg-transparent text-gray-400 border-navy-600 hover:border-gold-500 hover:text-gray-300'
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
        </div>

        <div className="flex items-center justify-end px-6.5 py-4 border-t border-navy-600 bg-navy-950">
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-7.5 py-2.75 bg-green-600 hover:bg-green-500 disabled:bg-navy-600 disabled:cursor-not-allowed text-white font-semibold transition-colors text-sm border-gold"
          >
            {publishing ? (
              <>
                <svg className="inline-block w-4 h-4 mr-1.5 -mt-0.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {isUpdate ? 'Updating...' : 'Publishing...'}
              </>
            ) : isUpdate ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
