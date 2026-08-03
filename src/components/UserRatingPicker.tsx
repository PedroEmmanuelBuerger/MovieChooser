import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isValidUserRating, type UserRating } from "@/types/watched";

interface UserRatingPickerProps {
  value: UserRating | null;
  onChange: (rating: UserRating) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function UserRatingPicker({
  value,
  onChange,
  disabled = false,
  size = "md",
}: UserRatingPickerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex flex-col gap-2"
      role="group"
      aria-label="Sua nota de 1 a 10"
    >
      <div className="flex flex-wrap gap-1.5">
        {RATINGS.map((rating) => {
          const selected = value === rating;

          return (
            <motion.button
              key={rating}
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
                size === "sm" ? "size-8 text-xs" : "size-9 text-sm",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-50",
              )}
              aria-pressed={selected}
              aria-label={`Nota ${String(rating)}`}
            >
              {rating}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
