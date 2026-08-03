import type { ContentTypeId, MediaKind } from "@/types/content-type";

export interface MediaPerson {
  id: number;
  name: string;
  job?: string;
}

export interface Media {
  id: string;
  externalId: number;
  title: string;
  originalTitle: string;
  type: MediaKind;
  overview: string;
  posterUrl: string | null;
  releaseDate: string;
  year: string;
  genres: string[];
  ratingTmdb?: number;
  actors?: MediaPerson[];
  director?: MediaPerson[];
  seasons?: number | null;
  episodes?: number | null;
  studio?: string | null;
  runtime?: number | null;
  keywords?: string[];
  userRating?: number | null;
  watched?: boolean;
  watchedAt?: string;
}

export interface WatchedMediaEntry {
  mediaId: number;
  type: ContentTypeId;
  title: string;
  posterUrl: string;
  genres: string[];
  watchedAt: string;
  rating: number | null;
}

export function createMediaId(type: MediaKind, externalId: number): string {
  return `${type}:${String(externalId)}`;
}
