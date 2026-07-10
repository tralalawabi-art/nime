import { Link, useLocation } from 'react-router-dom';
import { Home, Tv, Film, Tag, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentGenre = searchParams.get('genre') || '';
  const currentTab = searchParams.get('tab') || '';

  // Active state logic
  const isHomeActive = currentPath === '/';
  const isSeriesActive = currentPath.startsWith('/anime/list/ongoing');
  const isMoviesActive = currentGenre === 'movie';
  const isHistoryActive = currentPath === '/watchlist' && currentTab === 'history';
  const isGenresActive = 
    (currentPath.startsWith('/genres') || 
    (currentPath.startsWith('/anime/list/genre') && currentGenre !== 'movie' && currentGenre !== 'ova')) && !isHistoryActive;

  const navItems = [
    {
      name: 'Home',
      icon: Home,
      to: '/',
      active: isHomeActive,
    },
    {
      name: 'Series',
      icon: Tv,
      to: '/anime/list/ongoing',
      active: isSeriesActive,
    },
    {
      name: 'Movies',
      icon: Film,
      to: '/anime/list/genre?genre=movie',
      active: isMoviesActive,
    },
    {
      name: 'History',
      icon: History,
      to: '/watchlist?tab=history',
      active: isHistoryActive,
    },
    {
      name: 'Genres',
      icon: Tag,
      to: '/genres',
      active: isGenresActive,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F19]/95 border-t border-border/10 backdrop-blur-lg pb-safe">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <Icon 
                className={cn(
                  "w-5 h-5 transition-transform duration-200", 
                  item.active ? "text-accent scale-110" : "text-slate-400"
                )} 
              />
              <span 
                className={cn(
                  "text-[10px] font-semibold transition-colors", 
                  item.active ? "text-accent font-bold" : "text-slate-400"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
