import { MediaSearchService } from "@/services/mediaSearchService";
import type { Movie } from "@/types/movie";
import type {
  SearchMovieDetails,
  SearchMovieResult,
} from "@/types/movie-search";

export const MovieSearchService = {
  toMovie(
    media: SearchMovieResult | SearchMovieDetails,
  ): Movie {
    const mapped = MediaSearchService.toMedia({
      ...media,
      type: "movie",
      genreNames: "genreNames" in media ? media.genreNames : [],
      genreIds: "genreIds" in media ? media.genreIds : [],
    } as Parameters<typeof MediaSearchService.toMedia>[0]);

    return {
      id: mapped.id,
      externalId: mapped.externalId,
      title: mapped.title,
      originalTitle: mapped.originalTitle,
      overview: mapped.overview,
      posterUrl: mapped.posterUrl,
      releaseDate: mapped.releaseDate,
      year: mapped.year,
      genres: mapped.genres,
      actors: mapped.actors ?? [],
      director: mapped.director ?? [],
      ...(mapped.ratingTmdb !== undefined ? { ratingTmdb: mapped.ratingTmdb } : {}),
      ...(mapped.runtime !== undefined ? { runtime: mapped.runtime } : {}),
      ...(mapped.keywords !== undefined ? { keywords: mapped.keywords } : {}),
    };
  },

  async search(query: string, signal?: AbortSignal): Promise<SearchMovieResult[]> {
    const results = await MediaSearchService.search("movie", query, signal);
    return results.map((item) => ({
      id: item.id,
      title: item.title,
      originalTitle: item.originalTitle,
      year: item.year,
      poster: item.poster,
      overview: item.overview,
      ratingTmdb: item.ratingTmdb,
      genreIds: item.genreIds,
      genreNames: item.genreNames,
    }));
  },

  async getDetails(
    movieId: number,
    signal?: AbortSignal,
  ): Promise<SearchMovieDetails> {
    const details = await MediaSearchService.getDetails("movie", movieId, signal);
    return {
      id: details.id,
      title: details.title,
      originalTitle: details.originalTitle,
      year: details.year,
      poster: details.poster,
      overview: details.overview,
      ratingTmdb: details.ratingTmdb,
      genreIds: details.genreIds,
      genreNames: details.genreNames,
      description: details.description,
      releaseDate: details.releaseDate,
      runtime: details.runtime,
      directors: details.directors,
      cast: details.cast,
      keywords: details.keywords,
    };
  },
};
