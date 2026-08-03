import { motion, useReducedMotion } from "framer-motion";
import { Check, Dices } from "lucide-react";
import { springCheck, springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { SurpriseGenreOption } from "@/types/genre";

interface SurpriseGenreCardProps {
  option: SurpriseGenreOption;
  selected: boolean;
  onSelect: (option: SurpriseGenreOption) => void;
}

export function SurpriseGenreCard({
  option,
  selected,
  onSelect,
}: SurpriseGenreCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        onSelect(option);
      }}
      className={cn(
        "surprise-card group relative flex w-full flex-col items-start gap-5 overflow-hidden rounded-2xl p-5 text-left",
        selected && "surprise-card--selected",
      )}
      transition={springSnappy}
      {...(reduceMotion
        ? {}
        : {
            whileHover: { y: -8, scale: 1.035 },
            whileTap: { scale: 0.97 },
            ...(selected
              ? { animate: { scale: [1, 1.03, 1] } }
              : { animate: { scale: 1 } }),
          })}
    >
      <div aria-hidden className="surprise-card__glow" />
      <div aria-hidden className="surprise-card__shimmer" />

      <div className="relative flex w-full items-start justify-between">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_24px_oklch(0.58_0.23_27_/_0.35)]">
          <Dices className="size-6" strokeWidth={1.75} aria-hidden />
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
          transition={reduceMotion ? { duration: 0 } : springCheck}
        >
          <Check className="size-4" strokeWidth={2.5} />
        </motion.span>
      </div>

      <div className="relative space-y-1">
        <p className="font-display text-xl font-semibold tracking-tight text-foreground">
          {option.name}
        </p>
        <p className="text-sm text-muted-foreground">
          Escolha qualquer gênero e deixe a sorte decidir.
        </p>
      </div>
    </motion.button>
  );
}
