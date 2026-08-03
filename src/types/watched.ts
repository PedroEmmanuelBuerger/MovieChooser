import type { ContentTypeId } from "@/types/content-type";
import type { PlatformId } from "@/types/platform";

export type WatchedTab = "movie" | "series";

export type UserRating = number;

export interface WatchedItem {
  id: number;
  title: string;
  description: string;
  poster: string;
  platform: string;
  platformId: PlatformId;
  type: ContentTypeId;
  genre: string;
  ratingTmdb: number;
  userRating: UserRating | null;
  watchedAt: string;
}

export interface FutureRecommendationPreferences {
  excludeWatched: boolean;
  preferHighUserRatings: boolean;
  hideLowRated: boolean;
  preferFavoriteGenres: boolean;
}

export const DEFAULT_RECOMMENDATION_PREFERENCES: FutureRecommendationPreferences =
  {
    excludeWatched: true,
    preferHighUserRatings: false,
    hideLowRated: false,
    preferFavoriteGenres: false,
  };

export function buildContentKey(type: ContentTypeId, id: number): string {
  return `${type}:${String(id)}`;
}

export function getWatchedContentKey(item: WatchedItem): string {
  return buildContentKey(item.type, item.id);
}

export function isValidUserRating(value: number): value is UserRating {
  if (!Number.isFinite(value) || value < 0 || value > 10) {
    return false;
  }

  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-9;
}

export function formatUserRating(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function filterWatchedByTab(
  items: readonly WatchedItem[],
  tab: WatchedTab,
): WatchedItem[] {
  return items.filter((item) => item.type === tab);
}

export function findWatchedItem(
  items: readonly WatchedItem[],
  type: ContentTypeId,
  id: number,
): WatchedItem | undefined {
  return items.find((item) => item.type === type && item.id === id);
}
