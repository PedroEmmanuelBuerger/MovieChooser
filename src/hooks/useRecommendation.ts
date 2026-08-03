import { useState } from "react";
import {
  getRandomRecommendation,
  RecommendationServiceError,
  type GetRecommendationInput,
} from "@/services/recommendationService";
import type { RecommendationResult } from "@/types/recommendation";

interface UseRecommendationResult {
  loading: boolean;
  error: string | null;
  result: RecommendationResult | null;
  fetchRecommendation: (
    input: GetRecommendationInput,
  ) => Promise<RecommendationResult | null>;
  reset: () => void;
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof RecommendationServiceError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error while fetching a recommendation.";
}

export function useRecommendation(): UseRecommendationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);

  async function fetchRecommendation(
    input: GetRecommendationInput,
  ): Promise<RecommendationResult | null> {
    setLoading(true);
    setError(null);

    try {
      const recommendation = await getRandomRecommendation(input);
      setResult(recommendation);
      return recommendation;
    } catch (caughtError) {
      setError(resolveErrorMessage(caughtError));
      return null;
    } finally {
      setLoading(false);
    }
  }

  function reset(): void {
    setLoading(false);
    setError(null);
    setResult(null);
  }

  return {
    loading,
    error,
    result,
    fetchRecommendation,
    reset,
  };
}
