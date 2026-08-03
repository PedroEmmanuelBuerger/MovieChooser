import type { ContentTypeId } from "@/types/content-type";

export type InteractionAction = "WATCHED" | "RATED" | "DISLIKED";

export interface MediaInteraction {
  mediaId: number;
  type: ContentTypeId;
  action: InteractionAction;
  date: string;
  rating?: number;
}

export interface MovieInteraction {
  movieId: number;
  type?: ContentTypeId;
  action: InteractionAction;
  date: string;
  rating?: number;
}

export interface UserPreferences {
  favoriteGenres: string[];
  dislikedGenres: string[];
  favoriteActors: string[];
  favoriteDirectors: string[];
  preferredContentTypes?: ContentTypeId[];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  favoriteGenres: [],
  dislikedGenres: [],
  favoriteActors: [],
  favoriteDirectors: [],
  preferredContentTypes: [],
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
  type: ContentTypeId;
  title: string;
  year: string;
  poster: string;
  genres: string[];
  overview: string;
  ratingTmdb: number;
  compatibility: number;
  reason: string;
}

export function toMediaInteraction(
  interaction: MovieInteraction | MediaInteraction,
): MediaInteraction {
  if ("mediaId" in interaction) {
    return interaction;
  }

  return {
    mediaId: interaction.movieId,
    type: interaction.type ?? "movie",
    action: interaction.action,
    date: interaction.date,
    ...(interaction.rating !== undefined ? { rating: interaction.rating } : {}),
  };
}

export function toMovieInteraction(
  interaction: MediaInteraction,
): MovieInteraction {
  return {
    movieId: interaction.mediaId,
    type: interaction.type,
    action: interaction.action,
    date: interaction.date,
    ...(interaction.rating !== undefined ? { rating: interaction.rating } : {}),
  };
}
