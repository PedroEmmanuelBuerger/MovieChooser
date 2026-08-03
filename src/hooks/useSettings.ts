import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAppSettings,
  updateAppSettings,
} from "@/services/settingsService";
import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
} from "@/types/settings";

interface UseSettingsResult {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  setExcludeWatched: (value: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await getAppSettings();
      setSettings(next);
    } catch {
      setError("Não foi possível carregar as configurações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setExcludeWatched = useCallback(async (value: boolean) => {
    setError(null);

    try {
      const next = await updateAppSettings({ excludeWatched: value });
      setSettings(next);
    } catch {
      setError("Não foi possível salvar a configuração.");
    }
  }, []);

  return useMemo(
    () => ({
      settings,
      loading,
      error,
      setExcludeWatched,
      refresh,
    }),
    [settings, loading, error, setExcludeWatched, refresh],
  );
}
