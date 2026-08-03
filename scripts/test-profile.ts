import {
  createUserProfile,
  getUnlockedAchievements,
  getUserProfile,
  saveUnlockedAchievements,
  updateUserProfile,
} from "../src/services/profileService";
import {
  computeLibraryStats,
  createWatchTimeStats,
  evaluateAchievements,
  formatWatchTime,
} from "../src/services/statsService";
import type { HistoryItem } from "../src/types/history";
import type { WatchedItem } from "../src/types/watched";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
  const stamp = String(Date.now());
  const profile = await createUserProfile({
    name: `Tester ${stamp}`,
    bio: "Bio de teste",
    avatar: "default:crimson",
  });

  assert(profile.name.startsWith("Tester"), "Nome do perfil inválido");
  assert(Boolean(profile.createdAt), "createdAt ausente");

  const reloaded = await getUserProfile();
  assert(reloaded?.id === profile.id, "Perfil não persistiu");

  const updated = await updateUserProfile({
    name: `Updated ${stamp}`,
    bio: null,
  });
  assert(updated.name.startsWith("Updated"), "Edição de nome falhou");
  assert(updated.bio === undefined, "Bio deveria ter sido removida");

  const history: HistoryItem[] = [
    {
      id: 1,
      title: "Filme A",
      description: "",
      poster: "x",
      platform: "Netflix",
      platformId: "netflix",
      type: "movie",
      genre: "Ação",
      rating: 8,
      recommendedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Série B",
      description: "",
      poster: "x",
      platform: "Prime Video",
      platformId: "prime-video",
      type: "series",
      genre: "Ficção Científica",
      rating: 7,
      recommendedAt: new Date().toISOString(),
    },
  ];

  const watched: WatchedItem[] = [
    {
      id: 1,
      title: "Filme A",
      description: "",
      poster: "x",
      platform: "Netflix",
      platformId: "netflix",
      type: "movie",
      genre: "Ação",
      ratingTmdb: 8,
      userRating: 9,
      watchedAt: new Date().toISOString(),
    },
  ];

  const stats = computeLibraryStats(
    history,
    watched,
    createWatchTimeStats(120, 1, 0),
  );

  assert(stats.totalRecommendations === 2, "Total de recomendações incorreto");
  assert(stats.totalWatched === 1, "Total assistidos incorreto");
  assert(stats.watchedMovies === 1, "Filmes assistidos incorreto");
  assert(stats.declinedRecommendations === 1, "Recusadas incorreto");
  assert(stats.ratings.averageRating === 9, "Média incorreta");
  assert(stats.topGenres[0]?.label === "Ação", "Top gênero incorreto");
  assert(stats.platforms[0]?.label === "Netflix", "Plataforma favorita incorreta");
  assert(formatWatchTime(120) === "2 horas", "Formato de tempo incorreto");

  const progress = evaluateAchievements(watched, []);
  const firstMovie = progress.find((item) => item.definition.id === "first-movie");
  assert(firstMovie, "Conquista primeiro filme não encontrada");
  assert(firstMovie.unlocked, "Conquista primeiro filme deveria desbloquear");
  assert(firstMovie.newlyUnlocked, "Conquista deveria ser nova");

  await saveUnlockedAchievements([
    {
      id: "first-movie",
      unlockedAt: firstMovie.unlockedAt ?? new Date().toISOString(),
    },
  ]);

  const saved = await getUnlockedAchievements();
  assert(
    saved.some((item) => item.id === "first-movie"),
    "Conquista não persistiu",
  );

  const again = evaluateAchievements(watched, saved);
  const againFirst = again.find((item) => item.definition.id === "first-movie");
  assert(againFirst, "Conquista não encontrada na reavaliação");
  assert(againFirst.unlocked, "Conquista deveria permanecer");
  assert(!againFirst.newlyUnlocked, "Conquista não deveria ser nova de novo");

  console.log("Profile/stats ok");
  console.log(`Profile: ${updated.name}`);
  console.log(`Watched: ${String(stats.totalWatched)}`);
  console.log(`Achievements unlocked: ${String(saved.length)}`);
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
