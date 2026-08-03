import type { AchievementDefinition } from "@/types/stats";

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  {
    id: "first-movie",
    title: "Primeiro Filme",
    description: "Assistiu 1 filme.",
    icon: "🎬",
    target: 1,
  },
  {
    id: "marathoner",
    title: "Maratonista",
    description: "Assistiu 50 séries/animes.",
    icon: "📺",
    target: 50,
  },
  {
    id: "critic",
    title: "Crítico",
    description: "Avaliou 100 conteúdos.",
    icon: "⭐",
    target: 100,
  },
  {
    id: "cinephile",
    title: "Cinéfilo",
    description: "Assistiu 100 conteúdos.",
    icon: "🔥",
    target: 100,
  },
  {
    id: "explorer",
    title: "Explorador",
    description: "Assistiu conteúdos de 10 gêneros diferentes.",
    icon: "🚀",
    target: 10,
  },
] as const;
