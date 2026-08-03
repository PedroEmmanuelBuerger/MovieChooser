import { motion, useReducedMotion } from "framer-motion";
import { Clapperboard, Sparkles, Tv } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { HistoryTab } from "@/types/history";

interface ContentTypeTabsProps {
  value: HistoryTab;
  onChange: (tab: HistoryTab) => void;
  movieCount?: number;
  seriesCount?: number;
  animeCount?: number;
}

export function ContentTypeTabs({
  value,
  onChange,
  movieCount,
  seriesCount,
  animeCount,
}: ContentTypeTabsProps) {
  const reduceMotion = useReducedMotion();

  const tabs: {
    id: HistoryTab;
    label: string;
    icon: typeof Clapperboard;
    count?: number;
  }[] = [
    {
      id: "movie",
      label: "Filmes",
      icon: Clapperboard,
      ...(movieCount !== undefined ? { count: movieCount } : {}),
    },
    {
      id: "series",
      label: "Séries",
      icon: Tv,
      ...(seriesCount !== undefined ? { count: seriesCount } : {}),
    },
    {
      id: "anime",
      label: "Animes",
      icon: Sparkles,
      ...(animeCount !== undefined ? { count: animeCount } : {}),
    },
  ];

  return (
    <div
      className="relative inline-flex flex-wrap rounded-xl border border-border/80 bg-secondary/40 p-1"
      role="tablist"
      aria-label="Filtrar por tipo"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = value === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              onChange(tab.id);
            }}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && !reduceMotion ? (
              <motion.span
                layoutId="content-type-tab"
                className="absolute inset-0 rounded-lg bg-card shadow-sm"
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              />
            ) : null}
            {active && reduceMotion ? (
              <span className="absolute inset-0 rounded-lg bg-card shadow-sm" />
            ) : null}
            <Icon className="relative size-4" aria-hidden />
            <span className="relative">{tab.label}</span>
            {tab.count !== undefined ? (
              <span className="relative rounded-md bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
