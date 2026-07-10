import { Link } from 'react-router-dom';
import { Play, Star, Calendar } from 'lucide-react';
import type { AnimeCardData } from '@/services/shinimeApi';

interface AnimeCardProps {
  anime: AnimeCardData;
  index?: number;
  showEpisode?: boolean;
}

export function AnimeCard({ anime, index = 0, showEpisode = true }: AnimeCardProps) {
  const imageUrl = anime.poster || '/placeholder.svg';
  const displayEpisode = anime.episode;
  
  return (
    <Link
      to={`/anime/${anime.slug}`}
      className="group relative block rounded-xl overflow-hidden hover-glow opacity-0 slide-up border border-border/10 bg-card/40 hover:border-accent/40 hover:bg-card/80 transition-all"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
    >
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={anime.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center shadow-glow transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-accent-foreground fill-accent-foreground ml-1" />
          </div>
        </div>

        {/* Rating Badge */}
        {anime.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-background/80 backdrop-blur-sm text-[10px] font-semibold text-accent border border-accent/20">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            <span>{anime.rating}</span>
          </div>
        )}

        {/* Episode Badge / Current status */}
        {displayEpisode && showEpisode && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-bold uppercase shadow">
            {displayEpisode}
          </div>
        )}

        {/* Release Day / Schedule info */}
        {anime.day && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-medium text-white">
            <Calendar className="w-2.5 h-2.5" />
            <span>{anime.day}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors" title={anime.title}>
          {anime.title}
        </h3>
        <div className="flex items-center justify-between gap-2 mt-1 text-[10px] text-muted-foreground">
          {anime.date ? <span>{anime.date}</span> : anime.status ? <span>{anime.status}</span> : null}
          {anime.episodes && <span>{anime.episodes}</span>}
        </div>
      </div>
    </Link>
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="relative rounded-xl overflow-hidden bg-card/40 border border-border/10">
      <div className="aspect-[2/3] bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-2 bg-muted rounded w-2/3 animate-pulse" />
      </div>
    </div>
  );
}
