import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { RecommendationResult } from "@/types/recommendation";

interface RecommendationCardProps {
  recommendation: RecommendationResult | null;
  platformName: string;
  typeName: string;
  genreName: string;
  isSurpriseMode: boolean;
  isWatched: boolean;
  isAllWatched: boolean;
  markingWatched: boolean;
  loading: boolean;
  error: string | null;
  onShuffle: () => void;
  onRetry: () => void;
  onSearchMore: () => void;
  onAllowWatched: () => void;
  onChangeFilters: () => void;
  onMarkWatched: () => void;
}

const cardMotion = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
  transition: { duration: 0.4, ease: EASE_OUT_EXPO },
};

function formatRating(rating: number): string {
  return rating.toFixed(1);
}

function RecommendationCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/80 bg-card/80" aria-busy>
      <div className="grid gap-0 md:grid-cols-[240px_1fr]">
        <Skeleton className="aspect-[2/3] w-full rounded-none md:min-h-[360px]" />
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-auto h-6 w-16" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </Card>
  );
}

export function RecommendationCard({
  recommendation,
  platformName,
  typeName,
  genreName,
  isSurpriseMode,
  isWatched,
  isAllWatched,
  markingWatched,
  loading,
  error,
  onShuffle,
  onRetry,
  onSearchMore,
  onAllowWatched,
  onChangeFilters,
  onMarkWatched,
}: RecommendationCardProps) {
  const reduceMotion = useReducedMotion();
  const showSkeleton = loading && !recommendation;
  const motionProps = reduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : cardMotion;

  return (
    <div className="w-full max-w-4xl">
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <motion.div key="recommendation-skeleton" {...motionProps}>
            <RecommendationCardSkeleton />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Buscando uma recomendação para você...
            </p>
          </motion.div>
        ) : recommendation ? (
          <motion.div key={recommendation.id} {...motionProps}>
            <Card
              className="relative overflow-hidden border-border/80 bg-card/90 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)]"
              aria-busy={loading}
            >
              {loading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
                  <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Sorteando outro título...
                  </div>
                </div>
              ) : null}

              <div className="grid gap-0 md:grid-cols-[240px_1fr]">
                <div className="relative aspect-[2/3] overflow-hidden bg-muted md:aspect-auto md:min-h-[360px]">
                  <img
                    src={recommendation.poster}
                    alt={`Poster de ${recommendation.title}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-card/40" />
                </div>

                <div className="flex flex-col">
                  <CardHeader className="gap-3">
                    <CardTitle className="text-3xl leading-tight sm:text-4xl">
                      {recommendation.title}
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {platformName}
                      </span>
                      <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {typeName}
                      </span>
                      {isSurpriseMode || recommendation.isSurpriseMode ? (
                        <span className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                          Surpresa
                        </span>
                      ) : (
                        <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          {genreName}
                        </span>
                      )}
                      {isWatched ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          <CheckCircle2 className="size-3.5" aria-hidden />
                          Assistido
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-5">
                    <CardDescription className="line-clamp-6 text-base leading-relaxed text-muted-foreground">
                      {recommendation.description.trim().length > 0
                        ? recommendation.description
                        : "Sem descrição disponível para este título."}
                    </CardDescription>

                    <div className="mt-auto flex items-center gap-2 text-foreground">
                      <Star
                        className="size-5 fill-primary text-primary"
                        aria-hidden
                      />
                      <span className="font-display text-2xl font-semibold tabular-nums">
                        {formatRating(recommendation.rating)}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 10</span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex-col items-stretch gap-3">
                    {error ? (
                      <p
                        className="flex items-start gap-2 text-sm text-destructive"
                        role="alert"
                      >
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        {error}
                      </p>
                    ) : null}

                    <div className="flex w-full flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        size="lg"
                        className={cn("w-full flex-1")}
                        disabled={loading}
                        onClick={onShuffle}
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" aria-hidden />
                        ) : (
                          <RefreshCw aria-hidden />
                        )}
                        Sortear novamente
                      </Button>

                      {isWatched ? (
                        <Button
                          type="button"
                          size="lg"
                          variant="secondary"
                          className="w-full flex-1"
                          disabled
                        >
                          <CheckCircle2 aria-hidden />
                          Já assistido
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="lg"
                          variant="outline"
                          className="w-full flex-1"
                          disabled={loading || markingWatched}
                          onClick={onMarkWatched}
                        >
                          {markingWatched ? (
                            <Loader2 className="animate-spin" aria-hidden />
                          ) : (
                            <Check aria-hidden />
                          )}
                          Marcar como assistido
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="recommendation-empty" {...motionProps}>
            <Card className="border-border/80 bg-card/80 p-8 text-center">
              <CardHeader className="items-center">
                <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <AlertCircle className="size-6" aria-hidden />
                </div>
                <CardTitle>
                  {isAllWatched
                    ? "Todos os títulos já foram assistidos"
                    : "Nenhuma recomendação encontrada"}
                </CardTitle>
                <CardDescription className="max-w-md text-base">
                  {error ??
                    (isAllWatched
                      ? "Você já marcou todos os conteúdos encontrados como assistidos."
                      : "Não foi possível encontrar um título com os filtros escolhidos.")}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                {isAllWatched ? (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      disabled={loading}
                      onClick={onSearchMore}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" aria-hidden />
                      ) : (
                        <RefreshCw aria-hidden />
                      )}
                      Buscar mais opções
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      disabled={loading}
                      onClick={onAllowWatched}
                    >
                      Permitir conteúdos assistidos
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      disabled={loading}
                      onClick={onChangeFilters}
                    >
                      Mudar filtros
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      disabled={loading}
                      onClick={onRetry}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" aria-hidden />
                      ) : (
                        <RefreshCw aria-hidden />
                      )}
                      Tentar novamente
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      disabled={loading}
                      onClick={onChangeFilters}
                    >
                      Mudar filtros
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
