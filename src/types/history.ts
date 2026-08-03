import type { ContentTypeId } from "@/types/content-type";
import type { StreamingPlatformId } from "@/types/platform";

export type HistoryTab = "movie" | "series";

export interface HistoryItem {
  id: number;
  title: string;
  description: string;
  poster: string;
  platform: string;
  platformId: StreamingPlatformId;
  type: ContentTypeId;
  genre: string;
  rating: number;
  recommendedAt: string;
}

export function isHistoryMovie(item: HistoryItem): boolean {
  return item.type === "movie";
}

export function isHistorySeries(item: HistoryItem): boolean {
  return item.type === "series";
}

export function filterHistoryByTab(
  items: readonly HistoryItem[],
  tab: HistoryTab,
): HistoryItem[] {
  return items.filter((item) => item.type === tab);
}
