import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getUnlockedAchievements,
  getWatchTimeCache,
  saveStatsSnapshot,
  saveUnlockedAchievements,
  saveWatchTimeCache,
} from "@/services/profileService";
import {
  computeLibraryStats,
  createWatchTimeStats,
  evaluateAchievements,
  resolveWatchTimeStats,
  toPersistedStatsSnapshot,
} from "@/services/statsService";
import type { HistoryItem } from "@/types/history";
import type {
  AchievementProgress,
  LibraryStats,
  UnlockedAchievement,
} from "@/types/stats";
import type { WatchedItem } from "@/types/watched";

interface UseStatsParams {
  history: readonly HistoryItem[];
  watched: readonly WatchedItem[];
  enabled?: boolean;
}

interface UseStatsResult {
  stats: LibraryStats | null;
  achievements: AchievementProgress[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function emptyStats(): LibraryStats {
  return computeLibraryStats([], [], createWatchTimeStats(0, 0, 0));
}

export function useStats({
  history,
  watched,
  enabled = true,
}: UseStatsParams): UseStatsResult {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const historyKey = useMemo(
    () => history.map((item) => `${item.type}:${String(item.id)}:${item.recommendedAt}`).join("|"),
    [history],
  );
  const watchedKey = useMemo(
    () =>
      watched
        .map(
          (item) =>
            `${item.type}:${String(item.id)}:${String(item.userRating)}:${item.watchedAt}`,
        )
        .join("|"),
    [watched],
  );

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const [previousAchievements, cache] = await Promise.all([
        getUnlockedAchievements(),
        getWatchTimeCache(),
      ]);

      const watchTimeResult = await resolveWatchTimeStats(
        watched,
        cache,
        controller.signal,
      );

      if (controller.signal.aborted) {
        return;
      }

      if (JSON.stringify(watchTimeResult.cache) !== JSON.stringify(cache)) {
        await saveWatchTimeCache(watchTimeResult.cache);
      }

      const nextStats = computeLibraryStats(
        history,
        watched,
        watchTimeResult.stats,
      );
      const progress = evaluateAchievements(watched, previousAchievements);
      const mergedAchievements: UnlockedAchievement[] = progress
        .filter((item) => item.unlocked)
        .map((item) => ({
          id: item.definition.id,
          unlockedAt: item.unlockedAt ?? new Date().toISOString(),
        }));

      await Promise.all([
        saveUnlockedAchievements(mergedAchievements),
        saveStatsSnapshot(toPersistedStatsSnapshot(nextStats)),
      ]);

      setStats(nextStats);
      setAchievements(progress);
    } catch {
      if (!controller.signal.aborted) {
        setError("Não foi possível calcular as estatísticas.");
        setStats(emptyStats());
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [enabled, history, watched]);

  useEffect(() => {
    void refresh();

    return () => {
      abortRef.current?.abort();
    };
  }, [refresh, historyKey, watchedKey]);

  return useMemo(
    () => ({
      stats,
      achievements,
      loading,
      error,
      refresh,
    }),
    [stats, achievements, loading, error, refresh],
  );
}
