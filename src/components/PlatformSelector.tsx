import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { PlatformCard } from "@/components/PlatformCard";
import { STREAMING_PLATFORMS } from "@/data/platforms";
import type { StreamingPlatform } from "@/types/platform";

interface PlatformSelectorProps {
  selectedPlatform: StreamingPlatform | null;
  onSelect: (platform: StreamingPlatform) => void;
  onBack: () => void;
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function PlatformSelector({
  selectedPlatform,
  onSelect,
  onBack,
}: PlatformSelectorProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-14">
      <BackButton onClick={onBack} />

      <motion.header
        className="mb-10 max-w-2xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          MovieChooser
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Choose your platform
        </h1>
        <p className="mt-3 max-w-lg text-base text-muted-foreground sm:text-lg">
          Pick where you watch. We will use this to find something worth your
          next night in.
        </p>
      </motion.header>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={listVariants}
        initial="hidden"
        animate="visible"
      >
        {STREAMING_PLATFORMS.map((platform) => (
          <motion.div key={platform.id} variants={itemVariants}>
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
