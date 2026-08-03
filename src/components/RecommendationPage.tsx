import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PersonalRecommendationCard } from "@/components/PersonalRecommendationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLibrary } from "@/hooks/useLibrary";
import { EASE_OUT_EXPO, listVariants } from "@/lib/motion";
import { RecommendationService } from "@/services/personalRecommendationService";
import { addMediaInteraction } from "@/services/preferenceService";
import type { ScoredRecommendation } from "@/types/preferences";

export function RecommendationPage() {
  const reduceMotion = useReducedMotion();
  const { watched } = useLibrary();
  const [movies, setMovies] = useState<ScoredRecommendation[]>([]);
  const [seriesAndAnime, setSeriesAndAnime] = useState<ScoredRecommendation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void RecommendationService.getPersonalizedRecommendations({
      watched: watched.items,
      signal: controller.signal,
      limit: 12,
    })
      .then((next) => {
        if (!controller.signal.aborted) {
          setMovies(next.movies);
          setSeriesAndAnime(next.seriesAndAnime);
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

  const isEmpty = movies.length === 0 && seriesAndAnime.length === 0;

  function removeItem(item: ScoredRecommendation) {
    if (item.type === "movie") {
      setMovies((current) => current.filter((entry) => entry.id !== item.id));
      return;
    }

    setSeriesAndAnime((current) =>
      current.filter(
        (entry) => !(entry.id === item.id && entry.type === item.type),
      ),
    );
  }

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
          Sugestões com base nas suas notas, gêneros favoritos e tipos de
          conteúdo preferidos — sem IA e sem backend.
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
      ) : isEmpty ? (
        <div className="rounded-xl border border-dashed border-border/80 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">
            Ainda sem recomendações personalizadas
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Avalie títulos assistidos ou pesquise filmes, séries e animes para
            alimentar o algoritmo.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">
              Filmes recomendados
            </h2>
            {movies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma sugestão de filme no momento.
              </p>
            ) : (
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                variants={listVariants}
                initial={reduceMotion ? false : "hidden"}
                animate="visible"
              >
                {movies.map((item) => (
                  <PersonalRecommendationCard
                    key={`movie:${String(item.id)}`}
                    item={item}
                    onOpen={() => undefined}
                    onDislike={() => {
                      void addMediaInteraction({
                        mediaId: item.id,
                        type: item.type,
                        action: "DISLIKED",
                        date: new Date().toISOString(),
                      }).then(() => {
                        removeItem(item);
                      });
                    }}
                  />
                ))}
              </motion.div>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-display text-xl font-semibold">
              Séries e Animes recomendados
            </h2>
            {seriesAndAnime.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma sugestão de série ou anime no momento.
              </p>
            ) : (
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                variants={listVariants}
                initial={reduceMotion ? false : "hidden"}
                animate="visible"
              >
                {seriesAndAnime.map((item) => (
                  <PersonalRecommendationCard
                    key={`${item.type}:${String(item.id)}`}
                    item={item}
                    onOpen={() => undefined}
                    onDislike={() => {
                      void addMediaInteraction({
                        mediaId: item.id,
                        type: item.type,
                        action: "DISLIKED",
                        date: new Date().toISOString(),
                      }).then(() => {
                        removeItem(item);
                      });
                    }}
                  />
                ))}
              </motion.div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
