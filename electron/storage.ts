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

interface StoreSchema {
  recommendationHistory: HistoryItem[];
  watchedItems: WatchedItem[];
  settings: AppSettings;
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
}
