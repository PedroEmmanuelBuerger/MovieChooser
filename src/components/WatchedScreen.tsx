import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ContentTypeTabs } from "@/components/ContentTypeTabs";
import { WatchedCard } from "@/components/WatchedCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLibrary } from "@/hooks/useLibrary";
import { EASE_OUT_EXPO, listVariants } from "@/lib/motion";

export function WatchedScreen() {
  const reduceMotion = useReducedMotion();
  const { watched } = useLibrary();

  const movieCount = watched.items.filter((item) => item.type === "movie").length;
  const seriesCount = watched.items.filter(
    (item) => item.type === "series",
  ).length;
  const animeCount = watched.items.filter((item) => item.type === "anime").length;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <motion.header
        className="mb-8"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Biblioteca
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Assistidos
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Títulos que você já viu, com a sua nota pessoal.
        </p>
      </motion.header>

      <div className="mb-6">
        <ContentTypeTabs
          value={watched.tab}
          onChange={watched.setTab}
          movieCount={movieCount}
          seriesCount={seriesCount}
          animeCount={animeCount}
        />
      </div>

      {watched.error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {watched.error}
        </p>
      ) : null}

      {watched.loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[180px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={watched.tab}
            className="grid gap-3"
            variants={listVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            {...(reduceMotion ? {} : { exit: { opacity: 0, y: -8 } })}
          >
            {watched.filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
                <p className="font-display text-lg font-semibold text-foreground">
                  Nenhum título assistido
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Marque recomendações no histórico ou na tela de descoberta.
                </p>
              </div>
            ) : (
              watched.filteredItems.map((item) => (
                <WatchedCard
                  key={`${item.type}:${String(item.id)}`}
                  item={item}
                  onRatingChange={(rating) => {
                    void watched.setUserRating(item.type, item.id, rating);
                  }}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </main>
  );
}
