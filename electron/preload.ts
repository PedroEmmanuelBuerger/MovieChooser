import { contextBridge, ipcRenderer } from "electron";
import type {
  ContentTypeId,
  HistoryItem,
  PersistedStatsSnapshot,
  UnlockedAchievement,
  UserProfile,
  UserRating,
  WatchTimeCache,
  WatchedItem,
} from "./storage";

interface AppSettings {
  excludeWatched: boolean;
}

contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:get-version"),
  getRecommendationHistory: (): Promise<HistoryItem[]> =>
    ipcRenderer.invoke("storage:get-history"),
  addRecommendationToHistory: (item: HistoryItem): Promise<HistoryItem[]> =>
    ipcRenderer.invoke("storage:add-history", item),
  getWatchedItems: (): Promise<WatchedItem[]> =>
    ipcRenderer.invoke("storage:get-watched"),
  markAsWatched: (
    item: WatchedItem,
  ): Promise<{ items: WatchedItem[]; added: boolean }> =>
    ipcRenderer.invoke("storage:mark-watched", item),
  updateWatchedRating: (payload: {
    type: ContentTypeId;
    id: number;
    userRating: UserRating;
  }): Promise<WatchedItem[]> =>
    ipcRenderer.invoke("storage:update-rating", payload),
  getAppSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke("storage:get-settings"),
  updateAppSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke("storage:update-settings", partial),
  getUserProfile: (): Promise<UserProfile | null> =>
    ipcRenderer.invoke("storage:get-profile"),
  saveUserProfile: (profile: UserProfile): Promise<UserProfile> =>
    ipcRenderer.invoke("storage:save-profile", profile),
  updateUserProfile: (partial: {
    name?: string;
    bio?: string | null;
    avatar?: string | null;
  }): Promise<UserProfile> =>
    ipcRenderer.invoke("storage:update-profile", partial),
  getUnlockedAchievements: (): Promise<UnlockedAchievement[]> =>
    ipcRenderer.invoke("storage:get-achievements"),
  saveUnlockedAchievements: (
    items: UnlockedAchievement[],
  ): Promise<UnlockedAchievement[]> =>
    ipcRenderer.invoke("storage:save-achievements", items),
  getStatsSnapshot: (): Promise<PersistedStatsSnapshot | null> =>
    ipcRenderer.invoke("storage:get-stats-snapshot"),
  saveStatsSnapshot: (
    snapshot: PersistedStatsSnapshot,
  ): Promise<PersistedStatsSnapshot> =>
    ipcRenderer.invoke("storage:save-stats-snapshot", snapshot),
  getWatchTimeCache: (): Promise<WatchTimeCache> =>
    ipcRenderer.invoke("storage:get-watch-time-cache"),
  saveWatchTimeCache: (cache: WatchTimeCache): Promise<WatchTimeCache> =>
    ipcRenderer.invoke("storage:save-watch-time-cache", cache),
});
