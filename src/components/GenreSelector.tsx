import { motion, useReducedMotion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { GenreCard } from "@/components/GenreCard";
import { getGenresForContentType } from "@/data/genres";
import { EASE_OUT_EXPO, listItemVariants, listVariants } from "@/lib/motion";
import type { ContentTypeOption } from "@/types/content-type";
import type { GenreOption } from "@/types/genre";
import type { StreamingPlatform } from "@/types/platform";

interface GenreSelectorProps {
  selectedPlatform: StreamingPlatform;
  selectedType: ContentTypeOption;
  selectedGenre: GenreOption | null;
  onSelect: (genre: GenreOption) => void;
  onBack: () => void;
}

export function GenreSelector({
  selectedPlatform,
  selectedType,
  selectedGenre,
  onSelect,
  onBack,
}: GenreSelectorProps) {
  const reduceMotion = useReducedMotion();
  const genres = getGenresForContentType(selectedType.id);

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
          {selectedPlatform.name} · {selectedType.name}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Escolha uma categoria
        </h1>
        <p className="mt-3 max-w-lg text-base text-muted-foreground sm:text-lg">
          Selecione exatamente uma categoria para refinar a recomendação.
        </p>
      </motion.header>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        {...(reduceMotion ? {} : { variants: listVariants })}
      >
        {genres.map((genre) => (
          <motion.div
            key={`${selectedType.id}-${genre.id}`}
            {...(reduceMotion ? {} : { variants: listItemVariants })}
          >
            <GenreCard
              genre={genre}
              selected={selectedGenre?.id === genre.id}
              onSelect={onSelect}
            />
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}
