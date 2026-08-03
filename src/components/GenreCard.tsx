import { SelectionCard } from "@/components/SelectionCard";
import { GENRE_ICONS } from "@/data/genre-icons";
import type { GenreOption } from "@/types/genre";

interface GenreCardProps {
  genre: GenreOption;
  selected: boolean;
  onSelect: (genre: GenreOption) => void;
}

export function GenreCard({ genre, selected, onSelect }: GenreCardProps) {
  return (
    <SelectionCard
      title={genre.name}
      description={selected ? "Selecionado" : "Toque para selecionar"}
      selected={selected}
      icon={GENRE_ICONS[genre.id]}
      onSelect={() => {
        onSelect(genre);
      }}
    />
  );
}
