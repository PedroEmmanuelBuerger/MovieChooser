import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { UserRatingPicker } from "@/components/UserRatingPicker";
import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "@/lib/motion";
import type { UserRating } from "@/types/watched";

interface WatchedSuccessToastProps {
  open: boolean;
  title: string;
  rating: UserRating | null;
  onRatingChange: (rating: UserRating) => void;
  onClose: () => void;
}

export function WatchedSuccessToast({
  open,
  title,
  rating,
  onRatingChange,
  onClose,
}: WatchedSuccessToastProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)] backdrop-blur-md"
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          {...(reduceMotion
            ? {}
            : { exit: { opacity: 0, y: 16, scale: 0.96 } })}
          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          role="status"
        >
          <div className="mb-3 flex items-start gap-3">
            <motion.div
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
              initial={reduceMotion ? false : { scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 18 }}
            >
              <CheckCircle2 className="size-5" aria-hidden />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-foreground">
                Movido para Assistidos
              </p>
              <p className="truncate text-sm text-muted-foreground">{title}</p>
            </div>
          </div>

          <p className="mb-2 text-xs text-muted-foreground">
            Dê sua nota (1 a 10)
          </p>
          <UserRatingPicker value={rating} onChange={onRatingChange} size="sm" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={onClose}
          >
            Fechar
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
