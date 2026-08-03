import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getWatchedItems,
  markAsWatched,
  updateWatchedRating,
} from "@/services/storageService";
import type { ContentTypeId } from "@/types/content-type";
import type { HistoryItem } from "@/types/history";
import type { RecommendationResult } from "@/types/recommendation";
import type { StreamingPlatform } from "@/types/platform";
import {
  buildContentKey,
  filterWatchedByTab,
  findWatchedItem,
  type UserRating,
  type WatchedItem,
  type WatchedTab,
} from "@/types/watched";

interface MarkFromRecommendationInput {
  recommendation: RecommendationResult;
  platform: StreamingPlatform;
  genreName: string;
}

interface UseWatchedResult {
  items: WatchedItem[];
  loading: boolean;
  error: string | null;
  tab: WatchedTab;
  filteredItems: WatchedItem[];
  watchedKeys: ReadonlySet<string>;
  setTab: (tab: WatchedTab) => void;
  refresh: () => Promise<void>;
  isWatched: (type: ContentTypeId, id: number) => boolean;
  markHistoryItem: (item: HistoryItem) => Promise<{
    added: boolean;
    item: WatchedItem | null;
  }>;
  markRecommendation: (input: MarkFromRecommendationInput) => Promise<{
    added: boolean;
    item: WatchedItem | null;
  }>;
  setUserRating: (
    type: ContentTypeId,
    id: number,
    userRating: UserRating,
  ) => Promise<void>;
}

function toWatchedFromHistory(item: HistoryItem): WatchedItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    poster: item.poster,
    platform: item.platform,
    platformId: item.platformId,
    type: item.type,
    genre: item.genre,
    ratingTmdb: item.rating,
    userRating: null,
    watchedAt: new Date().toISOString(),
  };
}

function toWatchedFromRecommendation(
  recommendation: RecommendationResult,
  platform: StreamingPlatform,
  genreName: string,
): WatchedItem {
  return {
    id: recommendation.id,
    title: recommendation.title,
    description: recommendation.description,
    poster: recommendation.poster,
    platform: platform.name,
    platformId: platform.id,
    type: recommendation.type,
    genre: genreName,
    ratingTmdb: recommendation.rating,
    userRating: null,
    watchedAt: new Date().toISOString(),
  };
}

export function useWatched(): UseWatchedResult {
  const [items, setItems] = useState<WatchedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<WatchedTab>("movie");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const watched = await getWatchedItems();
      setItems(watched);
    } catch {
      setError("Não foi possível carregar os assistidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const watchedKeys = useMemo(() => {
    return new Set(items.map((item) => buildContentKey(item.type, item.id)));
  }, [items]);

  const isWatched = useCallback(
    (type: ContentTypeId, id: number) => {
      return watchedKeys.has(buildContentKey(type, id));
    },
    [watchedKeys],
  );

  const markHistoryItem = useCallback(async (item: HistoryItem) => {
    const payload = toWatchedFromHistory(item);

    try {
      const result = await markAsWatched(payload);
      setItems(result.items);

      if (!result.added) {
        return {
          added: false,
          item: findWatchedItem(result.items, item.type, item.id) ?? null,
        };
      }

      return { added: true, item: payload };
    } catch {
      setError("Não foi possível marcar como assistido.");
      return { added: false, item: null };
    }
  }, []);

  const markRecommendation = useCallback(
    async ({
      recommendation,
      platform,
      genreName,
    }: MarkFromRecommendationInput) => {
      const payload = toWatchedFromRecommendation(
        recommendation,
        platform,
        genreName,
      );

      try {
        const result = await markAsWatched(payload);
        setItems(result.items);

        if (!result.added) {
          return {
            added: false,
            item:
              findWatchedItem(
                result.items,
                recommendation.type,
                recommendation.id,
              ) ?? null,
          };
        }

        return { added: true, item: payload };
      } catch {
        setError("Não foi possível marcar como assistido.");
        return { added: false, item: null };
      }
    },
    [],
  );

  const setUserRating = useCallback(
    async (type: ContentTypeId, id: number, userRating: UserRating) => {
      try {
        const next = await updateWatchedRating({ type, id, userRating });
        setItems(next);
      } catch {
        setError("Não foi possível salvar a nota.");
      }
    },
    [],
  );

  const filteredItems = useMemo(
    () => filterWatchedByTab(items, tab),
    [items, tab],
  );

  return useMemo(
    () => ({
      items,
      loading,
      error,
      tab,
      filteredItems,
      watchedKeys,
      setTab,
      refresh,
      isWatched,
      markHistoryItem,
      markRecommendation,
      setUserRating,
    }),
    [
      items,
      loading,
      error,
      tab,
      filteredItems,
      watchedKeys,
      refresh,
      isWatched,
      markHistoryItem,
      markRecommendation,
      setUserRating,
    ],
  );
}
