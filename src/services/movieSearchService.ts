import { MOVIE_GENRES } from "@/data/genres";
import {
  getMovieCredits,
  getMovieDetails,
  getMovieKeywords,
  searchMovies,
} from "@/services/tmdb";
import {
  putSearchCache,
  readSearchCache,
} from "@/services/preferenceService";
import type {
  SearchMovieDetails,
  SearchMovieResult,
} from "@/types/movie-search";

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

function genreNameByTmdbId(id: number): string {
  const match = MOVIE_GENRES.find((genre) => genre.tmdbId === id);
  return match?.name ?? "Outros";
}

function yearFromDate(value: string): string {
  if (!value || value.length < 4) {
    return "—";
  }

  return value.slice(0, 4);
}

function posterUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  return `${TMDB_POSTER_BASE_URL}${path}`;
}

function mapSearchResult(
  item: Awaited<ReturnType<typeof searchMovies>>["results"][number],
): SearchMovieResult {
  const genreNames = item.genreIds.map(genreNameByTmdbId);

  return {
    id: item.id,
    title: item.title,
    originalTitle: item.originalTitle,
    year: yearFromDate(item.releaseDate),
    poster: posterUrl(item.posterPath),
    overview: item.overview,
    ratingTmdb: item.voteAverage,
    genreIds: item.genreIds,
    genreNames,
  };
}

function dedupeById(items: SearchMovieResult[]): SearchMovieResult[] {
  const seen = new Set<number>();
  const unique: SearchMovieResult[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    unique.push(item);
  }

  return unique;
}

export const MovieSearchService = {
  async search(
    query: string,
    signal?: AbortSignal,
  ): Promise<SearchMovieResult[]> {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      return [];
    }

    const cached = readSearchCache(trimmed);

    if (cached) {
      return cached as SearchMovieResult[];
    }

    const [ptResults, enResults] = await Promise.all([
      searchMovies(trimmed, {
        language: "pt-BR",
        ...(signal ? { signal } : {}),
      }),
      searchMovies(trimmed, {
        language: "en-US",
        ...(signal ? { signal } : {}),
      }),
    ]);

    const merged = dedupeById([
      ...ptResults.results.map(mapSearchResult),
      ...enResults.results.map(mapSearchResult),
    ]).slice(0, 24);

    putSearchCache(trimmed, merged);
    return merged;
  },

  async getDetails(
    movieId: number,
    signal?: AbortSignal,
  ): Promise<SearchMovieDetails> {
    const [details, credits, keywords] = await Promise.all([
      getMovieDetails(movieId, signal),
      getMovieCredits(movieId, signal),
      getMovieKeywords(movieId, signal),
    ]);

    const genreNames = details.genreIds.map(genreNameByTmdbId);

    return {
      id: details.id,
      title: details.title,
      originalTitle: details.title,
      year: yearFromDate(details.releaseDate),
      poster: posterUrl(details.posterPath),
      overview: details.overview,
      description: details.overview,
      releaseDate: details.releaseDate,
      ratingTmdb: details.voteAverage,
      genreIds: details.genreIds,
      genreNames,
      runtime: details.runtime,
      directors: credits.directors,
      cast: credits.cast,
      keywords,
    };
  },
};
