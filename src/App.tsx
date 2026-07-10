import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import AnimeListPage from "./pages/AnimeListPage";
import GenreListPage from "./pages/GenreListPage";
import AnimeDetailPage from "./pages/AnimeDetailPage";
import StreamPage from "./pages/StreamPage";
import WatchlistPage from "./pages/WatchlistPage";
import NotFound from "./pages/NotFound";
import { BottomNav } from "./components/BottomNav";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/genres" element={<GenreListPage />} />
              <Route path="/anime/:slug" element={<AnimeDetailPage />} />
              <Route path="/anime/list/:type" element={<AnimeListPage />} />
              <Route path="/watch/:slug" element={<StreamPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
