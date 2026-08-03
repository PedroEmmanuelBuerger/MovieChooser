import { getMovieDetails, getTVShowDetails } from "@/services/tmdb";
import type { HistoryItem } from "@/types/history";
import type {
  AchievementProgress,
  CountShare,
  LibraryStats,
  MonthlyActivityPoint,
  PersistedStatsSnapshot,
  PlatformShare,
  RatingStats,
  UnlockedAchievement,
  WatchTimeCache,
  WatchTimeStats,
} from "@/types/stats";
import { ACHIEVEMENT_DEFINITIONS } from "@/data/achievements";
import { buildContentKey, type WatchedItem } from "@/types/watched";
import type { PlatformId } from "@/types/platform";

const DEFAULT_EPISODE_MINUTES = 42;
const DEFAULT_MOVIE_MINUTES = 110;
const MAX_RUNTIME_FETCHES = 12;

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

function percentage(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((count / total) * 1000) / 10;
}

function toShares(
  counts: Map<string, number>,
  total: number,
): CountShare[] {
  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentage(count, total),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function computeRatingStats(items: readonly WatchedItem[]): RatingStats {
  const rated = items.filter((item) => item.userRating !== null);

  if (rated.length === 0) {
    return {
      ratedCount: 0,
      averageRating: null,
      highestRating: null,
      lowestRating: null,
    };
  }

  const values = rated.map((item) => item.userRating as number);
  const sum = values.reduce((acc, value) => acc + value, 0);

  return {
    ratedCount: rated.length,
    averageRating: Math.round((sum / rated.length) * 10) / 10,
    highestRating: Math.max(...values),
    lowestRating: Math.min(...values),
  };
}

function computeTopGenres(items: readonly WatchedItem[]): CountShare[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const genre = item.genre.trim() || "Sem gênero";
    counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }

  return toShares(counts, items.length).slice(0, 5);
}

