export type InteractionAction = "WATCHED" | "RATED" | "DISLIKED";

export interface MovieInteraction {
  movieId: number;
  action: InteractionAction;
  date: string;
  rating?: number;
}

export interface UserPreferences {
  favoriteGenres: string[];
  dislikedGenres: string[];
  favoriteActors: string[];
  favoriteDirectors: string[];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  favoriteGenres: [],
  dislikedGenres: [],
  favoriteActors: [],
  favoriteDirectors: [],
};

export interface WatchedMovieRecord {
  id: string;
  externalId: number;
  title: string;
  posterUrl: string;
  genres: string[];
  rating: number | null;
  watchedAt: string;
}

export interface ScoredRecommendation {
  id: number;
  title: string;
  year: string;
  poster: string;
  genres: string[];
  overview: string;
  ratingTmdb: number;
  compatibility: number;
  reason: string;
}
