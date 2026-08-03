import { MOVIE_GENRES } from "@/data/genres";
import {
  TMDB_WATCH_PROVIDER_IDS,
  TMDB_WATCH_REGION,
} from "@/data/watch-providers";
import {
  deriveGenreAverages,
  getDislikedMovieIds,
  getUserPreferences,
} from "@/services/preferenceService";
import { discoverMoviesByWatchProvider, getMovieDetails } from "@/services/tmdb";
import type { StreamingPlatformId } from "@/types/platform";
import type { ScoredRecommendation } from "@/types/preferences";
import type { WatchedItem } from "@/types/watched";

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

function genreNamesFromIds(ids: readonly number[]): string[] {
  return ids.map((id) => {
    const match = MOVIE_GENRES.find((genre) => genre.tmdbId === id);
    return match?.name ?? "Outros";
  });
}

function yearFromDate(value: string): string {
  return value.length >= 4 ? value.slice(0, 4) : "—";
}

function scoreCandidate(input: {
  genres: string[];
  genreAverages: Map<string, { average: number; count: number }>;
  favoriteGenres: string[];
  dislikedGenres: string[];
  favoriteActors: string[];
  favoriteDirectors: string[];
  directors: string[];
  cast: string[];
  keywords: string[];
  highlyRatedKeywords: Set<string>;
}): { score: number; reasons: string[] } {
  let score = 40;
  const reasons: string[] = [];

  for (const genre of input.genres) {
    const average = input.genreAverages.get(genre)?.average;

    if (average !== undefined) {
      score += (average - 5) * 6;
      if (average >= 8) {
        reasons.push(`Você avaliou muito bem filmes de ${genre}`);
      }
    }

    if (input.favoriteGenres.includes(genre)) {
      score += 18;
      reasons.push(`${genre} está entre seus gêneros favoritos`);
    }

    if (input.dislikedGenres.includes(genre)) {
      score -= 22;
    }
  }

  for (const director of input.directors) {
    if (input.favoriteDirectors.includes(director)) {
      score += 15;
      reasons.push(`Direção alinhada com ${director}`);
    }
  }

  for (const actor of input.cast) {
    if (input.favoriteActors.includes(actor)) {
      score += 10;
      reasons.push(`Elenco com ${actor}`);
    }
  }

  let keywordHits = 0;

  for (const keyword of input.keywords) {
    if (input.highlyRatedKeywords.has(keyword.toLowerCase())) {
      keywordHits += 1;
    }
  }

  if (keywordHits > 0) {
    score += Math.min(12, keywordHits * 3);
    reasons.push("Temas parecidos com filmes que você curtiu");
  }

  const normalized = Math.max(1, Math.min(99, Math.round(score)));

  if (reasons.length === 0) {
    reasons.push("Combina com o seu histórico recente de filmes");
  }

  return { score: normalized, reasons: [...new Set(reasons)].slice(0, 2) };
}

export const RecommendationService = {
  async getPersonalizedMovies(input: {
    watched: readonly WatchedItem[];
    platformId?: StreamingPlatformId;
    signal?: AbortSignal;
    limit?: number;
  }): Promise<ScoredRecommendation[]> {
    const [preferences, dislikedIds] = await Promise.all([
      getUserPreferences(),
      getDislikedMovieIds(),
    ]);

    const watchedMovies = input.watched.filter((item) => item.type === "movie");
    const watchedIds = new Set(watchedMovies.map((item) => item.id));
    const genreAverages = deriveGenreAverages(watchedMovies);

    const topGenreName = Array.from(genreAverages.entries()).sort(
      (a, b) => b[1].average - a[1].average,
    )[0]?.[0];

    const preferredGenre =
      preferences.favoriteGenres[0] ?? topGenreName ?? undefined;
    const preferredGenreId = preferredGenre
      ? MOVIE_GENRES.find((genre) => genre.name === preferredGenre)?.tmdbId
      : undefined;

    const platformId = input.platformId ?? "netflix";
    const watchProviderIds = TMDB_WATCH_PROVIDER_IDS[platformId];

    const pages = await Promise.all([
      discoverMoviesByWatchProvider({
        watchProviderIds,
        watchRegion: TMDB_WATCH_REGION,
        page: 1,
        ...(preferredGenreId === undefined
          ? {}
          : { genreId: preferredGenreId }),
        ...(input.signal ? { signal: input.signal } : {}),
      }),
      discoverMoviesByWatchProvider({
        watchProviderIds,
        watchRegion: TMDB_WATCH_REGION,
        page: 2,
        ...(input.signal ? { signal: input.signal } : {}),
      }),
    ]);

    const candidates = [...pages[0].results, ...pages[1].results].filter(
      (movie) =>
        !watchedIds.has(movie.id) &&
        !dislikedIds.has(movie.id) &&
        movie.posterPath !== null &&
        movie.title.trim().length > 0,
    );

    const unique = new Map(candidates.map((movie) => [movie.id, movie]));
    const sample = Array.from(unique.values()).slice(0, 18);

    const highlyRatedKeywords = new Set<string>();
    const topRated = [...watchedMovies]
      .filter((item) => (item.userRating ?? 0) >= 8)
      .slice(0, 3);

    for (const item of topRated) {
      try {
        const details = await getMovieDetails(item.id, input.signal);
        for (const genreId of details.genreIds) {
          const name = MOVIE_GENRES.find((genre) => genre.tmdbId === genreId)
            ?.name;
          if (name) {
            highlyRatedKeywords.add(name.toLowerCase());
          }
        }
      } catch {
        continue;
      }
    }

    const scored: ScoredRecommendation[] = sample.map((movie) => {
      const genres = genreNamesFromIds(movie.genreIds);
      const result = scoreCandidate({
        genres,
        genreAverages,
        favoriteGenres: preferences.favoriteGenres,
        dislikedGenres: preferences.dislikedGenres,
        favoriteActors: preferences.favoriteActors,
        favoriteDirectors: preferences.favoriteDirectors,
        directors: [],
        cast: [],
        keywords: genres,
        highlyRatedKeywords,
      });

      return {
        id: movie.id,
        title: movie.title,
        year: yearFromDate(movie.releaseDate),
        poster: `${TMDB_POSTER_BASE_URL}${movie.posterPath ?? ""}`,
        genres,
        overview: movie.overview,
        ratingTmdb: movie.voteAverage,
        compatibility: result.score,
        reason: result.reasons[0] ?? "Recomendado com base no seu perfil",
      };
    });

    return scored
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, input.limit ?? 12);
  },
};
