import {
  getConfiguration,
  getPopularMovies,
  TmdbServiceError,
} from "../src/services/tmdb";

async function main(): Promise<void> {
  try {
    const configuration = await getConfiguration();
    const popularMovies = await getPopularMovies(1);
    const firstMovie = popularMovies.results[0];

    console.log("TMDB connection ok");
    console.log(`Image base URL: ${configuration.images.secureBaseUrl}`);
    console.log(`Popular movies: ${String(popularMovies.totalResults)}`);

    if (firstMovie) {
      console.log(`Sample movie: ${firstMovie.title}`);
    }
  } catch (error) {
    if (error instanceof TmdbServiceError) {
      console.error(`TMDB smoke test failed [${error.code ?? "UNKNOWN"}]: ${error.message}`);
      process.exitCode = 1;
      return;
    }

    console.error("TMDB smoke test failed with unexpected error:", error);
    process.exitCode = 1;
  }
}

void main();
