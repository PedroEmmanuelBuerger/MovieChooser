import { LocalStorageService } from "@/services/localStorageService";
import {
  addMediaInteraction,
  rebuildPreferencesFromWatched,
} from "@/services/preferenceService";
import {
  getWatchedItems,
  markAsWatched,
  updateWatchedRating,
} from "@/services/storageService";
import type { ContentTypeId } from "@/types/content-type";
import { getContentTypeLabel } from "@/types/content-type";
import type { Media, WatchedMediaEntry } from "@/types/media";
import type { UserRating, WatchedItem } from "@/types/watched";
import { isValidUserRating } from "@/types/watched";

const WATCHED_MEDIA_MIRROR_KEY = "moviechooser.watchedMedia";

function toWatchedMediaEntry(item: WatchedItem): WatchedMediaEntry {
  return {
    mediaId: item.id,
    type: item.type,
    title: item.title,
    posterUrl: item.poster,
    genres: item.genre
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
    watchedAt: item.watchedAt,
    rating: item.userRating,
  };
}

function mirrorWatchedMedia(items: readonly WatchedItem[]): WatchedMediaEntry[] {
  const media = items
    .map(toWatchedMediaEntry)
    .sort(
      (a, b) =>
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime(),
    );

  LocalStorageService.setItem(WATCHED_MEDIA_MIRROR_KEY, media);
  return media;
}

function toWatchedItemFromMedia(media: Media): WatchedItem {
  return {
    id: media.externalId,
    title: media.title,
    description: media.overview,
    poster: media.posterUrl ?? "",
    platform: "Pesquisa",
    platformId: "search",
    type: media.type,
    genre: media.genres.join(", ") || getContentTypeLabel(media.type),
    ratingTmdb: media.ratingTmdb ?? 0,
    userRating: null,
    watchedAt: new Date().toISOString(),
  };
}

export const MediaHistoryService = {
  async listWatched(type?: ContentTypeId): Promise<WatchedMediaEntry[]> {
    const items = await getWatchedItems();
    const mirrored = mirrorWatchedMedia(items);

    if (!type) {
      return mirrored;
    }

    return mirrored.filter((item) => item.type === type);
  },

  async findWatched(
    type: ContentTypeId,
    mediaId: number,
  ): Promise<WatchedMediaEntry | undefined> {
    const items = await this.listWatched(type);
    return items.find((item) => item.mediaId === mediaId);
  },

  async markAsWatched(media: Media): Promise<WatchedMediaEntry> {
    const payload = toWatchedItemFromMedia(media);
    const result = await markAsWatched(payload);
    const entry =
      result.items.find(
        (item) => item.type === media.type && item.id === media.externalId,
      ) ?? payload;

    await addMediaInteraction({
      mediaId: media.externalId,
      type: media.type,
      action: "WATCHED",
      date: entry.watchedAt,
    });

    const mirrored = mirrorWatchedMedia(result.items);
    await rebuildPreferencesFromWatched(result.items);

    return (
      mirrored.find(
        (item) => item.type === media.type && item.mediaId === media.externalId,
      ) ?? toWatchedMediaEntry(entry)
    );
  },

  async updateRating(
    type: ContentTypeId,
    mediaId: number,
    rating: UserRating,
  ): Promise<WatchedMediaEntry | null> {
    if (!isValidUserRating(rating)) {
      throw new Error("Invalid rating");
    }

    const items = await updateWatchedRating({
      type,
      id: mediaId,
      userRating: rating,
    });

    await addMediaInteraction({
      mediaId,
      type,
      action: "RATED",
      date: new Date().toISOString(),
      rating,
    });

    const mirrored = mirrorWatchedMedia(items);
    await rebuildPreferencesFromWatched(items);
    return (
      mirrored.find((item) => item.type === type && item.mediaId === mediaId) ??
      null
    );
  },

  async removeRating(
    type: ContentTypeId,
    mediaId: number,
  ): Promise<WatchedMediaEntry | null> {
    const items = await updateWatchedRating({
      type,
      id: mediaId,
      userRating: null,
    });

    const mirrored = mirrorWatchedMedia(items);
    await rebuildPreferencesFromWatched(items);
    return (
      mirrored.find((item) => item.type === type && item.mediaId === mediaId) ??
      null
    );
  },
};
