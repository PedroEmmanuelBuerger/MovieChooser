import { useContext } from "react";
import {
  SettingsContext,
  type SettingsApi,
} from "@/context/settings-context";

export function useSettingsContext(): SettingsApi {
  const value = useContext(SettingsContext);

  if (!value) {
    throw new Error("useSettingsContext must be used within SettingsProvider");
  }

  return value;
}
