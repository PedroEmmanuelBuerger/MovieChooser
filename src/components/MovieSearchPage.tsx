import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MovieDetailsModal } from "@/components/MovieDetailsModal";
import { MovieResultCard } from "@/components/MovieResultCard";
import { MovieSearchBar } from "@/components/MovieSearchBar";
import { WatchedMoviesList } from "@/components/WatchedMoviesList";
import { useLibrary } from "@/hooks/useLibrary";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { MovieSearchService } from "@/services/movieSearchService";
import {
  addMovieInteraction,
  rebuildPreferencesFromWatched,
} from "@/services/preferenceService";
import { markAsWatched } from "@/services/storageService";
import type {
  SearchMovieDetails,
  SearchMovieResult,
} from "@/types/movie-search";
import type { UserRating, WatchedItem } from "@/types/watched";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
}

export function MovieSearchPage() {
  const reduceMotion = useReducedMotion();
  const { watched } = useLibrary();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 400);
  const [results, setResults] = useState<SearchMovieResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<SearchMovieDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [genreFilter, setGenreFilter] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    void MovieSearchService.search(debouncedQuery, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setResults(items);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Não foi possível buscar filmes agora.");
          setResults([]);
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
  }, [debouncedQuery]);

  const watchedMovies = useMemo(
    () => watched.items.filter((item) => item.type === "movie"),
    [watched.items],
  );

  async function markMovieWatched(movie: SearchMovieResult | SearchMovieDetails) {
    const genre = movie.genreNames.join(", ") || "Filme";
    const payload: WatchedItem = {
      id: movie.id,
      title: movie.title,
      description: movie.overview,
      poster: movie.poster ?? "",
      platform: "Pesquisa",
      platformId: "netflix",
      type: "movie",
      genre,
      ratingTmdb: movie.ratingTmdb,
      userRating: null,
      watchedAt: new Date().toISOString(),
    };

    await markAsWatched(payload);
    await addMovieInteraction({
      movieId: movie.id,
      action: "WATCHED",
      date: new Date().toISOString(),
    });
    await watched.refresh();
    await rebuildPreferencesFromWatched([
      ...watched.items.filter(
        (item) => !(item.type === "movie" && item.id === movie.id),
      ),
      payload,
    ]);
  }

  async function dislikeMovie(movieId: number) {
    await addMovieInteraction({
      movieId,
      action: "DISLIKED",
      date: new Date().toISOString(),
    });
  }

  async function openDetails(movieId: number) {
    try {
      const full = await MovieSearchService.getDetails(movieId);
      setDetails(full);
      setDetailsOpen(true);
    } catch {
      setError("Não foi possível carregar os detalhes.");
    }
  }

  const selectedWatched = details
    ? watchedMovies.find((item) => item.id === details.id)
    : undefined;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <motion.header
        className="mb-6"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
      >
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Catálogo
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Pesquisar Filmes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Busque filmes, marque como assistidos e construa suas preferências.
        </p>
      </motion.header>

      <MovieSearchBar value={query} onChange={setQuery} loading={loading} />

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          {debouncedQuery.trim().length >= 2 &&
          !loading &&
          results.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum filme encontrado para “{debouncedQuery}”.
            </p>
          ) : null}

          {results.map((movie) => {
            const item = watchedMovies.find((watchedItem) => watchedItem.id === movie.id);

            return (
              <MovieResultCard
                key={movie.id}
                movie={movie}
                isWatched={Boolean(item)}
                userRating={item?.userRating ?? null}
                {...(item?.watchedAt ? { watchedAt: item.watchedAt } : {})}
                onOpenDetails={() => {
                  void openDetails(movie.id);
                }}
                onMarkWatched={() => {
                  void markMovieWatched(movie);
                }}
                onDislike={() => {
                  void dislikeMovie(movie.id);
                }}
              />
            );
          })}
        </section>

        <WatchedMoviesList
          items={watchedMovies}
          query={historyQuery}
          minRating={minRating}
          genreFilter={genreFilter}
          onQueryChange={setHistoryQuery}
          onMinRatingChange={setMinRating}
          onGenreFilterChange={setGenreFilter}
        />
      </div>

      <MovieDetailsModal
        open={detailsOpen}
        movie={details}
        isWatched={Boolean(selectedWatched)}
        userRating={selectedWatched?.userRating ?? null}
        onClose={() => {
          setDetailsOpen(false);
        }}
        onMarkWatched={() => {
          if (details) {
            void markMovieWatched(details);
          }
        }}
        onRate={(rating: UserRating) => {
          if (!details) {
            return;
          }

          void watched.setUserRating("movie", details.id, rating);
          void addMovieInteraction({
            movieId: details.id,
            action: "RATED",
            date: new Date().toISOString(),
            rating,
          });
        }}
        onDislike={() => {
          if (details) {
            void dislikeMovie(details.id);
            setDetailsOpen(false);
          }
        }}
      />
    </main>
  );
}
