import type { ContentTypeId } from "@/types/content-type";

export type MovieGenreId =
  | "action"
  | "adventure"
  | "animation"
  | "comedy"
  | "crime"
  | "documentary"
  | "drama"
  | "family"
  | "fantasy"
  | "history"
  | "horror"
  | "music"
  | "mystery"
  | "romance"
  | "scienceFiction"
  | "thriller"
  | "war"
  | "western";

export type TvGenreId =
  | "actionAdventure"
  | "animation"
  | "comedy"
  | "crime"
  | "documentary"
  | "drama"
  | "family"
  | "kids"
  | "mystery"
  | "reality"
  | "sciFiFantasy"
  | "soap"
  | "talk"
  | "warPolitics";

export type GenreId = MovieGenreId | TvGenreId;

export interface GenreOption {
  id: GenreId;
  name: string;
  tmdbId: number;
  contentType: ContentTypeId;
}
