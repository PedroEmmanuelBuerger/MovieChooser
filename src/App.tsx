import { useState } from "react";
import { PlatformSelector } from "@/components/PlatformSelector";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import type { StreamingPlatform } from "@/types/platform";

type AppStep = "welcome" | "platform";

export function App() {
  const [step, setStep] = useState<AppStep>("welcome");
  const [selectedPlatform, setSelectedPlatform] =
    useState<StreamingPlatform | null>(null);

  if (step === "welcome") {
    return (
      <WelcomeScreen
        onStart={() => {
          setStep("platform");
        }}
      />
    );
  }

  return (
    <PlatformSelector
      selectedPlatform={selectedPlatform}
      onSelect={setSelectedPlatform}
    />
  );
}
