import { getRandomRecommendation } from "../src/services/recommendationService";

async function main(): Promise<void> {
  const recommendation = await getRandomRecommendation({
    platform: "netflix",
    type: "movie",
  });

  console.log("Recommendation ok");
  console.log(`Title: ${recommendation.title}`);
  console.log(`Type: ${recommendation.type}`);
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
