import type { ContentTypeId } from "@/types/content-type";
import type { PlatformId } from "@/types/platform";

export type WatchedTab = "movie" | "series";

export type UserRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

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
  return Number.isInteger(value) && value >= 1 && value <= 10;
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
