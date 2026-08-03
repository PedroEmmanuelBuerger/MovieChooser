import { useContext } from "react";
import {
  LibraryContext,
  type LibraryContextValue,
} from "@/context/library-context";

export function useLibrary(): LibraryContextValue {
  const value = useContext(LibraryContext);

  if (!value) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }

  return value;
}
