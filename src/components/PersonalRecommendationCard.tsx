import { motion, useReducedMotion } from "framer-motion";
import { ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listItemVariants } from "@/lib/motion";
import type { ScoredRecommendation } from "@/types/preferences";

interface RecommendationCardProps {
  item: ScoredRecommendation;
  onDislike: () => void;
  onOpen: () => void;
}

export function PersonalRecommendationCard({
  item,
  onDislike,
  onOpen,
}: RecommendationCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      variants={listItemVariants}
      layout={!reduceMotion}
      className="overflow-hidden rounded-xl border border-border/70 bg-card/70"
    >
      <button type="button" className="w-full text-left" onClick={onOpen}>
        <div className="aspect-[2/3] overflow-hidden bg-muted">
          <img
            src={item.poster}
            alt={`Poster de ${item.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="space-y-2 p-3">
          <h3 className="line-clamp-2 font-display text-base font-semibold">
            {item.title}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({item.year})
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            {item.genres.slice(0, 2).join(" · ") || "Filme"}
          </p>
          <p className="font-display text-2xl font-bold text-primary">
            {String(item.compatibility)}%
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {item.reason}
          </p>
        </div>
      </button>
      <div className="border-t border-border/60 p-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full"
          onClick={onDislike}
        >
          <ThumbsDown className="size-3.5" aria-hidden />
          Não tenho interesse
        </Button>
      </div>
    </motion.article>
  );
}
