import { createContext } from "react";
import type { useSettings } from "@/hooks/useSettings";

export type SettingsApi = ReturnType<typeof useSettings>;

export const SettingsContext = createContext<SettingsApi | null>(null);
