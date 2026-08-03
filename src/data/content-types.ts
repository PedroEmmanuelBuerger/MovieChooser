import type { ContentTypeOption } from "@/types/content-type";

export const CONTENT_TYPE_OPTIONS: readonly ContentTypeOption[] = [
  {
    id: "movie",
    name: "Filme",
    description: "Uma sessão de cinema em casa",
  },
  {
    id: "series",
    name: "Série",
    description: "Episódios para acompanhar no seu ritmo",
  },
  {
    id: "anime",
    name: "Anime",
    description: "Animações japonesas e títulos de anime",
  },
] as const;
