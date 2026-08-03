import { motion } from "framer-motion";
import { TypeCard } from "@/components/TypeCard";
import { CONTENT_TYPE_OPTIONS } from "@/data/content-types";
import type { ContentTypeOption } from "@/types/content-type";
import type { StreamingPlatform } from "@/types/platform";

interface TypeSelectorProps {
  selectedPlatform: StreamingPlatform;
  selectedType: ContentTypeOption | null;
  onSelect: (option: ContentTypeOption) => void;
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
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

export function TypeSelector({
  selectedPlatform,
  selectedType,
  onSelect,
}: TypeSelectorProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-14">
      <motion.header
        className="mb-10 max-w-2xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {selectedPlatform.name}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          O que você quer assistir?
        </h1>
        <p className="mt-3 max-w-lg text-base text-muted-foreground sm:text-lg">
          Escolha o tipo de conteúdo para receber uma recomendação sob medida.
        </p>
      </motion.header>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        variants={listVariants}
        initial="hidden"
        animate="visible"
      >
        {CONTENT_TYPE_OPTIONS.map((option) => (
          <motion.div key={option.id} variants={itemVariants}>
            <TypeCard
              option={option}
              selected={selectedType?.id === option.id}
              onSelect={onSelect}
            />
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}
