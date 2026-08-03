import {
  TMDB_WATCH_PROVIDER_IDS,
  TMDB_WATCH_REGION,
} from "@/data/watch-providers";
import {
  discoverMoviesByWatchProvider,
  discoverTVShowsByWatchProvider,
  TmdbServiceError,
} from "@/services/tmdb";
import { AxiosError } from "axios";
import type { ContentTypeId, ContentTypeOption } from "@/types/content-type";
import {
  isSurpriseGenre,
  type GenreSelection,
} from "@/types/genre";
import type { PlatformId, StreamingPlatform } from "@/types/platform";
import type { RecommendationResult } from "@/types/recommendation";
import type { Movie, TmdbPaginatedResponse, TVShow } from "@/types/tmdb";

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const MAX_RANDOM_PAGES = 20;
const MAX_PAGE_ATTEMPTS = 5;
const SURPRISE_MAX_RANDOM_PAGES = 40;
const SURPRISE_MAX_PAGE_ATTEMPTS = 8;
const SURPRISE_MAX_CANDIDATES = 60;

export class RecommendationServiceError extends Error {
  readonly code: string | undefined;

  constructor(message: string, options?: { code?: string; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "RecommendationServiceError";
    this.code = options?.code;
  }
}

export interface GetRecommendationInput {
  platform: StreamingPlatform | PlatformId;
  type: ContentTypeOption | ContentTypeId;
  genre: GenreSelection;
  excludeIds?: readonly number[];
  excludeWatchedKeys?: readonly string[];
  preferHighUserRatings?: boolean;
  signal?: AbortSignal;
}

function resolvePlatformId(
  platform: StreamingPlatform | PlatformId,
): PlatformId {
  return typeof platform === "string" ? platform : platform.id;
}

function resolveContentTypeId(
  type: ContentTypeOption | ContentTypeId,
): ContentTypeId {
  return typeof type === "string" ? type : type.id;
}

function buildPosterUrl(posterPath: string): string {
  return `${TMDB_POSTER_BASE_URL}${posterPath}`;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function isValidMovie(movie: Movie): boolean {
  return (
    hasText(movie.title) &&
    movie.posterPath !== null &&
    hasText(movie.posterPath)
  );
}

function isValidTVShow(show: TVShow): boolean {
  return (
    hasText(show.name) && show.posterPath !== null && hasText(show.posterPath)
  );
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleItems<T>(items: readonly T[]): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    const current = shuffled[index];
    const swap = shuffled[swapIndex];

    if (current === undefined || swap === undefined) {
      continue;
    }

    shuffled[index] = swap;
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

function pickRandomItem<T>(items: readonly T[]): T {
  const item = items[randomInt(0, items.length - 1)];

  if (item === undefined) {
    throw new RecommendationServiceError(
      "Unable to pick a recommendation from an empty list.",
      { code: "EMPTY_RESULTS" },
    );
  }

  return item;
}

function pickRandomCandidate<T extends { id: number }>(
  items: readonly T[],
  excludeIds: readonly number[],
  shuffleFirst: boolean,
): T {
  const preferredItems =
    excludeIds.length > 0
      ? items.filter((item) => !excludeIds.includes(item.id))
      : [...items];

  const pool =
    preferredItems.length > 0 ? preferredItems : [...items];

  return pickRandomItem(shuffleFirst ? shuffleItems(pool) : pool);
}

function filterValidItems<T>(
  items: readonly T[],
  isValid: (item: T) => boolean,
): T[] {
  return items.filter(isValid);
}

async function fetchValidCandidates<T>(
  fetchPage: (page: number) => Promise<TmdbPaginatedResponse<T>>,
  isValid: (item: T) => boolean,
  options: {
    maxPages: number;
    maxAttempts: number;
    collectMultiplePages: boolean;
    maxCandidates: number;
  },
): Promise<T[]> {
  const firstPage = await fetchPage(1);

  if (firstPage.results.length === 0 || firstPage.totalResults === 0) {
    throw new RecommendationServiceError(
      "No titles found for the selected platform, type and genre.",
      { code: "EMPTY_RESULTS" },
    );
  }

  const maxPage = Math.max(
    1,
    Math.min(firstPage.totalPages, options.maxPages),
  );
  const attemptedPages = new Set<number>();
  const collected: T[] = [];

  for (let attempt = 0; attempt < options.maxAttempts; attempt += 1) {
    let pageNumber = randomInt(1, maxPage);

    while (attemptedPages.has(pageNumber) && attemptedPages.size < maxPage) {
      pageNumber = randomInt(1, maxPage);
    }

    attemptedPages.add(pageNumber);

    const page = pageNumber === 1 ? firstPage : await fetchPage(pageNumber);
    const validItems = filterValidItems(page.results, isValid);

    if (validItems.length === 0) {
      continue;
    }

    if (!options.collectMultiplePages) {
      return validItems;
    }

    for (const item of validItems) {
      collected.push(item);

      if (collected.length >= options.maxCandidates) {
        return collected;
      }
    }
  }

  if (collected.length > 0) {
    return collected;
  }

  const fallbackValidItems = filterValidItems(firstPage.results, isValid);

  if (fallbackValidItems.length > 0) {
    return fallbackValidItems;
  }

  throw new RecommendationServiceError(
    "No valid titles found with title and poster for the selected filters.",
    { code: "EMPTY_RESULTS" },
  );
}

function mapMovieResult(
  movie: Movie,
  platformId: PlatformId,
  genre: GenreSelection,
): RecommendationResult {
  if (movie.posterPath === null) {
    throw new RecommendationServiceError(
      "Selected movie is missing a poster.",
      { code: "INVALID_ITEM" },
    );
  }

  const surprise = isSurpriseGenre(genre);

  return {
    id: movie.id,
    title: movie.title.trim(),
    description: movie.overview,
    poster: buildPosterUrl(movie.posterPath),
    rating: movie.voteAverage,
    type: "movie",
    genre: surprise ? "Surpresa" : genre.name,
    genreId: genre.id,
    isSurpriseMode: surprise,
    platformId,
    mediaType: "movie",
  };
}

function mapTVShowResult(
  show: TVShow,
  platformId: PlatformId,
  genre: GenreSelection,
): RecommendationResult {
  if (show.posterPath === null) {
    throw new RecommendationServiceError(
      "Selected series is missing a poster.",
      { code: "INVALID_ITEM" },
    );
  }

  const surprise = isSurpriseGenre(genre);

  return {
    id: show.id,
    title: show.name.trim(),
    description: show.overview,
    poster: buildPosterUrl(show.posterPath),
    rating: show.voteAverage,
    type: "series",
    genre: surprise ? "Surpresa" : genre.name,
    genreId: genre.id,
    isSurpriseMode: surprise,
    platformId,
    mediaType: "tv",
  };
}

function resolveGenreFilter(genre: GenreSelection): number | undefined {
  if (isSurpriseGenre(genre)) {
    return undefined;
  }

  return genre.tmdbId;
}

export async function getRandomRecommendation(
  input: GetRecommendationInput,
): Promise<RecommendationResult> {
  const platformId = resolvePlatformId(input.platform);
  const contentTypeId = resolveContentTypeId(input.type);
  const watchProviderIds = TMDB_WATCH_PROVIDER_IDS[platformId];
  const excludeIds = input.excludeIds ?? [];
  const signal = input.signal;
  const genre = input.genre;
  const surpriseMode = isSurpriseGenre(genre);
  const genreFilter = resolveGenreFilter(genre);

  if (!surpriseMode && genre.contentType !== contentTypeId) {
    throw new RecommendationServiceError(
      "Selected genre does not match the content type.",
      { code: "INVALID_ITEM" },
    );
  }

  const fetchOptions = surpriseMode
    ? {
        maxPages: SURPRISE_MAX_RANDOM_PAGES,
        maxAttempts: SURPRISE_MAX_PAGE_ATTEMPTS,
        collectMultiplePages: true,
        maxCandidates: SURPRISE_MAX_CANDIDATES,
      }
    : {
        maxPages: MAX_RANDOM_PAGES,
        maxAttempts: MAX_PAGE_ATTEMPTS,
        collectMultiplePages: false,
        maxCandidates: 20,
      };

  try {
    if (contentTypeId === "movie") {
      const candidates = await fetchValidCandidates(
        (pageNumber) =>
          discoverMoviesByWatchProvider({
            watchProviderIds,
            watchRegion: TMDB_WATCH_REGION,
            page: pageNumber,
            ...(genreFilter === undefined ? {} : { genreId: genreFilter }),
            ...(signal ? { signal } : {}),
          }),
        isValidMovie,
        fetchOptions,
      );

      return mapMovieResult(
        pickRandomCandidate(candidates, excludeIds, surpriseMode),
        platformId,
        genre,
      );
    }

    const candidates = await fetchValidCandidates(
      (pageNumber) =>
        discoverTVShowsByWatchProvider({
          watchProviderIds,
          watchRegion: TMDB_WATCH_REGION,
          page: pageNumber,
          ...(genreFilter === undefined ? {} : { genreId: genreFilter }),
          ...(signal ? { signal } : {}),
        }),
      isValidTVShow,
      fetchOptions,
    );

    return mapTVShowResult(
      pickRandomCandidate(candidates, excludeIds, surpriseMode),
      platformId,
      genre,
    );
  } catch (error) {
    if (error instanceof AxiosError && error.code === "ERR_CANCELED") {
      throw error;
    }

    if (error instanceof RecommendationServiceError) {
      throw error;
    }

    if (error instanceof TmdbServiceError) {
      throw new RecommendationServiceError(error.message, {
        ...(error.code === undefined ? {} : { code: error.code }),
        cause: error,
      });
    }

    throw new RecommendationServiceError(
      "Unexpected error while fetching a recommendation.",
      { code: "UNKNOWN", cause: error },
    );
  }
}
