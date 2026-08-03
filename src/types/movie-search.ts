export interface SearchMovieResult {
  id: number;
  title: string;
  originalTitle: string;
  year: string;
  poster: string | null;
  overview: string;
  ratingTmdb: number;
  genreIds: number[];
  genreNames: string[];
}

export interface MovieCreditPerson {
  id: number;
  name: string;
  job?: string;
}

export interface SearchMovieDetails extends SearchMovieResult {
  description: string;
  releaseDate: string;
  runtime: number | null;
  directors: MovieCreditPerson[];
  cast: MovieCreditPerson[];
  keywords: string[];
}
