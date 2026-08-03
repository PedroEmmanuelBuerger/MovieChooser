import { motion, useReducedMotion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useRecommendation } from "@/hooks/useRecommendation";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { isSurpriseGenre, type GenreSelection } from "@/types/genre";
import type { ContentTypeOption } from "@/types/content-type";
import type { StreamingPlatform } from "@/types/platform";

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
  const { loading, error, result, isSurpriseMode, shuffle, retry } =
    useRecommendation({
      platform,
      contentType,
      selectedGenre,
    });

  const headerTitle =
    loading && !result
      ? "Buscando sua recomendação"
      : result
        ? "Pronto para assistir"
        : "Não encontramos um título";

  const genreName = isSurpriseGenre(selectedGenre)
    ? "Surpresa"
    : selectedGenre.name;

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
        loading={loading}
        error={error}
        onShuffle={() => {
          void shuffle();
        }}
        onRetry={() => {
          void retry();
        }}
        onChangeFilters={onBack}
      />
    </main>
  );
}
