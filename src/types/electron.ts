import type { HistoryItem } from "@/types/history";
import type { UserRating, WatchedItem } from "@/types/watched";
import type { ContentTypeId } from "@/types/content-type";
import type { AppSettings } from "@/types/settings";

export interface MarkWatchedResult {
  items: WatchedItem[];
  added: boolean;
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getRecommendationHistory: () => Promise<HistoryItem[]>;
  addRecommendationToHistory: (item: HistoryItem) => Promise<HistoryItem[]>;
  getWatchedItems: () => Promise<WatchedItem[]>;
  markAsWatched: (item: WatchedItem) => Promise<MarkWatchedResult>;
  updateWatchedRating: (payload: {
    type: ContentTypeId;
    id: number;
    userRating: UserRating;
  }) => Promise<WatchedItem[]>;
  getAppSettings: () => Promise<AppSettings>;
  updateAppSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>;
}
