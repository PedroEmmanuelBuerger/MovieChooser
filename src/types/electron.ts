import type { HistoryItem } from "@/types/history";
import type { UserRating, WatchedItem } from "@/types/watched";
import type { ContentTypeId } from "@/types/content-type";
import type { AppSettings } from "@/types/settings";
import type {
  CreateProfileInput,
  UpdateProfileInput,
  UserProfile,
} from "@/types/profile";
import type {
  PersistedStatsSnapshot,
  UnlockedAchievement,
  WatchTimeCache,
} from "@/types/stats";

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
  getUserProfile: () => Promise<UserProfile | null>;
  saveUserProfile: (profile: UserProfile) => Promise<UserProfile>;
  updateUserProfile: (partial: UpdateProfileInput) => Promise<UserProfile>;
  getUnlockedAchievements: () => Promise<UnlockedAchievement[]>;
  saveUnlockedAchievements: (
    items: UnlockedAchievement[],
  ) => Promise<UnlockedAchievement[]>;
  getStatsSnapshot: () => Promise<PersistedStatsSnapshot | null>;
  saveStatsSnapshot: (
    snapshot: PersistedStatsSnapshot,
  ) => Promise<PersistedStatsSnapshot>;
  getWatchTimeCache: () => Promise<WatchTimeCache>;
  saveWatchTimeCache: (cache: WatchTimeCache) => Promise<WatchTimeCache>;
}

export type { CreateProfileInput };
