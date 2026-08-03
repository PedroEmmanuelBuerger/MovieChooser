import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PersonalRecommendationCard } from "@/components/PersonalRecommendationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLibrary } from "@/hooks/useLibrary";
import { EASE_OUT_EXPO, listVariants } from "@/lib/motion";
import { RecommendationService } from "@/services/personalRecommendationService";
import { addMovieInteraction } from "@/services/preferenceService";
import type { ScoredRecommendation } from "@/types/preferences";

export function RecommendationPage() {
  const reduceMotion = useReducedMotion();
  const { watched } = useLibrary();
  const [items, setItems] = useState<ScoredRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void RecommendationService.getPersonalizedMovies({
      watched: watched.items,
      signal: controller.signal,
      limit: 12,
    })
      .then((next) => {
        if (!controller.signal.aborted) {
          setItems(next);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Não foi possível gerar recomendações agora.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [watched.items]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <motion.header
        className="mb-8"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
      >
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Para você
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Recomendações
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Sugestões com base nas suas notas, gêneros favoritos e interações
          locais — sem IA e sem backend.
        </p>
      </motion.header>

      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">
            Ainda sem recomendações personalizadas
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Avalie filmes assistidos ou pesquise títulos para alimentar o
            algoritmo.
          </p>
        </div>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={listVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
        >
          {items.map((item) => (
            <PersonalRecommendationCard
              key={item.id}
              item={item}
              onOpen={() => undefined}
              onDislike={() => {
                void addMovieInteraction({
                  movieId: item.id,
                  action: "DISLIKED",
                  date: new Date().toISOString(),
                }).then(() => {
                  setItems((current) =>
                    current.filter((entry) => entry.id !== item.id),
                  );
                });
              }}
            />
          ))}
        </motion.div>
      )}
    </main>
  );
}
