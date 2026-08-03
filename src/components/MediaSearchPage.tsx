import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MediaDetailsModal } from "@/components/MediaDetailsModal";
import { MediaResultCard } from "@/components/MediaResultCard";
import { MediaSearchBar } from "@/components/MediaSearchBar";
import { WatchedMediaList } from "@/components/WatchedMediaList";
import { useLibrary } from "@/hooks/useLibrary";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MediaHistoryService } from "@/services/mediaHistoryService";
import { MediaSearchService } from "@/services/mediaSearchService";
import { addMediaInteraction } from "@/services/preferenceService";
import type { MediaKind } from "@/types/content-type";
import { getContentTypeLabel } from "@/types/content-type";
import type {
  SearchMediaDetails,
  SearchMediaResult,
} from "@/types/media-search";
import type { UserRating } from "@/types/watched";

const KIND_TABS: MediaKind[] = ["movie", "series", "anime"];

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

export function MediaSearchPage() {
  const reduceMotion = useReducedMotion();
  const { watched } = useLibrary();
  const [activeKind, setActiveKind] = useState<MediaKind>("movie");
  const [queries, setQueries] = useState<Record<MediaKind, string>>({
    movie: "",
    series: "",
    anime: "",
  });
  const [resultsByKind, setResultsByKind] = useState<
    Record<MediaKind, SearchMediaResult[]>
  >({
    movie: [],
    series: [],
    anime: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<SearchMediaDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [genreFilter, setGenreFilter] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const query = queries[activeKind];
  const debouncedQuery = useDebouncedValue(query, 400);
  const results = resultsByKind[activeKind];

  useEffect(() => {
    abortRef.current?.abort();

    if (debouncedQuery.trim().length < 2) {
      setResultsByKind((current) => ({ ...current, [activeKind]: [] }));
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    void MediaSearchService.search(activeKind, debouncedQuery, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setResultsByKind((current) => ({ ...current, [activeKind]: items }));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Não foi possível buscar agora.");
          setResultsByKind((current) => ({ ...current, [activeKind]: [] }));
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
  }, [activeKind, debouncedQuery]);

  const watchedForKind = useMemo(
    () => watched.items.filter((item) => item.type === activeKind),
    [watched.items, activeKind],
  );

  async function markMediaWatched(
    media: SearchMediaResult | SearchMediaDetails,
  ) {
    await MediaHistoryService.markAsWatched(MediaSearchService.toMedia(media));
    await watched.refresh();
  }

  async function dislikeMedia(mediaId: number) {
    await addMediaInteraction({
      mediaId,
      type: activeKind,
      action: "DISLIKED",
      date: new Date().toISOString(),
    });
  }

  async function openDetails(mediaId: number) {
    try {
      const full = await MediaSearchService.getDetails(activeKind, mediaId);
      setDetails(full);
      setDetailsOpen(true);
    } catch {
      setError("Não foi possível carregar os detalhes.");
    }
  }

  const selectedWatched = details
    ? watchedForKind.find((item) => item.id === details.id)
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
          Pesquisar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Busque filmes, séries e animes. Marque como assistidos e dê suas notas
          — tudo salvo localmente.
        </p>
      </motion.header>

      <div
        className="mb-4 inline-flex rounded-xl border border-border/80 bg-secondary/40 p-1"
        role="tablist"
        aria-label="Tipo de conteúdo"
      >
        {KIND_TABS.map((kind) => {
          const active = activeKind === kind;

          return (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setActiveKind(kind);
                setError(null);
                setHistoryQuery("");
                setMinRating(null);
                setGenreFilter("");
              }}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {kind === "movie"
                ? "Filmes"
                : kind === "series"
                  ? "Séries"
                  : "Animes"}
            </button>
          );
        })}
      </div>

      <MediaSearchBar
        kind={activeKind}
        value={query}
        onChange={(value) => {
          setQueries((current) => ({ ...current, [activeKind]: value }));
        }}
        loading={loading}
      />

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
              Nenhum {getContentTypeLabel(activeKind).toLowerCase()} encontrado
              para “{debouncedQuery}”.
            </p>
          ) : null}

          {results.map((media) => {
            const item = watchedForKind.find(
              (watchedItem) => watchedItem.id === media.id,
            );

            return (
              <MediaResultCard
                key={`${media.type}:${String(media.id)}`}
                media={media}
                isWatched={Boolean(item)}
                userRating={item?.userRating ?? null}
                {...(item?.watchedAt ? { watchedAt: item.watchedAt } : {})}
                onOpenDetails={() => {
                  void openDetails(media.id);
                }}
                onMarkWatched={() => {
                  void markMediaWatched(media);
                }}
                onDislike={() => {
                  void dislikeMedia(media.id);
                }}
              />
            );
          })}
        </section>

        <WatchedMediaList
          items={watched.items}
          contentType={activeKind}
          query={historyQuery}
          minRating={minRating}
          genreFilter={genreFilter}
          onQueryChange={setHistoryQuery}
          onMinRatingChange={setMinRating}
          onGenreFilterChange={setGenreFilter}
        />
      </div>

      <MediaDetailsModal
        open={detailsOpen}
        media={details}
        isWatched={Boolean(selectedWatched)}
        userRating={selectedWatched?.userRating ?? null}
        onClose={() => {
          setDetailsOpen(false);
        }}
        onMarkWatched={() => {
          if (details) {
            void markMediaWatched(details);
          }
        }}
        onRate={(rating: UserRating) => {
          if (!details) {
            return;
          }

          void MediaHistoryService.updateRating(
            details.type,
            details.id,
            rating,
          ).then(() => watched.refresh());
        }}
        onClearRating={() => {
          if (!details) {
            return;
          }

          void MediaHistoryService.removeRating(details.type, details.id).then(
            () => watched.refresh(),
          );
        }}
        onDislike={() => {
          if (details) {
            void dislikeMedia(details.id);
            setDetailsOpen(false);
          }
        }}
      />
    </main>
  );
}

export { MediaSearchPage as MovieSearchPage };
