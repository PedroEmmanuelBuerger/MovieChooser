import { motion, useReducedMotion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { PlatformCard } from "@/components/PlatformCard";
import { STREAMING_PLATFORMS } from "@/data/platforms";
import { EASE_OUT_EXPO, listItemVariants, listVariants } from "@/lib/motion";
import type { StreamingPlatform } from "@/types/platform";

interface PlatformSelectorProps {
  selectedPlatform: StreamingPlatform | null;
  onSelect: (platform: StreamingPlatform) => void;
  onBack: () => void;
}

export function PlatformSelector({
  selectedPlatform,
  onSelect,
  onBack,
}: PlatformSelectorProps) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-14">
      <BackButton onClick={onBack} />

      <motion.header
        className="mb-10 max-w-2xl"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      >
        <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          MovieChooser
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Escolha sua plataforma
        </h1>
        <p className="mt-3 max-w-lg text-base text-muted-foreground sm:text-lg">
          Selecione onde você assiste. Vamos usar isso para encontrar algo
          especial para a sua próxima sessão.
        </p>
      </motion.header>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        {...(reduceMotion ? {} : { variants: listVariants })}
      >
        {STREAMING_PLATFORMS.map((platform) => (
          <motion.div
            key={platform.id}
            {...(reduceMotion ? {} : { variants: listItemVariants })}
          >
            <PlatformCard
              platform={platform}
              selected={selectedPlatform?.id === platform.id}
              onSelect={onSelect}
            />
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}
