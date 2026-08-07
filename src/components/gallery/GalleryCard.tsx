import { memo, useState } from 'react';
import type { SavedCard } from '@/types/card';
import { displayCardName } from '@/lib/exportUtils';

export function CardThumb({ url, alt, roundedClass = 'card-thumb-round', borderClass = 'border-navy-600' }: {
  url: string;
  alt: string;
  roundedClass?: string;
  borderClass?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className="relative block w-full aspect-238/333">
      {!loaded && (
        <span className={`${roundedClass} absolute inset-0 block border ${borderClass} bg-navy-800 animate-pulse`} />
      )}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`${roundedClass} absolute inset-0 w-full h-full object-cover border ${borderClass} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  );
}

export function CardCaption({ card, className = 'gap-1.75' }: { card: SavedCard; className?: string }) {
  return (
    <span className={`flex items-baseline min-w-0 ${className}`}>
      <span className="text-xs text-gray-300 truncate">{displayCardName(card.cardName)}</span>
      {card.creatorName && (
        <span className="text-[11px] text-gray-500 truncate shrink-0 max-w-[45%]">@{card.creatorName}</span>
      )}
    </span>
  );
}

interface GalleryCardProps {
  card: SavedCard;
  onOpen: (id: string) => void;
}

export const GalleryCard = memo(function GalleryCard({ card, onOpen }: GalleryCardProps) {
  const borderClass = card.artNeeded ? 'border-red-900' : 'border-navy-600';

  return (
    <button
      onClick={() => onOpen(card.id)}
      className="flex flex-col gap-1.5 text-left transition-all cursor-pointer hover:scale-105"
    >
      {card.thumbnailUrl ? (
        <CardThumb url={card.thumbnailUrl} alt={card.cardName} borderClass={borderClass} />
      ) : (
        <div className={`card-thumb-round w-full aspect-238/333 bg-navy-800 border ${borderClass} flex items-center justify-center text-gray-400 text-xs`}>
          No preview
        </div>
      )}
      <CardCaption card={card} />
    </button>
  );
});

export function GalleryCardSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="card-thumb-round aspect-238/333 bg-navy-800 animate-pulse" />
      <div className="h-3 w-2/3 rounded bg-navy-800 animate-pulse" />
    </div>
  );
}
