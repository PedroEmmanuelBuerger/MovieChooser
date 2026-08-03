import { LocalStorageService } from "@/services/localStorageService";
import {
  DEFAULT_USER_PREFERENCES,
  toMediaInteraction,
  toMovieInteraction,
  type MediaInteraction,
  type MovieInteraction,
  type UserPreferences,
  type WatchedMovieRecord,
} from "@/types/preferences";
import type { ContentTypeId } from "@/types/content-type";
import type { WatchedItem } from "@/types/watched";

const PREFERENCES_KEY = "moviechooser.userPreferences";
const INTERACTIONS_KEY = "moviechooser.movieInteractions";
const SEARCH_CACHE_KEY = "moviechooser.searchCache";
const MAX_INTERACTIONS = 1000;

function hasElectronApi(): boolean {
  return LocalStorageService.hasElectronBridge();
}

export function toWatchedMovieRecord(item: WatchedItem): WatchedMovieRecord {
  return {
    id: `${item.type}:${String(item.id)}`,
    externalId: item.id,
    title: item.title,
    posterUrl: item.poster,
    genres: item.genre
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
    rating: item.userRating,
    watchedAt: item.watchedAt,
  };
}

export async function getUserPreferences(): Promise<UserPreferences> {
  if (hasElectronApi() && window.electronAPI?.getUserPreferences) {
    return window.electronAPI.getUserPreferences();
  }

  return {
    ...DEFAULT_USER_PREFERENCES,
    ...LocalStorageService.getItem<UserPreferences>(
      PREFERENCES_KEY,
      DEFAULT_USER_PREFERENCES,
    ),
  };
}

export async function saveUserPreferences(
  preferences: UserPreferences,
): Promise<UserPreferences> {
  if (hasElectronApi() && window.electronAPI?.saveUserPreferences) {
    return window.electronAPI.saveUserPreferences(preferences);
  }

  LocalStorageService.setItem(PREFERENCES_KEY, preferences);
  return preferences;
}

export async function getMediaInteractions(): Promise<MediaInteraction[]> {
  const raw = await getMovieInteractions();
  return raw.map(toMediaInteraction);
}

export async function getMovieInteractions(): Promise<MovieInteraction[]> {
  if (hasElectronApi() && window.electronAPI?.getMovieInteractions) {
    return window.electronAPI.getMovieInteractions();
  }

  return LocalStorageService.getItem<MovieInteraction[]>(INTERACTIONS_KEY, []);
}

export async function saveMovieInteractions(
  items: MovieInteraction[],
): Promise<MovieInteraction[]> {
  const next = items.slice(0, MAX_INTERACTIONS);

  if (hasElectronApi() && window.electronAPI?.saveMovieInteractions) {
    return window.electronAPI.saveMovieInteractions(next);
  }

  LocalStorageService.setItem(INTERACTIONS_KEY, next);
  return next;
}

export async function addMediaInteraction(
  interaction: MediaInteraction,
): Promise<MediaInteraction[]> {
  const current = await getMediaInteractions();
  const filtered = current.filter(
    (item) =>
      !(
        item.mediaId === interaction.mediaId &&
        item.type === interaction.type &&
        item.action === interaction.action
      ),
  );
  const saved = await saveMovieInteractions(
    [interaction, ...filtered].map(toMovieInteraction),
  );
  return saved.map(toMediaInteraction);
}

export async function addMovieInteraction(
  interaction: MovieInteraction,
): Promise<MovieInteraction[]> {
  const media = toMediaInteraction(interaction);
  const next = await addMediaInteraction(media);
  return next.map(toMovieInteraction);
}

export async function getDislikedMediaIds(
  type?: ContentTypeId,
): Promise<Set<number>> {
  const interactions = await getMediaInteractions();
  return new Set(
    interactions
      .filter(
        (item) =>
          item.action === "DISLIKED" &&
          (type === undefined || item.type === type),
      )
      .map((item) => item.mediaId),
  );
}

export async function getDislikedMovieIds(): Promise<Set<number>> {
  return getDislikedMediaIds("movie");
}

