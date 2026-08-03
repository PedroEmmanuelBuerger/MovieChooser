import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface DeleteAccountDialogProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteAccountDialog({
  open,
  loading = false,
  onCancel,
  onConfirm,
}: DeleteAccountDialogProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          {...(reduceMotion ? {} : { exit: { opacity: 0 } })}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-5 shadow-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            role="dialog"
            aria-modal
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
          >
            <h2
              id="delete-account-title"
              className="font-display text-xl font-bold text-foreground"
            >
              Excluir conta?
            </h2>
            <p
              id="delete-account-description"
              className="mt-2 text-sm text-muted-foreground"
            >
              Isso remove permanentemente o perfil, histórico, assistidos, notas
              e preferências deste dispositivo. Não dá para desfazer.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onConfirm}
              >
                {loading ? "Excluindo..." : "Sim, excluir tudo"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
