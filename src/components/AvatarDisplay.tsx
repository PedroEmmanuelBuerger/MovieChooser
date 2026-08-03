import { cn } from "@/lib/utils";
import {
  DEFAULT_AVATAR_OPTIONS,
  isDefaultAvatarId,
} from "@/types/profile";

interface AvatarDisplayProps {
  name: string;
  avatar?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASS = {
  sm: "size-10 text-sm",
  md: "size-14 text-lg",
  lg: "size-20 text-2xl",
  xl: "size-28 text-4xl",
} as const;

function resolveDefaultColor(avatar: string | undefined): string {
  if (avatar && isDefaultAvatarId(avatar)) {
    const option = DEFAULT_AVATAR_OPTIONS.find((item) => item.id === avatar);
    return option?.color ?? "#E50914";
  }

  return "#E50914";
}

export function AvatarDisplay({
  name,
  avatar,
  size = "md",
  className,
}: AvatarDisplayProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "M";
  const isCustomImage = Boolean(avatar && avatar.startsWith("data:"));

  if (isCustomImage && avatar) {
    return (
      <img
        src={avatar}
        alt={`Avatar de ${name}`}
        className={cn(
          "rounded-full object-cover ring-2 ring-border",
          SIZE_CLASS[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-display font-bold text-white ring-2 ring-border",
        SIZE_CLASS[size],
        className,
      )}
      style={{ backgroundColor: resolveDefaultColor(avatar) }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
