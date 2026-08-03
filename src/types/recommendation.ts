import type { ContentTypeId } from "@/types/content-type";
import type { PlatformId } from "@/types/platform";

export interface RecommendationResult {
  id: number;
  title: string;
  description: string;
  poster: string | null;
  rating: number;
  type: ContentTypeId;
  platformId: PlatformId;
  mediaType: "movie" | "tv";
}