function computePlatforms(items: readonly WatchedItem[]): PlatformShare[] {
  const counts = new Map<string, { platformId: PlatformId; count: number }>();

  for (const item of items) {
    const current = counts.get(item.platform);
    counts.set(item.platform, {
      platformId: item.platformId,
      count: (current?.count ?? 0) + 1,
    });
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      platformId: value.platformId,
      count: value.count,
      percentage: percentage(value.count, items.length),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function computeMonthlyActivity(
  items: readonly WatchedItem[],
): MonthlyActivityPoint[] {
  const now = new Date();
  const points: MonthlyActivityPoint[] = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const monthIndex = date.getMonth();
    const monthLabel = MONTH_LABELS[monthIndex] ?? "Mês";
    const key = `${String(date.getFullYear())}-${String(monthIndex + 1).padStart(2, "0")}`;
    const label = `${monthLabel} ${String(date.getFullYear())}`;
    points.push({ key, label, count: 0 });
  }

  const indexByKey = new Map(points.map((point, index) => [point.key, index]));

  for (const item of items) {
    const date = new Date(item.watchedAt);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const key = `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const index = indexByKey.get(key);

    if (index === undefined) {
      continue;
    }

    const point = points[index];

    if (point) {
      point.count += 1;
    }
  }

  return points;
}

function computeDeclinedRecommendations(
  history: readonly HistoryItem[],
  watched: readonly WatchedItem[],
): number {
  const watchedKeys = new Set(
    watched.map((item) => buildContentKey(item.type, item.id)),
  );
  const declined = new Set<string>();

  for (const item of history) {
    const key = buildContentKey(item.type, item.id);

    if (!watchedKeys.has(key)) {
      declined.add(key);
    }
  }

  return declined.size;
}

function computeFavorites(items: readonly WatchedItem[]): WatchedItem[] {
  return [...items]
    .filter((item) => item.userRating !== null)
    .sort((a, b) => {
      const ratingDiff = (b.userRating ?? 0) - (a.userRating ?? 0);

      if (ratingDiff !== 0) {
        return ratingDiff;
      }

      return (
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
      );
    })
    .slice(0, 10);
}

function computeInsights(
  watched: readonly WatchedItem[],
  ratings: RatingStats,
  topGenres: readonly CountShare[],
  platforms: readonly PlatformShare[],
): string[] {
  const insights: string[] = [];
  const movies = watched.filter((item) => item.type === "movie").length;
  const series = watched.filter(
    (item) => item.type === "series" || item.type === "anime",
  ).length;
  const topGenre = topGenres[0];
  const topPlatform = platforms[0];

  if (topGenre && topGenre.count > 0) {
    insights.push(`Você gosta principalmente de ${topGenre.label}.`);
  }

  if (movies > series && movies > 0) {
    insights.push("Você assiste mais filmes do que séries.");
  } else if (series > movies && series > 0) {
    insights.push("Você assiste mais séries do que filmes.");
  } else if (movies > 0 && series > 0) {
    insights.push("Você equilibra bem filmes e séries.");
  }

  if (topPlatform && topPlatform.count > 0) {
    insights.push(`Sua plataforma favorita é ${topPlatform.label}.`);
  }

  if (ratings.averageRating !== null) {
    if (ratings.averageRating >= 8) {
      insights.push("Você costuma dar notas altas.");
    } else if (ratings.averageRating <= 5) {
      insights.push("Você é exigente na hora de avaliar.");
    } else {
      insights.push("Suas notas costumam ser equilibradas.");
    }
  }

  if (insights.length === 0) {
    insights.push(
      "Continue marcando assistidos e avaliando para descobrir seu perfil.",
    );
  }

  return insights.slice(0, 4);
}

export function formatWatchTime(totalMinutes: number): string {
  if (totalMinutes <= 0) {
    return "0 horas";
  }

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    const hourPart = hours > 0 ? ` e ${String(hours)} hora${hours === 1 ? "" : "s"}` : "";
    return `${String(days)} dia${days === 1 ? "" : "s"}${hourPart}`;
  }

  if (hours > 0) {
    const minutePart =
      minutes > 0 ? ` e ${String(minutes)} min` : "";
    return `${String(hours)} hora${hours === 1 ? "" : "s"}${minutePart}`;
  }

  return `${String(minutes)} min`;
}

export function createWatchTimeStats(
  totalMinutes: number,
  resolvedCount: number,
  pendingCount: number,
): WatchTimeStats {
  return {
    totalMinutes,
    resolvedCount,
    pendingCount,
    formatted: formatWatchTime(totalMinutes),
  };
}

export function computeLibraryStats(
  history: readonly HistoryItem[],
  watched: readonly WatchedItem[],
  watchTime: WatchTimeStats,
): LibraryStats {
  const ratings = computeRatingStats(watched);
  const topGenres = computeTopGenres(watched);
  const platforms = computePlatforms(watched);
  const monthlyActivity = computeMonthlyActivity(watched);
  const favorites = computeFavorites(watched);
  const insights = computeInsights(watched, ratings, topGenres, platforms);

  return {
    totalRecommendations: history.length,
    totalWatched: watched.length,
    watchedMovies: watched.filter((item) => item.type === "movie").length,
    watchedSeries: watched.filter(
      (item) => item.type === "series" || item.type === "anime",
    ).length,
    declinedRecommendations: computeDeclinedRecommendations(history, watched),
    ratings,
    topGenres,
    platforms,
    monthlyActivity,
    favorites,
    insights,
    watchTime,
    computedAt: new Date().toISOString(),
  };
}

export function toPersistedStatsSnapshot(
  stats: LibraryStats,
): PersistedStatsSnapshot {
  return {
    computedAt: stats.computedAt,
    totalRecommendations: stats.totalRecommendations,
    totalWatched: stats.totalWatched,
    watchedMovies: stats.watchedMovies,
    watchedSeries: stats.watchedSeries,
    declinedRecommendations: stats.declinedRecommendations,
    averageRating: stats.ratings.averageRating,
    ratedCount: stats.ratings.ratedCount,
    totalWatchMinutes: stats.watchTime.totalMinutes,
  };
}

export function evaluateAchievements(
  watched: readonly WatchedItem[],
  previouslyUnlocked: readonly UnlockedAchievement[],
): AchievementProgress[] {
  const unlockedMap = new Map(
    previouslyUnlocked.map((item) => [item.id, item.unlockedAt]),
  );
  const movies = watched.filter((item) => item.type === "movie").length;
  const series = watched.filter(
    (item) => item.type === "series" || item.type === "anime",
  ).length;
  const rated = watched.filter((item) => item.userRating !== null).length;
  const genres = new Set(
    watched.map((item) => item.genre.trim()).filter((genre) => genre.length > 0),
  );

  const progressById: Record<string, number> = {
    "first-movie": movies,
    marathoner: series,
    critic: rated,
    cinephile: watched.length,
    explorer: genres.size,
  };

  return ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const progress = progressById[definition.id] ?? 0;
    const alreadyUnlocked = unlockedMap.has(definition.id);
    const shouldUnlock = progress >= definition.target;
    const newlyUnlocked = shouldUnlock && !alreadyUnlocked;

    return {
      definition,
      progress: Math.min(progress, definition.target),
      target: definition.target,
      unlocked: shouldUnlock,
      unlockedAt: alreadyUnlocked
        ? (unlockedMap.get(definition.id) ?? null)
        : newlyUnlocked
          ? new Date().toISOString()
          : null,
      newlyUnlocked,
    };
  });
}

function estimateSeriesMinutes(
  episodes: number | null,
  episodeRunTimes: readonly number[],
): number {
  const episodeCount = episodes && episodes > 0 ? episodes : 10;
  const averageRuntime =
    episodeRunTimes.find((value) => value > 0) ?? DEFAULT_EPISODE_MINUTES;
  return episodeCount * averageRuntime;
}

export async function resolveWatchTimeStats(
  watched: readonly WatchedItem[],
  cache: WatchTimeCache,
  signal?: AbortSignal,
): Promise<{ stats: WatchTimeStats; cache: WatchTimeCache }> {
  const nextCache: WatchTimeCache = { ...cache };
  const missing = watched.filter((item) => {
    const key = buildContentKey(item.type, item.id);
    return nextCache[key] === undefined;
  });

  const toFetch = missing.slice(0, MAX_RUNTIME_FETCHES);

  for (const item of toFetch) {
    if (signal?.aborted) {
      break;
    }

    const key = buildContentKey(item.type, item.id);

    try {
      if (item.type === "movie") {
        const details = await getMovieDetails(item.id, signal);
        nextCache[key] =
          details.runtime && details.runtime > 0
            ? details.runtime
            : DEFAULT_MOVIE_MINUTES;
      } else {
        const details = await getTVShowDetails(item.id, signal);
        nextCache[key] = estimateSeriesMinutes(
          details.numberOfEpisodes,
          details.episodeRunTime,
        );
      }
    } catch {
      nextCache[key] =
        item.type === "movie" ? DEFAULT_MOVIE_MINUTES : DEFAULT_EPISODE_MINUTES * 10;
    }
  }

  let totalMinutes = 0;
  let resolvedCount = 0;
  let pendingCount = 0;

  for (const item of watched) {
    const key = buildContentKey(item.type, item.id);
    const minutes = nextCache[key];

    if (minutes === undefined) {
      pendingCount += 1;
      continue;
    }

    totalMinutes += minutes;
    resolvedCount += 1;
  }

  return {
    stats: createWatchTimeStats(totalMinutes, resolvedCount, pendingCount),
    cache: nextCache,
  };
}
