import type { ContentTypeId } from "@/types/content-type";
import type { HistoryItem } from "@/types/history";
import type { MarkWatchedResult } from "@/types/electron";
import type { UserRating, WatchedItem } from "@/types/watched";

const HISTORY_KEY = "moviechooser.recommendationHistory";
const WATCHED_KEY = "moviechooser.watchedItems";

const memoryStore = new Map<string, string>();

function hasElectronApi(): boolean {
  return typeof window !== "undefined" && Boolean(window.electronAPI);
}

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = canUseLocalStorage()
      ? localStorage.getItem(key)
      : (memoryStore.get(key) ?? null);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): void {
  const serialized = JSON.stringify(value);

  if (canUseLocalStorage()) {
    localStorage.setItem(key, serialized);
    return;
  }

  memoryStore.set(key, serialized);
}

export async function getRecommendationHistory(): Promise<HistoryItem[]> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.getRecommendationHistory();
  }

  return readLocal<HistoryItem[]>(HISTORY_KEY, []);
}

export async function addRecommendationToHistory(
  item: HistoryItem,
): Promise<HistoryItem[]> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.addRecommendationToHistory(item);
  }

  const current = readLocal<HistoryItem[]>(HISTORY_KEY, []);
  const latest = current[0];

  if (
    latest &&
    latest.id === item.id &&
    latest.type === item.type &&
    Date.now() - new Date(latest.recommendedAt).getTime() < 2500
  ) {
    return current;
  }

  const next = [item, ...current].slice(0, 500);
  writeLocal(HISTORY_KEY, next);
  return next;
}

export async function getWatchedItems(): Promise<WatchedItem[]> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.getWatchedItems();
  }

  return readLocal<WatchedItem[]>(WATCHED_KEY, []);
}

export async function markAsWatched(
  item: WatchedItem,
): Promise<MarkWatchedResult> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.markAsWatched(item);
  }

  const current = readLocal<WatchedItem[]>(WATCHED_KEY, []);
  const exists = current.some(
    (watched) => watched.type === item.type && watched.id === item.id,
  );

  if (exists) {
    return { items: current, added: false };
  }

  const items = [item, ...current];
  writeLocal(WATCHED_KEY, items);
  return { items, added: true };
}

export async function updateWatchedRating(payload: {
  type: ContentTypeId;
  id: number;
  userRating: UserRating;
}): Promise<WatchedItem[]> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.updateWatchedRating(payload);
  }

  const items = readLocal<WatchedItem[]>(WATCHED_KEY, []).map((item) => {
    if (item.type === payload.type && item.id === payload.id) {
      return { ...item, userRating: payload.userRating };
    }

    return item;
  });

  writeLocal(WATCHED_KEY, items);
  return items;
}
