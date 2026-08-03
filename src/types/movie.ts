export interface MoviePerson {
  id: number;
  name: string;
  job?: string;
}

export interface Movie {
  id: string;
  externalId: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string;
  year: string;
  genres: string[];
  actors: MoviePerson[];
  director: MoviePerson[];
  ratingTmdb?: number;
  runtime?: number | null;
  keywords?: string[];
}

export interface WatchedMovieEntry {
  movieId: number;
  title: string;
  posterUrl: string;
  genres: string[];
  watchedAt: string;
  rating: number | null;
}

export function createMovieId(externalId: number): string {
  return `movie:${String(externalId)}`;
}
