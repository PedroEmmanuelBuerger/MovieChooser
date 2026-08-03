import { useCallback, useEffect, useMemo, useState } from "react";
import { clearAllLocalData } from "@/services/accountService";
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
} from "@/services/profileService";
import type {
  CreateProfileInput,
  UpdateProfileInput,
  UserProfile,
} from "@/types/profile";

interface UseProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  needsOnboarding: boolean;
  createProfile: (input: CreateProfileInput) => Promise<UserProfile | null>;
  updateProfile: (input: UpdateProfileInput) => Promise<UserProfile | null>;
  deleteAccount: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await getUserProfile();
      setProfile(next);
    } catch {
      setError("Não foi possível carregar o perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProfile = useCallback(async (input: CreateProfileInput) => {
    setError(null);

    try {
      const next = await createUserProfile(input);
      setProfile(next);
      return next;
    } catch {
      setError("Não foi possível criar o perfil.");
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    setError(null);

    try {
      const next = await updateUserProfile(input);
      setProfile(next);
      return next;
    } catch {
      setError("Não foi possível atualizar o perfil.");
      return null;
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setError(null);

    try {
      await clearAllLocalData();
      setProfile(null);
      return true;
    } catch {
      setError("Não foi possível excluir a conta.");
      return false;
    }
  }, []);

  return useMemo(
    () => ({
      profile,
      loading,
      error,
      needsOnboarding: !loading && profile === null,
      createProfile,
      updateProfile,
      deleteAccount,
      refresh,
    }),
    [
      profile,
      loading,
      error,
      createProfile,
      updateProfile,
      deleteAccount,
      refresh,
    ],
  );
}
