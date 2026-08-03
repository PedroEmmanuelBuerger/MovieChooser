import { contextBridge, ipcRenderer } from "electron";
import type {
  ContentTypeId,
  HistoryItem,
  UserRating,
  WatchedItem,
} from "./storage";

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
});
