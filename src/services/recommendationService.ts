import {
  TMDB_WATCH_PROVIDER_IDS,
  TMDB_WATCH_REGION,
} from "@/data/watch-providers";
import {
  discoverMoviesByWatchProvider,
  discoverTVShowsByWatchProvider,
  TmdbServiceError,
} from "@/services/tmdb";
import type { ContentTypeId, ContentTypeOption } from "@/types/content-type";
import type { PlatformId, StreamingPlatform } from "@/types/platform";
import type { RecommendationResult } from "@/types/recommendation";
import type { Movie, TmdbPaginatedResponse, TVShow } from "@/types/tmdb";

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const MAX_RANDOM_PAGES = 20;
const MAX_PAGE_ATTEMPTS = 5;

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
  return hasText(movie.title) && movie.posterPath !== null && hasText(movie.posterPath);
}

function isValidTVShow(show: TVShow): boolean {
  return hasText(show.name) && show.posterPath !== null && hasText(show.posterPath);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

function filterValidItems<T>(
  items: readonly T[],
  isValid: (item: T) => boolean,
): T[] {
  return items.filter(isValid);
}

async function fetchValidCandidates<T>(
  fetchPage: (page: number) => Promise<TmdbPaginatedResponse<T>>,
  isValid: (item: T) => boolean,
): Promise<T[]> {
  const firstPage = await fetchPage(1);

  if (firstPage.results.length === 0 || firstPage.totalResults === 0) {
    throw new RecommendationServiceError(
      "No titles found for the selected platform and type.",
      { code: "EMPTY_RESULTS" },
    );
  }

  const maxPage = Math.max(
    1,
    Math.min(firstPage.totalPages, MAX_RANDOM_PAGES),
  );
  const attemptedPages = new Set<number>();

  for (let attempt = 0; attempt < MAX_PAGE_ATTEMPTS; attempt += 1) {
    let pageNumber = randomInt(1, maxPage);

    while (attemptedPages.has(pageNumber) && attemptedPages.size < maxPage) {
      pageNumber = randomInt(1, maxPage);
    }

    attemptedPages.add(pageNumber);

    const page =
      pageNumber === 1 ? firstPage : await fetchPage(pageNumber);
    const validItems = filterValidItems(page.results, isValid);

    if (validItems.length > 0) {
      return validItems;
    }
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
): RecommendationResult {
  if (movie.posterPath === null) {
    throw new RecommendationServiceError(
      "Selected movie is missing a poster.",
      { code: "INVALID_ITEM" },
    );
  }

  return {
    id: movie.id,
    title: movie.title.trim(),
    description: movie.overview,
    poster: buildPosterUrl(movie.posterPath),
    rating: movie.voteAverage,
    type: "movie",
    platformId,
    mediaType: "movie",
  };
}

function mapTVShowResult(
  show: TVShow,
  platformId: PlatformId,
): RecommendationResult {
  if (show.posterPath === null) {
    throw new RecommendationServiceError(
      "Selected series is missing a poster.",
      { code: "INVALID_ITEM" },
    );
  }

  return {
    id: show.id,
    title: show.name.trim(),
    description: show.overview,
    poster: buildPosterUrl(show.posterPath),
    rating: show.voteAverage,
    type: "series",
    platformId,
    mediaType: "tv",
  };
}

export async function getRandomRecommendation(
  input: GetRecommendationInput,
): Promise<RecommendationResult> {
  const platformId = resolvePlatformId(input.platform);
  const contentTypeId = resolveContentTypeId(input.type);
  const watchProviderIds = TMDB_WATCH_PROVIDER_IDS[platformId];

  try {
    if (contentTypeId === "movie") {
      const candidates = await fetchValidCandidates(
        (pageNumber) =>
          discoverMoviesByWatchProvider({
            watchProviderIds,
            watchRegion: TMDB_WATCH_REGION,
            page: pageNumber,
          }),
        isValidMovie,
      );

      return mapMovieResult(pickRandomItem(candidates), platformId);
    }

    const candidates = await fetchValidCandidates(
      (pageNumber) =>
        discoverTVShowsByWatchProvider({
          watchProviderIds,
          watchRegion: TMDB_WATCH_REGION,
          page: pageNumber,
        }),
      isValidTVShow,
    );

    return mapTVShowResult(pickRandomItem(candidates), platformId);
  } catch (error) {
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
