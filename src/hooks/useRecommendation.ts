import { useEffect, useMemo, useRef, useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
  getRandomRecommendation,
  RecommendationServiceError,
  type GetRecommendationInput,
  type RecommendationSearchMode,
} from "@/services/recommendationService";
import type { ContentTypeOption } from "@/types/content-type";
import { isSurpriseGenre, type GenreSelection } from "@/types/genre";
import type { StreamingPlatform } from "@/types/platform";
import type { RecommendationResult } from "@/types/recommendation";

const MAX_EXCLUDE_HISTORY = 12;

interface UseRecommendationParams {
  platform: StreamingPlatform;
  contentType: ContentTypeOption;
  selectedGenre: GenreSelection;
  excludeWatched: boolean;
  watchedIds: ReadonlySet<number>;
}

interface UseRecommendationResult {
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  result: RecommendationResult | null;
  selectedGenre: GenreSelection;
  isSurpriseMode: boolean;
  isAllWatched: boolean;
  shuffle: () => Promise<RecommendationResult | null>;
  retry: () => Promise<RecommendationResult | null>;
  searchMoreOptions: () => Promise<RecommendationResult | null>;
  allowWatchedOnce: () => Promise<RecommendationResult | null>;
}

function resolveError(error: unknown): { message: string; code: string | null } {
  if (error instanceof RecommendationServiceError) {
    return {
      message: getFriendlyErrorMessage(error.code, error.message),
      code: error.code ?? null,
    };
  }

  if (error instanceof Error) {
    return {
      message: getFriendlyErrorMessage(undefined, error.message),
      code: null,
    };
  }

  return {
    message: getFriendlyErrorMessage("UNKNOWN"),
    code: "UNKNOWN",
  };
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof Error && error.name === "CanceledError") {
    return true;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_CANCELED"
  ) {
    return true;
  }

  return false;
}

export function useRecommendation({
  platform,
  contentType,
  selectedGenre,
  excludeWatched,
  watchedIds,
}: UseRecommendationParams): UseRecommendationResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const excludeHistoryRef = useRef<number[]>([]);
  const resultRef = useRef<RecommendationResult | null>(null);
  const platformRef = useRef(platform);
  const contentTypeRef = useRef(contentType);
  const genreRef = useRef(selectedGenre);
  const excludeWatchedRef = useRef(excludeWatched);
  const watchedIdsRef = useRef(watchedIds);

  platformRef.current = platform;
  contentTypeRef.current = contentType;
  genreRef.current = selectedGenre;
  excludeWatchedRef.current = excludeWatched;
  watchedIdsRef.current = watchedIds;
  resultRef.current = result;

  const watchedIdsKey = useMemo(
    () => Array.from(watchedIds).sort((a, b) => a - b).join(","),
    [watchedIds],
  );

  async function load(options: {
    excludeIds: readonly number[];
    searchMode?: RecommendationSearchMode;
    allowWatchedOverride?: boolean;
    clearResult?: boolean;
  }): Promise<RecommendationResult | null> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    setErrorCode(null);

    if (options.clearResult) {
      setResult(null);
    }

    const input: GetRecommendationInput = {
      platform: platformRef.current,
      type: contentTypeRef.current,
      genre: genreRef.current,
      signal: controller.signal,
      excludeWatched: excludeWatchedRef.current,
      watchedIds: watchedIdsRef.current,
      ...(options.excludeIds.length > 0
        ? { excludeIds: options.excludeIds }
        : {}),
      ...(options.searchMode ? { searchMode: options.searchMode } : {}),
      ...(options.allowWatchedOverride
        ? { allowWatchedOverride: true }
        : {}),
    };

    try {
      const recommendation = await getRandomRecommendation(input);

      if (requestId !== requestIdRef.current) {
        return null;
      }

      setResult(recommendation);
      return recommendation;
    } catch (caughtError) {
      if (
        controller.signal.aborted ||
        isAbortError(caughtError) ||
        requestId !== requestIdRef.current
      ) {
        return null;
      }

      const resolved = resolveError(caughtError);
      setError(resolved.message);
      setErrorCode(resolved.code);
      setResult(null);
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    excludeHistoryRef.current = [];
    void loadRef.current({ excludeIds: [], clearResult: true });

    return () => {
      abortRef.current?.abort();
    };
  }, [platform.id, contentType.id, selectedGenre.id, excludeWatched, watchedIdsKey]);

  async function shuffle(): Promise<RecommendationResult | null> {
    const currentId = resultRef.current?.id;
    const nextExclude =
      currentId === undefined
        ? excludeHistoryRef.current
        : [...excludeHistoryRef.current, currentId].slice(-MAX_EXCLUDE_HISTORY);

    excludeHistoryRef.current = nextExclude;
    return loadRef.current({ excludeIds: nextExclude });
  }

  async function retry(): Promise<RecommendationResult | null> {
    return loadRef.current({
      excludeIds: excludeHistoryRef.current,
      clearResult: true,
    });
  }

  async function searchMoreOptions(): Promise<RecommendationResult | null> {
    return loadRef.current({
      excludeIds: excludeHistoryRef.current,
      searchMode: "expand",
      clearResult: true,
    });
  }

  async function allowWatchedOnce(): Promise<RecommendationResult | null> {
    return loadRef.current({
      excludeIds: excludeHistoryRef.current,
      allowWatchedOverride: true,
      clearResult: true,
    });
  }

  return {
    loading,
    error,
    errorCode,
    result,
    selectedGenre,
    isSurpriseMode: isSurpriseGenre(selectedGenre),
    isAllWatched: errorCode === "ALL_WATCHED",
    shuffle,
    retry,
    searchMoreOptions,
    allowWatchedOnce,
  };
}
