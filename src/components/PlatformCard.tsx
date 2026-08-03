import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PLATFORM_ICONS } from "@/data/platform-icons";
import { cn } from "@/lib/utils";
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
  const Icon = PLATFORM_ICONS[platform.id];

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        onSelect(platform);
      }}
      className={cn(
        "group relative flex w-full flex-col items-start gap-5 overflow-hidden rounded-2xl border p-5 text-left transition-colors",
        selected
          ? "border-transparent bg-card"
          : "border-border/80 bg-card/60 hover:border-border hover:bg-card",
      )}
      style={{
        boxShadow: selected
          ? `0 0 0 2px ${platform.accent}, 0 18px 40px -24px ${platform.accent}`
          : undefined,
      }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at top right, ${platform.accentSoft}, transparent 55%)`,
        }}
      />

      <div className="relative flex w-full items-start justify-between">
        <div
          className="flex size-12 items-center justify-center rounded-xl"
          style={{
            backgroundColor: platform.accentSoft,
            color: platform.accent,
          }}
        >
          <Icon className="size-6" strokeWidth={1.75} aria-hidden />
        </div>

        <motion.span
          aria-hidden
          className={cn(
            "flex size-7 items-center justify-center rounded-full border",
            selected
              ? "border-transparent text-primary-foreground"
              : "border-border/70 bg-transparent text-transparent",
          )}
          style={
            selected ? { backgroundColor: platform.accent } : {}
          }
          animate={{ scale: selected ? 1 : 0.85, opacity: selected ? 1 : 0.4 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <Check className="size-4" strokeWidth={2.5} />
        </motion.span>
      </div>

      <div className="relative space-y-1">
        <p className="font-display text-xl font-semibold tracking-tight text-foreground">
          {platform.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {selected ? "Selected" : "Tap to select"}
        </p>
      </div>
    </motion.button>
  );
}
