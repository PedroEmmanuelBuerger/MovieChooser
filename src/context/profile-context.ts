import { createContext } from "react";
import type { useProfile } from "@/hooks/useProfile";

export type ProfileApi = ReturnType<typeof useProfile>;

export const ProfileContext = createContext<ProfileApi | null>(null);
