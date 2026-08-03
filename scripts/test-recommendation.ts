import { getRandomRecommendation } from "../src/services/recommendationService";
import { MOVIE_GENRES } from "../src/data/genres";

async function main(): Promise<void> {
  const genre = MOVIE_GENRES[0];

  if (!genre) {
    throw new Error("Movie genres list is empty");
  }

  const recommendation = await getRandomRecommendation({
    platform: "netflix",
    type: "movie",
    genre,
  });

  console.log("Recommendation ok");
  console.log(`Title: ${recommendation.title}`);
  console.log(`Type: ${recommendation.type}`);
  console.log(`Genre: ${recommendation.genre}`);
  console.log(`Rating: ${String(recommendation.rating)}`);
  console.log(`Poster: ${recommendation.poster}`);
  console.log(
    `Description: ${recommendation.description.slice(0, 120) || "(empty)"}`,
  );
}

void main().catch((error: unknown) => {
  console.error("Recommendation smoke test failed:", error);
  process.exitCode = 1;
});
