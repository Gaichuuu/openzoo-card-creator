import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SavedCard } from '@/types/card';
import { fetchCards } from '@/lib/galleryService';
import { displayCardName } from '@/lib/exportUtils';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CardThumb, CardCaption } from '@/components/gallery/GalleryCard';
import { Card3DHero } from './Card3DHero';
import { HoloBloom } from './HoloBloom';

const WALLPAPER_TILES = 24;
const TITLE_CLASS = 'font-title font-normal text-[52px] md:text-[72px] lg:text-[90px] leading-[.94] tracking-[-.018em] m-0';

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
  const justPublished = recentCards.slice(0, 6);

  return (
    <div className="flex flex-col min-h-dvh bg-navy-950 font-body">
      <div className="relative flex flex-col min-h-dvh overflow-clip">
        {/* Wallpaper */}
        <div
          aria-hidden="true"
          className="absolute -inset-15 grid grid-cols-4 md:grid-cols-8 gap-4.5 opacity-15"
          style={{ transform: 'rotate(-10deg) scale(1.14)', transformOrigin: 'center' }}
        >
          {Array.from({ length: WALLPAPER_TILES }, (_, i) => (
            <img
              key={i}
              src="/assets/OPZDexCardBackTile.jpg"
              alt=""
              className="w-full rounded-lg aspect-238/333 object-cover"
            />
          ))}
        </div>

        {/* Holo bloom */}
        <HoloBloom className="-left-[10%] -top-[30%] w-[120%] h-[90%] opacity-7" blur={110} />

        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'radial-gradient(64% 62% at 50% 40%, rgba(8,10,25,.35) 0%, rgba(8,10,25,.93) 100%)' }}
        />

        <div className="relative flex flex-col flex-1">
          <SiteHeader sticky />

          {/* Hero: type block + card */}
          <div className="flex flex-col-reverse lg:flex-row flex-1 items-center justify-center px-14 md:px-15 pt-2 lg:pt-0 pb-0 gap-5 lg:gap-18">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-135">
              <div className="relative">
                <span aria-hidden="true" className={`absolute -left-1.25 top-1.5 text-navy-990/70 select-none ${TITLE_CLASS}`}>
                  OpenZoo
                </span>
                <h1 className={`relative text-gold-gradient drop-shadow-[0_2px_0_rgba(0,0,0,.6)] ${TITLE_CLASS}`}>
                  OpenZoo
                </h1>
              </div>
              <h2
                className="font-title font-normal text-[22px] md:text-[26px] lg:text-[30px] leading-[1.02] tracking-[.14em] uppercase text-white mt-3.5 m-0"
                style={{ textShadow: '0 0 22px rgba(94,168,255,.45)' }}
              >
                Trading Card Game
              </h2>
              <p className="text-[22px] leading-normal italic text-gray-400 mt-5" style={{ textWrap: 'pretty' }}>
                The only TCG where your <span className="font-bold text-gold-100">surroundings</span> matter!
              </p>
              <div className="flex justify-center lg:justify-start lg:w-full gap-3 sm:gap-3.5 mt-8.5">
                <Link
                  to="/create"
                  className="btn-primary [--btn-glow:0_10px_30px_rgba(196,15,34,.35)] px-4 sm:px-7.5 py-4 text-[11px] sm:text-sm tracking-[.06em] sm:tracking-[.08em] whitespace-nowrap text-center"
                >
                  Create a card
                </Link>
                <Link
                  to="/rulebook"
                  className="btn-tertiary font-title uppercase px-4 sm:px-7.5 py-4 text-[11px] sm:text-sm tracking-[.06em] sm:tracking-[.08em] whitespace-nowrap text-center"
                >
                  Read the rules
                </Link>
              </div>
            </div>
            <div className="relative shrink-0">
              <HoloBloom className="-inset-8.5 opacity-15" blur={70} />
              <Card3DHero className="w-65 h-92.5 md:w-100 md:h-142 drop-shadow-[0_26px_40px_rgba(0,0,0,.75)]" frontCard={heroCard} frontPending={loading} />
            </div>
          </div>

          {/* Recent strip */}
          {(loading || justPublished.length > 0) && (
            <div className="shrink-0 px-4 md:px-10 pt-10 pb-7 lg:pt-0">
              <div className="md:w-fit md:mx-auto">
                <div className="pb-4">
                  <span className="font-sans text-xs tracking-[.16em] uppercase text-gray-400">Recently published</span>
                </div>
                <div className="flex gap-4 overflow-x-auto md:overflow-visible">
                {loading &&
                  Array.from({ length: 6 }, (_, i) => (
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
                      <CardThumb url={card.thumbnailUrl} alt={displayCardName(card.cardName)} roundedClass="rounded-[7px]" />
                    ) : (
                      <div className="w-full aspect-238/333 rounded-[7px] border border-navy-600 bg-navy-800" />
                    )}
                    <CardCaption card={card} className="gap-1.5" />
                  </Link>
                ))}
                {/* Final slot */}
                <Link
                  to="/gallery"
                  className="relative w-33 max-md:shrink-0 md:min-w-0 flex flex-col gap-1.5 hover:scale-110 hover:z-10 transition-transform"
                >
                  <span className="w-full aspect-238/333 rounded-[7px] border-gold-dashed flex items-center justify-center p-3.5 text-center font-title text-xs tracking-[.08em] uppercase leading-snug text-gold-400 hover:text-gold-100 transition-colors">
                    Browse the gallery →
                  </span>
                </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
