export type StreamingPlatformId =
  | "netflix"
  | "hbo-max"
  | "crunchyroll"
  | "prime-video"
  | "disney-plus";

export type PlatformId = StreamingPlatformId | "search";

export interface StreamingPlatform {
  id: StreamingPlatformId;
  name: string;
  accent: string;
  accentSoft: string;
}
