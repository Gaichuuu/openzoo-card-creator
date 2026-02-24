import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SavedCard } from '@/types/card';
import { fetchCards } from '@/lib/galleryService';
import { GalleryCard, GalleryCardSkeleton } from './GalleryCard';
import { CardDetailModal } from './CardDetailModal';
import type { CardType, Element } from '@/types/card';
import { CARD_TAGS } from '@/types/card';

const CARD_TYPES: CardType[] = ['Beastie', 'Spell', 'Artifact', 'Potion', 'Aura', 'Terra', 'Special Aura', 'Special Terra'];
const ELEMENTS: Element[] = ['Cosmic', 'Dark', 'Earth', 'Flame', 'Forest', 'Frost', 'Light', 'Lightning', 'Neutral', 'Spirit', 'Water'];

export function GalleryPage() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterElement, setFilterElement] = useState<string>('');
  const [filterTag, setFilterTag] = useState<string>('');
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    setError(false);
    fetchCards({ cardType: filterType || undefined, element: filterElement || undefined, tag: filterTag || undefined })
      .then((result) => {
        setCards(result);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [filterType, filterElement, filterTag]);

  const filteredCards = searchName
    ? cards.filter((c) => c.cardName.toLowerCase().includes(searchName.toLowerCase()))
    : cards;

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Header + Filters (single sticky row) */}
      <div className="sticky top-0 z-10 bg-navy-950 px-6 py-3 flex items-center gap-4 border-b-gold">
        <Link to="/" className="hover:opacity-80 transition-opacity shrink-0">
          <img src="/assets/ozLogo.png" alt="OpenZoo" className="h-7" />
        </Link>
        <h1 className="text-xl font-bold shrink-0">Gallery</h1>

        <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-navy-800 text-white text-sm px-3 py-1.5"
          >
            <option value="">Types</option>
            {CARD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={filterElement}
            onChange={(e) => setFilterElement(e.target.value)}
            className="bg-navy-800 text-white text-sm px-3 py-1.5"
          >
            <option value="">Aura</option>
            {ELEMENTS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-navy-800 text-white text-sm px-3 py-1.5"
          >
            <option value="">Tags</option>
            {CARD_TAGS.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Search by name..."
            maxLength={50}
            className="bg-navy-800 text-white text-sm px-3 py-1.5 w-44"
          />

          {(filterType || filterElement || filterTag || searchName) && (
            <button
              onClick={() => { setFilterType(''); setFilterElement(''); setFilterTag(''); setSearchName(''); }}
              className="text-xs text-gold-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <Link
          to="/create"
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors border-gold shrink-0"
        >
          Create a Card
        </Link>
      </div>

      {/* Grid */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {Array.from({ length: 16 }, (_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-12">Failed to load cards. Check your connection and try again.</div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center text-gold-400 py-12">
            {cards.length === 0 ? 'No cards published yet.' : 'No cards match your filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {filteredCards.map((card) => (
              <GalleryCard
                key={card.id}
                card={card}
                onClick={() => setSelectedCard(card)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
