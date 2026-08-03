import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { AvatarDisplay } from "@/components/AvatarDisplay";
import { Button } from "@/components/ui/button";
import { compressImageToAvatarDataUrl } from "@/lib/avatar";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  DEFAULT_AVATAR_OPTIONS,
  type CreateProfileInput,
} from "@/types/profile";

interface ProfileOnboardingProps {
  onComplete: (input: CreateProfileInput) => Promise<void>;
  submitting?: boolean;
}

export function ProfileOnboarding({
  onComplete,
  submitting = false,
}: ProfileOnboardingProps) {
  const reduceMotion = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string>("default:crimson");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    setError(null);
    const input: CreateProfileInput = {
      name: trimmed,
      avatar,
      ...(bio.trim().length > 0 ? { bio: bio.trim() } : {}),
    };
    await onComplete(input);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 px-4 backdrop-blur-md">
      <motion.form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      >
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Bem-vindo
        </p>
        <h2 className="font-display text-3xl font-bold text-foreground">
          Crie seu perfil
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sem login. Tudo fica salvo neste dispositivo.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <AvatarDisplay name={name || "M"} avatar={avatar} size="xl" />
          <div className="flex flex-wrap justify-center gap-2">
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
                  setAvatar(option.id);
                }}
              />
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                return;
              }

              void compressImageToAvatarDataUrl(file)
                .then((dataUrl) => {
                  setAvatar(dataUrl);
                })
                .catch(() => {
                  setError("Não foi possível carregar a imagem.");
                });
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              fileRef.current?.click();
            }}
          >
            Enviar imagem local
          </Button>
        </div>

        <label className="mt-6 block text-sm font-medium text-foreground">
          Nome
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            className="mt-2 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            placeholder="Como você quer ser chamado?"
            maxLength={40}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-foreground">
          Bio (opcional)
          <textarea
            value={bio}
            onChange={(event) => {
              setBio(event.target.value);
            }}
            className="mt-2 min-h-24 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            placeholder="Conte um pouco sobre seus gostos"
            maxLength={160}
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
          Começar
        </Button>
      </motion.form>
    </div>
  );
}
