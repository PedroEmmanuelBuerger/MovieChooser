import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUserRating, isValidUserRating, type UserRating } from "@/types/watched";

interface RatingComponentProps {
  value: UserRating | null;
  onChange: (rating: UserRating) => void;
  onClear?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

const RATING_STEPS: UserRating[] = Array.from({ length: 21 }, (_, index) =>
  index / 2,
);

export function RatingComponent({
  value,
  onChange,
  onClear,
  disabled = false,
  size = "md",
}: RatingComponentProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Sua nota de 0 a 10">
      <div className="flex flex-wrap gap-1.5">
        {RATING_STEPS.map((rating) => {
          const selected = value === rating;
          const label = formatUserRating(rating);

          return (
            <motion.button
              key={label}
              type="button"
              disabled={disabled}
              {...(reduceMotion || disabled
                ? {}
                : { whileTap: { scale: 0.92 } })}
              onClick={() => {
                if (isValidUserRating(rating)) {
                  onChange(rating);
                }
              }}
              className={cn(
                "rounded-md border font-display font-semibold tabular-nums transition-colors",
                size === "sm" ? "min-w-8 px-1.5 py-1 text-[11px]" : "min-w-9 px-1.5 py-1.5 text-xs",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-50",
              )}
              aria-pressed={selected}
              aria-label={`Nota ${label}`}
            >
              {label}
            </motion.button>
          );
        })}
      </div>

      {onClear && value !== null ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="self-start px-2 text-muted-foreground"
          onClick={onClear}
        >
          Remover nota
        </Button>
      ) : null}
    </div>
  );
}
