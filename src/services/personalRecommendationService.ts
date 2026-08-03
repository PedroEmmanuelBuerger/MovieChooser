import { MOVIE_GENRES, TV_GENRES } from "@/data/genres";
import {
  TMDB_WATCH_PROVIDER_IDS,
  TMDB_WATCH_REGION,
} from "@/data/watch-providers";
import {
  deriveGenreAverages,
  getDislikedMediaIds,
  getUserPreferences,
} from "@/services/preferenceService";
import {
  discoverMoviesByWatchProvider,
  discoverTVShowsByWatchProvider,
  isLikelyAnime,
} from "@/services/tmdb";
import type { ContentTypeId } from "@/types/content-type";
import { getContentTypeLabel } from "@/types/content-type";
import type { StreamingPlatformId } from "@/types/platform";
import type { ScoredRecommendation } from "@/types/preferences";
import type { WatchedItem } from "@/types/watched";
import type { Movie, TVShow } from "@/types/tmdb";

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

function genreNamesFromIds(
  ids: readonly number[],
  kind: ContentTypeId,
): string[] {
  const list = kind === "movie" ? MOVIE_GENRES : TV_GENRES;

  return ids.map((id) => {
    const match = list.find((genre) => genre.tmdbId === id);
    return match?.name ?? "Outros";
  });
}

function yearFromDate(value: string): string {
  return value.length >= 4 ? value.slice(0, 4) : "—";
}

