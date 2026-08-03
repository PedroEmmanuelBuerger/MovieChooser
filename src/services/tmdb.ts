import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
  Movie,
  MovieDetails,
  TmdbPaginatedResponse,
  TVShow,
  TVShowDetails,
} from "@/types/tmdb";

const DEFAULT_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_LANGUAGE = "pt-BR";
const DEFAULT_TIMEOUT_MS = 15_000;

export class TmdbServiceError extends Error {
  readonly statusCode: number | undefined;
  readonly code: string | undefined;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: string;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "TmdbServiceError";
    this.statusCode = options?.statusCode;
    this.code = options?.code;
  }
}

interface TmdbMovieDto {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  original_language: string;
  adult: boolean;
}

interface TmdbTvShowDto {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  original_language: string;
  origin_country: string[];
}

interface TmdbPaginatedDto<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

function resolveApiKey(): string {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY as string | undefined;

  if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
    throw new TmdbServiceError(
      "TMDB API key is missing. Set VITE_TMDB_API_KEY in your .env file.",
      { code: "MISSING_API_KEY" },
    );
  }

  return apiKey.trim();
}

function resolveBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_TMDB_BASE_URL as string | undefined;

  if (typeof baseUrl === "string" && baseUrl.trim().length > 0) {
    return baseUrl.trim().replace(/\/$/, "");
  }

  return DEFAULT_BASE_URL;
}

function toServiceError(error: unknown): TmdbServiceError {
  if (error instanceof TmdbServiceError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const responseMessage = extractTmdbMessage(error.response?.data);

    if (error.code === "ECONNABORTED") {
      return new TmdbServiceError("TMDB request timed out.", {
        code: "TIMEOUT",
        cause: error,
      });
    }

    if (!error.response) {
      return new TmdbServiceError(
        "Unable to reach TMDB. Check your internet connection.",
        { code: "NETWORK_ERROR", cause: error },
      );
    }

    if (statusCode === 401) {
      return new TmdbServiceError(
        responseMessage ?? "Invalid TMDB API key.",
        { statusCode, code: "UNAUTHORIZED", cause: error },
      );
    }

    if (statusCode === 404) {
      return new TmdbServiceError(
        responseMessage ?? "Requested TMDB resource was not found.",
        { statusCode, code: "NOT_FOUND", cause: error },
      );
    }

    if (statusCode === 429) {
      return new TmdbServiceError(
        responseMessage ?? "TMDB rate limit exceeded. Try again later.",
        { statusCode, code: "RATE_LIMIT", cause: error },
      );
    }

    return new TmdbServiceError(
      responseMessage ??
        `TMDB request failed with status ${String(statusCode ?? "unknown")}.`,
      {
        ...(statusCode === undefined ? {} : { statusCode }),
        code: "HTTP_ERROR",
        cause: error,
      },
    );
  }

  return new TmdbServiceError("Unexpected error while calling TMDB.", {
    code: "UNKNOWN",
    cause: error,
  });
}

function extractTmdbMessage(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) {
    return undefined;
  }

  if ("status_message" in data && typeof data.status_message === "string") {
    return data.status_message;
  }

  return undefined;
}

function mapMovie(dto: TmdbMovieDto): Movie {
  return {
    id: dto.id,
    title: dto.title,
    overview: dto.overview,
    posterPath: dto.poster_path,
    backdropPath: dto.backdrop_path,
    releaseDate: dto.release_date,
    voteAverage: dto.vote_average,
    voteCount: dto.vote_count,
    popularity: dto.popularity,
    genreIds: dto.genre_ids,
    originalLanguage: dto.original_language,
    adult: dto.adult,
  };
}

function mapTvShow(dto: TmdbTvShowDto): TVShow {
  return {
    id: dto.id,
    name: dto.name,
    overview: dto.overview,
    posterPath: dto.poster_path,
    backdropPath: dto.backdrop_path,
    firstAirDate: dto.first_air_date,
    voteAverage: dto.vote_average,
    voteCount: dto.vote_count,
    popularity: dto.popularity,
    genreIds: dto.genre_ids,
    originalLanguage: dto.original_language,
    originCountry: dto.origin_country,
  };
}

function mapPaginated<TDto, TResult>(
  dto: TmdbPaginatedDto<TDto>,
  mapper: (item: TDto) => TResult,
): TmdbPaginatedResponse<TResult> {
  return {
    page: dto.page,
    results: dto.results.map(mapper),
    totalPages: dto.total_pages,
    totalResults: dto.total_results,
  };
}

function rethrowOrWrap(error: unknown): never {
  if (error instanceof AxiosError && error.code === "ERR_CANCELED") {
    throw error;
  }

  if (error instanceof TmdbServiceError) {
    throw error;
  }

  throw toServiceError(error);
}

