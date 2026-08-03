import { motion } from "framer-motion";
import { Check, Film, type LucideIcon, TvMinimalPlay } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentTypeId, ContentTypeOption } from "@/types/content-type";

const CONTENT_TYPE_ICONS: Record<ContentTypeId, LucideIcon> = {
  movie: Film,
  series: TvMinimalPlay,
};

interface TypeCardProps {
  option: ContentTypeOption;
  selected: boolean;
  onSelect: (option: ContentTypeOption) => void;
}

export function TypeCard({ option, selected, onSelect }: TypeCardProps) {
  const Icon = CONTENT_TYPE_ICONS[option.id];

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        onSelect(option);
      }}
      className={cn(
        "group relative flex w-full flex-col items-start gap-5 overflow-hidden rounded-2xl border p-6 text-left transition-colors",
        selected
          ? "border-primary bg-card shadow-[0_0_0_2px_var(--primary),0_18px_40px_-24px_var(--primary)]"
          : "border-border/80 bg-card/60 hover:border-border hover:bg-card",
      )}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.58_0.23_27_/_0.16),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative flex w-full items-start justify-between">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="size-6" strokeWidth={1.75} aria-hidden />
        </div>

        <motion.span
          aria-hidden
          className={cn(
            "flex size-7 items-center justify-center rounded-full border",
            selected
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border/70 bg-transparent text-transparent",
          )}
          animate={{ scale: selected ? 1 : 0.85, opacity: selected ? 1 : 0.4 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <Check className="size-4" strokeWidth={2.5} />
        </motion.span>
      </div>

      <div className="relative space-y-1">
        <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {option.name}
        </p>
        <p className="text-sm text-muted-foreground">{option.description}</p>
      </div>
    </motion.button>
  );
}
