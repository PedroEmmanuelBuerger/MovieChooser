import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { ContentTypeTabs } from "@/components/ContentTypeTabs";
import { HistoryCard } from "@/components/HistoryCard";
import { WatchedSuccessToast } from "@/components/WatchedSuccessToast";
import { Skeleton } from "@/components/ui/skeleton";
import { useLibrary } from "@/hooks/useLibrary";
import { EASE_OUT_EXPO, listVariants } from "@/lib/motion";
import type { HistoryItem } from "@/types/history";
import type { UserRating } from "@/types/watched";

export function HistoryScreen() {
  const reduceMotion = useReducedMotion();
  const { history, watched } = useLibrary();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [toastItem, setToastItem] = useState<HistoryItem | null>(null);
  const [toastRating, setToastRating] = useState<UserRating | null>(null);

  const movieCount = history.items.filter((item) => item.type === "movie").length;
  const seriesCount = history.items.filter(
    (item) => item.type === "series",
  ).length;

  async function handleMarkWatched(item: HistoryItem) {
    const key = `${item.type}:${String(item.id)}:${item.recommendedAt}`;
    setMarkingId(key);

    const result = await watched.markHistoryItem(item);
    setMarkingId(null);

    if (result.added || result.item) {
      setToastItem(item);
      setToastRating(result.item?.userRating ?? null);
    }
  }

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
          Histórico
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Todas as recomendações que você recebeu neste dispositivo.
        </p>
      </motion.header>

      <div className="mb-6">
        <ContentTypeTabs
          value={history.tab}
          onChange={history.setTab}
          movieCount={movieCount}
          seriesCount={seriesCount}
        />
      </div>

      {history.error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {history.error}
        </p>
      ) : null}

      {history.loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[156px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={history.tab}
            className="grid gap-3"
            variants={listVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            {...(reduceMotion ? {} : { exit: { opacity: 0, y: -8 } })}
          >
            {history.filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
                <p className="font-display text-lg font-semibold text-foreground">
                  Nenhum item neste histórico
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  As recomendações aparecem aqui automaticamente.
                </p>
              </div>
            ) : (
              history.filteredItems.map((item) => {
                const markKey = `${item.type}:${String(item.id)}:${item.recommendedAt}`;

                return (
                  <HistoryCard
                    key={markKey}
                    item={item}
                    isWatched={watched.isWatched(item.type, item.id)}
                    marking={markingId === markKey}
                    onMarkWatched={() => {
                      void handleMarkWatched(item);
                    }}
                  />
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <WatchedSuccessToast
        open={toastItem !== null}
        title={toastItem?.title ?? ""}
        rating={toastRating}
        onRatingChange={(rating) => {
          if (!toastItem) {
            return;
          }

          setToastRating(rating);
          void watched.setUserRating(toastItem.type, toastItem.id, rating);
        }}
        onClose={() => {
          setToastItem(null);
          setToastRating(null);
        }}
      />
    </main>
  );
}
