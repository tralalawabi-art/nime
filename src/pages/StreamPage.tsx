import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ChevronLeft, 
  ChevronRight, 
  List, 
  Loader2, 
  AlertCircle, 
  ExternalLink,
  Moon,
  Sun,
  X,
  Tv,
  Download,
  Send,
  User as UserIcon,
  MessageSquare,
  Bookmark,
  Share2,
  Database,
  RefreshCw,
  Check
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { shinimeApi, type EpisodeDetail, type EpisodeItem } from '@/services/shinimeApi';
import { firebaseService, type Comment } from '@/services/firebaseService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function StreamPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [episodeData, setEpisodeData] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Streams & Active Server
  const [activeServer, setActiveServer] = useState<string>('');
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  
  // UI states
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [customName, setCustomName] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Watchlist & Database states
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const fetchEpisode = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);
      const res = await shinimeApi.getEpisode(slug);
      const data = res.data;

      // Hapus stream/server yang lain kecuali stream dari mega dan ondesuhd
      if (data.streams) {
        const filteredStreams: Record<string, string> = {};
        for (const [key, val] of Object.entries(data.streams)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('mega') || lowerKey.includes('ondesuhd')) {
            filteredStreams[key] = val;
          }
        }
        data.streams = filteredStreams;
      }

      setEpisodeData(data);

      // Set default stream server (the first one available)
      const servers = Object.keys(data.streams || {});
      if (servers.length > 0) {
        setActiveServer(servers[0]);
        setActiveStreamUrl(data.streams[servers[0]]);
      } else {
        setActiveServer('');
        setActiveStreamUrl('');
      }

      // Add to Firebase watch history if allSlug is available
      if (data.nav?.allSlug) {
        try {
          await firebaseService.addToHistory(
            data.nav.allSlug,
            data.title.replace("Episode", "").split("-")[0]?.trim() || "Anime",
            slug,
            data.title,
            "" // Poster will load from DB if previously bookmarked
          );
        } catch (histErr) {
          console.error("Failed to save watch history:", histErr);
        }

        try {
          const bookmarked = await firebaseService.isBookmarked(data.nav.allSlug);
          setIsBookmarked(bookmarked);
        } catch (bkErr) {
          console.error("Failed to check bookmark status:", bkErr);
        }
      }

      // Update fallback mode status
      setIsFallback(firebaseService.isFallbackActive());

      // Fetch comments for this episode
      try {
        const epComments = await firebaseService.getComments(slug);
        setComments(epComments);
      } catch (commErr) {
        console.error("Failed to load comments:", commErr);
      }

    } catch (err: any) {
      console.error("Episode page error:", err);
      setError(err.message || 'Gagal memuat streaming episode. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEpisode();
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchEpisode]);

  // Handle stream server change
  const handleServerChange = (serverName: string) => {
    if (episodeData?.streams[serverName]) {
      setActiveServer(serverName);
      setActiveStreamUrl(episodeData.streams[serverName]);
      toast.success(`Server dialihkan ke ${serverName.split('_').reverse().join(' ')}`);
    }
  };

  // Toggle watchlist/bookmark handler
  const toggleBookmark = async () => {
    if (!episodeData?.nav?.allSlug) return;
    try {
      setBookmarkLoading(true);
      const animeSlug = episodeData.nav.allSlug;
      const animeTitle = episodeData.title.split('Episode')[0]?.trim() || "Anime";
      
      if (isBookmarked) {
        await firebaseService.removeBookmark(animeSlug);
        setIsBookmarked(false);
        toast.success('Dihapus dari Daftar Tontonan');
      } else {
        // Fallback or empty poster, we can use empty string or placeholder
        await firebaseService.addBookmark(animeSlug, animeTitle, "", "");
        setIsBookmarked(true);
        toast.success('Disimpan ke Daftar Tontonan');
      }
    } catch (err) {
      console.error("Watchlist operation failed:", err);
      toast.error('Gagal memperbarui Daftar Tontonan');
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Copy streaming link
  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Tautan berhasil disalin!');
    } catch (err) {
      toast.error('Gagal menyalin tautan');
    }
  };

  // Keyboard navigation for Prev/Next episodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cinemaMode) {
        setCinemaMode(false);
      }
      if (e.key === 'ArrowLeft' && episodeData?.nav?.prevSlug && !e.ctrlKey && !e.metaKey) {
        navigate(`/watch/${episodeData.nav.prevSlug}`);
      }
      if (e.key === 'ArrowRight' && episodeData?.nav?.nextSlug && !e.ctrlKey && !e.metaKey) {
        navigate(`/watch/${episodeData.nav.nextSlug}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cinemaMode, episodeData, navigate]);

  // Toggle body class for cinema mode styling
  useEffect(() => {
    if (cinemaMode) {
      document.body.classList.add('cinema-mode');
    } else {
      document.body.classList.remove('cinema-mode');
    }
    return () => {
      document.body.classList.remove('cinema-mode');
    };
  }, [cinemaMode]);

  // Submit comment to Firestore
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !slug) return;

    try {
      setSubmittingComment(true);
      await firebaseService.addComment(slug, newComment.trim(), customName.trim() || undefined);
      setNewComment('');
      
      // Reload comments list
      const epComments = await firebaseService.getComments(slug);
      setComments(epComments);
      toast.success('Komentar berhasil dikirim!');
    } catch (err) {
      console.error("Failed to post comment:", err);
      toast.error('Gagal mengirim komentar');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[#0B0F19] text-white">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
          <p className="text-xs text-muted-foreground animate-pulse">Menghubungkan stream server...</p>
        </main>
      </>
    );
  }

  if (error || !episodeData) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 bg-[#0B0F19] text-white">
          <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
            <EmptyState 
              type="error" 
              title="Streaming Error"
              description={error || 'Episode tidak ditemukan'} 
              onRetry={fetchEpisode}
            />
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline">
                <Link to="/">Ke Beranda</Link>
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Nonton ${episodeData.title} Sub Indo - Maounime`}</title>
        <meta name="description" content={`Streaming online anime ${episodeData.title} sub indo gratis dengan pilihan resolusi 360p, 480p, 720p kualitas terbaik.`} />
      </Helmet>

      {/* Cinema Mode Background dark tint overlay */}
      {cinemaMode && (
        <div 
          className="fixed inset-0 bg-black/95 z-40 transition-opacity duration-300"
          onClick={() => setCinemaMode(false)}
        />
      )}

      {!cinemaMode && <Navbar />}

      <main className={cn(
        "min-h-screen transition-all duration-300",
        cinemaMode 
          ? "pt-0 bg-black" 
          : "pt-16 sm:pt-20 pb-28 md:pb-16 bg-[#0B0F19] text-slate-100"
      )}>
        <div className={cn(
          "mx-auto px-4 transition-all duration-300",
          cinemaMode ? "max-w-[1400px] py-4" : "max-w-6xl"
        )}>
          
          {/* Back Nav Link */}
          {!cinemaMode && episodeData.nav?.allSlug && (
            <Link
              to={`/anime/${episodeData.nav.allSlug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-white mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali ke Detail Anime
            </Link>
          )}

          {/* Video Streaming Window Frame */}
          <div className={cn(
            "relative z-50 transition-all duration-300 bg-black rounded-none sm:rounded-2xl overflow-hidden shadow-2xl border",
            cinemaMode ? "mb-4 border-accent/20" : "mb-6 border-border/10",
          )}>
            
            {/* Cinema mode switch toggle floating upper right */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCinemaMode(!cinemaMode)}
                className="bg-black/80 backdrop-blur-sm border border-white/10 hover:bg-black/90 hover:border-white/20 gap-1.5 text-[10px] h-8"
              >
                {cinemaMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Lampu Nyala</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-accent" />
                    <span>Lampu Padam</span>
                  </>
                )}
              </Button>
            </div>

            {/* Embed / IFrame stream frame player */}
            {activeStreamUrl ? (
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={activeStreamUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  referrerPolicy="no-referrer"
                  title={episodeData.title}
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-[#0E1119] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-3" />
                <h3 className="text-sm font-bold text-white">Stream Server Tidak Tersedia</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Coba switch server atau reload kembali jika link tidak ter-render dengan sempurna.
                </p>
              </div>
            )}

          </div>

          {/* Watch Page Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card/20 border border-border/10 mb-6 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* Watchlist Toggle */}
              <Button
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                variant="outline"
                size="sm"
                className="h-9 text-xs rounded-xl border-border/40 text-slate-300 hover:text-white hover:bg-card flex items-center gap-1.5"
              >
                <Bookmark className={cn("w-3.5 h-3.5", isBookmarked && "fill-accent text-accent")} />
                <span>{isBookmarked ? 'Simpan di Watchlist' : 'Tambah ke Watchlist'}</span>
              </Button>

              {/* Cinema Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCinemaMode(!cinemaMode)}
                className="h-9 text-xs rounded-xl border-border/40 text-slate-300 hover:text-white hover:bg-card flex items-center gap-1.5"
              >
                {cinemaMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Lampu Nyala</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-accent" />
                    <span>Lampu Padam</span>
                  </>
                )}
              </Button>

              {/* Copy / Share link */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-9 text-xs rounded-xl border-border/40 text-slate-300 hover:text-white hover:bg-card flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Salin Tautan</span>
              </Button>
            </div>

            {/* Database Storage / Cloud Sync State Badge */}
            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
              <span className="text-muted-foreground">Status Sinkronisasi:</span>
              <div 
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold select-none cursor-pointer hover:bg-card/40 transition-colors",
                  isFallback 
                    ? "border-amber-500/20 bg-amber-500/5 text-amber-400" 
                    : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                )}
                onClick={() => {
                  if (isFallback) {
                    toast.info(
                      "Koneksi Cloud Firestore bermasalah. Data Anda disimpan secara aman di browser lokal Anda.",
                      { duration: 5000 }
                    );
                  } else {
                    toast.success("Tersambung ke Cloud Firestore. Data tersinkronisasi di Cloud.");
                  }
                }}
              >
                <Database className="w-3 h-3" />
                <span className="relative flex h-1.5 w-1.5">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    isFallback ? "bg-amber-400" : "bg-emerald-400"
                  )}></span>
                  <span className={cn(
                    "relative inline-flex rounded-full h-1.5 w-1.5",
                    isFallback ? "bg-amber-500" : "bg-emerald-500"
                  )}></span>
                </span>
                <span>{isFallback ? 'Penyimpanan Lokal (Fallback)' : 'Cloud Firestore'}</span>
              </div>
            </div>
          </div>

          {/* Video Metadata Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Main column: Video Title, Switch server, Downloads, Comments */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Ep details & navigation buttons */}
              <div className="p-5 rounded-2xl bg-card/20 border border-border/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-base sm:text-lg font-bold text-white">
                      {episodeData.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Tv className="w-3.5 h-3.5 text-accent" />
                      <span>Streaming Server Aktif: </span>
                      <span className="text-accent font-bold">{activeServer ? activeServer.replace(/_/g, ' ') : "None"}</span>
                    </p>
                  </div>

                  {/* Navigation controls (Prev, Ep list, Next) */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!episodeData.nav?.prevSlug}
                      onClick={() => episodeData.nav?.prevSlug && navigate(`/watch/${episodeData.nav.prevSlug}`)}
                      className="h-9 text-xs border-border/40 text-slate-300"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                    </Button>

                    <Button
                      variant={showEpisodes ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setShowEpisodes(!showEpisodes)}
                      className="h-9 text-xs border-border/40 text-slate-300"
                    >
                      <List className="w-3.5 h-3.5 mr-1" /> List
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!episodeData.nav?.nextSlug}
                      onClick={() => episodeData.nav?.nextSlug && navigate(`/watch/${episodeData.nav.nextSlug}`)}
                      className="h-9 text-xs border-border/40 text-slate-300"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Keyboard tip */}
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  Tips: Tekan tombol panah ← → pada keyboard untuk pindah episode dengan cepat.
                </p>
              </div>

              {/* Server Mirror List Switcher */}
              {episodeData.streams && Object.keys(episodeData.streams).length > 0 && (
                <div className="p-5 rounded-2xl bg-card/20 border border-border/10">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Pilih Server / Mirror Streaming</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {Object.keys(episodeData.streams).map((serverName) => (
                      <button
                        key={serverName}
                        onClick={() => handleServerChange(serverName)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-bold border transition-all truncate text-left",
                          activeServer === serverName
                            ? "bg-accent/15 border-accent text-accent shadow"
                            : "bg-[#0F1321] border-border/5 text-slate-300 hover:border-accent/40"
                        )}
                      >
                        {serverName.split('_').reverse().join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Comment Section (Firebase) */}
              <div className="p-5 rounded-2xl bg-card/20 border border-border/10 space-y-6">
                <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <h3 className="text-sm font-bold text-white">Diskusi Episode ({comments.length})</h3>
                </div>

                {/* Comment Box input form */}
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      type="text"
                      placeholder="Nama Anda (Opsional)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="text-xs h-10 bg-black/40 border-border/30 focus:border-accent text-white"
                    />
                    <div className="sm:col-span-2 flex gap-2">
                      <Input
                        type="text"
                        required
                        placeholder="Tulis pendapatmu tentang episode ini..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="text-xs h-10 bg-black/40 border-border/30 focus:border-accent text-white flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={submittingComment || !newComment.trim()}
                        className="bg-accent text-accent-foreground font-bold px-4 hover:bg-accent/80"
                      >
                        {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Comments List display */}
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-black/20 border border-border/5 text-xs">
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs flex-shrink-0 border border-accent/20 uppercase">
                          {comment.userDisplayName.substring(0, 2)}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{comment.userDisplayName}</span>
                            <span className="text-[9px] text-muted-foreground">
                              {comment.createdAt?.seconds 
                                ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                                : 'Baru saja'}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed break-words">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      Belum ada komentar. Jadilah yang pertama memberikan tanggapan!
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Side column: All episodes jump and Download links */}
            <div className="space-y-6">
              
              {/* Episodes jump List */}
              {(showEpisodes || (episodeData.otherEpisodes && episodeData.otherEpisodes.length > 0)) && (
                <div className="p-5 rounded-2xl bg-card/20 border border-border/10">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Semua Episode</span>
                    <span className="text-[10px] text-muted-foreground">
                      {episodeData.otherEpisodes?.length || 0} eps
                    </span>
                  </h3>
                  <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {(episodeData.otherEpisodes || []).map((ep: EpisodeItem, index: number) => (
                      <Link
                        key={ep.episodeId || index}
                        to={`/watch/${ep.episodeId}`}
                        className={cn(
                          "flex items-center justify-center h-10 rounded-xl text-xs font-bold border transition-all",
                          ep.episodeId === slug
                            ? "bg-accent border-accent text-accent-foreground shadow"
                            : "bg-[#0F1321] border-border/5 text-slate-300 hover:border-accent/40"
                        )}
                      >
                        {ep.title.match(/Episode\s+(\d+)/)?.[1] || index + 1}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Downloads Links grouped by resolution */}
              {episodeData.downloads && episodeData.downloads.length > 0 && (
                <div className="p-5 rounded-2xl bg-card/20 border border-border/10 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/15 pb-2">
                    <Download className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Link Download Video</h3>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {episodeData.downloads.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-2">
                        <h4 className="text-[11px] font-bold text-accent uppercase tracking-wider bg-accent/10 px-2 py-1 rounded border border-accent/20">
                          {group.group}
                        </h4>
                        <div className="space-y-2.5">
                          {group.items.map((resItem, rIdx) => (
                            <div key={rIdx} className="p-2.5 rounded-xl bg-black/30 border border-border/5 text-xs space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-300">
                                <span className="font-bold text-white uppercase">{resItem.resolution}</span>
                                <span className="text-muted-foreground">{resItem.size}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {resItem.links.map((link, lIdx) => (
                                  <a
                                    key={lIdx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 rounded bg-[#0F1321] hover:bg-accent hover:text-accent-foreground border border-border/10 text-[10px] font-bold transition-all inline-flex items-center gap-1 text-slate-300"
                                  >
                                    <span>{link.host}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </main>
    </>
  );
}
