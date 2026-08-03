import { motion, useReducedMotion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import { springCheck, springSnappy } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SelectionCardProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  icon: LucideIcon;
  accentColor?: string;
  accentSoft?: string;
  titleClassName?: string;
}

export function SelectionCard({
  title,
  description,
  selected,
  onSelect,
  icon: Icon,
  accentColor,
  accentSoft,
  titleClassName,
}: SelectionCardProps) {
  const reduceMotion = useReducedMotion();
  const usesCustomAccent = Boolean(accentColor && accentSoft);

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full flex-col items-start gap-5 overflow-hidden rounded-2xl border p-5 text-left transition-colors",
        selected
          ? usesCustomAccent
            ? "border-transparent bg-card"
            : "border-primary bg-card shadow-[0_0_0_2px_var(--primary),0_18px_40px_-24px_var(--primary)]"
          : "border-border/80 bg-card/60 hover:border-border hover:bg-card",
      )}
      style={
        selected && accentColor
          ? {
              boxShadow: `0 0 0 2px ${accentColor}, 0 18px 40px -24px ${accentColor}`,
            }
          : {}
      }
      transition={springSnappy}
      {...(reduceMotion
        ? {}
        : {
            whileHover: { y: -6, scale: 1.02 },
            whileTap: { scale: 0.98 },
          })}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: accentSoft
            ? `radial-gradient(circle at top right, ${accentSoft}, transparent 55%)`
            : "radial-gradient(circle at top right, oklch(0.58 0.23 27 / 0.16), transparent 55%)",
        }}
      />

      <div className="relative flex w-full items-start justify-between">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl",
            !usesCustomAccent && "bg-primary/15 text-primary",
          )}
          style={
            usesCustomAccent
              ? {
                  backgroundColor: accentSoft,
                  color: accentColor,
                }
              : {}
          }
        >
          <Icon className="size-6" strokeWidth={1.75} aria-hidden />
        </div>

        <motion.span
          aria-hidden
          className={cn(
            "flex size-7 items-center justify-center rounded-full border",
            selected
              ? "border-transparent text-primary-foreground"
              : "border-border/70 bg-transparent text-transparent",
            selected && !usesCustomAccent && "bg-primary",
          )}
          style={
            selected && accentColor ? { backgroundColor: accentColor } : {}
          }
          animate={{ scale: selected ? 1 : 0.85, opacity: selected ? 1 : 0.4 }}
          transition={reduceMotion ? { duration: 0 } : springCheck}
        >
          <Check className="size-4" strokeWidth={2.5} />
        </motion.span>
      </div>

      <div className="relative space-y-1">
        <p
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            titleClassName ?? "text-xl",
          )}
        >
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </motion.button>
  );
}
