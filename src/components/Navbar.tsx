import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Play, Film, Tv, Tag, Bookmark, ArrowLeft, LogIn, LogOut, History, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

const navLinks = [
  { name: 'Ongoing', href: '/anime/list/ongoing', icon: Tv },
  { name: 'Completed', href: '/anime/list/complete', icon: Film },
  { name: 'Genre List', href: '/genres', icon: Tag },
  { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { user, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
      setShowMobileSearch(false);
    }
  };

  const isUserLoggedIn = user && !user.isAnonymous;

  const renderProfileMenu = (align: 'end' | 'start' = 'end') => {
    if (isUserLoggedIn) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full focus-visible:ring-0">
              <Avatar className="h-8 w-8 border border-accent/20">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs uppercase">
                  {user.displayName?.substring(0, 2) || user.email?.substring(0, 2) || 'US'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align} className="w-56 bg-[#0B0F19]/95 backdrop-blur-xl border border-border/15 text-slate-100 rounded-xl p-1.5 shadow-2xl">
            <DropdownMenuLabel className="font-normal px-2.5 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold text-white line-clamp-1">{user.displayName}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/10" />
            <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white rounded-lg cursor-pointer">
              <Link to="/watchlist" className="flex items-center gap-2.5 py-2 px-2.5 text-xs text-slate-300">
                <Bookmark className="w-4 h-4 text-slate-400" />
                <span>Daftar Tontonan</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white rounded-lg cursor-pointer">
              <Link to="/watchlist?tab=history" className="flex items-center gap-2.5 py-2 px-2.5 text-xs text-slate-300">
                <History className="w-4 h-4 text-slate-400" />
                <span>Riwayat Nonton</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/10" />
            <DropdownMenuItem 
              onClick={logout} 
              className="focus:bg-destructive/10 focus:text-destructive rounded-lg cursor-pointer py-2 px-2.5 text-xs text-rose-400"
            >
              <LogOut className="w-4 h-4 mr-2.5 shrink-0" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Button 
        onClick={loginWithGoogle}
        variant="outline" 
        className="h-9 px-4 rounded-xl text-xs font-bold border-accent/25 hover:border-accent hover:bg-accent/10 text-white flex items-center gap-2 transition-all"
      >
        <LogIn className="w-3.5 h-3.5 text-accent" />
        <span className="hidden sm:inline">Masuk</span>
      </Button>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-border/10">
      <div className="container max-w-7xl mx-auto px-4">
        {showMobileSearch ? (
          <div className="flex items-center gap-3 h-16 sm:h-20 animate-fade-in">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-300 hover:text-white shrink-0"
              onClick={() => setShowMobileSearch(false)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  autoFocus
                  type="text"
                  placeholder="Cari anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 bg-black/40 border-border/15 text-white rounded-xl text-xs placeholder:text-slate-500 focus:border-accent focus:ring-accent/10"
                />
              </div>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-between h-16 sm:h-20 animate-fade-in">
            
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 group shrink-0"
            >
              <div className="relative">
                <Play className="w-7 h-7 text-accent fill-accent group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-accent/20 blur-md group-hover:blur-lg transition-all" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                maou<span className="text-accent">nime</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white hover:text-accent transition-colors group"
                >
                  <link.icon className="w-4 h-4 text-slate-400 group-hover:text-accent transition-colors" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>

            {/* Desktop Search Bar & Auth */}
            <div className="hidden md:flex items-center gap-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Cari anime..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-40 lg:w-48 h-9 pl-9 pr-4 text-xs bg-black/40 border-border/20 text-white rounded-xl focus:border-accent focus:ring-accent/10 focus:w-56 transition-all placeholder:text-slate-500"
                  />
                </div>
              </form>
              {renderProfileMenu()}
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex md:hidden items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-300 hover:text-white"
                onClick={() => setShowMobileSearch(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
              {renderProfileMenu('end')}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 sm:top-20 left-0 right-0 bg-[#0B0F19]/95 backdrop-blur-xl border-b border-border/10 scale-in shadow-xl">
          <div className="container mx-auto px-4 py-5 space-y-4">
            {/* Search Input for Mobile Dropdown */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 bg-black/40 border-border/15 text-white rounded-xl text-xs placeholder:text-slate-500 focus:border-accent focus:ring-accent/10"
                />
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-card/40 text-xs font-semibold transition-all"
                >
                  <link.icon className="w-4 h-4 text-slate-400" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>

            {/* Mobile Auth options inline if logged in */}
            {isUserLoggedIn && (
              <div className="pt-3 border-t border-border/10 flex flex-col gap-1">
                <div className="px-3.5 py-2 mb-1 flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-accent/20">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs uppercase">
                      {user.displayName?.substring(0, 2) || 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-bold text-white line-clamp-1">{user.displayName}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{user.email}</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full h-10 rounded-xl text-xs font-bold justify-start px-3.5 flex items-center gap-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-0"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
