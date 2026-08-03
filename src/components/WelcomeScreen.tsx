import { motion, useReducedMotion } from "framer-motion";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "@/lib/motion";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <motion.div
        className="flex max-w-xl flex-col items-center gap-6"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      >
        <motion.p
          className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.05, ease: EASE_OUT_EXPO }}
        >
          MovieChooser
        </motion.p>

        <motion.p
          className="max-w-md text-base text-muted-foreground sm:text-lg"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          Descubra o próximo filme ou série nas plataformas de streaming que
          você já ama.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4 }}
        >
          <Button size="lg" type="button" onClick={onStart}>
            <Clapperboard aria-hidden />
            Começar
          </Button>
        </motion.div>
      </motion.div>
    </main>
  );
}
