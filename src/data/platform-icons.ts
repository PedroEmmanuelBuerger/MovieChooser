import {
  Clapperboard,
  Crown,
  Popcorn,
  Search,
  Sparkles,
  Tv,
  type LucideIcon,
} from "lucide-react";
import type { PlatformId } from "@/types/platform";

export const PLATFORM_ICONS: Record<PlatformId, LucideIcon> = {
  netflix: Clapperboard,
  "hbo-max": Tv,
  crunchyroll: Sparkles,
  "prime-video": Popcorn,
  "disney-plus": Crown,
  search: Search,
};
