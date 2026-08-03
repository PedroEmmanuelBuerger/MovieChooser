import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useRecommendation } from "@/hooks/useRecommendation";
import type { ContentTypeOption } from "@/types/content-type";
import type { StreamingPlatform } from "@/types/platform";

interface RecommendationScreenProps {
  platform: StreamingPlatform;
  contentType: ContentTypeOption;
  onBack: () => void;
}

export function RecommendationScreen({
  platform,
  contentType,
  onBack,
}: RecommendationScreenProps) {
  const { loading, error, result, fetchRecommendation } = useRecommendation();
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;
    void fetchRecommendation({
      platform,
      type: contentType,
    });
  }, [contentType, fetchRecommendation, platform]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-14">
      <BackButton onClick={onBack} />

      <motion.header
        className="mb-8 max-w-2xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Sua recomendação
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Pronto para assistir
        </h1>
      </motion.header>

      <RecommendationCard
        recommendation={result}
        platformName={platform.name}
        typeName={contentType.name}
        loading={loading}
        error={error}
        onShuffle={() => {
          void fetchRecommendation({
            platform,
            type: contentType,
            ...(result ? { excludeIds: [result.id] } : {}),
          });
        }}
      />
    </main>
  );
}