function scoreCandidate(input: {
  type: ContentTypeId;
  genres: string[];
  genreAverages: Map<string, { average: number; count: number }>;
  favoriteGenres: string[];
  dislikedGenres: string[];
  preferredContentTypes: ContentTypeId[];
}): { score: number; reasons: string[] } {
  let score = 40;
  const reasons: string[] = [];

  if (input.preferredContentTypes.includes(input.type)) {
    score += 14;
    reasons.push(
      `${getContentTypeLabel(input.type)} está entre seus tipos preferidos`,
    );
  }

  for (const genre of input.genres) {
    const average = input.genreAverages.get(genre)?.average;

    if (average !== undefined) {
      score += (average - 5) * 6;
      if (average >= 8) {
        reasons.push(`Você avaliou muito bem títulos de ${genre}`);
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

  const normalized = Math.max(1, Math.min(99, Math.round(score)));

  if (reasons.length === 0) {
    reasons.push("Combina com o seu histórico recente");
  }

  return { score: normalized, reasons: [...new Set(reasons)].slice(0, 2) };
}

function scoreMovie(
  movie: Movie,
  context: {
    genreAverages: Map<string, { average: number; count: number }>;
    favoriteGenres: string[];
    dislikedGenres: string[];
    preferredContentTypes: ContentTypeId[];
  },
): ScoredRecommendation {
  const genres = genreNamesFromIds(movie.genreIds, "movie");
  const result = scoreCandidate({
    type: "movie",
    genres,
    ...context,
  });

  return {
    id: movie.id,
    type: "movie",
    title: movie.title,
    year: yearFromDate(movie.releaseDate),
    poster: `${TMDB_POSTER_BASE_URL}${movie.posterPath ?? ""}`,
    genres,
    overview: movie.overview,
    ratingTmdb: movie.voteAverage,
    compatibility: result.score,
    reason: result.reasons[0] ?? "Recomendado com base no seu perfil",
  };
}

function scoreTvShow(
  show: TVShow,
  type: "series" | "anime",
  context: {
    genreAverages: Map<string, { average: number; count: number }>;
    favoriteGenres: string[];
    dislikedGenres: string[];
    preferredContentTypes: ContentTypeId[];
  },
): ScoredRecommendation {
  const genres = genreNamesFromIds(show.genreIds, type);
  const result = scoreCandidate({
    type,
    genres,
    ...context,
  });

  return {
    id: show.id,
    type,
    title: show.name,
    year: yearFromDate(show.firstAirDate),
    poster: `${TMDB_POSTER_BASE_URL}${show.posterPath ?? ""}`,
    genres,
    overview: show.overview,
    ratingTmdb: show.voteAverage,
    compatibility: result.score,
    reason: result.reasons[0] ?? "Recomendado com base no seu perfil",
  };
}

export const RecommendationService = {
  async getPersonalizedRecommendations(input: {
    watched: readonly WatchedItem[];
    platformId?: StreamingPlatformId;
    signal?: AbortSignal;
    limit?: number;
  }): Promise<{
    movies: ScoredRecommendation[];
    seriesAndAnime: ScoredRecommendation[];
  }> {
    const [preferences, dislikedMovieIds, dislikedSeriesIds, dislikedAnimeIds] =
      await Promise.all([
        getUserPreferences(),
        getDislikedMediaIds("movie"),
        getDislikedMediaIds("series"),
        getDislikedMediaIds("anime"),
      ]);

    const watchedIds = {
      movie: new Set(
        input.watched.filter((item) => item.type === "movie").map((i) => i.id),
      ),
      series: new Set(
        input.watched.filter((item) => item.type === "series").map((i) => i.id),
      ),
      anime: new Set(
        input.watched.filter((item) => item.type === "anime").map((i) => i.id),
      ),
    };

    const genreAverages = deriveGenreAverages(input.watched);
    const preferredContentTypes = preferences.preferredContentTypes ?? [];
    const platformId = input.platformId ?? "netflix";
    const watchProviderIds = TMDB_WATCH_PROVIDER_IDS[platformId];

    const topGenreName = Array.from(genreAverages.entries()).sort(
      (a, b) => b[1].average - a[1].average,
    )[0]?.[0];

    const preferredGenre =
      preferences.favoriteGenres[0] ?? topGenreName ?? undefined;
    const preferredMovieGenreId = preferredGenre
      ? MOVIE_GENRES.find((genre) => genre.name === preferredGenre)?.tmdbId
      : undefined;
    const preferredTvGenreId = preferredGenre
      ? TV_GENRES.find((genre) => genre.name === preferredGenre)?.tmdbId
      : undefined;

    const [moviePage1, moviePage2, seriesPage, animePage] = await Promise.all([
      discoverMoviesByWatchProvider({
        watchProviderIds,
        watchRegion: TMDB_WATCH_REGION,
        page: 1,
        ...(preferredMovieGenreId === undefined
          ? {}
          : { genreId: preferredMovieGenreId }),
        ...(input.signal ? { signal: input.signal } : {}),
      }),
      discoverMoviesByWatchProvider({
        watchProviderIds,
        watchRegion: TMDB_WATCH_REGION,
        page: 2,
        ...(input.signal ? { signal: input.signal } : {}),
      }),
      discoverTVShowsByWatchProvider({
        watchProviderIds,
        watchRegion: TMDB_WATCH_REGION,
        page: 1,
        ...(preferredTvGenreId === undefined
          ? {}
          : { genreId: preferredTvGenreId }),
        ...(input.signal ? { signal: input.signal } : {}),
      }),
      discoverTVShowsByWatchProvider({
        watchProviderIds,
        watchRegion: TMDB_WATCH_REGION,
        page: 1,
        genreId: preferredTvGenreId ?? 16,
        originalLanguage: "ja",
        ...(input.signal ? { signal: input.signal } : {}),
      }),
    ]);

    const scoreContext = {
      genreAverages,
      favoriteGenres: preferences.favoriteGenres,
      dislikedGenres: preferences.dislikedGenres,
      preferredContentTypes,
    };

    const movieCandidates = [...moviePage1.results, ...moviePage2.results]
      .filter(
        (movie) =>
          !watchedIds.movie.has(movie.id) &&
          !dislikedMovieIds.has(movie.id) &&
          movie.posterPath !== null &&
          movie.title.trim().length > 0,
      )
      .map((movie) => scoreMovie(movie, scoreContext));

    const seriesCandidates = seriesPage.results
      .filter((show) => {
        const anime = isLikelyAnime({
          genreIds: show.genreIds,
          originalLanguage: show.originalLanguage,
          originCountry: show.originCountry,
        });

        return (
          !anime &&
          !watchedIds.series.has(show.id) &&
          !dislikedSeriesIds.has(show.id) &&
          show.posterPath !== null &&
          show.name.trim().length > 0
        );
      })
      .map((show) => scoreTvShow(show, "series", scoreContext));

    const animeCandidates = animePage.results
      .filter(
        (show) =>
          !watchedIds.anime.has(show.id) &&
          !dislikedAnimeIds.has(show.id) &&
          show.posterPath !== null &&
          show.name.trim().length > 0,
      )
      .map((show) => scoreTvShow(show, "anime", scoreContext));

    const limit = input.limit ?? 12;
    const movieLimit = Math.ceil(limit / 2);
    const tvLimit = Math.floor(limit / 2);

    return {
      movies: movieCandidates
        .sort((a, b) => b.compatibility - a.compatibility)
        .slice(0, movieLimit),
      seriesAndAnime: [...seriesCandidates, ...animeCandidates]
        .sort((a, b) => b.compatibility - a.compatibility)
        .slice(0, tvLimit),
    };
  },

  async getPersonalizedMovies(input: {
    watched: readonly WatchedItem[];
    platformId?: StreamingPlatformId;
    signal?: AbortSignal;
    limit?: number;
  }): Promise<ScoredRecommendation[]> {
    const result = await this.getPersonalizedRecommendations(input);
    return result.movies;
  },
};
