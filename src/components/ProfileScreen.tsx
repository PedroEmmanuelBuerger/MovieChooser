import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRef, useState } from "react";
import { Check, ImagePlus, Pencil, Trophy } from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { AvatarDisplay } from "@/components/AvatarDisplay";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLibrary } from "@/hooks/useLibrary";
import { useProfileContext } from "@/hooks/useProfileContext";
import { useStats } from "@/hooks/useStats";
import { compressImageToAvatarDataUrl } from "@/lib/avatar";
import { EASE_OUT_EXPO, listItemVariants, listVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  DEFAULT_AVATAR_OPTIONS,
  type UpdateProfileInput,
} from "@/types/profile";

const CHART_COLORS = ["#E50914", "#00A8E1", "#113CCF", "#F47521", "#B825F6", "#10B981"];

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function StatCard({
  label,
  value,
  decimals = 0,
}: {
  label: string;
  value: number;
  decimals?: number;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-foreground">
        <AnimatedCounter value={value} decimals={decimals} />
      </p>
    </div>
  );
}

export function ProfileScreen() {
  const reduceMotion = useReducedMotion();
  const { profile, updateProfile, error: profileError } = useProfileContext();
  const { history, watched } = useLibrary();
  const { stats, achievements, loading, error } = useStats({
    history: history.items,
    watched: watched.items,
    enabled: true,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar ?? "default:crimson");
  const [saving, setSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </main>
    );
  }

  async function handleSave() {
    if (!profile) {
      return;
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
      return;
    }

    setSaving(true);
    const input: UpdateProfileInput = {
      name: trimmed,
      bio: bio.trim().length > 0 ? bio.trim() : null,
      avatar,
    };
    await updateProfile(input);
    setSaving(false);
    setEditing(false);
  }

  function startEditing() {
    if (!profile) {
      return;
    }

    setName(profile.name);
    setBio(profile.bio ?? "");
    setAvatar(profile.avatar ?? "default:crimson");
    setAvatarError(null);
    setEditing(true);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <motion.header
        className="mb-8"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Biblioteca pessoal
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Perfil
        </h1>
      </motion.header>

      <motion.section
        className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <AvatarDisplay
            name={editing ? name || profile.name : profile.name}
            avatar={editing ? avatar : (profile.avatar ?? "default:crimson")}
            size="xl"
          />
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {DEFAULT_AVATAR_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        "size-8 rounded-full ring-2 transition",
                        avatar === option.id
                          ? "ring-primary"
                          : "ring-transparent hover:ring-border",
                      )}
                      style={{ backgroundColor: option.color }}
                      aria-label={option.label}
                      onClick={() => {
                        setAvatarError(null);
                        setAvatar(option.id);
                      }}
                    />
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      fileRef.current?.click();
                    }}
                  >
                    <ImagePlus className="size-3.5" aria-hidden />
                    Enviar imagem
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";

                      if (!file) {
                        return;
                      }

                      setAvatarError(null);
                      void compressImageToAvatarDataUrl(file)
                        .then((dataUrl) => {
                          setAvatar(dataUrl);
                        })
                        .catch(() => {
                          setAvatarError(
                            "Não foi possível carregar a imagem. Tente outro arquivo.",
                          );
                        });
                    }}
                  />
                </div>
                {avatarError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {avatarError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Escolha uma cor ou envie uma foto do seu dispositivo.
                  </p>
                )}
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                  className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                  maxLength={40}
                />
                <textarea
                  value={bio}
                  onChange={(event) => {
                    setBio(event.target.value);
                  }}
                  className="min-h-20 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                  maxLength={160}
                  placeholder="Bio opcional"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={() => {
                      void handleSave();
                    }}
                  >
                    <Check className="size-3.5" aria-hidden />
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAvatarError(null);
                      setEditing(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {profile.name}
                    </h2>
                    {profile.bio ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {profile.bio}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sem bio ainda
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Perfil criado em {formatDate(profile.createdAt)}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={startEditing}>
                    <Pencil className="size-3.5" aria-hidden />
                    Editar
                  </Button>
                </div>
              </>
            )}
            {profileError ? (
              <p className="mt-3 text-sm text-destructive">{profileError}</p>
            ) : null}
          </div>
        </div>
      </motion.section>

      {error ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : null}

      {stats ? (
        <div className="space-y-8">
          <section>
            <h3 className="mb-4 font-display text-xl font-semibold text-foreground">
              Estatísticas
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <StatCard
                label="Recomendações"
                value={stats.totalRecommendations}
              />
              <StatCard label="Assistidos" value={stats.totalWatched} />
              <StatCard label="Filmes" value={stats.watchedMovies} />
              <StatCard label="Séries e Animes" value={stats.watchedSeries} />
              <StatCard
                label="Não assistidos do histórico"
                value={stats.declinedRecommendations}
              />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <h3 className="mb-4 font-display text-lg font-semibold">
                Avaliações
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Média"
                  value={stats.ratings.averageRating ?? 0}
                  decimals={1}
                />
                <StatCard label="Avaliados" value={stats.ratings.ratedCount} />
                <StatCard
                  label="Maior nota"
                  value={stats.ratings.highestRating ?? 0}
                />
                <StatCard
                  label="Menor nota"
                  value={stats.ratings.lowestRating ?? 0}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <h3 className="mb-2 font-display text-lg font-semibold">
                Tempo estimado assistido
              </h3>
              <p className="font-display text-3xl font-bold text-primary">
                {stats.watchTime.formatted}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Com base no runtime da TMDB
                {stats.watchTime.pendingCount > 0
                  ? ` · ${String(stats.watchTime.pendingCount)} pendente(s)`
                  : ""}
              </p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <h3 className="mb-4 font-display text-lg font-semibold">
                Top gêneros
              </h3>
              {stats.topGenres.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Marque conteúdos assistidos para ver gêneros.
                </p>
              ) : (
                <ul className="space-y-3">
                  {stats.topGenres.map((genre, index) => (
                    <li key={genre.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>
                          {String(index + 1)}º {genre.label}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {String(genre.count)} · {String(genre.percentage)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={reduceMotion ? false : { width: 0 }}
                          animate={{ width: `${String(genre.percentage)}%` }}
                          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <h3 className="mb-4 font-display text-lg font-semibold">
                Plataformas
              </h3>
              {stats.platforms.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem dados de plataforma ainda.
                </p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.platforms}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {stats.platforms.map((entry, index) => (
                          <Cell
                            key={entry.platformId}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${String(value)} título(s)`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {stats.platforms.map((platform, index) => (
                      <li key={platform.platformId} className="flex justify-between">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          {platform.label}
                        </span>
                        <span>{String(platform.percentage)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/70 p-5">
            <h3 className="mb-4 font-display text-lg font-semibold">
              Atividade mensal
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#a3a3a3", fontSize: 10 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: "#a3a3a3", fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#E50914" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <h3 className="mb-4 font-display text-lg font-semibold">
                Seu perfil de consumo
              </h3>
              <ul className="space-y-2">
                {stats.insights.map((insight) => (
                  <li
                    key={insight}
                    className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground"
                  >
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <h3 className="mb-4 font-display text-lg font-semibold">
                Favoritos do usuário
              </h3>
              {stats.favorites.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Avalie conteúdos assistidos para montar o ranking.
                </p>
              ) : (
                <ol className="space-y-2">
                  {stats.favorites.map((item, index) => (
                    <li
                      key={`${item.type}:${String(item.id)}`}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-2"
                    >
                      <span className="w-6 text-center font-display text-sm font-bold text-primary">
                        {String(index + 1)}
                      </span>
                      <img
                        src={item.poster}
                        alt=""
                        className="size-10 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Sua nota {String(item.userRating)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
              <Trophy className="size-5 text-primary" aria-hidden />
              Conquistas
            </h3>
            <motion.div
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              variants={listVariants}
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
            >
              {achievements.map((item) => (
                <motion.article
                  key={item.definition.id}
                  variants={listItemVariants}
                  className={cn(
                    "rounded-xl border p-4",
                    item.unlocked
                      ? "border-primary/40 bg-primary/10 shadow-[0_0_24px_-12px_rgba(229,9,20,0.55)]"
                      : "border-border/70 bg-card/50 opacity-75",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-2xl" aria-hidden>
                      {item.definition.icon}
                    </span>
                    {item.unlocked ? (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Desbloqueada
                      </span>
                    ) : null}
                  </div>
                  <h4 className="font-display font-semibold text-foreground">
                    {item.definition.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.definition.description}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${String((item.progress / item.target) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                    {String(item.progress)} / {String(item.target)}
                  </p>
                </motion.article>
              ))}
            </motion.div>
          </section>
        </div>
      ) : null}

      <AnimatePresence>
        {achievements.some((item) => item.newlyUnlocked) ? (
          <motion.div
            className="fixed bottom-6 right-6 z-50 rounded-2xl border border-primary/40 bg-card/95 px-4 py-3 shadow-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            {...(reduceMotion ? {} : { exit: { opacity: 0, y: 12 } })}
          >
            <p className="text-sm font-semibold text-primary">
              Nova conquista desbloqueada!
            </p>
            <p className="text-xs text-muted-foreground">
              {
                achievements.find((item) => item.newlyUnlocked)?.definition
                  .title
              }
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
