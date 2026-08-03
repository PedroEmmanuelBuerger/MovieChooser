import { motion, useReducedMotion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { TypeCard } from "@/components/TypeCard";
import { CONTENT_TYPE_OPTIONS } from "@/data/content-types";
import { EASE_OUT_EXPO, listItemVariants, listVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ContentTypeOption } from "@/types/content-type";
import type { StreamingPlatform } from "@/types/platform";

interface TypeSelectorProps {
  selectedPlatform: StreamingPlatform;
  selectedType: ContentTypeOption | null;
  onSelect: (option: ContentTypeOption) => void;
  onBack: () => void;
}

function getContentTypesForPlatform(
  platform: StreamingPlatform,
): readonly ContentTypeOption[] {
  if (platform.id === "crunchyroll") {
    return CONTENT_TYPE_OPTIONS.filter((option) => option.id !== "series");
  }

  return CONTENT_TYPE_OPTIONS;
}

export function TypeSelector({
  selectedPlatform,
  selectedType,
  onSelect,
  onBack,
}: TypeSelectorProps) {
  const reduceMotion = useReducedMotion();
  const options = getContentTypesForPlatform(selectedPlatform);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-14">
      <BackButton onClick={onBack} />

      <motion.header
        className="mb-10 max-w-2xl"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      >
        <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {selectedPlatform.name}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          O que você quer assistir?
        </h1>
        <p className="mt-3 max-w-lg text-base text-muted-foreground sm:text-lg">
          {selectedPlatform.id === "crunchyroll"
            ? "Na Crunchyroll, escolha entre filme ou anime."
            : "Escolha o tipo de conteúdo para receber uma recomendação sob medida."}
        </p>
      </motion.header>

      <motion.div
        className={cn(
          "grid grid-cols-1 gap-4",
          options.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        {...(reduceMotion ? {} : { variants: listVariants })}
      >
        {options.map((option) => (
          <motion.div
            key={option.id}
            {...(reduceMotion ? {} : { variants: listItemVariants })}
          >
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
