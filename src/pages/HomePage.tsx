import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Calendar, Sparkles, TrendingUp, Clock, Bookmark, History, ChevronRight, Play } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AnimeCard } from '@/components/AnimeCard';
import { LoadingGrid } from '@/components/LoadingGrid';
import { EmptyState } from '@/components/EmptyState';
import { shinimeApi, type AnimeCardData, type ScheduleData } from '@/services/shinimeApi';
import { firebaseService, type Bookmark as FirebaseBookmark, type WatchHistory } from '@/services/firebaseService';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const DAY_MAP_IND: Record<string, string> = {
  'Monday': 'Senin',
  'Tuesday': 'Selasa',
  'Wednesday': 'Rabu',
  'Thursday': 'Kamis',
  'Friday': 'Jumat',
  'Saturday': 'Sabtu',
  'Sunday': 'Minggu',
};

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function HomePage() {
  const [latestOngoing, setLatestOngoing] = useState<AnimeCardData[]>([]);
  const [completedAnime, setCompletedAnime] = useState<AnimeCardData[]>([]);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [bookmarks, setBookmarks] = useState<FirebaseBookmark[]>([]);
  const [history, setHistory] = useState<WatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Active schedule day (default to current day name in English)
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [activeDay, setActiveDay] = useState(DAYS_ORDER.includes(currentDayName) ? currentDayName : 'Monday');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch concurrently to speed up load time
      const [homeRes, completeRes, scheduleRes] = await Promise.all([
        shinimeApi.getHome(),
        shinimeApi.getComplete(1),
        shinimeApi.getSchedule(),
      ]);

      setLatestOngoing(homeRes.data.items || []);
      setCompletedAnime(completeRes.data.items || []);
      setSchedule(scheduleRes.data || null);

      // Fetch Firestore user data (gracefully handled even if user is anonymous)
      try {
        const [savedBookmarks, savedHistory] = await Promise.all([
          firebaseService.getBookmarks(),
          firebaseService.getHistory(6),
        ]);
        setBookmarks(savedBookmarks);
        setHistory(savedHistory);
      } catch (fbErr) {
        console.error("Firestore loading error:", fbErr);
      }

    } catch (err: any) {
      console.error("Homepage error:", err);
      setError(err.message || 'Gagal memuat konten anime. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Featured anime for top banner slider (just use the first few from latest ongoing)
  const featuredAnime = latestOngoing.slice(0, 5);

  return (
    <>
      <Helmet>
        <title>Maounime - Streaming Anime Sub Indo Gratis Terlengkap</title>
        <meta name="description" content="Nonton streaming anime subtitle Indonesia gratis terbaru dan terlengkap. Maounime menyediakan update tercepat anime ongoing, complete, movie dan live-action." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen pt-20 pb-28 md:pb-16 bg-[#0B0F19] text-slate-100">
        
        {/* Hero Section / Banner Slider */}
        {!loading && !error && featuredAnime.length > 0 && (
          <section className="relative w-full overflow-hidden mb-12">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19]/90 via-[#0B0F19]/40 to-transparent z-10" />
            <div className="container max-w-7xl mx-auto px-4 py-12 md:py-20 relative z-20">
              <div className="max-w-2xl space-y-4 fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rekomendasi Utama</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  Nonton Anime <span className="text-accent">Sub Indo</span> Tanpa Iklan Mengganggu
                </h1>
                <p className="text-sm md:text-base text-slate-300 max-w-xl">
                  Nikmati koleksi anime terlengkap dengan kualitas terbaik. Simpan favorit Anda, tandai episode terakhir yang ditonton, dan diskusikan bersama komunitas Maounime.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link 
                    to={`/anime/${featuredAnime[0].slug}`}
                    className="px-6 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm shadow-glow hover:bg-accent/80 hover:scale-105 transition-all"
                  >
                    Nonton Sekarang
                  </Link>
                  <Link 
                    to="/genres"
                    className="px-6 py-3 rounded-xl bg-card border border-border/60 hover:bg-muted font-bold text-sm text-slate-200 transition-all"
                  >
                    Telusuri Genre
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Background poster of first ongoing anime blurred for aesthetic depth */}
            <div className="absolute top-0 right-0 w-full md:w-[60%] h-full opacity-20 md:opacity-30 pointer-events-none filter blur-sm md:blur-none">
              <img 
                src={featuredAnime[0].poster || '/placeholder.svg'} 
                alt="Banner Backdrop" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </section>
        )}

        <div className="container max-w-7xl mx-auto px-4 space-y-16 relative z-20">
          
          {/* Error state */}
          {error && !loading && (
            <EmptyState 
              type="error" 
              title="Koneksi Bermasalah"
              description={error} 
              onRetry={fetchData}
            />
          )}

          {/* User Watchlist / Bookmarks (Only display if user actually has bookmarked something) */}
          {!loading && !error && bookmarks.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-5.5 h-5.5 text-accent fill-accent/20" />
                  <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
                    Daftar Tontonan Saya
                  </h2>
                </div>
                <Link to="/watchlist" className="text-xs font-semibold text-accent flex items-center gap-1 hover:underline">
                  Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                {bookmarks.slice(0, 6).map((b) => (
                  <AnimeCard 
                    key={b.animeSlug} 
                    anime={{
                      title: b.title,
                      slug: b.animeSlug,
                      poster: b.poster,
                      url: "",
                      rating: b.rating
                    }} 
                    showEpisode={false}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Latest Ongoing Episodes Section */}
          {!error && (
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-5.5 h-5.5 text-accent" />
                  <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
                    Anime Ongoing Terupdate
                  </h2>
                </div>
                <Link to="/anime/list/ongoing" className="text-xs font-semibold text-accent flex items-center gap-1 hover:underline">
                  Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              
              {loading ? (
                <LoadingGrid count={12} />
              ) : latestOngoing.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                  {latestOngoing.slice(0, 18).map((anime, index) => (
                    <AnimeCard key={anime.slug} anime={anime} index={index} showEpisode={true} />
                  ))}
                </div>
              ) : (
                <EmptyState type="anime" description="Tidak ada anime ongoing yang ditemukan." />
              )}
            </section>
          )}

          {/* Weekly Release Schedule Section */}
          {!error && schedule && (
            <section className="space-y-6">
              <div className="flex items-center gap-2.5 border-b border-border/30 pb-3">
                <Calendar className="w-5.5 h-5.5 text-accent" />
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
                  Jadwal Rilis Mingguan
                </h2>
              </div>

              {/* Day horizontal tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {DAYS_ORDER.map((dayEng) => {
                  const dayInd = DAY_MAP_IND[dayEng] || dayEng;
                  const isToday = dayEng.toLowerCase() === currentDayName.toLowerCase();
                  return (
                    <button
                      key={dayEng}
                      onClick={() => setActiveDay(dayEng)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                        activeDay === dayEng
                          ? "bg-accent border-accent text-accent-foreground shadow-glow"
                          : "bg-card/40 border-border/10 text-slate-300 hover:bg-card hover:text-white"
                      )}
                    >
                      {dayInd}
                      {isToday && (
                        <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-background/50 text-accent border border-accent/20">Hari ini</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                {schedule[activeDay] && schedule[activeDay].length > 0 ? (
                  schedule[activeDay].map((sched, idx) => (
                    <Link
                      key={sched.slug || idx}
                      to={`/anime/${sched.slug}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-border/10 hover:border-accent/30 hover:bg-card/60 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-accent shadow-glow" />
                        <span className="text-xs font-bold text-slate-200 truncate group-hover:text-accent transition-colors">
                          {sched.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-accent uppercase flex-shrink-0 bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        Rilis
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-muted-foreground text-xs bg-card/10 rounded-xl border border-border/5">
                    Tidak ada jadwal rilis untuk hari {DAY_MAP_IND[activeDay]}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Completed Anime Section */}
          {!error && completedAnime.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5.5 h-5.5 text-accent" />
                  <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
                    Rekomendasi Anime Complete
                  </h2>
                </div>
                <Link to="/anime/list/complete" className="text-xs font-semibold text-accent flex items-center gap-1 hover:underline">
                  Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                {completedAnime.slice(0, 12).map((anime, index) => (
                  <AnimeCard key={anime.slug} anime={anime} index={index} showEpisode={false} />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/10 bg-[#070A12] py-12 text-slate-400">
        <div className="container max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center items-center gap-2">
            <div className="relative">
              <Play className="w-6 h-6 text-accent fill-accent" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              maou<span className="text-accent">nime</span>
            </span>
          </div>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            Maounime adalah platform streaming anime subtitle Indonesia gratis yang dibuat untuk seluruh penggemar anime. Menghubungkan Anda langsung ke ribuan episode anime favorit secara real-time.
          </p>
          <div className="border-t border-border/5 pt-6 text-[11px] text-muted-foreground">
            <p>© {new Date().getFullYear()} Maounime. Seluruh konten didapatkan dari sumber publik secara otomatis.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
