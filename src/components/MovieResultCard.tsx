import { CheckCircle2, Star, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SearchMovieResult } from "@/types/movie-search";

interface MovieResultCardProps {
  movie: SearchMovieResult;
  isWatched: boolean;
  userRating: number | null;
  watchedAt?: string;
  onOpenDetails: () => void;
  onMarkWatched: () => void;
  onDislike: () => void;
}

export function MovieResultCard({
  movie,
  isWatched,
  userRating,
  watchedAt,
  onOpenDetails,
  onMarkWatched,
  onDislike,
}: MovieResultCardProps) {
  return (
    <article className="flex gap-4 rounded-xl border border-border/70 bg-card/70 p-3">
      <button type="button" onClick={onOpenDetails} className="shrink-0">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={`Poster de ${movie.title}`}
            className="h-[132px] w-[88px] rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-[132px] w-[88px] items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
            Sem poster
          </div>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button type="button" onClick={onOpenDetails} className="text-left">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {movie.title}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({movie.year})
            </span>
          </h3>
        </button>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {movie.genreNames.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px]"
            >
              {genre}
            </span>
          ))}
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {movie.overview.trim() || "Sem sinopse disponível."}
        </p>

        <p className="mt-2 flex items-center gap-1 text-sm">
          <Star className="size-3.5 fill-primary text-primary" aria-hidden />
          <span className="tabular-nums">{movie.ratingTmdb.toFixed(1)}</span>
          <span className="text-muted-foreground">TMDB</span>
        </p>

        {isWatched ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-primary">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Assistido
            </span>
            {userRating !== null ? (
              <span>Minha nota: {String(userRating)}</span>
            ) : null}
            {watchedAt ? (
              <span className="text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR").format(new Date(watchedAt))}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={onMarkWatched}>
              Marcar como assistido
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onDislike}>
              <ThumbsDown className="size-3.5" aria-hidden />
              Não tenho interesse
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
