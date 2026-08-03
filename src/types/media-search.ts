export interface SearchMediaResult {
  id: number;
  type: "movie" | "series" | "anime";
  title: string;
  originalTitle: string;
  year: string;
  poster: string | null;
  overview: string;
  ratingTmdb: number;
  genreIds: number[];
  genreNames: string[];
  runtime?: number | null;
  seasons?: number | null;
  episodes?: number | null;
  studio?: string | null;
}

export interface MediaCreditPerson {
  id: number;
  name: string;
  job?: string;
}

export interface SearchMediaDetails extends SearchMediaResult {
  description: string;
  releaseDate: string;
  runtime: number | null;
  directors: MediaCreditPerson[];
  cast: MediaCreditPerson[];
  keywords: string[];
}
