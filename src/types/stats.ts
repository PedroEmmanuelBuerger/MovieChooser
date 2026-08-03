import type { PlatformId } from "@/types/platform";
import type { WatchedItem } from "@/types/watched";

export interface CountShare {
  label: string;
  count: number;
  percentage: number;
}

export interface PlatformShare extends CountShare {
  platformId: PlatformId;
}

export interface MonthlyActivityPoint {
  key: string;
  label: string;
  count: number;
}

export interface RatingStats {
  ratedCount: number;
  averageRating: number | null;
  highestRating: number | null;
  lowestRating: number | null;
}

export interface WatchTimeStats {
  totalMinutes: number;
  resolvedCount: number;
  pendingCount: number;
  formatted: string;
}

export interface LibraryStats {
  totalRecommendations: number;
  totalWatched: number;
  watchedMovies: number;
  watchedSeries: number;
  declinedRecommendations: number;
  ratings: RatingStats;
  topGenres: CountShare[];
  platforms: PlatformShare[];
  monthlyActivity: MonthlyActivityPoint[];
  favorites: WatchedItem[];
  insights: string[];
  watchTime: WatchTimeStats;
  computedAt: string;
}

export type AchievementId =
  | "first-movie"
  | "marathoner"
  | "critic"
  | "cinephile"
  | "explorer";

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  target: number;
}

export interface UnlockedAchievement {
  id: AchievementId;
  unlockedAt: string;
}

export interface AchievementProgress {
  definition: AchievementDefinition;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt: string | null;
  newlyUnlocked: boolean;
}

export interface PersistedStatsSnapshot {
  computedAt: string;
  totalRecommendations: number;
  totalWatched: number;
  watchedMovies: number;
  watchedSeries: number;
  declinedRecommendations: number;
  averageRating: number | null;
  ratedCount: number;
  totalWatchMinutes: number;
}

export type WatchTimeCache = Record<string, number>;
