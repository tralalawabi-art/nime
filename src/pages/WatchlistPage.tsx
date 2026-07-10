import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bookmark, Loader2, Trash2, History, Play, LogIn, Sparkles, AlertCircle, Info } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AnimeCard } from '@/components/AnimeCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { firebaseService, type Bookmark as FirebaseBookmark, type WatchHistory } from '@/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function WatchlistPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'watchlist';

  const { user, loginWithGoogle } = useAuth();
  const [bookmarks, setBookmarks] = useState<FirebaseBookmark[]>([]);
  const [history, setHistory] = useState<WatchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const isUserLoggedIn = user && !user.isAnonymous;

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'watchlist') {
        const savedBookmarks = await firebaseService.getBookmarks();
        setBookmarks(savedBookmarks);
      } else {
        const savedHistory = await firebaseService.getHistory(30);
        setHistory(savedHistory);
      }
    } catch (err) {
      console.error("Watchlist page data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, user]); // Refetch when tab changes or user logs in/out

  const handleRemoveBookmark = async (slug: string) => {
    try {
      await firebaseService.removeBookmark(slug);
      setBookmarks((prev) => prev.filter((b) => b.animeSlug !== slug));
      toast.success('Dihapus dari Daftar Tontonan');
    } catch (err) {
      console.error("Remove bookmark error:", err);
      toast.error('Gagal menghapus bookmark');
    }
  };

  const handleRemoveHistory = async (episodeSlug: string) => {
    try {
      await firebaseService.removeHistoryItem(episodeSlug);
      setHistory((prev) => prev.filter((h) => h.episodeSlug !== episodeSlug));
      toast.success('Riwayat nonton berhasil dihapus');
    } catch (err) {
      console.error("Remove history error:", err);
      toast.error('Gagal menghapus riwayat');
    }
  };

  // Safe Indonesian date formatter helper
  const formatTimeAgo = (dateInput: any) => {
    if (!dateInput) return '';
    let date: Date;
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else {
      date = new Date(dateInput);
    }
    
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Baru saja';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit yang lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam yang lalu`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <Helmet>
        <title>{activeTab === 'watchlist' ? 'Daftar Tontonan Saya' : 'Riwayat Nonton Saya'} - Maounime</title>
        <meta name="description" content="Simpan dan pantau anime serta riwayat streaming favorit Anda di Maounime." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen pt-20 pb-28 md:pb-16 bg-[#0B0F19] text-slate-100">
        <div className="container max-w-7xl mx-auto px-4">
          
          {/* Header */}
          <div className="py-8 border-b border-border/10 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {activeTab === 'watchlist' ? (
                    <Bookmark className="w-6 h-6 text-accent" />
                  ) : (
                    <History className="w-6 h-6 text-accent" />
                  )}
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                    {activeTab === 'watchlist' ? 'Daftar Tontonan' : 'Riwayat Nonton'}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'watchlist' 
                    ? 'Anime-anime pilihan yang telah Anda simpan di akun Anda' 
                    : 'Episode anime terakhir yang Anda tonton'
                  }
                </p>
              </div>

              {/* Guest mode warning / sign in prompt */}
              {!isUserLoggedIn && (
                <div className="bg-accent/5 border border-accent/15 rounded-2xl p-4 flex items-center gap-4 max-w-md">
                  <div className="h-10 w-10 shrink-0 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white">Gunakan Akun Google</h3>
                    <p className="text-[10px] text-slate-400">
                      Sinkronkan daftar tontonan dan riwayat Anda di semua perangkat secara permanen.
                    </p>
                    <button 
                      onClick={loginWithGoogle}
                      className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1 mt-1 text-left"
                    >
                      Hubungkan Google Sekarang &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Tab Bar */}
            <div className="flex gap-2 mt-8">
              <Button
                variant={activeTab === 'watchlist' ? 'default' : 'ghost'}
                onClick={() => setSearchParams({ tab: 'watchlist' })}
                className="rounded-xl font-bold text-xs"
              >
                <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                Daftar Tontonan
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'ghost'}
                onClick={() => setSearchParams({ tab: 'history' })}
                className="rounded-xl font-bold text-xs"
              >
                <History className="w-3.5 h-3.5 mr-1.5" />
                Riwayat Nonton
              </Button>
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : activeTab === 'watchlist' ? (
            // Watchlist Tab Contents
            bookmarks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                {bookmarks.map((b, idx) => (
                  <div key={b.animeSlug} className="relative group">
                    <AnimeCard 
                      anime={{
                        title: b.title,
                        slug: b.animeSlug,
                        poster: b.poster,
                        url: "",
                        rating: b.rating
                      }} 
                      index={idx}
                      showEpisode={false}
                    />
                    {/* Floating remove button */}
                    <Button
                      onClick={() => handleRemoveBookmark(b.animeSlug)}
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-30"
                      title="Hapus dari Daftar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                type="anime" 
                title="Daftar Tontonan Kosong"
                description="Anda belum menyimpan anime apa pun ke daftar tontonan Anda. Mulai cari anime favorit Anda dan klik tombol 'Tambah ke Watchlist' di halaman detail!"
              />
            )
          ) : (
            // History Tab Contents
            history.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((h, idx) => (
                  <div 
                    key={h.episodeSlug || idx} 
                    className="relative bg-card/40 hover:bg-card/70 border border-border/10 hover:border-border/20 rounded-2xl p-4 flex gap-4 transition-all group overflow-hidden"
                  >
                    {/* Hover glow line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent transform -translate-x-full group-hover:translate-x-0 transition-transform" />

                    {/* Left: Thumbnail/Poster */}
                    <div className="relative w-16 h-24 bg-black/40 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-border/10">
                      {h.poster ? (
                        <img 
                          src={h.poster} 
                          alt={h.animeTitle} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Play className="w-6 h-6 text-slate-500 group-hover:text-accent transition-colors" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-5 h-5 text-accent" />
                      </div>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div className="space-y-1">
                        <Link 
                          to={`/watch/${h.episodeSlug}`} 
                          className="font-bold text-sm text-white hover:text-accent transition-colors line-clamp-1 block"
                        >
                          {h.animeTitle}
                        </Link>
                        <p className="text-xs text-slate-300 font-medium line-clamp-1">
                          {h.episodeTitle}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <History className="w-3 h-3 text-slate-500" />
                          {formatTimeAgo(h.watchedAt)}
                        </span>
                        
                        <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link to={`/watch/${h.episodeSlug}`}>
                            <Button size="icon" variant="secondary" className="w-7 h-7 rounded-lg" title="Putar">
                              <Play className="w-3.5 h-3.5 text-accent" />
                            </Button>
                          </Link>
                          <Button 
                            onClick={() => handleRemoveHistory(h.episodeSlug)}
                            size="icon" 
                            variant="ghost" 
                            className="w-7 h-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-400"
                            title="Hapus dari riwayat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                type="anime" 
                title="Belum Ada Riwayat Nonton"
                description="Anda belum menonton episode apa pun. Mulai streaming anime favorit Anda, dan riwayat tontonan Anda akan tersimpan di sini secara otomatis!"
              />
            )
          )}

        </div>
      </main>
    </>
  );
}
