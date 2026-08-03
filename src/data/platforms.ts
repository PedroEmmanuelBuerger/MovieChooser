import type { StreamingPlatform } from "@/types/platform";

export const STREAMING_PLATFORMS: readonly StreamingPlatform[] = [
  {
    id: "netflix",
    name: "Netflix",
    accent: "#E50914",
    accentSoft: "rgba(229, 9, 20, 0.18)",
  },
  {
    id: "hbo-max",
    name: "HBO Max",
    accent: "#B825F6",
    accentSoft: "rgba(184, 37, 246, 0.18)",
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    accent: "#F47521",
    accentSoft: "rgba(244, 117, 33, 0.18)",
  },
  {
    id: "prime-video",
    name: "Prime Video",
    accent: "#00A8E1",
    accentSoft: "rgba(0, 168, 225, 0.18)",
  },
  {
    id: "disney-plus",
    name: "Disney+",
    accent: "#113CCF",
    accentSoft: "rgba(17, 60, 207, 0.22)",
  },
] as const;
