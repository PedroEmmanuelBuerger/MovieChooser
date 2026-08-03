import { Search } from "lucide-react";
import type { MediaKind } from "@/types/content-type";
import { getContentTypeLabel } from "@/types/content-type";

interface MediaSearchBarProps {
  kind: MediaKind;
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
}

export function MediaSearchBar({
  kind,
  value,
  onChange,
  loading = false,
}: MediaSearchBarProps) {
  const label = getContentTypeLabel(kind).toLowerCase();

  return (
    <label className="relative block w-full">
      <span className="sr-only">Pesquisar {label}</span>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={`Digite o nome do ${label}...`}
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
