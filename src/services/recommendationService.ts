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

function buildPosterUrl(posterPath: string | null): string | null {
  if (!posterPath) {
    return null;
  }

  return `${TMDB_POSTER_BASE_URL}${posterPath}`;
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

async function fetchRandomPage<T>(
  fetchPage: (page: number) => Promise<TmdbPaginatedResponse<T>>,
): Promise<TmdbPaginatedResponse<T>> {
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
  const selectedPage = randomInt(1, maxPage);

  if (selectedPage === 1) {
    return firstPage;
  }

  const pageResult = await fetchPage(selectedPage);

  if (pageResult.results.length === 0) {
    return firstPage;
  }

  return pageResult;
}

function mapMovieResult(
  movie: Movie,
  platformId: PlatformId,
): RecommendationResult {
  return {
    id: movie.id,
    title: movie.title,
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
  return {
    id: show.id,
    title: show.name,
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
      const page = await fetchRandomPage((pageNumber) =>
        discoverMoviesByWatchProvider({
          watchProviderIds,
          watchRegion: TMDB_WATCH_REGION,
          page: pageNumber,
        }),
      );

      return mapMovieResult(pickRandomItem(page.results), platformId);
    }

    const page = await fetchRandomPage((pageNumber) =>
      discoverTVShowsByWatchProvider({
        watchProviderIds,
        watchRegion: TMDB_WATCH_REGION,
        page: pageNumber,
      }),
    );

    return mapTVShowResult(pickRandomItem(page.results), platformId);
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
