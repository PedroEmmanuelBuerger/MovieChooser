import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
  Movie,
  TmdbPaginatedResponse,
  TVShow,
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
        },
      },
    );

    return mapPaginated(data, mapTvShow);
  } catch (error) {
    rethrowOrWrap(error);
  }
}
