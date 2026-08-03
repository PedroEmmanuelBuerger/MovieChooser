export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
  originalLanguage: string;
  adult: boolean;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  genreIds: number[];
  originalLanguage: string;
  originCountry: string[];
}

export interface MovieDetails extends Movie {
  runtime: number | null;
}

export interface TVShowDetails extends TVShow {
  numberOfEpisodes: number | null;
  episodeRunTime: number[];
}

export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  totalPages: number;
  totalResults: number;
}
