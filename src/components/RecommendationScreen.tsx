import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { RecommendationCard } from "@/components/RecommendationCard";
import { WatchedSuccessToast } from "@/components/WatchedSuccessToast";
import { MOVIE_GENRES, TV_GENRES, ANIME_GENRES } from "@/data/genres";
import { useLibrary } from "@/hooks/useLibrary";
import { useRecommendation } from "@/hooks/useRecommendation";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import { EASE_OUT_EXPO } from "@/lib/motion";
import {
  addMediaInteraction,
  getDislikedMediaIds,
  getUserPreferences,
  rebuildPreferencesFromWatched,
} from "@/services/preferenceService";
import { isSurpriseGenre, type GenreSelection } from "@/types/genre";
import type { ContentTypeOption } from "@/types/content-type";
import type { StreamingPlatform } from "@/types/platform";
import type { UserRating } from "@/types/watched";

interface RecommendationScreenProps {
  platform: StreamingPlatform;
  contentType: ContentTypeOption;
  selectedGenre: GenreSelection;
  onBack: () => void;
}

export function RecommendationScreen({
  platform,
  contentType,
  selectedGenre,
  onBack,
}: RecommendationScreenProps) {
  const reduceMotion = useReducedMotion();
  const { history, watched } = useLibrary();
  const { settings } = useSettingsContext();
  const { recordRecommendation } = history;
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set());
  const [preferredGenreId, setPreferredGenreId] = useState<number | undefined>();

  const watchedIds = useMemo(() => {
    const ids = new Set<number>();

    for (const item of watched.items) {
      if (item.type === contentType.id) {
        ids.add(item.id);
      }
    }

    return ids;
  }, [watched.items, contentType.id]);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      const [disliked, preferences] = await Promise.all([
        getDislikedMediaIds(contentType.id),
        getUserPreferences(),
      ]);

      if (controller.signal.aborted) {
        return;
      }

      setDislikedIds(disliked);
      const favorite = preferences.favoriteGenres[0];
      const genreList =
        contentType.id === "movie"
          ? MOVIE_GENRES
          : contentType.id === "anime"
            ? ANIME_GENRES
            : TV_GENRES;
      const match = genreList.find((genre) => genre.name === favorite);
      setPreferredGenreId(match?.tmdbId);
    })();

    return () => {
      controller.abort();
    };
  }, [watched.items, contentType.id]);

  const {
    loading,
    error,
    result,
    isSurpriseMode,
    isAllWatched,
    shuffle,
    retry,
    searchMoreOptions,
    allowWatchedOnce,
  } = useRecommendation({
    platform,
    contentType,
    selectedGenre,
    excludeWatched: settings.excludeWatched,
    watchedIds,
    dislikedIds,
    ...(preferredGenreId === undefined ? {} : { preferredGenreId }),
    considerPreferences: settings.considerPreferences,
  });

  const recordedKeyRef = useRef<string | null>(null);
  const [markingWatched, setMarkingWatched] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastRating, setToastRating] = useState<UserRating | null>(null);
  const [toastTypeId, setToastTypeId] = useState<{
    type: typeof contentType.id;
    id: number;
  } | null>(null);

  const genreName = isSurpriseGenre(selectedGenre)
    ? "Surpresa"
    : selectedGenre.name;

  useEffect(() => {
    if (!result || loading) {
      return;
    }

    const key = `${result.type}:${String(result.id)}:${result.title}:${genreName}`;

    if (recordedKeyRef.current === key) {
      return;
    }

    recordedKeyRef.current = key;
    void recordRecommendation(result, platform, genreName);
  }, [result, loading, genreName, recordRecommendation, platform]);

  const headerTitle =
    loading && !result
      ? "Buscando sua recomendação"
      : result
        ? "Pronto para assistir"
        : isAllWatched
          ? "Tudo já assistido"
          : "Não encontramos um título";

  async function handleMarkWatched() {
    if (!result) {
      return;
    }

    setMarkingWatched(true);
    const markResult = await watched.markRecommendation({
      recommendation: result,
      platform,
      genreName,
    });

    await addMediaInteraction({
      mediaId: result.id,
      type: result.type,
      action: "WATCHED",
      date: new Date().toISOString(),
    });
    await rebuildPreferencesFromWatched(watched.items);

    setMarkingWatched(false);

    if (markResult.item) {
      setToastTitle(result.title);
      setToastRating(markResult.item.userRating);
      setToastTypeId({ type: result.type, id: result.id });
      setToastOpen(true);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-14">
      <BackButton onClick={onBack} />

      <motion.header
        className="mb-8 max-w-2xl"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      >
        <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Sua recomendação
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {headerTitle}
        </h1>
      </motion.header>

      <RecommendationCard
        recommendation={result}
        platformName={platform.name}
        typeName={contentType.name}
        genreName={genreName}
        isSurpriseMode={isSurpriseMode}
        isWatched={
          result ? watched.isWatched(result.type, result.id) : false
        }
        isAllWatched={isAllWatched}
        markingWatched={markingWatched}
        loading={loading}
        error={error}
        onShuffle={() => {
          void shuffle();
        }}
        onRetry={() => {
          void retry();
        }}
        onSearchMore={() => {
          void searchMoreOptions();
        }}
        onAllowWatched={() => {
          void allowWatchedOnce();
        }}
        onChangeFilters={onBack}
        onMarkWatched={() => {
          void handleMarkWatched();
        }}
      />

      <WatchedSuccessToast
        open={toastOpen}
        title={toastTitle}
        rating={toastRating}
        onRatingChange={(rating) => {
          if (!toastTypeId) {
            return;
          }

          setToastRating(rating);
          void watched.setUserRating(
            toastTypeId.type,
            toastTypeId.id,
            rating,
          );

          void addMediaInteraction({
            mediaId: toastTypeId.id,
            type: toastTypeId.type,
            action: "RATED",
            date: new Date().toISOString(),
            rating,
          });
        }}
        onClose={() => {
          setToastOpen(false);
        }}
      />
    </main>
  );
}
