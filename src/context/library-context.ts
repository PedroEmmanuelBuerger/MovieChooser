import { createContext } from "react";
import type { useHistory } from "@/hooks/useHistory";
import type { useWatched } from "@/hooks/useWatched";

type HistoryApi = ReturnType<typeof useHistory>;
type WatchedApi = ReturnType<typeof useWatched>;

export interface LibraryContextValue {
  history: HistoryApi;
  watched: WatchedApi;
}

export const LibraryContext = createContext<LibraryContextValue | null>(null);
