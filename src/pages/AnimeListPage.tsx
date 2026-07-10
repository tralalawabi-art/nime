import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Film, Tv, Video, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AnimeCard } from '@/components/AnimeCard';
import { LoadingGrid } from '@/components/LoadingGrid';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { shinimeApi, type AnimeCardData, type GenreItem } from '@/services/shinimeApi';
import { cn } from '@/lib/utils';

export default function AnimeListPage() {
  const { type = 'ongoing' } = useParams<{ type: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const genreSlug = searchParams.get('genre') || '';
  
  const [animeList, setAnimeList] = useState<AnimeCardData[]>([]);
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [showGenreFilter, setShowGenreFilter] = useState(false);

  // Determine Title based on page state
  let pageTitle = 'Anime List';
  let pageDesc = 'Daftar tontonan anime terlengkap.';
  let Icon = Tv;

  if (type === 'ongoing') {
    pageTitle = 'Anime Ongoing';
    pageDesc = 'Daftar serial anime yang sedang tayang (ongoing) terupdate minggu ini.';
    Icon = Tv;
  } else if (type === 'complete') {
    pageTitle = 'Anime Completed';
    pageDesc = 'Koleksi serial anime subtitle Indonesia yang sudah tamat secara keseluruhan.';
    Icon = Film;
  } else if (type === 'genre' && genreSlug) {
    const formattedGenre = genreSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    pageTitle = `Genre: ${formattedGenre}`;
    pageDesc = `Jelajahi tontonan berkualitas dengan kategori genre ${formattedGenre}.`;
    Icon = Video;
  }

  const fetchGenres = useCallback(async () => {
    try {
      const data = await shinimeApi.getGenres();
      setGenres(data.data?.genres || []);
    } catch (err) {
      console.error('Failed to fetch genres:', err);
    }
  }, []);

  const fetchAnimeList = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (type === 'ongoing') {
        response = await shinimeApi.getOngoing(pageNum);
      } else if (type === 'complete') {
        response = await shinimeApi.getComplete(pageNum);
      } else {
        // Fallback or Type === 'genre'
        response = await shinimeApi.getGenreAnime(genreSlug || 'action', pageNum);
      }

      setAnimeList(response.data?.items || []);
      setHasNextPage(response.data?.pagination?.hasNext || false);
    } catch (err: any) {
      console.error("List page load error:", err);
      setError(err.message || 'Gagal memuat daftar anime.');
    } finally {
      setLoading(false);
    }
  }, [type, genreSlug]);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  useEffect(() => {
    setCurrentPage(1);
    fetchAnimeList(1);
  }, [type, genreSlug, fetchAnimeList]);

  const handlePageChange = (newPageNum: number) => {
    if (newPageNum < 1) return;
    setCurrentPage(newPageNum);
    fetchAnimeList(newPageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenreChange = (slug: string) => {
    if (slug) {
      setSearchParams({ genre: slug });
    } else {
      setSearchParams({});
    }
    setShowGenreFilter(false);
  };

  const selectedGenre = genres.find(g => g.slug === genreSlug);

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} - Halaman ${currentPage} - Maounime`}</title>
        <meta name="description" content={`${pageDesc} Sub Indo kualitas terbaik.`} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen pt-20 pb-28 md:pb-16 bg-[#0B0F19] text-slate-100">
        <div className="container max-w-7xl mx-auto px-4">
          
          {/* Header */}
          <div className="py-8 border-b border-border/10 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-6 h-6 text-accent" />
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{pageTitle}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{pageDesc}</p>
          </div>

          {/* Genre Filters Row */}
          {type === 'genre' && (
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowGenreFilter(!showGenreFilter)}
                  className={cn(
                    "gap-2 border-border/40 text-slate-300 hover:bg-card hover:text-white",
                    selectedGenre && "border-accent text-accent hover:text-accent bg-accent/5"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  {selectedGenre ? selectedGenre.name : 'Filter Genre'}
                </Button>

                {selectedGenre && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenreChange('')}
                    className="text-xs text-muted-foreground hover:text-white"
                  >
                    Hapus Filter
                  </Button>
                )}
              </div>

              {/* Genre Filter drop-panel */}
              {showGenreFilter && genres.length > 0 && (
                <div className="mt-4 p-5 bg-[#0F1321] rounded-2xl border border-border/10 scale-in shadow-2xl">
                  <div className="flex flex-wrap gap-2">
                    {genres.map((g) => (
                      <button
                        key={g.slug}
                        onClick={() => handleGenreChange(g.slug)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all",
                          genreSlug === g.slug
                            ? "bg-accent text-accent-foreground"
                            : "bg-black/30 text-slate-300 hover:bg-card hover:text-white border border-border/5"
                        )}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Anime Grid list */}
          {loading ? (
            <LoadingGrid count={12} />
          ) : error ? (
            <EmptyState 
              type="error" 
              description={error} 
              onRetry={() => fetchAnimeList(currentPage)}
            />
          ) : animeList.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                {animeList.map((anime, index) => (
                  <AnimeCard key={`${anime.slug}-${index}`} anime={anime} index={index} showEpisode={type === 'ongoing'} />
                ))}
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-center gap-4 mt-12 border-t border-border/5 pt-8">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  variant="outline"
                  size="sm"
                  className="h-10 border-border/40 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Kembali
                </Button>
                
                <span className="text-xs font-bold text-slate-200">
                  Halaman {currentPage}
                </span>

                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  variant="outline"
                  size="sm"
                  className="h-10 border-border/40 text-slate-300"
                >
                  Berikutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <EmptyState type="anime" title="Belum Ada Konten" description="Tidak ada anime yang ditemukan pada halaman ini." />
          )}
        </div>
      </main>
    </>
  );
}
