import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { RatingComponent } from "@/components/RatingComponent";
import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { getContentTypeLabel } from "@/types/content-type";
import type { SearchMediaDetails } from "@/types/media-search";
import type { UserRating } from "@/types/watched";

interface MediaDetailsModalProps {
  open: boolean;
  media: SearchMediaDetails | null;
  isWatched: boolean;
  userRating: UserRating | null;
  onClose: () => void;
  onMarkWatched: () => void;
  onRate: (rating: UserRating) => void;
  onClearRating: () => void;
  onDislike: () => void;
}

export function MediaDetailsModal({
  open,
  media,
  isWatched,
  userRating,
  onClose,
  onMarkWatched,
  onRate,
  onClearRating,
  onDislike,
}: MediaDetailsModalProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && media ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          {...(reduceMotion ? {} : { exit: { opacity: 0 } })}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 shadow-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            role="dialog"
            aria-modal
            aria-label={media.title}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {getContentTypeLabel(media.type)}
                </p>
                <h2 className="font-display text-2xl font-bold">{media.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {media.year}
                  {media.type === "movie" && media.runtime
                    ? ` · ${String(media.runtime)} min`
                    : ""}
                  {media.seasons
                    ? ` · ${String(media.seasons)} temporada${media.seasons === 1 ? "" : "s"}`
                    : ""}
                  {media.episodes
                    ? ` · ${String(media.episodes)} episódio${media.episodes === 1 ? "" : "s"}`
                    : ""}
                </p>
                {media.originalTitle && media.originalTitle !== media.title ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {media.originalTitle}
                  </p>
                ) : null}
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={onClose}>
                <X aria-hidden />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              {media.poster ? (
                <img
                  src={media.poster}
                  alt=""
                  className="w-full rounded-lg object-cover"
                />
              ) : null}
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {media.description.trim() || "Sem descrição."}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Gêneros: {media.genreNames.join(", ") || "—"}
                </p>
                {media.studio ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Estúdio: {media.studio}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  Direção:{" "}
                  {media.directors.map((person) => person.name).join(", ") ||
                    "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Elenco:{" "}
                  {media.cast.map((person) => person.name).join(", ") || "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nota TMDB: {media.ratingTmdb.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {!isWatched ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={onMarkWatched}>
                    Marcar como assistido
                  </Button>
                  <Button type="button" variant="outline" onClick={onDislike}>
                    Não tenho interesse
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Sua nota (0 a 10, com meias)
                  </p>
                  <RatingComponent
                    value={userRating}
                    onChange={onRate}
                    onClear={onClearRating}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
