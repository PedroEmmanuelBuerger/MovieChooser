import { Search } from "lucide-react";

interface MovieSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export function MovieSearchBar({
  value,
  onChange,
  loading = false,
}: MovieSearchBarProps) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">Pesquisar filmes</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder="Digite o nome do filme..."
        className="h-12 w-full rounded-xl border border-border/80 bg-card/80 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
      />
      {loading ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          Buscando...
        </span>
      ) : null}
    </label>
  );
}
