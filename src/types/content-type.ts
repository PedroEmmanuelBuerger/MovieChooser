export type ContentTypeId = "movie" | "series" | "anime";

export type MediaKind = ContentTypeId;

export interface ContentTypeOption {
  id: ContentTypeId;
  name: string;
  description: string;
}

export function isTvContentType(type: ContentTypeId): boolean {
  return type === "series" || type === "anime";
}

export function getContentTypeLabel(type: ContentTypeId): string {
  if (type === "movie") {
    return "Filme";
  }

  if (type === "anime") {
    return "Anime";
  }

  return "Série";
}
