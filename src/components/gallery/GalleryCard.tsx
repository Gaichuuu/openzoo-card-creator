import { useState } from 'react';
import type { SavedCard } from '@/types/card';

interface GalleryCardProps {
  card: SavedCard;
  onClick: () => void;
}

export function GalleryCard({ card, onClick }: GalleryCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      className="transition-all cursor-pointer hover:scale-105"
    >
      {card.thumbnailUrl ? (
        <div className="relative aspect-238/333">
          {!loaded && (
            <div className="absolute inset-0 rounded-xl bg-navy-800 animate-pulse" />
          )}
          <img
            src={card.thumbnailUrl}
            alt={card.cardName}
            className={`absolute inset-0 w-full h-full object-cover border border-navy-600 rounded-xl transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        </div>
      ) : (
        <div className="aspect-238/333 bg-navy-800 rounded-xl flex items-center justify-center text-gray-400 text-xs">
          No preview
        </div>
      )}
    </button>
  );
}

export function GalleryCardSkeleton() {
  return (
    <div className="aspect-238/333 rounded-xl bg-navy-800 animate-pulse" />
  );
}
