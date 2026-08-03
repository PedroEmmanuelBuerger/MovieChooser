import { LocalStorageService } from "@/services/localStorageService";
import {
  addMovieInteraction,
  rebuildPreferencesFromWatched,
} from "@/services/preferenceService";
import {
  getWatchedItems,
  markAsWatched,
  updateWatchedRating,
} from "@/services/storageService";
import type { Movie, WatchedMovieEntry } from "@/types/movie";
import type { UserRating, WatchedItem } from "@/types/watched";
import { isValidUserRating } from "@/types/watched";

const WATCHED_MOVIES_MIRROR_KEY = "moviechooser.watchedMovies";

function toWatchedMovieEntry(item: WatchedItem): WatchedMovieEntry {
  return {
    movieId: item.id,
    title: item.title,
    posterUrl: item.poster,
    genres: item.genre
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
    watchedAt: item.watchedAt,
    rating: item.userRating,
  };
}

function mirrorWatchedMovies(items: readonly WatchedItem[]): WatchedMovieEntry[] {
  const movies = items
    .filter((item) => item.type === "movie")
    .map(toWatchedMovieEntry)
    .sort(
      (a, b) =>
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime(),
    );

  LocalStorageService.setItem(WATCHED_MOVIES_MIRROR_KEY, movies);
  return movies;
}

function toWatchedItemFromMovie(movie: Movie): WatchedItem {
  return {
    id: movie.externalId,
    title: movie.title,
    description: movie.overview,
    poster: movie.posterUrl ?? "",
    platform: "Pesquisa",
    platformId: "search",
    type: "movie",
    genre: movie.genres.join(", ") || "Filme",
    ratingTmdb: movie.ratingTmdb ?? 0,
    userRating: null,
    watchedAt: new Date().toISOString(),
  };
}

export const MovieHistoryService = {
  async listWatchedMovies(): Promise<WatchedMovieEntry[]> {
    const items = await getWatchedItems();
    return mirrorWatchedMovies(items);
  },

  async getWatchedMovieIds(): Promise<Set<number>> {
    const movies = await this.listWatchedMovies();
    return new Set(movies.map((item) => item.movieId));
  },

  async findWatchedMovie(
    movieId: number,
  ): Promise<WatchedMovieEntry | undefined> {
    const movies = await this.listWatchedMovies();
    return movies.find((item) => item.movieId === movieId);
  },

  async markAsWatched(movie: Movie): Promise<WatchedMovieEntry> {
    const payload = toWatchedItemFromMovie(movie);
    const result = await markAsWatched(payload);
    const entry =
      result.items.find(
        (item) => item.type === "movie" && item.id === movie.externalId,
      ) ?? payload;

    await addMovieInteraction({
      movieId: movie.externalId,
      action: "WATCHED",
      date: entry.watchedAt,
    });

    const mirrored = mirrorWatchedMovies(result.items);
    await rebuildPreferencesFromWatched(result.items);

    return (
      mirrored.find((item) => item.movieId === movie.externalId) ??
      toWatchedMovieEntry(entry)
    );
  },

  async updateRating(
    movieId: number,
    rating: UserRating,
  ): Promise<WatchedMovieEntry | null> {
    if (!isValidUserRating(rating)) {
      throw new Error("Invalid rating");
    }

    const items = await updateWatchedRating({
      type: "movie",
      id: movieId,
      userRating: rating,
    });

    await addMovieInteraction({
      movieId,
      action: "RATED",
      date: new Date().toISOString(),
      rating,
    });

    const mirrored = mirrorWatchedMovies(items);
    await rebuildPreferencesFromWatched(items);
    return mirrored.find((item) => item.movieId === movieId) ?? null;
  },

  async removeRating(movieId: number): Promise<WatchedMovieEntry | null> {
    const items = await updateWatchedRating({
      type: "movie",
      id: movieId,
      userRating: null,
    });

    const mirrored = mirrorWatchedMovies(items);
    await rebuildPreferencesFromWatched(items);
    return mirrored.find((item) => item.movieId === movieId) ?? null;
  },
};
