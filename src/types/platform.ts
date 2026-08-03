export type PlatformId =
  | "netflix"
  | "hbo-max"
  | "crunchyroll"
  | "prime-video"
  | "disney-plus";

export interface StreamingPlatform {
  id: PlatformId;
  name: string;
  accent: string;
  accentSoft: string;
}
