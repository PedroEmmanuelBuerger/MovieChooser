import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { RecommendationCard } from "@/components/RecommendationCard";
import { WatchedSuccessToast } from "@/components/WatchedSuccessToast";
import { useLibrary } from "@/hooks/useLibrary";
import { useRecommendation } from "@/hooks/useRecommendation";
import { EASE_OUT_EXPO } from "@/lib/motion";
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
  const { recordRecommendation } = history;
  const { loading, error, result, isSurpriseMode, shuffle, retry } =
    useRecommendation({
      platform,
      contentType,
      selectedGenre,
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
        markingWatched={markingWatched}
        loading={loading}
        error={error}
        onShuffle={() => {
          void shuffle();
        }}
        onRetry={() => {
          void retry();
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
        }}
        onClose={() => {
          setToastOpen(false);
        }}
      />
    </main>
  );
}
