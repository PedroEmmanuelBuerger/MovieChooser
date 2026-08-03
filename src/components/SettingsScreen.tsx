import { motion, useReducedMotion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function SettingsScreen() {
  const reduceMotion = useReducedMotion();
  const { settings, loading, error, setExcludeWatched } = useSettingsContext();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <motion.header
        className="mb-8"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Preferências
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Configurações
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Ajuste como o MovieChooser escolhe as próximas recomendações.
        </p>
      </motion.header>

      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <motion.section
        className="rounded-2xl border border-border/70 bg-card/70 p-6"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: EASE_OUT_EXPO }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Settings2 className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Recomendações
            </h2>
            <p className="text-sm text-muted-foreground">
              Controle o que pode aparecer no sorteio
            </p>
          </div>
        </div>

        <label
          className={cn(
            "flex cursor-pointer items-start gap-4 rounded-xl border border-border/80 bg-secondary/30 p-4 transition-colors hover:bg-secondary/50",
            loading && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[oklch(0.58_0.23_27)]"
            checked={settings.excludeWatched}
            disabled={loading}
            onChange={(event) => {
              void setExcludeWatched(event.target.checked);
            }}
          />
          <span className="min-w-0">
            <span className="block font-medium text-foreground">
              Não recomendar conteúdos já assistidos
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Quando ativado, o MovieChooser irá ignorar filmes, séries e animes
              marcados como assistidos.
            </span>
          </span>
        </label>
      </motion.section>
    </main>
  );
}
