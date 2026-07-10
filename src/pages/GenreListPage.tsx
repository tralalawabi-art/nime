import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Tag, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { EmptyState } from '@/components/EmptyState';
import { shinimeApi, type GenreItem } from '@/services/shinimeApi';
import { cn } from '@/lib/utils';

// Vibrant gradient variations for genre categories (Kuzen theme)
const GRADIENT_COLORS = [
  'from-blue-600/10 to-cyan-600/10 hover:from-blue-600/20 hover:to-cyan-600/20 border-blue-500/10 hover:border-blue-500/30',
  'from-purple-600/10 to-pink-600/10 hover:from-purple-600/20 hover:to-pink-600/20 border-purple-500/10 hover:border-purple-500/30',
  'from-orange-600/10 to-red-600/10 hover:from-orange-600/20 hover:to-red-600/20 border-orange-500/10 hover:border-orange-500/30',
  'from-green-600/10 to-emerald-600/10 hover:from-green-600/20 hover:to-emerald-600/20 border-green-500/10 hover:border-green-500/30',
  'from-rose-600/10 to-pink-600/10 hover:from-rose-600/20 hover:to-pink-600/20 border-rose-500/10 hover:border-rose-500/30',
  'from-indigo-600/10 to-purple-600/10 hover:from-indigo-600/20 hover:to-purple-600/20 border-indigo-500/10 hover:border-indigo-500/30',
  'from-teal-600/10 to-cyan-600/10 hover:from-teal-600/20 hover:to-cyan-600/20 border-teal-500/10 hover:border-teal-500/30',
  'from-amber-600/10 to-orange-600/10 hover:from-amber-600/20 hover:to-orange-600/20 border-amber-500/10 hover:border-amber-500/30',
];

export default function GenreListPage() {
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGenres = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await shinimeApi.getGenres();
      setGenres(res.data?.genres || []);
    } catch (err: any) {
      console.error("Genre list loading error:", err);
      setError(err.message || 'Gagal memuat daftar genre.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  return (
    <>
      <Helmet>
        <title>Daftar Genre Anime Lengkap - Maounime</title>
        <meta name="description" content="Telusuri koleksi lengkap genre anime di Maounime. Temukan anime aksi, petualangan, romantis, komedi, horor, fantasi, dan banyak lagi." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen pt-20 pb-28 md:pb-16 bg-[#0B0F19] text-slate-100">
        <div className="container max-w-7xl mx-auto px-4">
          
          {/* Header */}
          <div className="py-8 border-b border-border/10 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="w-6 h-6 text-accent" />
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">Genre Anime</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Jelajahi ribuan judul anime berdasarkan kategori genre kesukaan Anda
            </p>
          </div>

          {/* Genres Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-card/20 border border-border/5 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <EmptyState 
              type="error" 
              description={error}
              onRetry={fetchGenres}
            />
          ) : genres.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {genres.map((genre, index) => {
                const gradientClass = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
                
                return (
                  <Link
                    key={genre.slug || index}
                    to={`/anime/list/genre?genre=${genre.slug}`}
                    className={cn(
                      "group relative flex items-center justify-between p-4 rounded-xl bg-gradient-to-br border transition-all duration-300 hover-glow opacity-0 slide-up",
                      gradientClass
                    )}
                    style={{ animationDelay: `${index * 0.02}s`, animationFillMode: 'forwards' }}
                  >
                    <span className="text-xs font-bold text-slate-200 group-hover:text-accent transition-colors">
                      {genre.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              type="anime" 
              title="Genre Tidak Ditemukan"
              description="Daftar genre saat ini tidak dapat diakses."
            />
          )}
        </div>
      </main>
    </>
  );
}
