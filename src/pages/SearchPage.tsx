import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search as SearchIcon, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AnimeCard } from '@/components/AnimeCard';
import { LoadingGrid } from '@/components/LoadingGrid';
import { EmptyState } from '@/components/EmptyState';
import { shinimeApi, type AnimeCardData } from '@/services/shinimeApi';

const SUGGESTIONS = [
  'Naruto',
  'One Piece',
  'Boruto',
  'Bleach',
  'Shangri-La Frontier',
  'Solo Leveling',
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<AnimeCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!query) return;

    try {
      setLoading(true);
      setError(null);
      const res = await shinimeApi.search(query);
      setResults(res.data?.items || []);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || 'Pencarian gagal. Silakan coba kata kunci lain.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query) {
      setResults([]);
      fetchResults();
    } else {
      setResults([]);
    }
  }, [query, fetchResults]);

  return (
    <>
      <Helmet>
        <title>{`${query ? `Cari: ${query}` : 'Pencarian'} - Maounime`}</title>
        <meta name="description" content={`Hasil pencarian untuk "${query}" di Maounime. Temukan serial anime favorit Anda secara cepat.`} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen pt-20 pb-28 md:pb-16 bg-[#0B0F19] text-slate-100">
        <div className="container max-w-7xl mx-auto px-4">
          
          {/* Header */}
          <div className="py-8 border-b border-border/10 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SearchIcon className="w-6 h-6 text-accent" />
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">Hasil Pencarian</h1>
            </div>
            {query && (
              <p className="text-sm text-muted-foreground">
                Menampilkan hasil pencarian untuk "<span className="text-white font-semibold">{query}</span>"
              </p>
            )}
          </div>

          {/* Results */}
          {!query ? (
            // Empty search - show suggestions
            <div className="py-16 text-center max-w-lg mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto shadow">
                <Sparkles className="w-8 h-8 text-accent animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Temukan Anime Favoritmu</h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Masukkan judul anime, studio, genre, atau karakter untuk mulai menjelajah ribuan seri sub indo gratis di Maounime.
                </p>
              </div>
              
              {/* Suggestions */}
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Rekomendasi Pencarian:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <Link
                      key={suggestion}
                      to={`/search?q=${encodeURIComponent(suggestion)}`}
                      className="px-4 py-2 rounded-xl bg-card border border-border/10 text-xs font-semibold text-slate-300 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all"
                    >
                      {suggestion}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : loading ? (
            <LoadingGrid count={12} />
          ) : error ? (
            <EmptyState 
              type="error" 
              description={error} 
              onRetry={fetchResults}
            />
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {results.map((anime, index) => (
                <AnimeCard key={`${anime.slug}-${index}`} anime={anime} index={index} showEpisode={false} />
              ))}
            </div>
          ) : (
            <EmptyState 
              type="search" 
              title="Tidak ada hasil"
              description={`Kami tidak dapat menemukan anime apa pun yang cocok dengan "${query}". Coba periksa kembali ejaan atau gunakan kata kunci lain.`}
            />
          )}
        </div>
      </main>
    </>
  );
}
