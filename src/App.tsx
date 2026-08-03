import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { PlatformSelector } from "@/components/PlatformSelector";
import { RecommendationScreen } from "@/components/RecommendationScreen";
import { TypeSelector } from "@/components/TypeSelector";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { screenFade } from "@/lib/motion";
import type { ContentTypeOption } from "@/types/content-type";
import type { StreamingPlatform } from "@/types/platform";

type AppStep = "welcome" | "platform" | "type" | "recommendation";

export function App() {
  const [step, setStep] = useState<AppStep>("welcome");
  const [selectedPlatform, setSelectedPlatform] =
    useState<StreamingPlatform | null>(null);
  const [selectedType, setSelectedType] = useState<ContentTypeOption | null>(
    null,
  );
  const reduceMotion = useReducedMotion();

  let screen = null;

  if (step === "welcome") {
    screen = (
      <WelcomeScreen
        onStart={() => {
          setStep("platform");
        }}
      />
    );
  } else if (step === "recommendation" && selectedPlatform && selectedType) {
    screen = (
      <RecommendationScreen
        platform={selectedPlatform}
        contentType={selectedType}
        onBack={() => {
          setStep("type");
        }}
      />
    );
  } else if (step === "type" && selectedPlatform) {
    screen = (
      <TypeSelector
        selectedPlatform={selectedPlatform}
        selectedType={selectedType}
        onBack={() => {
          setStep("platform");
        }}
        onSelect={(option) => {
          setSelectedType(option);
          setStep("recommendation");
        }}
      />
    );
  } else {
    screen = (
      <PlatformSelector
        selectedPlatform={selectedPlatform}
        onBack={() => {
          setStep("welcome");
        }}
        onSelect={(platform) => {
          setSelectedPlatform(platform);

          if (selectedPlatform?.id !== platform.id) {
            setSelectedType(null);
          }

          setStep("type");
        }}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        className="min-h-screen"
        initial={reduceMotion ? false : screenFade.initial}
        animate={screenFade.animate}
        transition={reduceMotion ? { duration: 0 } : screenFade.transition}
        {...(reduceMotion ? {} : { exit: screenFade.exit })}
      >
        {screen}
      </motion.div>
    </AnimatePresence>
  );
}
