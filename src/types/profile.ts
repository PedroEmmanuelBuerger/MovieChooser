export type DefaultAvatarId =
  | "default:crimson"
  | "default:amber"
  | "default:slate"
  | "default:emerald"
  | "default:indigo";

export interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileInput {
  name: string;
  bio?: string;
  avatar?: string;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string | null;
  avatar?: string | null;
}

export const DEFAULT_AVATAR_OPTIONS: readonly {
  id: DefaultAvatarId;
  label: string;
  color: string;
}[] = [
  { id: "default:crimson", label: "Carmesim", color: "#E50914" },
  { id: "default:amber", label: "Âmbar", color: "#F59E0B" },
  { id: "default:slate", label: "Ardósia", color: "#64748B" },
  { id: "default:emerald", label: "Esmeralda", color: "#10B981" },
  { id: "default:indigo", label: "Índigo", color: "#6366F1" },
] as const;

export function isDefaultAvatarId(value: string): value is DefaultAvatarId {
  return DEFAULT_AVATAR_OPTIONS.some((option) => option.id === value);
}

export function createProfileId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `profile-${String(Date.now())}-${String(Math.floor(Math.random() * 10000))}`;
}
