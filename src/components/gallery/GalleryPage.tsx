import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { SavedCard, CardType, Element, CardTag } from '@/types/card';
import {
  fetchCards,
  fetchCard,
  fetchGalleryCounts,
  fetchFilteredCount,
  type GalleryCounts,
  type GallerySort,
  type PageCursor,
} from '@/lib/galleryService';
import { GalleryCard, GalleryCardSkeleton } from './GalleryCard';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CardBackBackdrop } from '@/components/CardBackBackdrop';
import { CardDetailModal, MODAL_CONTAINER_CLASS, MODAL_CARD_CLASS, MODAL_DETAILS_CLASS } from './CardDetailModal';
import { CARD_TAGS } from '@/types/card';
import { CARD_TYPES, ELEMENTS, TERRAS, TRAITS } from '@/data/constants';
import { useLocalStorageState } from '@/lib/useLocalStorageState';
import { useAuthUid, useAuthReady } from '@/lib/auth';
import { buildCardSearchText } from '@/lib/cardSearchText';

const FACET_ORDER: Element[] = [
  'Dark', 'Light', 'Water', 'Flame', 'Forest', 'Frost',
  'Earth', 'Lightning', 'Spirit', 'Cosmic', 'Neutral',
];
const FACET_ELEMENTS: Element[] = [
  ...FACET_ORDER,
  ...ELEMENTS.filter((e) => e !== 'Special' && !FACET_ORDER.includes(e)),
];

const GRID_LARGE = 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6';
const GRID_COMFORTABLE = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4.5';
const GRID_COMPACT = 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2.5';

const FACET_HEADING_CLASS = 'font-title text-[10px] text-gold-400 uppercase tracking-[.16em] mb-2.5';
const DENSITY_BUTTON_CLASS = 'px-2.25 py-0.75 rounded-[3px] cursor-pointer';

type Density = 'large' | 'comfortable' | 'compact';

const SORT_KEY = 'openzoo-gallery-sort';
const DENSITY_KEY = 'openzoo-gallery-density';

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: 'large', label: 'L' },
  { value: 'comfortable', label: 'M' },
  { value: 'compact', label: 'S' },
];

interface FacetSectionsProps {
  counts: GalleryCounts | null;
  myCount: number;
  filterMine: boolean;
  setFilterMine: (mine: boolean) => void;
  filterTag: CardTag | '';
  setFilterTag: (tag: CardTag | '') => void;
  filterElement: Element | '';
  setFilterElement: (el: Element | '') => void;
  filterType: CardType | '';
  setFilterType: (type: CardType | '') => void;
  filterTerra: string;
  setFilterTerra: (terra: string) => void;
  filterTrait: string;
  setFilterTrait: (trait: string) => void;
}

