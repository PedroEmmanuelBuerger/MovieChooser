import { Film, type LucideIcon, TvMinimalPlay } from "lucide-react";
import { SelectionCard } from "@/components/SelectionCard";
import type { ContentTypeId, ContentTypeOption } from "@/types/content-type";

const CONTENT_TYPE_ICONS: Record<ContentTypeId, LucideIcon> = {
  movie: Film,
  series: TvMinimalPlay,
};

interface TypeCardProps {
  option: ContentTypeOption;
  selected: boolean;
  onSelect: (option: ContentTypeOption) => void;
}

export function TypeCard({ option, selected, onSelect }: TypeCardProps) {
  return (
    <SelectionCard
      title={option.name}
      description={option.description}
      selected={selected}
      icon={CONTENT_TYPE_ICONS[option.id]}
      titleClassName="text-2xl"
      onSelect={() => {
        onSelect(option);
      }}
    />
  );
}
