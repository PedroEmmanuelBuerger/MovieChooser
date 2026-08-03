import type { ContentTypeId } from "@/types/content-type";
import type {
  GenreOption,
  MovieGenreId,
  TvGenreId,
} from "@/types/genre";

export const MOVIE_GENRE_TMDB_IDS: Record<MovieGenreId, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  scienceFiction: 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

export const TV_GENRE_TMDB_IDS: Record<TvGenreId, number> = {
  actionAdventure: 10759,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  kids: 10762,
  mystery: 9648,
  reality: 10764,
  sciFiFantasy: 10765,
  soap: 10766,
  talk: 10767,
  warPolitics: 10768,
};

export const MOVIE_GENRES: readonly GenreOption[] = [
  { id: "action", name: "Ação", tmdbId: MOVIE_GENRE_TMDB_IDS.action, contentType: "movie" },
  { id: "adventure", name: "Aventura", tmdbId: MOVIE_GENRE_TMDB_IDS.adventure, contentType: "movie" },
  { id: "animation", name: "Animação", tmdbId: MOVIE_GENRE_TMDB_IDS.animation, contentType: "movie" },
  { id: "comedy", name: "Comédia", tmdbId: MOVIE_GENRE_TMDB_IDS.comedy, contentType: "movie" },
  { id: "crime", name: "Crime", tmdbId: MOVIE_GENRE_TMDB_IDS.crime, contentType: "movie" },
  { id: "documentary", name: "Documentário", tmdbId: MOVIE_GENRE_TMDB_IDS.documentary, contentType: "movie" },
  { id: "drama", name: "Drama", tmdbId: MOVIE_GENRE_TMDB_IDS.drama, contentType: "movie" },
  { id: "family", name: "Família", tmdbId: MOVIE_GENRE_TMDB_IDS.family, contentType: "movie" },
  { id: "fantasy", name: "Fantasia", tmdbId: MOVIE_GENRE_TMDB_IDS.fantasy, contentType: "movie" },
  { id: "history", name: "História", tmdbId: MOVIE_GENRE_TMDB_IDS.history, contentType: "movie" },
  { id: "horror", name: "Terror", tmdbId: MOVIE_GENRE_TMDB_IDS.horror, contentType: "movie" },
  { id: "music", name: "Música", tmdbId: MOVIE_GENRE_TMDB_IDS.music, contentType: "movie" },
  { id: "mystery", name: "Mistério", tmdbId: MOVIE_GENRE_TMDB_IDS.mystery, contentType: "movie" },
  { id: "romance", name: "Romance", tmdbId: MOVIE_GENRE_TMDB_IDS.romance, contentType: "movie" },
  { id: "scienceFiction", name: "Ficção Científica", tmdbId: MOVIE_GENRE_TMDB_IDS.scienceFiction, contentType: "movie" },
  { id: "thriller", name: "Thriller", tmdbId: MOVIE_GENRE_TMDB_IDS.thriller, contentType: "movie" },
  { id: "war", name: "Guerra", tmdbId: MOVIE_GENRE_TMDB_IDS.war, contentType: "movie" },
  { id: "western", name: "Faroeste", tmdbId: MOVIE_GENRE_TMDB_IDS.western, contentType: "movie" },
] as const;

export const TV_GENRES: readonly GenreOption[] = [
  { id: "actionAdventure", name: "Ação e Aventura", tmdbId: TV_GENRE_TMDB_IDS.actionAdventure, contentType: "series" },
  { id: "animation", name: "Animação", tmdbId: TV_GENRE_TMDB_IDS.animation, contentType: "series" },
  { id: "comedy", name: "Comédia", tmdbId: TV_GENRE_TMDB_IDS.comedy, contentType: "series" },
  { id: "crime", name: "Crime", tmdbId: TV_GENRE_TMDB_IDS.crime, contentType: "series" },
  { id: "documentary", name: "Documentário", tmdbId: TV_GENRE_TMDB_IDS.documentary, contentType: "series" },
  { id: "drama", name: "Drama", tmdbId: TV_GENRE_TMDB_IDS.drama, contentType: "series" },
  { id: "family", name: "Família", tmdbId: TV_GENRE_TMDB_IDS.family, contentType: "series" },
  { id: "kids", name: "Kids", tmdbId: TV_GENRE_TMDB_IDS.kids, contentType: "series" },
  { id: "mystery", name: "Mistério", tmdbId: TV_GENRE_TMDB_IDS.mystery, contentType: "series" },
  { id: "reality", name: "Reality", tmdbId: TV_GENRE_TMDB_IDS.reality, contentType: "series" },
  { id: "sciFiFantasy", name: "Sci-Fi & Fantasy", tmdbId: TV_GENRE_TMDB_IDS.sciFiFantasy, contentType: "series" },
  { id: "soap", name: "Soap", tmdbId: TV_GENRE_TMDB_IDS.soap, contentType: "series" },
  { id: "talk", name: "Talk", tmdbId: TV_GENRE_TMDB_IDS.talk, contentType: "series" },
  { id: "warPolitics", name: "War & Politics", tmdbId: TV_GENRE_TMDB_IDS.warPolitics, contentType: "series" },
] as const;

export const ANIME_GENRES: readonly GenreOption[] = TV_GENRES.map((genre) => ({
  ...genre,
  contentType: "anime" as const,
}));

export function getGenresForContentType(
  contentType: ContentTypeId,
): readonly GenreOption[] {
  if (contentType === "movie") {
    return MOVIE_GENRES;
  }

  if (contentType === "anime") {
    return ANIME_GENRES;
  }

  return TV_GENRES;
}
