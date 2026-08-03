import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { AppSidebar, type AppSection } from "@/components/AppSidebar";
import { GenreSelector } from "@/components/GenreSelector";
import { HistoryScreen } from "@/components/HistoryScreen";
import { PlatformSelector } from "@/components/PlatformSelector";
import { RecommendationScreen } from "@/components/RecommendationScreen";
import { TypeSelector } from "@/components/TypeSelector";
import { WatchedScreen } from "@/components/WatchedScreen";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { LibraryProvider } from "@/context/LibraryContext";
import { screenFade } from "@/lib/motion";
import type { ContentTypeOption } from "@/types/content-type";
import type { GenreSelection } from "@/types/genre";
import type { StreamingPlatform } from "@/types/platform";

type AppStep = "welcome" | "platform" | "type" | "genre" | "recommendation";

function DiscoverFlow() {
  const [step, setStep] = useState<AppStep>("welcome");
  const [selectedPlatform, setSelectedPlatform] =
    useState<StreamingPlatform | null>(null);
  const [selectedType, setSelectedType] = useState<ContentTypeOption | null>(
    null,
  );
  const [selectedGenre, setSelectedGenre] = useState<GenreSelection | null>(
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
  } else if (
    step === "recommendation" &&
    selectedPlatform &&
    selectedType &&
    selectedGenre
  ) {
    screen = (
      <RecommendationScreen
        platform={selectedPlatform}
        contentType={selectedType}
        selectedGenre={selectedGenre}
        onBack={() => {
          setStep("genre");
        }}
      />
    );
  } else if (step === "genre" && selectedPlatform && selectedType) {
    screen = (
      <GenreSelector
        selectedPlatform={selectedPlatform}
        selectedType={selectedType}
        selectedGenre={selectedGenre}
        onBack={() => {
          setStep("type");
        }}
        onSelect={(genre) => {
          setSelectedGenre(genre);
          setStep("recommendation");
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

          if (selectedType?.id !== option.id) {
            setSelectedGenre(null);
          }

          setStep("genre");
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
            setSelectedGenre(null);
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

export function App() {
  const [section, setSection] = useState<AppSection>("discover");
  const reduceMotion = useReducedMotion();

  return (
    <LibraryProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar activeSection={section} onNavigate={setSection} />

        <div className="min-h-screen min-w-0 flex-1 overflow-y-auto">
          <div
            className={section === "discover" ? "min-h-screen" : "hidden"}
            aria-hidden={section !== "discover"}
          >
            <DiscoverFlow />
          </div>

          <AnimatePresence mode="wait">
            {section !== "discover" ? (
              <motion.div
                key={section}
                className="min-h-screen"
                initial={reduceMotion ? false : screenFade.initial}
                animate={screenFade.animate}
                transition={
                  reduceMotion ? { duration: 0 } : screenFade.transition
                }
                {...(reduceMotion ? {} : { exit: screenFade.exit })}
              >
                {section === "history" ? <HistoryScreen /> : null}
                {section === "watched" ? <WatchedScreen /> : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </LibraryProvider>
  );
}
