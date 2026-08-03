import type { ContentTypeOption } from "@/types/content-type";

export const CONTENT_TYPE_OPTIONS: readonly ContentTypeOption[] = [
  {
    id: "movie",
    name: "Filme",
    description: "Uma sessão de cinema em casa",
  },
  {
    id: "series",
    name: "Série/Anime",
    description: "Episódios para acompanhar no seu ritmo",
  },
] as const;
