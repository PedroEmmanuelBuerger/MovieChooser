import Store from "electron-store";
import { ipcMain } from "electron";

export type ContentTypeId = "movie" | "series";

export type PlatformId =
  | "netflix"
  | "hbo-max"
  | "crunchyroll"
  | "prime-video"
  | "disney-plus";

export interface HistoryItem {
  id: number;
  title: string;
  description: string;
  poster: string;
  platform: string;
  platformId: PlatformId;
  type: ContentTypeId;
  genre: string;
  rating: number;
  recommendedAt: string;
}

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

interface AppSettings {
  excludeWatched: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
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

interface StoreSchema {
  recommendationHistory: HistoryItem[];
  watchedItems: WatchedItem[];
  settings: AppSettings;
  userProfile: UserProfile | null;
  unlockedAchievements: UnlockedAchievement[];
  statsSnapshot: PersistedStatsSnapshot | null;
  watchTimeCache: WatchTimeCache;
}

const MAX_HISTORY_ITEMS = 500;

const DEFAULT_SETTINGS: AppSettings = {
  excludeWatched: true,
};

const store = new Store<StoreSchema>({
  name: "moviechooser-data",
  defaults: {
    recommendationHistory: [],
    watchedItems: [],
    settings: DEFAULT_SETTINGS,
    userProfile: null,
    unlockedAchievements: [],
    statsSnapshot: null,
    watchTimeCache: {},
  },
});

function getHistory(): HistoryItem[] {
  return store.get("recommendationHistory");
}

function setHistory(items: HistoryItem[]): HistoryItem[] {
  store.set("recommendationHistory", items);
  return items;
}

function getWatched(): WatchedItem[] {
  return store.get("watchedItems");
}

function setWatched(items: WatchedItem[]): WatchedItem[] {
  store.set("watchedItems", items);
  return items;
}

function addHistoryItem(item: HistoryItem): HistoryItem[] {
  const current = getHistory();
  const latest = current[0];

  if (
    latest &&
    latest.id === item.id &&
    latest.type === item.type &&
    Date.now() - new Date(latest.recommendedAt).getTime() < 2500
  ) {
    return current;
  }

  const next = [item, ...current].slice(0, MAX_HISTORY_ITEMS);
  return setHistory(next);
}

function markAsWatched(item: WatchedItem): {
  items: WatchedItem[];
  added: boolean;
} {
  const current = getWatched();
  const exists = current.some(
    (watched) => watched.type === item.type && watched.id === item.id,
  );

  if (exists) {
    return { items: current, added: false };
  }

  const items = setWatched([item, ...current]);
  return { items, added: true };
}

function updateUserRating(
  type: ContentTypeId,
  id: number,
  userRating: UserRating,
): WatchedItem[] {
  const items = getWatched().map((item) => {
    if (item.type === type && item.id === id) {
      return { ...item, userRating };
    }

    return item;
  });

  return setWatched(items);
}

function getSettings(): AppSettings {
  const stored = store.get("settings");
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
  };
}

function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const next = {
    ...getSettings(),
    ...partial,
  };
  store.set("settings", next);
  return next;
}

function normalizeProfile(profile: UserProfile): UserProfile {
  const next: UserProfile = {
    id: profile.id,
    name: profile.name.trim(),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  if (profile.bio && profile.bio.trim().length > 0) {
    next.bio = profile.bio.trim();
  }

  if (profile.avatar && profile.avatar.trim().length > 0) {
    next.avatar = profile.avatar;
  }

  return next;
}

function getUserProfile(): UserProfile | null {
  const profile = store.get("userProfile");
  return profile ? normalizeProfile(profile) : null;
}

function saveUserProfile(profile: UserProfile): UserProfile {
  const next = normalizeProfile(profile);
  store.set("userProfile", next);
  return next;
}

function updateUserProfile(
  partial: {
    name?: string;
    bio?: string | null;
    avatar?: string | null;
  },
): UserProfile {
  const current = getUserProfile();

  if (!current) {
    throw new Error("Profile not found");
  }

  const next: UserProfile = {
    ...current,
    updatedAt: new Date().toISOString(),
  };

  if (partial.name !== undefined) {
    next.name = partial.name.trim();
  }

  if (partial.bio === null) {
    delete next.bio;
  } else if (partial.bio !== undefined) {
    next.bio = partial.bio.trim();
  }

  if (partial.avatar === null) {
    delete next.avatar;
  } else if (partial.avatar !== undefined) {
    next.avatar = partial.avatar;
  }

  return saveUserProfile(next);
}

function getUnlockedAchievements(): UnlockedAchievement[] {
  return store.get("unlockedAchievements");
}

function saveUnlockedAchievements(
  items: UnlockedAchievement[],
): UnlockedAchievement[] {
  store.set("unlockedAchievements", items);
  return items;
}

function getStatsSnapshot(): PersistedStatsSnapshot | null {
  return store.get("statsSnapshot");
}

function saveStatsSnapshot(
  snapshot: PersistedStatsSnapshot,
): PersistedStatsSnapshot {
  store.set("statsSnapshot", snapshot);
  return snapshot;
}

function getWatchTimeCache(): WatchTimeCache {
  return store.get("watchTimeCache");
}

function saveWatchTimeCache(cache: WatchTimeCache): WatchTimeCache {
  store.set("watchTimeCache", cache);
  return cache;
}

export function registerStorageIpc(): void {
  ipcMain.handle("storage:get-history", () => getHistory());
  ipcMain.handle("storage:add-history", (_event, item: HistoryItem) =>
    addHistoryItem(item),
  );
  ipcMain.handle("storage:get-watched", () => getWatched());
  ipcMain.handle("storage:mark-watched", (_event, item: WatchedItem) =>
    markAsWatched(item),
  );
  ipcMain.handle(
    "storage:update-rating",
    (
      _event,
      payload: { type: ContentTypeId; id: number; userRating: UserRating },
    ) => updateUserRating(payload.type, payload.id, payload.userRating),
  );
  ipcMain.handle("storage:get-settings", () => getSettings());
  ipcMain.handle(
    "storage:update-settings",
    (_event, partial: Partial<AppSettings>) => updateSettings(partial),
  );
  ipcMain.handle("storage:get-profile", () => getUserProfile());
  ipcMain.handle("storage:save-profile", (_event, profile: UserProfile) =>
    saveUserProfile(profile),
  );
  ipcMain.handle(
    "storage:update-profile",
    (
      _event,
      partial: {
        name?: string;
        bio?: string | null;
        avatar?: string | null;
      },
    ) => updateUserProfile(partial),
  );
  ipcMain.handle("storage:get-achievements", () => getUnlockedAchievements());
  ipcMain.handle(
    "storage:save-achievements",
    (_event, items: UnlockedAchievement[]) => saveUnlockedAchievements(items),
  );
  ipcMain.handle("storage:get-stats-snapshot", () => getStatsSnapshot());
  ipcMain.handle(
    "storage:save-stats-snapshot",
    (_event, snapshot: PersistedStatsSnapshot) => saveStatsSnapshot(snapshot),
  );
  ipcMain.handle("storage:get-watch-time-cache", () => getWatchTimeCache());
  ipcMain.handle(
    "storage:save-watch-time-cache",
    (_event, cache: WatchTimeCache) => saveWatchTimeCache(cache),
  );
}
