import { type ReactNode, useMemo } from "react";
import { LibraryContext } from "@/context/library-context";
import { useHistory } from "@/hooks/useHistory";
import { useWatched } from "@/hooks/useWatched";

export function LibraryProvider({ children }: { children: ReactNode }) {
  const history = useHistory();
  const watched = useWatched();
  const value = useMemo(
    () => ({ history, watched }),
    [history, watched],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}
