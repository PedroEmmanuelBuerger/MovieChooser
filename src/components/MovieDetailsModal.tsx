import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { RatingComponent } from "@/components/RatingComponent";
import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "@/lib/motion";
import type { SearchMovieDetails } from "@/types/movie-search";
import type { UserRating } from "@/types/watched";

interface MovieDetailsModalProps {
  open: boolean;
  movie: SearchMovieDetails | null;
  isWatched: boolean;
  userRating: UserRating | null;
  onClose: () => void;
  onMarkWatched: () => void;
  onRate: (rating: UserRating) => void;
  onClearRating: () => void;
  onDislike: () => void;
}

export function MovieDetailsModal({
  open,
  movie,
  isWatched,
  userRating,
  onClose,
  onMarkWatched,
  onRate,
  onClearRating,
  onDislike,
}: MovieDetailsModalProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && movie ? (
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
            aria-label={movie.title}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold">{movie.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {movie.year}
                  {movie.runtime ? ` · ${String(movie.runtime)} min` : ""}
                </p>
                {movie.originalTitle && movie.originalTitle !== movie.title ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {movie.originalTitle}
                  </p>
                ) : null}
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={onClose}>
                <X aria-hidden />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              {movie.poster ? (
                <img
                  src={movie.poster}
                  alt=""
                  className="w-full rounded-lg object-cover"
                />
              ) : null}
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {movie.description.trim() || "Sem descrição."}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Gêneros: {movie.genreNames.join(", ") || "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Direção:{" "}
                  {movie.directors.map((person) => person.name).join(", ") ||
                    "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Elenco:{" "}
                  {movie.cast.map((person) => person.name).join(", ") || "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nota TMDB: {movie.ratingTmdb.toFixed(1)}
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
