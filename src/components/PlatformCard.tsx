import { SelectionCard } from "@/components/SelectionCard";
import { PLATFORM_ICONS } from "@/data/platform-icons";
import type { StreamingPlatform } from "@/types/platform";

interface PlatformCardProps {
  platform: StreamingPlatform;
  selected: boolean;
  onSelect: (platform: StreamingPlatform) => void;
}

export function PlatformCard({
  platform,
  selected,
  onSelect,
}: PlatformCardProps) {
  return (
    <SelectionCard
      title={platform.name}
      description={selected ? "Selecionado" : "Toque para selecionar"}
      selected={selected}
      icon={PLATFORM_ICONS[platform.id]}
      accentColor={platform.accent}
      accentSoft={platform.accentSoft}
      onSelect={() => {
        onSelect(platform);
      }}
    />
  );
}
