import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Play, Star, Clock, Tag, Calendar, ChevronLeft, Loader2, Bookmark, BookmarkCheck, ArrowUpDown } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { GenreBadge } from '@/components/GenreBadge';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { shinimeApi, type AnimeDetail, type EpisodeItem } from '@/services/shinimeApi';
import { firebaseService } from '@/services/firebaseService';
import { toast } from 'sonner';

export default function AnimeDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [sortAsc, setSortAsc] = useState(false); // Default: Terbaru (desc)

  const fetchDetail = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);
      const res = await shinimeApi.getDetail(slug);
      setDetail(res.data);

      // Check bookmark status in Firebase
      try {
        const bookmarked = await firebaseService.isBookmarked(slug);
        setIsBookmarked(bookmarked);
      } catch (fbErr) {
        console.error("Error checking bookmark status:", fbErr);
      }
    } catch (err: any) {
      console.error("Detail page error:", err);
      setError(err.message || 'Gagal memuat detail anime. Anime ini mungkin tidak ada atau URL berubah.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const toggleBookmark = async () => {
    if (!detail || !slug) return;
    try {
      setBookmarkLoading(true);
      if (isBookmarked) {
        await firebaseService.removeBookmark(slug);
        setIsBookmarked(false);
        toast.success('Dihapus dari Daftar Tontonan');
      } else {
        await firebaseService.addBookmark(
          slug, 
          detail.title, 
          detail.poster || "", 
          detail.info?.rating || detail.info?.skor || ""
        );
        setIsBookmarked(true);
        toast.success('Disimpan ke Daftar Tontonan');
      }
    } catch (fbErr: any) {
      console.error("Bookmark operation failed:", fbErr);
      toast.error('Gagal memperbarui daftar tontonan');
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 flex items-center justify-center bg-[#0B0F19]">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </main>
      </>
    );
  }

  if (error || !detail) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 bg-[#0B0F19] text-white">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <EmptyState 
              type="error" 
              title="Gagal Memuat Detail"
              description={error || 'Anime tidak ditemukan'} 
              onRetry={fetchDetail}
            />
            <div className="text-center mt-6">
              <Button asChild variant="outline">
                <Link to="/">Kembali ke Beranda</Link>
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const imageUrl = detail.poster || '/placeholder.svg';
  
  // Genres list from comma separated string
  const genres = detail.info?.genre?.split(',').map(g => g.trim()) || [];
  
  // Sort episodes: Otakudesu returns with newest first by default.
  const sortedEpisodes = [...(detail.episodes || [])];
  if (sortAsc) {
    sortedEpisodes.reverse(); // Newest last (oldest first)
  }

  return (
    <>
      <Helmet>
        <title>{`${detail.title} Sub Indo - Maounime`}</title>
        <meta name="description" content={detail.sinopsis || `Nonton streaming anime ${detail.title} subtitle Indonesia gratis di Maounime.`} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen pt-20 pb-28 md:pb-16 bg-[#0B0F19] text-slate-100">
        
        {/* Backdrop Blurred Cover */}
        <div className="relative min-h-[50vh] md:min-h-[45vh] overflow-hidden flex items-end">
          <div className="absolute inset-0">
            <img
              src={imageUrl}
              alt={detail.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover blur-2xl scale-110 opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/80 to-[#0B0F19]/40" />
          </div>

          <div className="container max-w-7xl mx-auto px-4 relative z-10 pb-8 pt-12">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
              
              {/* Poster */}
              <div className="w-48 md:w-56 flex-shrink-0">
                <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-card border border-border/20 bg-muted">
                  <img
                    src={imageUrl}
                    alt={detail.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Description Info */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Kembali
                </Link>

                <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                  {detail.title}
                </h1>

                {/* Meta details list */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300">
                  {detail.info?.rating && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/20">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      <span>{detail.info.rating}</span>
                    </div>
                  )}
                  {detail.info?.status && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      <span>{detail.info.status}</span>
                    </div>
                  )}
                  {detail.info?.produser && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{detail.info.produser}</span>
                    </div>
                  )}
                  {detail.info?.tipe && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-card text-muted-foreground uppercase text-[10px] font-bold border border-border/10">
                      {detail.info.tipe}
                    </div>
                  )}
                </div>

                {/* Genre Badges */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {genres.map((g) => (
                      <GenreBadge key={g} genre={g} variant="filled" />
                    ))}
                  </div>
                )}

                {/* Action buttons (Watch, Bookmark) */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-3">
                  {detail.episodes?.length > 0 && (
                    <Button
                      asChild
                      size="lg"
                      className="bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-xl shadow-glow"
                    >
                      <Link to={`/watch/${detail.episodes[detail.episodes.length - 1].episodeId}`}>
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        Episode Pertama
                      </Link>
                    </Button>
                  )}

                  <Button
                    onClick={toggleBookmark}
                    disabled={bookmarkLoading}
                    variant="outline"
                    size="lg"
                    className="border-border hover:bg-card hover:text-white rounded-xl"
                  >
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 mr-2 text-accent fill-accent/20" />
                        Simpan di Watchlist
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Tambah ke Watchlist
                      </>
                    )}
                  </Button>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Details Grid & Episode list */}
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Main Column: Synopsis & Episodes */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Synopsis */}
              <section className="bg-card/20 border border-border/10 rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-3">Sinopsis</h2>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {detail.sinopsis || "Tidak ada sinopsis untuk anime ini."}
                </p>
              </section>

              {/* Episodes Listing */}
              <section className="bg-card/20 border border-border/10 rounded-2xl p-6">
                <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-4">
                  <h2 className="text-base font-bold text-white">
                    Daftar Episode ({detail.episodes?.length || 0})
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortAsc(!sortAsc)}
                    className="text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                    {sortAsc ? "Episode Terlama" : "Episode Terbaru"}
                  </Button>
                </div>

                {sortedEpisodes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {sortedEpisodes.map((ep: EpisodeItem, idx) => (
                      <Link
                        key={ep.episodeId || idx}
                        to={`/watch/${ep.episodeId}`}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#0F1321] border border-border/5 hover:border-accent/40 hover:bg-accent/5 transition-all group"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="block text-xs font-bold text-slate-200 group-hover:text-accent transition-colors truncate">
                            {ep.title}
                          </span>
                          {ep.releaseDate && (
                            <span className="block text-[10px] text-muted-foreground mt-1">
                              Rilis: {ep.releaseDate}
                            </span>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-all flex-shrink-0">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    type="anime" 
                    title="Episode Belum Tersedia"
                    description="Belum ada episode rilis untuk anime ini."
                  />
                )}
              </section>

            </div>

            {/* Right Column: Information details and Recommendations */}
            <div className="space-y-8">
              
              {/* Information Card */}
              <section className="bg-card/20 border border-border/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-white border-b border-border/10 pb-3">Informasi</h2>
                <div className="space-y-3 text-xs">
                  {Object.entries(detail.info || {}).map(([key, val]) => {
                    if (key === 'genre' || !val) return null;
                    const readableKey = key.replace(/_/g, ' ').toUpperCase();
                    return (
                      <div key={key} className="flex justify-between gap-4 border-b border-border/5 pb-2">
                        <span className="text-muted-foreground font-semibold uppercase">{readableKey}</span>
                        <span className="text-slate-200 text-right font-medium">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Recommendations */}
              {detail.recommendations && detail.recommendations.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-base font-bold text-white px-1">Rekomendasi Anime Serupa</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {detail.recommendations.slice(0, 4).map((rec, index) => (
                      <Link
                        key={rec.slug || index}
                        to={`/anime/${rec.slug}`}
                        className="group flex flex-col gap-2 rounded-xl overflow-hidden border border-border/5 bg-card/20 hover:border-accent/30 transition-all p-2"
                      >
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                          <img
                            src={rec.poster || '/placeholder.svg'}
                            alt={rec.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-all"
                          />
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-200 line-clamp-1 group-hover:text-accent transition-colors px-1">
                          {rec.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

            </div>

          </div>
        </div>

      </main>
    </>
  );
}
