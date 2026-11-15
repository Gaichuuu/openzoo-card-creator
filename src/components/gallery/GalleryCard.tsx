import { memo, useState } from 'react';
import type { SavedCard } from '@/types/card';
import { displayCardName } from '@/lib/exportUtils';
import { gridThumbOf } from '@/lib/gridThumb';
import { rememberCardOrigin } from '@/lib/cardFlight';

export function CardThumb({ url, alt, roundedClass = 'card-thumb-round', priority = false }: {
  url: string;
  alt: string;
  roundedClass?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span data-card-thumb className="relative block w-full aspect-238/333">
      {!loaded && (
        <span className={`${roundedClass} absolute inset-0 block border border-navy-600 bg-navy-800 animate-pulse`} />
      )}
      <img
        src={url}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`${roundedClass} absolute inset-0 w-full h-full object-cover border border-navy-600 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  );
}

export function CardCaption({ card, className = 'gap-1.75' }: { card: SavedCard; className?: string }) {
  return (
    <span className={`flex items-baseline min-w-0 ${className}`}>
      <span className="text-sm text-gray-300 truncate">{displayCardName(card.cardName)}</span>
      {card.creatorName && (
        <span className="text-xs text-gray-500 truncate shrink-0 max-w-[45%]">@{card.creatorName}</span>
      )}
    </span>
  );
}

interface GalleryCardProps {
  card: SavedCard;
  onOpen: (id: string) => void;
  priority?: boolean;
}

export const GalleryCard = memo(function GalleryCard({ card, onOpen, priority = false }: GalleryCardProps) {
  return (
    <button
      onClick={(e) => {
        rememberCardOrigin(card.id, e.currentTarget.querySelector<HTMLElement>('[data-card-thumb]'));
        onOpen(card.id);
      }}
      className="flex flex-col gap-1.5 text-left cursor-pointer transition-transform duration-200 ease-snap hover:scale-105 active:scale-[1.02]"
    >
      {card.thumbnailUrl ? (
        <CardThumb url={gridThumbOf(card)} alt={card.cardName} priority={priority} />
      ) : (
        <div data-card-thumb className="card-thumb-round w-full aspect-238/333 bg-navy-800 border border-navy-600 flex items-center justify-center text-gray-400 text-xs">
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
