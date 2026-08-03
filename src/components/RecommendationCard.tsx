import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw, Star } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { RecommendationResult } from "@/types/recommendation";

interface RecommendationCardProps {
  recommendation: RecommendationResult | null;
  platformName: string;
  typeName: string;
  loading: boolean;
  error: string | null;
  onShuffle: () => void;
}

const cardMotion = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

function formatRating(rating: number): string {
  return rating.toFixed(1);
}

function RecommendationCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/80 bg-card/80">
      <div className="grid gap-0 md:grid-cols-[240px_1fr]">
        <Skeleton className="aspect-[2/3] w-full rounded-none md:min-h-[360px]" />
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
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
  loading,
  error,
  onShuffle,
}: RecommendationCardProps) {
  const showSkeleton = loading && !recommendation;

  return (
    <div className="w-full max-w-4xl">
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <motion.div key="recommendation-skeleton" {...cardMotion}>
            <RecommendationCardSkeleton />
          </motion.div>
        ) : recommendation ? (
          <motion.div key={recommendation.id} {...cardMotion}>
            <Card className="overflow-hidden border-border/80 bg-card/90 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)]">
              <div className="grid gap-0 md:grid-cols-[240px_1fr]">
                <div className="relative aspect-[2/3] overflow-hidden bg-muted md:aspect-auto md:min-h-[360px]">
                  <img
                    src={recommendation.poster}
                    alt={`Poster de ${recommendation.title}`}
                    className="h-full w-full object-cover"
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
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-5">
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
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
                      <p className="text-sm text-destructive" role="alert">
                        {error}
                      </p>
                    ) : null}

                    <Button
                      type="button"
                      size="lg"
                      className={cn("w-full")}
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
                  </CardFooter>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="recommendation-empty" {...cardMotion}>
            <Card className="border-border/80 bg-card/80 p-8 text-center">
              <CardHeader>
                <CardTitle>Nenhuma recomendação</CardTitle>
                <CardDescription>
                  {error ??
                    "Não foi possível encontrar um título com os filtros escolhidos."}
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-center">
                <Button
                  type="button"
                  size="lg"
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
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
