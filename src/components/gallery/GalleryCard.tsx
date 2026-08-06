import { useState } from 'react';
import type { SavedCard } from '@/types/card';
import { displayCardName } from '@/lib/exportUtils';

interface GalleryCardProps {
  card: SavedCard;
  onClick: () => void;
}

export function GalleryCard({ card, onClick }: GalleryCardProps) {
  const [loaded, setLoaded] = useState(false);
  const artNeeded = card.tags.includes('Art Needed');
  const borderClass = artNeeded ? 'border-red-900' : 'border-navy-600';

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1.5 text-left transition-all cursor-pointer hover:scale-105"
    >
      <div className="relative aspect-238/333">
        {card.thumbnailUrl ? (
          <>
            {!loaded && (
              <div className="card-thumb-round absolute inset-0 bg-navy-800 animate-pulse" />
            )}
            <img
              src={card.thumbnailUrl}
              alt={card.cardName}
              className={`card-thumb-round absolute inset-0 w-full h-full object-cover border ${borderClass} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
          </>
        ) : (
          <div className={`card-thumb-round w-full h-full bg-navy-800 border ${borderClass} flex items-center justify-center text-gray-400 text-xs`}>
            No preview
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.75 min-w-0">
        <span className="text-xs text-gray-300 truncate">{displayCardName(card.cardName)}</span>
        {card.creatorName && (
          <span className="text-[11px] text-gray-500 truncate shrink-0 max-w-[45%]">@{card.creatorName}</span>
        )}
      </div>
    </button>
  );
}

export function GalleryCardSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="card-thumb-round aspect-238/333 bg-navy-800 animate-pulse" />
      <div className="h-3 w-2/3 rounded bg-navy-800 animate-pulse" />
    </div>
  );
}
