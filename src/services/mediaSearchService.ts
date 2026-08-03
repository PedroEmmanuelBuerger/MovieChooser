import { MOVIE_GENRES, TV_GENRES } from "@/data/genres";
import {
  getMovieCredits,
  getMovieDetails,
  getMovieKeywords,
  getTVShowCredits,
  getTVShowDetails,
  isLikelyAnime,
  searchMovies,
  searchTVShows,
} from "@/services/tmdb";
import {
  putSearchCache,
  readSearchCache,
} from "@/services/preferenceService";
import type { MediaKind } from "@/types/content-type";
import { createMediaId, type Media } from "@/types/media";
import type {
  SearchMediaDetails,
  SearchMediaResult,
} from "@/types/media-search";

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

function genreNameByTmdbId(id: number, kind: MediaKind): string {
  const list = kind === "movie" ? MOVIE_GENRES : TV_GENRES;
  const match = list.find((genre) => genre.tmdbId === id);
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

function cacheKey(kind: MediaKind, query: string): string {
  return `${kind}:${query.trim().toLowerCase()}`;
}

function dedupeById(items: SearchMediaResult[]): SearchMediaResult[] {
  const seen = new Set<number>();
  const unique: SearchMediaResult[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    unique.push(item);
  }

  return unique;
}

function mapMovieResult(
  item: Awaited<ReturnType<typeof searchMovies>>["results"][number],
): SearchMediaResult {
  return {
    id: item.id,
    type: "movie",
    title: item.title,
    originalTitle: item.originalTitle,
    year: yearFromDate(item.releaseDate),
    poster: posterUrl(item.posterPath),
    overview: item.overview,
    ratingTmdb: item.voteAverage,
    genreIds: item.genreIds,
    genreNames: item.genreIds.map((id) => genreNameByTmdbId(id, "movie")),
  };
}

function mapTvResult(
  item: Awaited<ReturnType<typeof searchTVShows>>["results"][number],
  type: "series" | "anime",
): SearchMediaResult {
  return {
    id: item.id,
    type,
    title: item.name,
    originalTitle: item.originalTitle,
    year: yearFromDate(item.firstAirDate),
    poster: posterUrl(item.posterPath),
    overview: item.overview,
    ratingTmdb: item.voteAverage,
    genreIds: item.genreIds,
    genreNames: item.genreIds.map((id) => genreNameByTmdbId(id, type)),
  };
}

function toMediaFromResult(movie: SearchMediaResult): Media {
  return {
    id: createMediaId(movie.type, movie.id),
    externalId: movie.id,
    title: movie.title,
    originalTitle: movie.originalTitle,
    type: movie.type,
    overview: movie.overview,
    posterUrl: movie.poster,
    releaseDate: "",
    year: movie.year,
    genres: movie.genreNames,
    ratingTmdb: movie.ratingTmdb,
    ...(movie.seasons !== undefined ? { seasons: movie.seasons } : {}),
    ...(movie.episodes !== undefined ? { episodes: movie.episodes } : {}),
    ...(movie.studio !== undefined ? { studio: movie.studio } : {}),
  };
}

function toMediaFromDetails(movie: SearchMediaDetails): Media {
  return {
    id: createMediaId(movie.type, movie.id),
    externalId: movie.id,
    title: movie.title,
    originalTitle: movie.originalTitle,
    type: movie.type,
    overview: movie.overview,
    posterUrl: movie.poster,
    releaseDate: movie.releaseDate,
    year: movie.year,
    genres: movie.genreNames,
    actors: movie.cast.map((person) => ({
      id: person.id,
      name: person.name,
    })),
    director: movie.directors.map((person) => ({
      id: person.id,
      name: person.name,
      ...(person.job ? { job: person.job } : {}),
    })),
    ratingTmdb: movie.ratingTmdb,
    runtime: movie.runtime,
    keywords: movie.keywords,
    seasons: movie.seasons ?? null,
    episodes: movie.episodes ?? null,
    studio: movie.studio ?? null,
  };
}

async function searchMoviesKind(
  query: string,
  signal?: AbortSignal,
): Promise<SearchMediaResult[]> {
  const [ptResults, enResults] = await Promise.all([
    searchMovies(query, {
      language: "pt-BR",
      ...(signal ? { signal } : {}),
    }),
    searchMovies(query, {
      language: "en-US",
      ...(signal ? { signal } : {}),
    }),
  ]);

  const base = dedupeById([
    ...ptResults.results.map(mapMovieResult),
    ...enResults.results.map(mapMovieResult),
  ]).slice(0, 24);

  const withRuntime = await Promise.all(
    base.map(async (item) => {
      try {
        const details = await getMovieDetails(
          item.id,
          signal,
        );
        if (details.runtime && details.runtime > 0) {
          return { ...item, runtime: details.runtime };
        }
      } catch {
        return item;
      }

      return item;
    }),
  );

  return withRuntime;
}

async function searchTvKind(
  query: string,
  kind: "series" | "anime",
  signal?: AbortSignal,
): Promise<SearchMediaResult[]> {
  const [ptResults, enResults] = await Promise.all([
    searchTVShows(query, {
      language: "pt-BR",
      ...(signal ? { signal } : {}),
    }),
    searchTVShows(query, {
      language: "en-US",
      ...(signal ? { signal } : {}),
    }),
  ]);

  const merged = dedupeById(
    [...ptResults.results, ...enResults.results]
      .filter((item) => {
        const anime = isLikelyAnime({
          genreIds: item.genreIds,
          originalLanguage: item.originalLanguage,
          originCountry: item.originCountry,
        });

        return kind === "anime" ? anime : !anime;
      })
      .map((item) => mapTvResult(item, kind)),
  );

  return merged.slice(0, 24);
}

export const MediaSearchService = {
  toMedia(media: SearchMediaResult | SearchMediaDetails): Media {
    if ("cast" in media) {
      return toMediaFromDetails(media);
    }

    return toMediaFromResult(media);
  },

  async search(
    kind: MediaKind,
    query: string,
    signal?: AbortSignal,
  ): Promise<SearchMediaResult[]> {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      return [];
    }

    const key = cacheKey(kind, trimmed);
    const cached = readSearchCache(key);

    if (cached) {
      return cached as SearchMediaResult[];
    }

    const results =
      kind === "movie"
        ? await searchMoviesKind(trimmed, signal)
        : await searchTvKind(trimmed, kind, signal);

    putSearchCache(key, results);
    return results;
  },

  async getDetails(
    kind: MediaKind,
    mediaId: number,
    signal?: AbortSignal,
  ): Promise<SearchMediaDetails> {
    if (kind === "movie") {
      const [details, credits, keywords] = await Promise.all([
        getMovieDetails(mediaId, signal),
        getMovieCredits(mediaId, signal),
        getMovieKeywords(mediaId, signal),
      ]);

      const genreNames = details.genreIds.map((id) =>
        genreNameByTmdbId(id, "movie"),
      );

      return {
        id: details.id,
        type: "movie",
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
    }

    const [details, credits] = await Promise.all([
      getTVShowDetails(mediaId, signal),
      getTVShowCredits(mediaId, signal),
    ]);

    const type: "series" | "anime" = kind;
    const genreNames = details.genreIds.map((id) =>
      genreNameByTmdbId(id, type),
    );

    return {
      id: details.id,
      type,
      title: details.name,
      originalTitle: details.name,
      year: yearFromDate(details.firstAirDate),
      poster: posterUrl(details.posterPath),
      overview: details.overview,
      description: details.overview,
      releaseDate: details.firstAirDate,
      ratingTmdb: details.voteAverage,
      genreIds: details.genreIds,
      genreNames,
      runtime: details.episodeRunTime[0] ?? null,
      directors: credits.directors,
      cast: credits.cast,
      keywords: [],
      seasons: details.numberOfSeasons,
      episodes: details.numberOfEpisodes,
      studio: details.studio,
    };
  },
};
