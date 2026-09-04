"use client";

import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { screeningFailedContent } from "@/data/onboarding";

// Terminal screen (see store.ts's phase "screening-failed") — shown when
// ScreeningScreen.tsx's answers don't clear data/questionnaire.ts's
// screeningPassAnswers. No continue button and nothing is recorded for
// this path — the participant simply stops here.
export function ScreeningFailedScreen() {
  return (
    <FullScreenCard className="max-w-2xl">
      <h1 className="text-xl font-semibold">{screeningFailedContent.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{screeningFailedContent.body}</p>
    </FullScreenCard>
  );
}
