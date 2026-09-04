"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { SurveyForm, allRequiredAnswered } from "@/components/flow/SurveyForm";
import { screeningDescription, screeningItems, screeningPassAnswers, screeningTitle } from "@/data/questionnaire";
import { useExperimentStore } from "@/lib/store";

// Shown right after consent (see store.ts's phase "screening", between
// "consent" and "pre-survey") — gates access to the actual study against
// consentContent's own selection/exclusion criteria (data/onboarding.ts).
// Nothing here is ever submitted anywhere, pass or fail — `handleSubmit`
// only decides which phase submitScreening advances to next.
export function ScreeningScreen() {
  const submitScreening = useExperimentStore((s) => s.submitScreening);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const ready = allRequiredAnswered(screeningItems, answers);

  const handleSubmit = () => {
    const passed = screeningItems.every((item) => screeningPassAnswers[item.id]?.includes(answers[item.id]));
    submitScreening(passed);
  };

  return (
    <FullScreenCard className="max-w-2xl">
      <h1 className="text-xl font-semibold">{screeningTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{screeningDescription}</p>

      <div className="mt-8">
        <SurveyForm
          items={screeningItems}
          answers={answers}
          onAnswerChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
        />
      </div>

      <Button className="mt-8 w-full" size="lg" disabled={!ready} onClick={handleSubmit}>
        제출하기
      </Button>
    </FullScreenCard>
  );
}