/** Icon + label + count */
function FacetIconRow({ icon, label, count, active, onClick }: {
  icon: string;
  label: string;
  count: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 cursor-pointer transition-colors ${active ? 'text-gold-400' : 'text-gray-400 hover:text-gold-100'}`}
    >
      <img src={icon} alt="" className="w-4.5 h-4.5 object-contain shrink-0" />
      <span className="truncate">{label}</span>
      <span className="ml-auto text-gray-400">{count}</span>
    </button>
  );
}

const defaultFacetClass = (isActive: boolean) =>
  (isActive ? 'text-gold-400' : 'text-gray-400 hover:text-gold-100');

function FacetList<T extends string>({ title, items, active, onSelect, countFor }: {
  title: string;
  items: readonly T[];
  active: T | '';
  onSelect: (item: T | '') => void;
  countFor: (item: T) => number | undefined;
}) {
  return (
    <div>
      <div className={FACET_HEADING_CLASS}>{title}</div>
      <div className="flex flex-col gap-1.75 text-sm">
        {items.map((item) => {
          const isActive = active === item;
          return (
            <button
              key={item}
              onClick={() => onSelect(isActive ? '' : item)}
              className={`flex justify-between cursor-pointer transition-colors ${defaultFacetClass(isActive)}`}
            >
              <span>{item}</span>
              <span className="text-gray-400">{countFor(item) ?? ''}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const FacetSections = memo(function FacetSections({
  counts, myCount, filterMine, setFilterMine,
  filterTag, setFilterTag, filterElement, setFilterElement, filterType, setFilterType,
  filterTerra, setFilterTerra, filterTrait, setFilterTrait,
}: FacetSectionsProps) {
  const countOf = (n: number | undefined) => (n === undefined ? '' : String(n));
  const usedTerras = TERRAS.filter((terra) => counts !== null && (counts.byTerra[terra] ?? 1) > 0);
  const usedTraits = TRAITS.filter((trait) => counts !== null && (counts.byTrait[trait] ?? 1) > 0);
  return (
    <>
      {myCount > 0 && (
        <div>
          <div className="flex flex-col gap-1.75 text-sm">
            <button
              onClick={() => setFilterMine(!filterMine)}
              className={`flex justify-between cursor-pointer transition-colors ${defaultFacetClass(filterMine)}`}
            >
              <span>My Cards</span>
              <span className="text-gray-400">{myCount || ''}</span>
            </button>
          </div>
        </div>
      )}

      <FacetList
        title="Filter"
        items={CARD_TAGS}
        active={filterTag}
        onSelect={setFilterTag}
        countFor={(tag) => counts?.byTag[tag]}
      />

      <FacetList
        title="Page type"
        items={CARD_TYPES}
        active={filterType}
        onSelect={setFilterType}
        countFor={(type) => counts?.byType[type]}
      />

      <div>
        <div className={FACET_HEADING_CLASS}>Aura</div>
        <div className="flex flex-col gap-1.75 text-sm">
          {FACET_ELEMENTS.map((element) => (
            <FacetIconRow
              key={element}
              icon={`/assets/AuraSymbols/${element}.png`}
              label={element}
              count={countOf(counts?.byElement[element])}
              active={filterElement === element}
              onClick={() => setFilterElement(filterElement === element ? '' : element)}
            />
          ))}
        </div>
      </div>

      {usedTerras.length > 0 && (
        <div>
          <div className={FACET_HEADING_CLASS}>Terra</div>
          <div className="flex flex-col gap-1.75 text-sm">
            {usedTerras.map((terra) => (
              <FacetIconRow
                key={terra}
                icon={`/assets/TerraNoGlow/${encodeURIComponent(terra)}.png`}
                label={terra}
                count={countOf(counts?.byTerra[terra])}
                active={filterTerra === terra}
                onClick={() => setFilterTerra(filterTerra === terra ? '' : terra)}
              />
            ))}
          </div>
        </div>
      )}

      {usedTraits.length > 0 && (
        <div>
          <div className={FACET_HEADING_CLASS}>Traits</div>
          <div className="flex flex-col gap-1.75 text-sm">
            {usedTraits.map((trait) => (
              <FacetIconRow
                key={trait}
                icon={`/assets/TraitsNoGlow/${encodeURIComponent(trait)}.png`}
                label={trait}
                count={countOf(counts?.byTrait[trait])}
                active={filterTrait === trait}
                onClick={() => setFilterTrait(filterTrait === trait ? '' : trait)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
});

export function GalleryPage() {
  const { cardId } = useParams<{ cardId?: string }>();
  const navigate = useNavigate();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchName, setSearchName] = useState('');
  const uid = useAuthUid();
  const authReady = useAuthReady();
  const [myCount, setMyCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!uid) { setMyCount(0); return; }
    let stale = false;
    fetchFilteredCount({ ownerUid: uid })
      .then((n) => { if (!stale) setMyCount(n); })
      .catch(() => {});
    return () => { stale = true; };
  }, [uid, refreshKey]);

  const filterType = (searchParams.get('type') || '') as CardType | '';
  const filterElement = (searchParams.get('aura') || '') as Element | '';
  const filterTag = (searchParams.get('tag') || '') as CardTag | '';
  const filterTerra = filterTag ? '' : searchParams.get('terra') || '';
  const filterTrait = filterTag || filterTerra ? '' : searchParams.get('trait') || '';
  const filterMine = searchParams.get('mine') === '1';

  const updateParams = useCallback((updates: Record<string, string>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setFilterType = useCallback((type: CardType | '') => updateParams({ type, mine: '' }), [updateParams]);
  const setFilterElement = useCallback((aura: Element | '') => updateParams({ aura, mine: '' }), [updateParams]);
  const setFilterTag = useCallback(
    (tag: CardTag | '') => updateParams(tag ? { tag, terra: '', trait: '', mine: '' } : { tag }),
    [updateParams],
  );
  const setFilterTerra = useCallback(
    (terra: string) => updateParams(terra ? { terra, tag: '', trait: '', mine: '' } : { terra }),
    [updateParams],
  );
  const setFilterTrait = useCallback(
    (trait: string) => updateParams(trait ? { trait, tag: '', terra: '', mine: '' } : { trait }),
    [updateParams],
  );
  const setFilterMine = useCallback(
    (mine: boolean) => updateParams(mine
      ? { mine: '1', type: '', aura: '', tag: '', terra: '', trait: '' }
      : { mine: '' }),
    [updateParams],
  );
  const clearFilters = useCallback(
    () => updateParams({ type: '', aura: '', tag: '', terra: '', trait: '', mine: '' }),
    [updateParams],
  );

  const openCard = useCallback(
    (id: string) => navigate({ pathname: `/gallery/${id}`, search: searchParams.toString() }),
    [navigate, searchParams],
  );
  const closeModal = useCallback(
    (replace?: boolean) => navigate({ pathname: '/gallery', search: searchParams.toString() }, { replace }),
    [navigate, searchParams],
  );

  const [sort, setSort] = useLocalStorageState<GallerySort>(
    SORT_KEY, (v) => (v === 'name' ? 'name' : 'newest'), (v) => v,
  );
  const [density, setDensity] = useLocalStorageState<Density>(
    DENSITY_KEY, (v) => (v === 'large' || v === 'compact' ? v : 'comfortable'), (v) => v,
  );
  const [counts, setCounts] = useState<GalleryCounts | null>(null);
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [cursor, setCursor] = useState<PageCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const queryGenRef = useRef(0);

  useEffect(() => {
    if ((loadingCard && !selectedCard) || mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [loadingCard, selectedCard, mobileFiltersOpen]);

  useEffect(() => {
    fetchGalleryCounts({
      tags: CARD_TAGS,
      cardTypes: CARD_TYPES,
      elements: FACET_ELEMENTS,
      terras: TERRAS,
      traits: TRAITS,
    })
      .then(setCounts)
      .catch((err) => console.error('Gallery counts failed:', err));
  }, []);

  const mineUid = filterMine ? uid : null;
  const buildFilters = useCallback(() => ({
    cardType: filterType || undefined,
    element: filterElement || undefined,
    tag: filterTag || undefined,
    terra: filterTerra || undefined,
    trait: filterTrait || undefined,
    ownerUid: mineUid || undefined,
  }), [filterType, filterElement, filterTag, filterTerra, filterTrait, mineUid]);

  const activeFilterCount = [filterType, filterElement, filterTag, filterTerra, filterTrait].filter(Boolean).length + (filterMine ? 1 : 0);
  const hasFilters = activeFilterCount > 0;

  useEffect(() => {
    const gen = ++queryGenRef.current;
    setError(false);
    setCards([]);
    setCursor(null);
    setHasMore(false);
    if (filterMine && !mineUid) {
      setLoading(!authReady);
      return;
    }
    setLoading(true);
    fetchCards(buildFilters(), null, undefined, sort)
      .then((result) => {
        if (queryGenRef.current !== gen) return;
        setCards(result.cards);
        setCursor(result.cursor);
        setHasMore(result.hasMore);
        setLoading(false);
      })
      .catch((err) => {
        if (queryGenRef.current !== gen) return;
        console.error('Gallery fetch failed:', err);
        setError(true);
        setLoading(false);
      });
  }, [buildFilters, sort, refreshKey, filterMine, mineUid, authReady]);

  useEffect(() => {
    if (!hasFilters) { setFilteredCount(null); return; }
    if (filterMine && !mineUid) { setFilteredCount(authReady ? 0 : null); return; }
    const facetCount = [filterType, filterElement, filterTag, filterTerra, filterTrait].filter(Boolean).length;
    if (facetCount === 1 && !filterMine && counts) {
      const cached =
        filterTag ? counts.byTag[filterTag]
        : filterType ? counts.byType[filterType]
        : filterElement ? counts.byElement[filterElement]
        : filterTerra ? counts.byTerra[filterTerra]
        : counts.byTrait[filterTrait];
      if (cached !== undefined) {
        setFilteredCount(cached);
        return;
      }
    }
    let stale = false;
    fetchFilteredCount(buildFilters())
      .then((n) => { if (!stale) setFilteredCount(n); })
      .catch(() => { if (!stale) setFilteredCount(null); });
    return () => { stale = true; };
  }, [buildFilters, hasFilters, filterTag, filterType, filterElement, filterTerra, filterTrait, filterMine, mineUid, authReady, counts]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || !cursor) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const gen = queryGenRef.current;
    try {
      const result = await fetchCards(buildFilters(), cursor, undefined, sort);
      if (queryGenRef.current !== gen) return;
      setCards((prev) => [...prev, ...result.cards]);
      setCursor(result.cursor);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Gallery load more failed:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, cursor, buildFilters, sort]);

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
      else closeModal(true);
    }).finally(() => { if (!stale) setLoadingCard(false); });
    return () => { stale = true; };
  }, [cardId, cards, closeModal]);

  const search = searchName.trim().toLowerCase();
  // TODO: search is limited to the currently loaded cards. We should fetch full results from server.
  const searchTexts = useMemo(() => {
    const texts = new Map<string, string>();
    for (const c of cards) texts.set(c.id, buildCardSearchText(c));
    return texts;
  }, [cards]);
  const filteredCards = useMemo(() => (search
    ? cards.filter((c) =>
        c.cardName.toLowerCase().includes(search)
        || c.tribe.toLowerCase().includes(search)
        || c.creatorName.toLowerCase().includes(search)
        || (searchTexts.get(c.id) || '').includes(search))
    : cards), [cards, search, searchTexts]);

  const exactCount = search ? null : (hasFilters ? filteredCount : counts?.total) ?? null;
  const shownCount = exactCount ?? filteredCards.length;
  const countInexact = exactCount === null && hasMore;

  const gridClass = density === 'compact' ? GRID_COMPACT : density === 'large' ? GRID_LARGE : GRID_COMFORTABLE;

  const facetProps = useMemo<FacetSectionsProps>(
    () => ({
      counts, filterTag, setFilterTag, filterElement, setFilterElement, filterType, setFilterType,
      filterTerra, setFilterTerra, filterTrait, setFilterTrait,
      myCount,
      filterMine,
      setFilterMine,
    }),
    [counts, filterTag, filterElement, filterType, filterTerra, filterTrait, myCount, filterMine],
  );

  return (
    <div className="min-h-dvh bg-navy-990 text-white flex flex-col font-body">
      <SiteHeader sticky />

      <div className="flex flex-1 min-h-0">
        {/* Facet rail */}
        <aside className="hidden md:flex w-59 shrink-0 bg-navy-950 bg-panel-deep border-r border-navy-600 px-4.5 py-5 flex-col gap-1.5 divide-y divide-navy-700 [&>*:not(:last-child)]:pb-3.5 overflow-y-auto sticky top-(--site-header-h) max-h-[calc(100dvh-var(--site-header-h))] self-start">
          <FacetSections {...facetProps} />
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 md:px-5.5 py-3 bg-navy-950 bg-panel-deep border-b border-navy-600">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Card name, effects, flavor text…"
              maxLength={50}
              className="input-plain w-full max-w-62.5 min-w-0 shrink bg-navy-800 rounded-[3px] px-2.5 py-1.5 text-sm text-white placeholder-gray-500"
            />
            <div className="hidden sm:block text-sm text-gray-400 whitespace-nowrap">{shownCount}{countInexact ? '+' : ''} card{shownCount === 1 && !countInexact ? '' : 's'}</div>
            <div className="hidden sm:block md:hidden w-px h-4.5 bg-navy-600" />
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className={`md:hidden px-2.5 py-1.5 text-xs whitespace-nowrap border rounded cursor-pointer ${hasFilters ? 'text-gold-400 border-gold-500' : 'text-gray-300 border-navy-600'}`}
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            <div className="flex-1" />
            {(hasFilters || search) && (
              <button
                onClick={() => { clearFilters(); setSearchName(''); }}
                className="text-[13px] text-gold-400 hover:text-gold-100 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as GallerySort)}
              className="input-plain bg-navy-800 rounded-[3px] px-2 py-1 text-sm text-gold-400"
            >
              <option value="newest">Newest</option>
              <option value="name">A–Z</option>
            </select>
            <div className="hidden sm:block w-px h-4.5 bg-navy-600" />
            <div className="hidden sm:flex items-center gap-2 text-[13px] text-gray-500">
              <span>Grid</span>
              {DENSITY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDensity(value)}
                  className={`${DENSITY_BUTTON_CLASS} ${density === value ? 'chip-selected' : 'chip-idle'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="p-4 md:px-6 md:py-5">
            {loading ? (
              !cardId && (
                <div className={gridClass}>
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
              <div className={gridClass}>
                {filteredCards.map((card) => (
                  <GalleryCard key={card.id} card={card} onOpen={openCard} />
                ))}
              </div>
            )}
            {!loading && !error && hasMore && !search && (
              <div ref={sentinelRef} className="h-1" />
            )}
            {!loading && !error && hasMore && search && !loadingMore && (
              <div className="text-center pt-6">
                <button
                  onClick={loadMore}
                  className="btn-tertiary px-4 py-2 text-[13px]"
                >
                  Search more cards
                </button>
              </div>
            )}
            {loadingMore && (
              <div className={`${gridClass} pt-4`}>
                {Array.from({ length: 8 }, (_, i) => (
                  <GalleryCardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />

      {/* Mobile filter */}
      {mobileFiltersOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col bg-navy-950">
          <div className="flex items-center gap-4 pl-4 pr-1.5 h-13 border-b border-navy-600 shrink-0">
            <span className="font-title text-xs tracking-[.14em] uppercase text-gold-400">Filters</span>
            <div className="flex-1" />
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-gold-400 cursor-pointer">
                Clear all
              </button>
            )}
            <button
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Close filters"
              className="w-11 h-11 flex items-center justify-center text-gray-300 cursor-pointer"
            >
              <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 divide-y divide-navy-700 [&>*:not(:last-child)]:pb-3.5 px-4 py-5">
            <FacetSections {...facetProps} />
          </div>
          <div className="px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.875rem)] border-t border-navy-600 shrink-0">
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary w-full h-12 text-sm"
            >
              {exactCount !== null
                ? `Show ${exactCount} card${exactCount === 1 ? '' : 's'}`
                : 'Show results'}
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedCard ? (
        <CardDetailModal
          card={selectedCard}
          onClose={() => closeModal()}
          onDeleted={() => { closeModal(true); setRefreshKey((k) => k + 1); }}
        />
      ) : loadingCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => closeModal()}
        >
          <CardBackBackdrop />
          <div className={MODAL_CONTAINER_CLASS}>
            <div className={`shrink-0 rounded-[14px] bg-navy-800 animate-pulse ${MODAL_CARD_CLASS}`} style={{ aspectRatio: '238/333' }} />
            <div className={`${MODAL_DETAILS_CLASS} p-5 gap-4`}>
              <div className="h-3 w-24 bg-navy-700 rounded animate-pulse" />
              <div className="h-6 w-40 bg-navy-700 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-navy-700 rounded animate-pulse" />
                <div className="h-5 w-16 bg-navy-700 rounded animate-pulse" />
              </div>
              <div className="h-4 w-32 bg-navy-700 rounded animate-pulse" />
              <div className="h-10 w-full bg-navy-700 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-9 flex-1 bg-navy-700 rounded animate-pulse" />
                <div className="h-9 flex-1 bg-navy-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