function createTmdbClient(): AxiosInstance {
  const client = axios.create({
    baseURL: resolveBaseUrl(),
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      Accept: "application/json",
    },
  });

  client.interceptors.request.use((config) => {
    const existingParams =
      typeof config.params === "object" &&
      config.params !== null &&
      !Array.isArray(config.params)
        ? (config.params as Record<string, unknown>)
        : {};

    config.params = {
      language: DEFAULT_LANGUAGE,
      ...existingParams,
      api_key: resolveApiKey(),
    };

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (error instanceof AxiosError && error.code === "ERR_CANCELED") {
        throw error;
      }

      throw toServiceError(error);
    },
  );

  return client;
}

export const tmdbClient = createTmdbClient();

export async function getConfiguration(): Promise<{
  images: {
    secureBaseUrl: string;
    posterSizes: string[];
  };
}> {
  try {
    const { data } = await tmdbClient.get<{
      images: {
        secure_base_url: string;
        poster_sizes: string[];
      };
    }>("/configuration");

    return {
      images: {
        secureBaseUrl: data.images.secure_base_url,
        posterSizes: data.images.poster_sizes,
      },
    };
  } catch (error) {
    rethrowOrWrap(error);
  }
}

export interface DiscoverByWatchProviderParams {
  watchProviderIds: string;
  watchRegion: string;
  page?: number;
  genreId?: number;
  originalLanguage?: string;
  signal?: AbortSignal;
}

export async function discoverMoviesByWatchProvider(
  params: DiscoverByWatchProviderParams,
): Promise<TmdbPaginatedResponse<Movie>> {
  try {
    const { data } = await tmdbClient.get<TmdbPaginatedDto<TmdbMovieDto>>(
      "/discover/movie",
      {
        ...(params.signal ? { signal: params.signal } : {}),
        params: {
          page: params.page ?? 1,
          sort_by: "popularity.desc",
          watch_region: params.watchRegion,
          with_watch_providers: params.watchProviderIds,
          with_watch_monetization_types: "flatrate",
          "vote_count.gte": 20,
          ...(params.genreId === undefined
            ? {}
            : { with_genres: params.genreId }),
        },
      },
    );

    return mapPaginated(data, mapMovie);
  } catch (error) {
    rethrowOrWrap(error);
  }
}

export async function discoverTVShowsByWatchProvider(
  params: DiscoverByWatchProviderParams,
): Promise<TmdbPaginatedResponse<TVShow>> {
  try {
    const { data } = await tmdbClient.get<TmdbPaginatedDto<TmdbTvShowDto>>(
      "/discover/tv",
      {
        ...(params.signal ? { signal: params.signal } : {}),
        params: {
          page: params.page ?? 1,
          sort_by: "popularity.desc",
          watch_region: params.watchRegion,
          with_watch_providers: params.watchProviderIds,
          with_watch_monetization_types: "flatrate",
          "vote_count.gte": 20,
          ...(params.genreId === undefined
            ? {}
            : { with_genres: params.genreId }),
          ...(params.originalLanguage
            ? { with_original_language: params.originalLanguage }
            : {}),
        },
      },
    );

    return mapPaginated(data, mapTvShow);
  } catch (error) {
    rethrowOrWrap(error);
  }
}

interface TmdbMovieDetailsDto extends TmdbMovieDto {
  runtime: number | null;
}

interface TmdbTvDetailsDto extends TmdbTvShowDto {
  number_of_episodes: number | null;
  number_of_seasons: number | null;
  episode_run_time: number[];
  networks?: Array<{ id: number; name: string }>;
  production_companies?: Array<{ id: number; name: string }>;
}

export function isLikelyAnime(input: {
  genreIds: readonly number[];
  originalLanguage: string;
  originCountry?: readonly string[];
}): boolean {
  const hasAnimation = input.genreIds.includes(16);
  const isJapanese =
    input.originalLanguage === "ja" ||
    (input.originCountry?.includes("JP") ?? false);

  return hasAnimation || isJapanese;
}

export async function getMovieDetails(
  movieId: number,
  signal?: AbortSignal,
): Promise<MovieDetails> {
  try {
    const { data } = await tmdbClient.get<TmdbMovieDetailsDto>(
      `/movie/${String(movieId)}`,
      {
        ...(signal ? { signal } : {}),
      },
    );

    return {
      ...mapMovie(data),
      runtime: data.runtime,
    };
  } catch (error) {
    rethrowOrWrap(error);
  }
}

export async function getTVShowDetails(
  showId: number,
  signal?: AbortSignal,
): Promise<TVShowDetails> {
  try {
    const { data } = await tmdbClient.get<TmdbTvDetailsDto>(
      `/tv/${String(showId)}`,
      {
        ...(signal ? { signal } : {}),
      },
    );

    const studio =
      data.networks?.[0]?.name ??
      data.production_companies?.[0]?.name ??
      null;

    return {
      ...mapTvShow(data),
      numberOfEpisodes: data.number_of_episodes,
      numberOfSeasons: data.number_of_seasons,
      episodeRunTime: data.episode_run_time,
      studio,
    };
  } catch (error) {
    rethrowOrWrap(error);
  }
}