export function deriveGenreAverages(
  watched: readonly WatchedItem[],
): Map<string, { sum: number; count: number; average: number }> {
  const map = new Map<string, { sum: number; count: number }>();

  for (const item of watched) {
    if (item.userRating === null) {
      continue;
    }

    const genres = item.genre
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    const labels = genres.length > 0 ? genres : [item.genre || "Outros"];

    for (const genre of labels) {
      const current = map.get(genre) ?? { sum: 0, count: 0 };
      current.sum += item.userRating;
      current.count += 1;
      map.set(genre, current);
    }
  }

  const averages = new Map<
    string,
    { sum: number; count: number; average: number }
  >();

  for (const [genre, value] of map.entries()) {
    averages.set(genre, {
      ...value,
      average: value.sum / value.count,
    });
  }

  return averages;
}

export function derivePreferredContentTypes(
  watched: readonly WatchedItem[],
): ContentTypeId[] {
  const scores = new Map<ContentTypeId, { sum: number; count: number }>();

  for (const item of watched) {
    if (item.userRating === null || item.userRating < 7) {
      continue;
    }

    const current = scores.get(item.type) ?? { sum: 0, count: 0 };
    current.sum += item.userRating;
    current.count += 1;
    scores.set(item.type, current);
  }

  return Array.from(scores.entries())
    .sort(
      (a, b) =>
        b[1].sum / b[1].count - a[1].sum / a[1].count ||
        b[1].count - a[1].count,
    )
    .map(([type]) => type);
}

export async function rebuildPreferencesFromWatched(
  watched: readonly WatchedItem[],
): Promise<UserPreferences> {
  const averages = deriveGenreAverages(watched);
  const ranked = Array.from(averages.entries()).sort(
    (a, b) => b[1].average - a[1].average || b[1].count - a[1].count,
  );

  const favoriteGenres = ranked
    .filter(([, value]) => value.average >= 7.5 && value.count >= 1)
    .slice(0, 5)
    .map(([genre]) => genre);

  const dislikedGenres = ranked
    .filter(([, value]) => value.average <= 5 && value.count >= 1)
    .slice(0, 5)
    .map(([genre]) => genre);

  const preferredContentTypes = derivePreferredContentTypes(watched);
  const current = await getUserPreferences();
  const next: UserPreferences = {
    ...current,
    favoriteGenres:
      favoriteGenres.length > 0 ? favoriteGenres : current.favoriteGenres,
    dislikedGenres:
      dislikedGenres.length > 0 ? dislikedGenres : current.dislikedGenres,
  };

  if (preferredContentTypes.length > 0) {
    next.preferredContentTypes = preferredContentTypes;
  } else if (current.preferredContentTypes) {
    next.preferredContentTypes = current.preferredContentTypes;
  }

  return saveUserPreferences(next);
}

export interface SearchCacheEntry {
  query: string;
  results: unknown[];
  cachedAt: string;
}

export function getSearchCache(): SearchCacheEntry[] {
  return LocalStorageService.getItem<SearchCacheEntry[]>(SEARCH_CACHE_KEY, []);
}

export function putSearchCache(query: string, results: unknown[]): void {
  const normalized = query.trim().toLowerCase();
  const current = getSearchCache().filter((item) => item.query !== normalized);
  const next = [
    {
      query: normalized,
      results,
      cachedAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 40);
  LocalStorageService.setItem(SEARCH_CACHE_KEY, next);
}

export function readSearchCache(query: string): unknown[] | null {
  const normalized = query.trim().toLowerCase();
  const entry = getSearchCache().find((item) => item.query === normalized);

  if (!entry) {
    return null;
  }

  const age = Date.now() - new Date(entry.cachedAt).getTime();

  if (age > 1000 * 60 * 30) {
    return null;
  }

  return entry.results;
}

export const PreferenceService = {
  getUserPreferences,
  saveUserPreferences,
  getMovieInteractions,
  getMediaInteractions,
  saveMovieInteractions,
  addMovieInteraction,
  addMediaInteraction,
  getDislikedMovieIds,
  getDislikedMediaIds,
  rebuildPreferencesFromWatched,
  deriveGenreAverages,
  derivePreferredContentTypes,
  toWatchedMovieRecord,
} as const;
