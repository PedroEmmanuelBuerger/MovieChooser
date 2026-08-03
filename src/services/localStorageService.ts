const memoryStore = new Map<string, string>();

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function readRaw(key: string): string | null {
  try {
    if (canUseLocalStorage()) {
      return localStorage.getItem(key);
    }

    return memoryStore.get(key) ?? null;
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  if (canUseLocalStorage()) {
    localStorage.setItem(key, value);
    return;
  }

  memoryStore.set(key, value);
}

function removeRaw(key: string): void {
  if (canUseLocalStorage()) {
    localStorage.removeItem(key);
    return;
  }

  memoryStore.delete(key);
}

export const LocalStorageService = {
  getItem<T>(key: string, fallback: T): T {
    const raw = readRaw(key);

    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setItem(key: string, value: unknown): void {
    writeRaw(key, JSON.stringify(value));
  },

  removeItem(key: string): void {
    removeRaw(key);
  },

  hasElectronBridge(): boolean {
    return typeof window !== "undefined" && Boolean(window.electronAPI);
  },
} as const;
