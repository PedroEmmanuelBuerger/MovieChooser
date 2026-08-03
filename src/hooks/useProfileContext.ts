import { useContext } from "react";
import {
  ProfileContext,
  type ProfileApi,
} from "@/context/profile-context";

export function useProfileContext(): ProfileApi {
  const value = useContext(ProfileContext);

  if (!value) {
    throw new Error("useProfileContext must be used within ProfileProvider");
  }

  return value;
}
