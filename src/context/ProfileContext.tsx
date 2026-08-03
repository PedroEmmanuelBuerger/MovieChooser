import { type ReactNode } from "react";
import { ProfileContext } from "@/context/profile-context";
import { useProfile } from "@/hooks/useProfile";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const profile = useProfile();

  return (
    <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>
  );
}
