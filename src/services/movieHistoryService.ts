import { MediaHistoryService } from "@/services/mediaHistoryService";
import type { Movie, WatchedMovieEntry } from "@/types/movie";
import type { UserRating } from "@/types/watched";

function toWatchedMovieEntry(entry: {
  mediaId: number;
  title: string;
  posterUrl: string;
  genres: string[];
  watchedAt: string;
  rating: number | null;
}): WatchedMovieEntry {
  return {
    movieId: entry.mediaId,
    title: entry.title,
    posterUrl: entry.posterUrl,
    genres: entry.genres,
    watchedAt: entry.watchedAt,
    rating: entry.rating,
  };
}

export const MovieHistoryService = {
  async listWatchedMovies(): Promise<WatchedMovieEntry[]> {
    const items = await MediaHistoryService.listWatched("movie");
    return items.map(toWatchedMovieEntry);
  },

  async getWatchedMovieIds(): Promise<Set<number>> {
    const movies = await this.listWatchedMovies();
    return new Set(movies.map((item) => item.movieId));
  },

  async findWatchedMovie(
    movieId: number,
  ): Promise<WatchedMovieEntry | undefined> {
    const item = await MediaHistoryService.findWatched("movie", movieId);
    return item ? toWatchedMovieEntry(item) : undefined;
  },

  async markAsWatched(movie: Movie): Promise<WatchedMovieEntry> {
    const entry = await MediaHistoryService.markAsWatched({
      id: movie.id,
      externalId: movie.externalId,
      title: movie.title,
      originalTitle: movie.originalTitle,
      type: "movie",
      overview: movie.overview,
      posterUrl: movie.posterUrl,
      releaseDate: movie.releaseDate,
      year: movie.year,
      genres: movie.genres,
      actors: movie.actors,
      director: movie.director,
      ...(movie.ratingTmdb !== undefined ? { ratingTmdb: movie.ratingTmdb } : {}),
      ...(movie.runtime !== undefined ? { runtime: movie.runtime } : {}),
      ...(movie.keywords !== undefined ? { keywords: movie.keywords } : {}),
    });

    return toWatchedMovieEntry(entry);
  },

  async updateRating(
    movieId: number,
    rating: UserRating,
  ): Promise<WatchedMovieEntry | null> {
    const entry = await MediaHistoryService.updateRating(
      "movie",
      movieId,
      rating,
    );
    return entry ? toWatchedMovieEntry(entry) : null;
  },

  async removeRating(movieId: number): Promise<WatchedMovieEntry | null> {
    const entry = await MediaHistoryService.removeRating("movie", movieId);
    return entry ? toWatchedMovieEntry(entry) : null;
  },
};
