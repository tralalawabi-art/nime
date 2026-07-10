import axios from "axios";

export interface AnimeCardData {
  title: string;
  slug: string;
  url: string;
  poster: string | null;
  episode?: string | null;
  day?: string | null;
  date?: string | null;
  studio?: string | null;
  episodes?: string | null;
  rating?: string | null;
  genres?: string[];
  synopsis?: string | null;
  season?: string | null;
  status?: string | null;
}

export interface Pagination {
  current: number;
  next: string | null;
  hasNext: boolean;
  total: number | null;
}

export interface ScrapedResponse<T> {
  creator: string;
  page: string;
  url: string;
  data: T;
}

export interface HomeData {
  items: AnimeCardData[];
}

export interface ListData {
  pagination: Pagination;
  items: AnimeCardData[];
}

export interface GenreItem {
  name: string;
  slug: string;
  url: string;
}

export interface GenreListData {
  genres: GenreItem[];
}

export interface ScheduleItem {
  title: string;
  slug: string;
  url: string;
}

export interface ScheduleData {
  [day: string]: ScheduleItem[];
}

export interface EpisodeItem {
  title: string;
  episodeId: string | null;
  url: string;
  releaseDate: string | null;
}

export interface RecommendationItem {
  title: string;
  slug: string;
  url: string;
  poster: string | null;
}

export interface AnimeDetail {
  title: string;
  poster: string | null;
  sinopsis: string | null;
  info: Record<string, string>;
  episodes: EpisodeItem[];
  recommendations: RecommendationItem[];
}

export interface StreamMirror {
  [qualityAndHost: string]: string;
}

export interface DownloadLink {
  host: string;
  url: string;
}

export interface DownloadResolutionItem {
  resolution: string | null;
  size: string | null;
  links: DownloadLink[];
}

export interface DownloadGroup {
  group: string;
  items: DownloadResolutionItem[];
}

export interface EpisodeDetail {
  title: string;
  streams: StreamMirror;
  downloads: DownloadGroup[];
  nav: {
    prevSlug: string | null;
    allSlug: string | null;
    nextSlug: string | null;
  };
  otherEpisodes?: EpisodeItem[];
}

export interface BatchDetail {
  title: string;
  downloads: DownloadGroup[];
}

const API_BASE = ""; // Relative paths will hit Express directly

export const shinimeApi = {
  async getHome(): Promise<ScrapedResponse<HomeData>> {
    const res = await axios.get(`${API_BASE}/api/home`);
    return res.data;
  },

  async getOngoing(page = 1): Promise<ScrapedResponse<ListData>> {
    const res = await axios.get(`${API_BASE}/api/ongoing`, { params: { page } });
    return res.data;
  },

  async getComplete(page = 1): Promise<ScrapedResponse<ListData>> {
    const res = await axios.get(`${API_BASE}/api/complete`, { params: { page } });
    return res.data;
  },

  async getGenres(): Promise<ScrapedResponse<GenreListData>> {
    const res = await axios.get(`${API_BASE}/api/genres`);
    return res.data;
  },

  async getGenreAnime(slug: string, page = 1): Promise<ScrapedResponse<ListData>> {
    const res = await axios.get(`${API_BASE}/api/genres/${slug}`, { params: { page } });
    return res.data;
  },

  async getSchedule(): Promise<ScrapedResponse<ScheduleData>> {
    const res = await axios.get(`${API_BASE}/api/schedule`);
    return res.data;
  },

  async search(queryStr: string): Promise<ScrapedResponse<HomeData>> {
    const res = await axios.get(`${API_BASE}/api/search`, { params: { q: queryStr } });
    return res.data;
  },

  async getDetail(slug: string): Promise<ScrapedResponse<AnimeDetail>> {
    const res = await axios.get(`${API_BASE}/api/anime/${slug}`);
    return res.data;
  },

  async getEpisode(slug: string): Promise<ScrapedResponse<EpisodeDetail>> {
    const res = await axios.get(`${API_BASE}/api/episode/${slug}`);
    return res.data;
  },

  async getBatch(slug: string): Promise<ScrapedResponse<BatchDetail>> {
    const res = await axios.get(`${API_BASE}/api/batch/${slug}`);
    return res.data;
  }
};
