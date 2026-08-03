import { useState } from "react";
import { PlatformSelector } from "@/components/PlatformSelector";
import { RecommendationScreen } from "@/components/RecommendationScreen";
import { TypeSelector } from "@/components/TypeSelector";
import { WelcomeScreen } from "@/components/WelcomeScreen";
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

  if (step === "welcome") {
    return (
      <WelcomeScreen
        onStart={() => {
          setStep("platform");
        }}
      />
    );
  }

  if (step === "recommendation" && selectedPlatform && selectedType) {
    return (
      <RecommendationScreen
        platform={selectedPlatform}
        contentType={selectedType}
      />
    );
  }

  if (step === "type" && selectedPlatform) {
    return (
      <TypeSelector
        selectedPlatform={selectedPlatform}
        selectedType={selectedType}
        onSelect={(option) => {
          setSelectedType(option);
          setStep("recommendation");
        }}
      />
    );
  }

  return (
    <PlatformSelector
      selectedPlatform={selectedPlatform}
      onSelect={(platform) => {
        setSelectedPlatform(platform);
        setSelectedType(null);
        setStep("type");
      }}
    />
  );
}
