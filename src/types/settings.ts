export interface AppSettings {
  excludeWatched: boolean;
}

export interface FutureAppSettings extends AppSettings {
  preferHighUserRatings: boolean;
  hideLowRated: boolean;
  preferFavoriteGenres: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  excludeWatched: true,
};

export const DEFAULT_FUTURE_APP_SETTINGS: FutureAppSettings = {
  ...DEFAULT_APP_SETTINGS,
  preferHighUserRatings: false,
  hideLowRated: false,
  preferFavoriteGenres: false,
};

export function mergeAppSettings(
  partial: Partial<AppSettings> | null | undefined,
): AppSettings {
  return {
    ...DEFAULT_APP_SETTINGS,
    ...(partial ?? {}),
  };
}
