import type { StreamingPlatformId } from "@/types/platform";

export const TMDB_WATCH_REGION = "BR";

export const TMDB_WATCH_PROVIDER_IDS: Record<StreamingPlatformId, string> = {
  netflix: "8",
  "hbo-max": "1899|384",
  crunchyroll: "283",
  "prime-video": "119",
  "disney-plus": "337",
};
