import { motion, useReducedMotion } from "framer-motion";
import { Check, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listItemVariants } from "@/lib/motion";
import type { HistoryItem } from "@/types/history";

interface HistoryCardProps {
  item: HistoryItem;
  isWatched: boolean;
  marking?: boolean;
  onMarkWatched: () => void;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function HistoryCard({
  item,
  isWatched,
  marking = false,
  onMarkWatched,
}: HistoryCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      layout={!reduceMotion}
      variants={listItemVariants}
      className="flex gap-4 overflow-hidden rounded-xl border border-border/70 bg-card/70 p-3 shadow-[0_16px_40px_-36px_rgba(0,0,0,0.9)]"
    >
      <div className="relative h-[132px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-muted">
        <img
          src={item.poster}
          alt={`Poster de ${item.title}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <h3 className="truncate font-display text-lg font-semibold text-foreground">
            {item.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground">
              {item.platform}
            </span>
            <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground">
              {item.type === "movie"
                ? "Filme"
                : item.type === "anime"
                  ? "Anime"
                  : "Série"}
            </span>
            {isWatched ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                <CheckCircle2 className="size-3" aria-hidden />
                Assistido
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{formatDate(item.recommendedAt)}</p>
            <p className="flex items-center gap-1 text-foreground">
              <Star className="size-3.5 fill-primary text-primary" aria-hidden />
              <span className="font-medium tabular-nums">
                {item.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">TMDB</span>
            </p>
          </div>

          {isWatched ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Já na biblioteca
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={marking}
              onClick={onMarkWatched}
            >
              <Check className="size-3.5" aria-hidden />
              Marcar como assistido
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
