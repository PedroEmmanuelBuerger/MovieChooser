import {
  DEFAULT_APP_SETTINGS,
  mergeAppSettings,
  type AppSettings,
} from "@/types/settings";

const SETTINGS_KEY = "moviechooser.settings";

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

function readLocal(key: string): string | null {
  try {
    if (canUseLocalStorage()) {
      return localStorage.getItem(key);
    }

    return memoryStore.get(key) ?? null;
  } catch {
    return null;
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

export async function getAppSettings(): Promise<AppSettings> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.getAppSettings();
  }

  const raw = readLocal(SETTINGS_KEY);

  if (!raw) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  try {
    return mergeAppSettings(JSON.parse(raw) as Partial<AppSettings>);
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export async function updateAppSettings(
  partial: Partial<AppSettings>,
): Promise<AppSettings> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.updateAppSettings(partial);
  }

  const current = await getAppSettings();
  const next = mergeAppSettings({ ...current, ...partial });
  writeLocal(SETTINGS_KEY, next);
  return next;
}
