import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SavedCard } from '@/types/card';
import { fetchCards } from '@/lib/galleryService';
import { displayCardName } from '@/lib/exportUtils';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Card3DHero } from './Card3DHero';

const WALLPAPER_TILES = 24;

function stripTierClass(slot: number): string {
  if (slot < 5) return '';
  if (slot < 7) return 'md:max-lg:hidden';
  if (slot < 8) return 'md:max-xl:hidden';
  return 'md:max-2xl:hidden';
}

function useRecentCards(): { cards: SavedCard[]; heroCard: SavedCard | null; loading: boolean } {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [heroCard, setHeroCard] = useState<SavedCard | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let stale = false;
    fetchCards(undefined, null, 20)
      .then((result) => {
        if (stale) return;
        setCards(result.cards);
        if (result.cards.length > 0) {
          setHeroCard(result.cards[Math.floor(Math.random() * result.cards.length)]);
        }
      })
      .catch(() => { /* strip stays empty, hero keeps the card back */ })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => { stale = true; };
  }, []);
  return { cards, heroCard, loading };
}

export function LandingPage() {
  const { cards: recentCards, heroCard, loading } = useRecentCards();
  const justPublished = recentCards.slice(0, 9);

  return (
    <div className="flex flex-col min-h-dvh bg-navy-950">
      <div className="relative flex flex-col min-h-dvh overflow-clip">
        {/* Layer 1 — wallpaper */}
        <div
          aria-hidden="true"
          className="absolute -inset-15 grid grid-cols-4 md:grid-cols-8 gap-4.5 opacity-16"
          style={{ transform: 'rotate(-10deg) scale(1.14)', transformOrigin: 'center' }}
        >
          {/* Downscaled tile */}
          {Array.from({ length: WALLPAPER_TILES }, (_, i) => (
            <img
              key={i}
              src="/assets/OPZDexCardBackTile.jpg"
              alt=""
              className="w-full rounded-lg aspect-238/333 object-cover"
            />
          ))}
        </div>

        {/* Layer 2 — scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'radial-gradient(75% 75% at 36% 44%, rgba(8,10,25,.55) 0%, rgba(8,10,25,.8) 100%)' }}
        />

        {/* Layer 3 — content */}
        <div className="relative flex flex-col flex-1">
          <SiteHeader sticky />

          {/* Hero */}
          <div className="flex flex-col-reverse lg:flex-row flex-1 items-center w-full max-w-375 mx-auto px-4 md:px-10 py-8 lg:py-0 gap-8 lg:gap-0">
            <div className="lg:flex-1 lg:min-w-0 text-center lg:text-left">
              <h1
                className="font-title font-normal text-[52px] md:text-[72px] lg:text-[clamp(44px,4.8vw,72px)] leading-[1.02] m-0"
                style={{
                  letterSpacing: '-.01em',
                  backgroundImage: 'linear-gradient(180deg, #fff7cf 10%, #e8d88c 38%, #dcbe64 60%, #aa821e 96%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                OpenZoo</h1>
                <h2
                className="pt-2.5 font-title font-normal text-[32px] md:text-[42px] lg:text-[clamp(30px,3.3vw,48px)] leading-[1.02] text-white m-0"
                style={{ textWrap: 'balance' }}
                >Trading Card Game
              </h2>
              <p className="text-lg md:text-xl leading-relaxed italic text-gray-400 mt-4 max-w-117.5 mx-auto lg:mx-0" style={{ textWrap: 'pretty' }}>
              The only TCG where your <span className="text-gray-300 font-semibold">surroundings</span> matter!
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-3.5 mt-9">
                <Link
                  to="/create"
                  className="px-7.5 py-3.75 bg-green-600 hover:bg-green-500 text-white text-[17px] font-semibold whitespace-nowrap transition-colors border-gold text-center"
                >
                  Create a card
                </Link>
                <Link
                  to="/rulebook"
                  className="px-7.5 py-3.75 bg-navy-800 hover:bg-navy-700 text-gold-300 text-[17px] font-semibold whitespace-nowrap transition-colors border-gold text-center"
                >
                  Read the rules
                </Link>
              </div>
            </div>
            <div className="flex lg:flex-1 justify-center min-w-0">
              <Card3DHero className="w-65 h-92.5 md:w-100 md:h-138 shrink-0" frontCard={heroCard} frontPending={loading} />
            </div>
            <div className="hidden lg:block lg:flex-1" />
          </div>

          {/* Recent strip */}
          {(loading || justPublished.length > 0) && (
            <div className="shrink-0 px-4 md:px-10 pb-6.5">
              <div className="flex items-center gap-3.5 pt-0 pb-4">
                <span className="text-xs tracking-[.16em] uppercase text-gray-400">Recently published</span>
              </div>
              <div className="flex gap-4 overflow-x-auto md:overflow-visible">
                {loading &&
                  Array.from({ length: 9 }, (_, i) => (
                    <div
                      key={i}
                      className={`relative w-33 max-md:shrink-0 md:min-w-0 flex flex-col gap-1.5 ${stripTierClass(i + 1)}`}
                    >
                      <div className="w-full aspect-238/333 rounded-[7px] border border-navy-600 bg-navy-800 animate-pulse" />
                      <div className="h-4 w-24 bg-navy-700 rounded animate-pulse" />
                    </div>
                  ))}
                {!loading && justPublished.map((card, i) => (
                  <Link
                    key={card.id}
                    to={`/gallery/${card.id}`}
                    className={`relative w-33 max-md:shrink-0 md:min-w-0 flex flex-col gap-1.5 hover:scale-110 hover:z-10 transition-transform ${stripTierClass(i + 1)}`}
                  >
                    {card.thumbnailUrl ? (
                      <img
                        src={card.thumbnailUrl}
                        alt={displayCardName(card.cardName)}
                        loading="lazy"
                        className="w-full aspect-238/333 object-cover rounded-[7px] border border-navy-600"
                      />
                    ) : (
                      <div className="w-full aspect-238/333 rounded-[7px] border border-navy-600 bg-navy-800" />
                    )}
                    <span className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-xs text-gray-300 truncate">{displayCardName(card.cardName)}</span>
                      {card.creatorName && (
                        <span className="text-[11px] text-gray-500 truncate shrink-0 max-w-[45%]">@{card.creatorName}</span>
                      )}
                    </span>
                  </Link>
                ))}
                {/* Final slot */}
                <Link
                  to="/gallery"
                  className="relative w-33 max-md:shrink-0 md:min-w-0 flex flex-col gap-1.5 hover:scale-110 hover:z-10 transition-transform"
                >
                  <span className="w-full aspect-238/333 rounded-[7px] border-gold-dashed flex items-center justify-center p-3 text-center text-[13px] leading-snug text-gold-400 hover:text-gold-300 transition-colors">
                    Browse the gallery →
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
