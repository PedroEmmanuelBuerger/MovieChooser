import {
  createProfileId,
  type CreateProfileInput,
  type UpdateProfileInput,
  type UserProfile,
} from "@/types/profile";
import type {
  PersistedStatsSnapshot,
  UnlockedAchievement,
  WatchTimeCache,
} from "@/types/stats";

const PROFILE_KEY = "moviechooser.userProfile";
const ACHIEVEMENTS_KEY = "moviechooser.achievements";
const STATS_SNAPSHOT_KEY = "moviechooser.statsSnapshot";
const WATCH_TIME_CACHE_KEY = "moviechooser.watchTimeCache";

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

function removeLocal(key: string): void {
  if (canUseLocalStorage()) {
    localStorage.removeItem(key);
    return;
  }

  memoryStore.delete(key);
}

function normalizeProfile(raw: UserProfile): UserProfile {
  return {
    id: raw.id,
    name: raw.name.trim(),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    ...(raw.bio && raw.bio.trim().length > 0
      ? { bio: raw.bio.trim() }
      : {}),
    ...(raw.avatar && raw.avatar.trim().length > 0
      ? { avatar: raw.avatar }
      : {}),
  };
}

export async function getUserProfile(): Promise<UserProfile | null> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.getUserProfile();
  }

  const raw = readLocal(PROFILE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return normalizeProfile(JSON.parse(raw) as UserProfile);
  } catch {
    return null;
  }
}

export async function createUserProfile(
  input: CreateProfileInput,
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const profile = normalizeProfile({
    id: createProfileId(),
    name: input.name,
    createdAt: now,
    updatedAt: now,
    ...(input.bio ? { bio: input.bio } : {}),
    ...(input.avatar ? { avatar: input.avatar } : {}),
  });

  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.saveUserProfile(profile);
  }

  writeLocal(PROFILE_KEY, profile);
  return profile;
}

export async function updateUserProfile(
  partial: UpdateProfileInput,
): Promise<UserProfile> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.updateUserProfile(partial);
  }

  const current = await getUserProfile();

  if (!current) {
    throw new Error("Profile not found");
  }

  const next: UserProfile = {
    id: current.id,
    name: partial.name !== undefined ? partial.name.trim() : current.name,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const nextBio =
    partial.bio === null
      ? undefined
      : partial.bio !== undefined
        ? partial.bio.trim()
        : current.bio;

  if (nextBio && nextBio.length > 0) {
    next.bio = nextBio;
  }

  const nextAvatar =
    partial.avatar === null
      ? undefined
      : partial.avatar !== undefined
        ? partial.avatar
        : current.avatar;

  if (nextAvatar && nextAvatar.length > 0) {
    next.avatar = nextAvatar;
  }

  writeLocal(PROFILE_KEY, next);
  return next;
}

export async function getUnlockedAchievements(): Promise<UnlockedAchievement[]> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.getUnlockedAchievements();
  }

  const raw = readLocal(ACHIEVEMENTS_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as UnlockedAchievement[];
  } catch {
    return [];
  }
}

export async function saveUnlockedAchievements(
  items: UnlockedAchievement[],
): Promise<UnlockedAchievement[]> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.saveUnlockedAchievements(items);
  }

  writeLocal(ACHIEVEMENTS_KEY, items);
  return items;
}

export async function getStatsSnapshot(): Promise<PersistedStatsSnapshot | null> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.getStatsSnapshot();
  }

  const raw = readLocal(STATS_SNAPSHOT_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedStatsSnapshot;
  } catch {
    return null;
  }
}

export async function saveStatsSnapshot(
  snapshot: PersistedStatsSnapshot,
): Promise<PersistedStatsSnapshot> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.saveStatsSnapshot(snapshot);
  }

  writeLocal(STATS_SNAPSHOT_KEY, snapshot);
  return snapshot;
}

export async function getWatchTimeCache(): Promise<WatchTimeCache> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.getWatchTimeCache();
  }

  const raw = readLocal(WATCH_TIME_CACHE_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as WatchTimeCache;
  } catch {
    return {};
  }
}

export async function saveWatchTimeCache(
  cache: WatchTimeCache,
): Promise<WatchTimeCache> {
  if (hasElectronApi() && window.electronAPI) {
    return window.electronAPI.saveWatchTimeCache(cache);
  }

  writeLocal(WATCH_TIME_CACHE_KEY, cache);
  return cache;
}

export function clearProfileLocalFallback(): void {
  removeLocal(PROFILE_KEY);
}
