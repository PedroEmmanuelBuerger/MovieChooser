import type { ContentTypeId } from "@/types/content-type";
import type { GenreId } from "@/types/genre";
import type { PlatformId } from "@/types/platform";

export interface RecommendationResult {
  id: number;
  title: string;
  description: string;
  poster: string;
  rating: number;
  type: ContentTypeId;
  genre: string;
  genreId: GenreId | "random";
  isSurpriseMode: boolean;
  platformId: PlatformId;
  mediaType: "movie" | "tv";
}
