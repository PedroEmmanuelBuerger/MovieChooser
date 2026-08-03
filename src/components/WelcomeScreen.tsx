import { motion } from "framer-motion";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <motion.div
        className="flex max-w-xl flex-col items-center gap-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.p
          className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          MovieChooser
        </motion.p>

        <motion.p
          className="max-w-md text-base text-muted-foreground sm:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          Discover your next movie or series on the streaming platforms you
          already love.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4 }}
        >
          <Button size="lg" type="button" onClick={onStart}>
            <Clapperboard aria-hidden />
            Start choosing
          </Button>
        </motion.div>
      </motion.div>
    </main>
  );
}
