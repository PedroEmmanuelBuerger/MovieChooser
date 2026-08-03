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
const EXPAND_MAX_PAGES = 12;
const EXPAND_MAX_CANDIDATES = 80;

export class RecommendationServiceError extends Error {
  readonly code: string | undefined;

  constructor(message: string, options?: { code?: string; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "RecommendationServiceError";
    this.code = options?.code;
  }
}

export type RecommendationSearchMode = "random" | "expand";

export interface GetRecommendationInput {
  platform: StreamingPlatform | PlatformId;
  type: ContentTypeOption | ContentTypeId;
  genre: GenreSelection;
  excludeIds?: readonly number[];
  excludeWatched?: boolean;
  watchedIds?: ReadonlySet<number> | readonly number[];
  dislikedIds?: ReadonlySet<number> | readonly number[];
  preferredGenreId?: number;
  considerPreferences?: boolean;
  allowWatchedOverride?: boolean;
  searchMode?: RecommendationSearchMode;
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

function toIdSet(
  value: ReadonlySet<number> | readonly number[] | undefined,
): Set<number> {
  if (!value) {
    return new Set<number>();
  }

  if (value instanceof Set) {
    return new Set<number>(Array.from(value));
  }

  return new Set<number>(value);
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

function filterOutIds<T extends { id: number }>(
  items: readonly T[],
  excluded: ReadonlySet<number>,
): T[] {
  if (excluded.size === 0) {
    return [...items];
  }

  return items.filter((item) => !excluded.has(item.id));
}

function pickRandomCandidate<T extends { id: number }>(
  items: readonly T[],
  softExcludeIds: ReadonlySet<number>,
  hardExcludeIds: ReadonlySet<number>,
  shuffleFirst: boolean,
): T {
  const withoutHardExclude = filterOutIds(items, hardExcludeIds);

  if (withoutHardExclude.length === 0) {
    if (items.length > 0 && hardExcludeIds.size > 0) {
      throw new RecommendationServiceError(
        "You already marked all found titles as watched.",
        { code: "ALL_WATCHED" },
      );
    }

    throw new RecommendationServiceError(
      "Unable to pick a recommendation from an empty list.",
      { code: "EMPTY_RESULTS" },
    );
  }

  const preferred = filterOutIds(withoutHardExclude, softExcludeIds);
  const pool = preferred.length > 0 ? preferred : withoutHardExclude;

  return pickRandomItem(shuffleFirst ? shuffleItems(pool) : pool);
}

function filterValidItems<T>(
  items: readonly T[],
  isValid: (item: T) => boolean,
): T[] {
  return items.filter(isValid);
}

async function fetchValidCandidates<T extends { id: number }>(
  fetchPage: (page: number) => Promise<TmdbPaginatedResponse<T>>,
  isValid: (item: T) => boolean,
  options: {
    maxPages: number;
    maxAttempts: number;
    collectMultiplePages: boolean;
    maxCandidates: number;
    hardExcludeIds: ReadonlySet<number>;
    searchMode: RecommendationSearchMode;
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

  if (options.searchMode === "expand") {
    const collected: T[] = [];
    const seenIds = new Set<number>();

    for (let pageNumber = 1; pageNumber <= maxPage; pageNumber += 1) {
      const page = pageNumber === 1 ? firstPage : await fetchPage(pageNumber);
      const validItems = filterOutIds(
        filterValidItems(page.results, isValid),
        options.hardExcludeIds,
      );

      for (const item of validItems) {
        if (seenIds.has(item.id)) {
          continue;
        }

        seenIds.add(item.id);
        collected.push(item);

        if (collected.length >= options.maxCandidates) {
          return collected;
        }
      }
    }

    if (collected.length > 0) {
      return collected;
    }

    const hadAnyValid = filterValidItems(firstPage.results, isValid).length > 0;

    if (hadAnyValid && options.hardExcludeIds.size > 0) {
      throw new RecommendationServiceError(
        "You already marked all found titles as watched.",
        { code: "ALL_WATCHED" },
      );
    }

    throw new RecommendationServiceError(
      "No valid titles found with title and poster for the selected filters.",
      { code: "EMPTY_RESULTS" },
    );
  }

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
      const available = filterOutIds(validItems, options.hardExcludeIds);

      if (available.length > 0) {
        return available;
      }

      continue;
    }

    for (const item of validItems) {
      if (options.hardExcludeIds.has(item.id)) {
        continue;
      }

      collected.push(item);

      if (collected.length >= options.maxCandidates) {
        return collected;
      }
    }
  }

  if (collected.length > 0) {
    return collected;
  }

  const fallbackValidItems = filterOutIds(
    filterValidItems(firstPage.results, isValid),
    options.hardExcludeIds,
  );

  if (fallbackValidItems.length > 0) {
    return fallbackValidItems;
  }

  const hadAnyValid = filterValidItems(firstPage.results, isValid).length > 0;

  if (hadAnyValid && options.hardExcludeIds.size > 0) {
    throw new RecommendationServiceError(
      "You already marked all found titles as watched.",
      { code: "ALL_WATCHED" },
    );
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
  const softExcludeIds = toIdSet(input.excludeIds);
  const signal = input.signal;
  const genre = input.genre;
  const surpriseMode = isSurpriseGenre(genre);
  const genreFilter = resolveGenreFilter(genre);
  const searchMode = input.searchMode ?? "random";
  const excludeWatched =
    input.excludeWatched === true && input.allowWatchedOverride !== true;
  const watchedIds = toIdSet(input.watchedIds);
  const dislikedIds = toIdSet(input.dislikedIds);
  const hardExcludeIds = excludeWatched ? watchedIds : new Set<number>();

  for (const id of dislikedIds) {
    hardExcludeIds.add(id);
  }

  const preferGenreFromPreferences =
    input.considerPreferences === true &&
    surpriseMode &&
    input.preferredGenreId !== undefined;

  const effectiveGenreFilter = preferGenreFromPreferences
    ? input.preferredGenreId
    : genreFilter;

  if (!surpriseMode && genre.contentType !== contentTypeId) {
    throw new RecommendationServiceError(
      "Selected genre does not match the content type.",
      { code: "INVALID_ITEM" },
    );
  }

  const fetchOptions =
    searchMode === "expand"
      ? {
          maxPages: EXPAND_MAX_PAGES,
          maxAttempts: EXPAND_MAX_PAGES,
          collectMultiplePages: true,
          maxCandidates: EXPAND_MAX_CANDIDATES,
          hardExcludeIds,
          searchMode,
        }
      : surpriseMode
        ? {
            maxPages: SURPRISE_MAX_RANDOM_PAGES,
            maxAttempts: SURPRISE_MAX_PAGE_ATTEMPTS,
            collectMultiplePages: true,
            maxCandidates: SURPRISE_MAX_CANDIDATES,
            hardExcludeIds,
            searchMode,
          }
        : {
            maxPages: MAX_RANDOM_PAGES,
            maxAttempts: MAX_PAGE_ATTEMPTS,
            collectMultiplePages: false,
            maxCandidates: 20,
            hardExcludeIds,
            searchMode,
          };

  try {
    if (contentTypeId === "movie") {
      const candidates = await fetchValidCandidates(
        (pageNumber) =>
          discoverMoviesByWatchProvider({
            watchProviderIds,
            watchRegion: TMDB_WATCH_REGION,
            page: pageNumber,
            ...(effectiveGenreFilter === undefined
              ? {}
              : { genreId: effectiveGenreFilter }),
            ...(signal ? { signal } : {}),
          }),
        isValidMovie,
        fetchOptions,
      );

      return mapMovieResult(
        pickRandomCandidate(
          candidates,
          softExcludeIds,
          hardExcludeIds,
          surpriseMode || searchMode === "expand",
        ),
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
          ...(effectiveGenreFilter === undefined
            ? {}
            : { genreId: effectiveGenreFilter }),
          ...(signal ? { signal } : {}),
        }),
      isValidTVShow,
      fetchOptions,
    );

    return mapTVShowResult(
      pickRandomCandidate(
        candidates,
        softExcludeIds,
        hardExcludeIds,
        surpriseMode || searchMode === "expand",
      ),
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
