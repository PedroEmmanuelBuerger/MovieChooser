export type ContentTypeId = "movie" | "series";

export interface ContentTypeOption {
  id: ContentTypeId;
  name: string;
  description: string;
}
