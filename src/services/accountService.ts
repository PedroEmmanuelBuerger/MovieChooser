import { LocalStorageService } from "@/services/localStorageService";

const LOCAL_DATA_KEYS = [
  "moviechooser.recommendationHistory",
  "moviechooser.watchedItems",
  "moviechooser.watchedMedia",
  "moviechooser.watchedMovies",
  "moviechooser.settings",
  "moviechooser.userProfile",
  "moviechooser.achievements",
  "moviechooser.statsSnapshot",
  "moviechooser.watchTimeCache",
  "moviechooser.userPreferences",
  "moviechooser.movieInteractions",
  "moviechooser.searchCache",
] as const;

function clearLocalFallbacks(): void {
  for (const key of LOCAL_DATA_KEYS) {
    LocalStorageService.removeItem(key);
  }
}

export async function clearAllLocalData(): Promise<void> {
  if (LocalStorageService.hasElectronBridge() && window.electronAPI) {
    await window.electronAPI.clearAllData();
  }

  clearLocalFallbacks();
}
