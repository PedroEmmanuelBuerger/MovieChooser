import {
  getAppSettings,
  updateAppSettings,
} from "../src/services/settingsService";
import { DEFAULT_APP_SETTINGS } from "../src/types/settings";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
  const initial = await getAppSettings();
  assert(
    typeof initial.excludeWatched === "boolean",
    "excludeWatched deve ser boolean",
  );

  const disabled = await updateAppSettings({ excludeWatched: false });
  assert(!disabled.excludeWatched, "Falha ao desativar exclusão");

  const reloadedDisabled = await getAppSettings();
  assert(
    !reloadedDisabled.excludeWatched,
    "Configuração desativada não persistiu",
  );

  const enabled = await updateAppSettings({ excludeWatched: true });
  assert(enabled.excludeWatched, "Falha ao ativar exclusão");

  const reloadedEnabled = await getAppSettings();
  assert(
    reloadedEnabled.excludeWatched,
    "Configuração ativada não persistiu",
  );

  assert(
    typeof initial.considerPreferences === "boolean",
    "considerPreferences deve ser boolean",
  );

  const withPrefs = await updateAppSettings({ considerPreferences: true });
  assert(withPrefs.considerPreferences, "Falha ao ativar preferências");

  const prefsReloaded = await getAppSettings();
  assert(
    prefsReloaded.considerPreferences,
    "considerPreferences não persistiu",
  );

  await updateAppSettings({ considerPreferences: false });

  assert(
    DEFAULT_APP_SETTINGS.excludeWatched,
    "Padrão deve ser ativado",
  );
  assert(
    !DEFAULT_APP_SETTINGS.considerPreferences,
    "Padrão de preferências deve ser desativado",
  );

  console.log("Settings ok");
  console.log(`excludeWatched: ${String(reloadedEnabled.excludeWatched)}`);
  console.log(
    `considerPreferences: ${String(prefsReloaded.considerPreferences)}`,
  );
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
