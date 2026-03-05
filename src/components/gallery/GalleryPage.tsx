import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import type { SavedCard, CardType, Element, CardTag } from '@/types/card';
import { fetchCards, fetchCard, type PageCursor } from '@/lib/galleryService';
import { GalleryCard, GalleryCardSkeleton } from './GalleryCard';
import { CardDetailModal } from './CardDetailModal';
import { CARD_TAGS } from '@/types/card';
import { CARD_TYPES, ELEMENTS } from '@/data/constants';

const GALLERY_ELEMENTS = ELEMENTS.filter((e) => e !== 'Special');
const GRID_CLASS = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4';

export function GalleryPage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const navigate = useNavigate();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [filterType, setFilterType] = useState<CardType | ''>('');
  const [filterElement, setFilterElement] = useState<Element | ''>('');
  const [filterTag, setFilterTag] = useState<CardTag | ''>('');
  const [searchName, setSearchName] = useState('');
  const [cursor, setCursor] = useState<PageCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const buildFilters = useCallback(() => ({
    cardType: filterType || undefined,
    element: filterElement || undefined,
    tag: filterTag || undefined,
  }), [filterType, filterElement, filterTag]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setCards([]);
    setCursor(null);
    setHasMore(false);
    fetchCards(buildFilters())
      .then((result) => {
        setCards(result.cards);
        setCursor(result.cursor);
        setHasMore(result.hasMore);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [buildFilters]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || !cursor) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const result = await fetchCards(buildFilters(), cursor);
      setCards((prev) => [...prev, ...result.cards]);
      setCursor(result.cursor);
      setHasMore(result.hasMore);
    } catch {
      // User can scroll again to retry
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, cursor, buildFilters]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    if (!cardId) {
      setSelectedCard(null);
      setLoadingCard(false);
      return;
    }
    const existing = cards.find((c) => c.id === cardId);
    if (existing) {
      setSelectedCard(existing);
      setLoadingCard(false);
      return;
    }
    let stale = false;
    setLoadingCard(true);
    fetchCard(cardId).then((card) => {
      if (stale) return;
      if (card) setSelectedCard(card);
      else navigate('/gallery', { replace: true });
    }).finally(() => { if (!stale) setLoadingCard(false); });
    return () => { stale = true; };
  }, [cardId, cards, navigate]);

  const filteredCards = searchName
    ? cards.filter((c) => c.cardName.toLowerCase().includes(searchName.toLowerCase()))
    : cards;

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Header + Filters */}
      <div className="sticky top-0 z-10 bg-navy-950 px-6 py-3 flex items-center gap-4 border-b-gold">
        <Link to="/" className="hover:opacity-80 transition-opacity shrink-0">
          <img src="/assets/ozLogo.png" alt="OpenZoo" className="h-7" />
        </Link>
        <h1 className="text-xl font-bold shrink-0">Gallery</h1>

        <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as CardType | '')}
            className="bg-navy-800 text-white text-sm px-3 py-1.5"
          >
            <option value="">Types</option>
            {CARD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={filterElement}
            onChange={(e) => setFilterElement(e.target.value as Element | '')}
            className="bg-navy-800 text-white text-sm px-3 py-1.5"
          >
            <option value="">Aura</option>
            {GALLERY_ELEMENTS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value as CardTag | '')}
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
            placeholder="Search..."
            maxLength={50}
            className="bg-navy-800 text-white text-sm px-3 py-1.5 w-64"
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
          Card Creator
        </Link>
      </div>

      {/* Grid */}
      <div className="p-6">
        {loading ? (
          !cardId && (
            <div className={GRID_CLASS}>
              {Array.from({ length: 24 }, (_, i) => (
                <GalleryCardSkeleton key={i} />
              ))}
            </div>
          )
        ) : error ? (
          <div className="text-center text-red-400 py-12">Failed to load cards. Check your connection and try again.</div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center text-gold-400 py-12">
            {cards.length === 0 ? 'No cards published yet.' : 'No cards match your filters.'}
          </div>
        ) : (
          <div className={GRID_CLASS}>
            {filteredCards.map((card) => (
              <GalleryCard
                key={card.id}
                card={card}
                onClick={() => navigate(`/gallery/${card.id}`)}
              />
            ))}
          </div>
        )}
        {!loading && !error && hasMore && !searchName && (
          <div ref={sentinelRef} className="h-1" />
        )}
        {loadingMore && (
          <div className={`${GRID_CLASS} pt-4`}>
            {Array.from({ length: 8 }, (_, i) => (
              <GalleryCardSkeleton key={i} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedCard ? (
        <CardDetailModal
          card={selectedCard}
          onClose={() => navigate('/gallery')}
        />
      ) : loadingCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => navigate('/gallery')}
        >
          <div className="flex gap-6 items-start mx-4 pointer-events-none">
            <div className="shrink-0 rounded-3xl bg-navy-800 animate-pulse" style={{ maxHeight: '80vh', aspectRatio: '238/333', width: 'auto', height: '80vh' }} />
            <div className="bg-navy-900 p-5 w-72 space-y-4 pointer-events-auto border-gold">
              <div className="h-5 w-40 bg-navy-700 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-navy-700 rounded animate-pulse" />
                <div className="h-5 w-16 bg-navy-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-32 bg-navy-700 rounded animate-pulse" />
              <div className="space-y-2 pt-2">
                <div className="h-9 w-full bg-navy-700 rounded animate-pulse" />
                <div className="h-9 w-full bg-navy-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
