import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addRecommendationToHistory,
  getRecommendationHistory,
} from "@/services/storageService";
import type { HistoryItem, HistoryTab } from "@/types/history";
import { filterHistoryByTab } from "@/types/history";
import type { RecommendationResult } from "@/types/recommendation";
import type { StreamingPlatform } from "@/types/platform";

interface UseHistoryResult {
  items: HistoryItem[];
  loading: boolean;
  error: string | null;
  tab: HistoryTab;
  filteredItems: HistoryItem[];
  setTab: (tab: HistoryTab) => void;
  refresh: () => Promise<void>;
  recordRecommendation: (
    recommendation: RecommendationResult,
    platform: StreamingPlatform,
    genreName: string,
  ) => Promise<void>;
}

export function useHistory(): UseHistoryResult {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<HistoryTab>("movie");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const history = await getRecommendationHistory();
      setItems(history);
    } catch {
      setError("Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recordRecommendation = useCallback(
    async (
      recommendation: RecommendationResult,
      platform: StreamingPlatform,
      genreName: string,
    ) => {
      const item: HistoryItem = {
        id: recommendation.id,
        title: recommendation.title,
        description: recommendation.description,
        poster: recommendation.poster,
        platform: platform.name,
        platformId: platform.id,
        type: recommendation.type,
        genre: genreName,
        rating: recommendation.rating,
        recommendedAt: new Date().toISOString(),
      };

      try {
        const next = await addRecommendationToHistory(item);
        setItems(next);
      } catch {
        setError("Não foi possível salvar no histórico.");
      }
    },
    [],
  );

  const filteredItems = useMemo(
    () => filterHistoryByTab(items, tab),
    [items, tab],
  );

  return useMemo(
    () => ({
      items,
      loading,
      error,
      tab,
      filteredItems,
      setTab,
      refresh,
      recordRecommendation,
    }),
    [items, loading, error, tab, filteredItems, refresh, recordRecommendation],
  );
}
