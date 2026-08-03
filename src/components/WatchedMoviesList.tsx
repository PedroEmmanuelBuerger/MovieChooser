import { Star } from "lucide-react";
import { formatUserRating, type WatchedItem } from "@/types/watched";

interface WatchedMoviesListProps {
  items: readonly WatchedItem[];
  query: string;
  minRating: number | null;
  genreFilter: string;
  onQueryChange: (value: string) => void;
  onMinRatingChange: (value: number | null) => void;
  onGenreFilterChange: (value: string) => void;
}

export function WatchedMoviesList({
  items,
  query,
  minRating,
  genreFilter,
  onQueryChange,
  onMinRatingChange,
  onGenreFilterChange,
}: WatchedMoviesListProps) {
  const genres = Array.from(
    new Set(
      items.flatMap((item) =>
        item.genre
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const filtered = items
    .filter((item) => item.type === "movie")
    .filter((item) =>
      query.trim().length === 0
        ? true
        : item.title.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .filter((item) =>
      minRating === null ? true : (item.userRating ?? -1) >= minRating,
    )
    .filter((item) =>
      genreFilter.length === 0 ? true : item.genre.includes(genreFilter),
    )
    .sort(
      (a, b) =>
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime(),
    );

  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-4">
      <h2 className="font-display text-lg font-semibold">Meus Filmes</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          placeholder="Buscar no histórico"
          className="h-10 rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none ring-ring focus:ring-2"
        />
        <select
          value={minRating === null ? "" : String(minRating)}
          onChange={(event) => {
            onMinRatingChange(
              event.target.value === "" ? null : Number(event.target.value),
            );
          }}
          className="h-10 rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none"
        >
          <option value="">Nota mínima</option>
          {[0, 5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((value) => (
            <option key={value} value={value}>
              {formatUserRating(value)}+
            </option>
          ))}
        </select>
        <select
          value={genreFilter}
          onChange={(event) => {
            onGenreFilterChange(event.target.value);
          }}
          className="h-10 rounded-lg border border-border bg-secondary/40 px-3 text-sm outline-none"
        >
          <option value="">Todos os gêneros</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      <ul className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            Nenhum filme no histórico com esses filtros.
          </li>
        ) : (
          filtered.map((item) => (
            <li
              key={`${item.type}:${String(item.id)}`}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-2"
            >
              {item.poster ? (
                <img
                  src={item.poster}
                  alt=""
                  className="size-12 rounded object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                  —
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3 fill-primary text-primary" />
                    Minha nota: {formatUserRating(item.userRating)}
                  </span>
                  <span>
                    Assistido:{" "}
                    {new Intl.DateTimeFormat("pt-BR").format(
                      new Date(item.watchedAt),
                    )}
                  </span>
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