interface TmdbSearchMovieDto {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

interface TmdbCreditsDto {
  cast: Array<{ id: number; name: string; order: number }>;
  crew: Array<{ id: number; name: string; job: string }>;
}

interface TmdbKeywordsDto {
  keywords: Array<{ id: number; name: string }>;
}

export async function searchMovies(
  query: string,
  options?: { page?: number; signal?: AbortSignal; language?: string },
): Promise<TmdbPaginatedResponse<Movie & { originalTitle: string }>> {
  try {
    const { data } = await tmdbClient.get<TmdbPaginatedDto<TmdbSearchMovieDto>>(
      "/search/movie",
      {
        ...(options?.signal ? { signal: options.signal } : {}),
        params: {
          query,
          page: options?.page ?? 1,
          include_adult: false,
          ...(options?.language ? { language: options.language } : {}),
        },
      },
    );

    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: data.results.map((item) => ({
        ...mapMovie({
          id: item.id,
          title: item.title,
          overview: item.overview,
          poster_path: item.poster_path,
          backdrop_path: null,
          release_date: item.release_date,
          vote_average: item.vote_average,
          vote_count: 0,
          popularity: 0,
          genre_ids: item.genre_ids,
          original_language: "",
          adult: false,
        }),
        originalTitle: item.original_title,
      })),
    };
  } catch (error) {
    rethrowOrWrap(error);
  }
}

interface TmdbSearchTvDto {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language: string;
  origin_country: string[];
}

export async function searchTVShows(
  query: string,
  options?: { page?: number; signal?: AbortSignal; language?: string },
): Promise<TmdbPaginatedResponse<TVShow & { originalTitle: string }>> {
  try {
    const { data } = await tmdbClient.get<TmdbPaginatedDto<TmdbSearchTvDto>>(
      "/search/tv",
      {
        ...(options?.signal ? { signal: options.signal } : {}),
        params: {
          query,
          page: options?.page ?? 1,
          include_adult: false,
          ...(options?.language ? { language: options.language } : {}),
        },
      },
    );

    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: data.results.map((item) => ({
        ...mapTvShow({
          id: item.id,
          name: item.name,
          overview: item.overview,
          poster_path: item.poster_path,
          backdrop_path: null,
          first_air_date: item.first_air_date,
          vote_average: item.vote_average,
          vote_count: 0,
          popularity: 0,
          genre_ids: item.genre_ids,
          original_language: item.original_language,
          origin_country: item.origin_country,
        }),
        originalTitle: item.original_name,
      })),
    };
  } catch (error) {
    rethrowOrWrap(error);
  }
}

export async function getMovieCredits(
  movieId: number,
  signal?: AbortSignal,
): Promise<{
  cast: Array<{ id: number; name: string }>;
  directors: Array<{ id: number; name: string; job: string }>;
}> {
  try {
    const { data } = await tmdbClient.get<TmdbCreditsDto>(
      `/movie/${String(movieId)}/credits`,
      {
        ...(signal ? { signal } : {}),
      },
    );

    return {
      cast: data.cast
        .slice(0, 8)
        .map((person) => ({ id: person.id, name: person.name })),
      directors: data.crew
        .filter((person) => person.job === "Director")
        .map((person) => ({
          id: person.id,
          name: person.name,
          job: person.job,
        })),
    };
  } catch (error) {
    rethrowOrWrap(error);
  }
}

export async function getTVShowCredits(
  showId: number,
  signal?: AbortSignal,
): Promise<{
  cast: Array<{ id: number; name: string }>;
  directors: Array<{ id: number; name: string; job: string }>;
}> {
  try {
    const { data } = await tmdbClient.get<TmdbCreditsDto>(
      `/tv/${String(showId)}/credits`,
      {
        ...(signal ? { signal } : {}),
      },
    );

    const directors = data.crew
      .filter(
        (person) =>
          person.job === "Director" ||
          person.job === "Series Director" ||
          person.job === "Executive Producer",
      )
      .slice(0, 4)
      .map((person) => ({
        id: person.id,
        name: person.name,
        job: person.job,
      }));

    return {
      cast: data.cast
        .slice(0, 8)
        .map((person) => ({ id: person.id, name: person.name })),
      directors,
    };
  } catch (error) {
    rethrowOrWrap(error);
  }
}

export async function getMovieKeywords(
  movieId: number,
  signal?: AbortSignal,
): Promise<string[]> {
  try {
    const { data } = await tmdbClient.get<TmdbKeywordsDto>(
      `/movie/${String(movieId)}/keywords`,
      {
        ...(signal ? { signal } : {}),
      },
    );

    return data.keywords.map((keyword) => keyword.name);
  } catch (error) {
    rethrowOrWrap(error);
  }
}
