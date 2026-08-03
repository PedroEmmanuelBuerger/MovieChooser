import { useEffect, useRef, useState } from "react";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
  getRandomRecommendation,
  RecommendationServiceError,
  type GetRecommendationInput,
} from "@/services/recommendationService";
import type { ContentTypeOption } from "@/types/content-type";
import type { GenreOption } from "@/types/genre";
import type { StreamingPlatform } from "@/types/platform";
import type { RecommendationResult } from "@/types/recommendation";

const MAX_EXCLUDE_HISTORY = 12;

interface UseRecommendationParams {
  platform: StreamingPlatform;
  contentType: ContentTypeOption;
  selectedGenre: GenreOption;
}

interface UseRecommendationResult {
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  result: RecommendationResult | null;
  selectedGenre: GenreOption;
  shuffle: () => Promise<RecommendationResult | null>;
  retry: () => Promise<RecommendationResult | null>;
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

  platformRef.current = platform;
  contentTypeRef.current = contentType;
  genreRef.current = selectedGenre;
  resultRef.current = result;

  async function load(
    excludeIds: readonly number[],
  ): Promise<RecommendationResult | null> {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);
    setErrorCode(null);

    const input: GetRecommendationInput = {
      platform: platformRef.current,
      type: contentTypeRef.current,
      genre: genreRef.current,
      signal: controller.signal,
      ...(excludeIds.length > 0 ? { excludeIds } : {}),
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
    void loadRef.current([]);

    return () => {
      abortRef.current?.abort();
    };
  }, [platform.id, contentType.id, selectedGenre.id]);

  async function shuffle(): Promise<RecommendationResult | null> {
    const currentId = resultRef.current?.id;
    const nextExclude =
      currentId === undefined
        ? excludeHistoryRef.current
        : [...excludeHistoryRef.current, currentId].slice(-MAX_EXCLUDE_HISTORY);

    excludeHistoryRef.current = nextExclude;
    return loadRef.current(nextExclude);
  }

  async function retry(): Promise<RecommendationResult | null> {
    return loadRef.current(excludeHistoryRef.current);
  }

  return {
    loading,
    error,
    errorCode,
    result,
    selectedGenre,
    shuffle,
    retry,
  };
}
