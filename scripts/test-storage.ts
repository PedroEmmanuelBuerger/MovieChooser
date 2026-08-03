import {
  addRecommendationToHistory,
  getRecommendationHistory,
  getWatchedItems,
  markAsWatched,
  updateWatchedRating,
} from "../src/services/storageService";
import type { HistoryItem } from "../src/types/history";
import type { WatchedItem } from "../src/types/watched";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
  const stamp = String(Date.now());

  const historyItem: HistoryItem = {
    id: 900001,
    title: `Teste Histórico ${stamp}`,
    description: "Item de validação local",
    poster: "https://image.tmdb.org/t/p/w500/test.jpg",
    platform: "Netflix",
    platformId: "netflix",
    type: "movie",
    genre: "Ação",
    rating: 8.2,
    recommendedAt: new Date().toISOString(),
  };

  const afterHistory = await addRecommendationToHistory(historyItem);
  assert(
    afterHistory.some((item) => item.id === historyItem.id),
    "Histórico não persistiu o item",
  );

  const reloadedHistory = await getRecommendationHistory();
  assert(
    reloadedHistory.some((item) => item.id === historyItem.id),
    "Histórico não foi relido corretamente",
  );

  const watchedPayload: WatchedItem = {
    id: historyItem.id,
    title: historyItem.title,
    description: historyItem.description,
    poster: historyItem.poster,
    platform: historyItem.platform,
    platformId: historyItem.platformId,
    type: historyItem.type,
    genre: historyItem.genre,
    ratingTmdb: historyItem.rating,
    userRating: null,
    watchedAt: new Date().toISOString(),
  };

  const firstMark = await markAsWatched(watchedPayload);
  assert(firstMark.added, "Primeira marcação deveria adicionar");
  assert(
    firstMark.items.some((item) => item.id === watchedPayload.id),
    "Assistidos não contém o item",
  );

  const secondMark = await markAsWatched(watchedPayload);
  assert(!secondMark.added, "Duplicação de assistido não deveria ocorrer");
  assert(
    secondMark.items.filter((item) => item.id === watchedPayload.id).length ===
      1,
    "Assistidos ficou com duplicatas",
  );

  const rated = await updateWatchedRating({
    type: "movie",
    id: watchedPayload.id,
    userRating: 9,
  });
  const ratedItem = rated.find((item) => item.id === watchedPayload.id);
  assert(ratedItem?.userRating === 9, "Nota do usuário não foi salva");

  const reloadedWatched = await getWatchedItems();
  const reloadedItem = reloadedWatched.find(
    (item) => item.id === watchedPayload.id,
  );
  assert(reloadedItem?.userRating === 9, "Nota não persistiu na releitura");

  const movies = reloadedHistory.filter((item) => item.type === "movie");
  const series = reloadedHistory.filter((item) => item.type === "series");
  assert(movies.length >= 1, "Separação de filmes falhou");
  assert(Array.isArray(series), "Separação de séries falhou");

  console.log("Storage ok");
  console.log(`History movies: ${String(movies.length)}`);
  console.log(`Watched count: ${String(reloadedWatched.length)}`);
  assert(reloadedItem, "Item assistido não encontrado na releitura");
  console.log(`User rating: ${String(reloadedItem.userRating)}`);
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
