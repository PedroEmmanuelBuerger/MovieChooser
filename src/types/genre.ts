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

export interface SurpriseGenreOption {
  id: "random";
  name: string;
  isSurprise: true;
}

export type GenreSelection = GenreOption | SurpriseGenreOption;

export const SURPRISE_GENRE: SurpriseGenreOption = {
  id: "random",
  name: "Surpreenda-me",
  isSurprise: true,
};

export function isSurpriseGenre(
  selection: GenreSelection,
): selection is SurpriseGenreOption {
  return selection.id === "random";
}
