"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { SurveyForm, allRequiredAnswered } from "@/components/flow/SurveyForm";
import { preSurveyDescription, preSurveyGroups, preSurveyItems, preSurveyTitle } from "@/data/questionnaire";
import { useExperimentStore } from "@/lib/store";
import { submitSurveyRow, type PreSurveyPayload } from "@/lib/surveySubmission";

// Shown once, right after consent and before instructions/the first
// condition (see store.ts's phase "pre-survey", between "consent" and
// "instructions" — ExperimentFlow.tsx). Submits as its own row in the SAME
// Google Form/sheet every other survey uses (see docs/SURVEY_SETUP.md and
// data/questionnaire.ts's preSurveyItems comment) rather than a separate
// form, tied to the same auto-generated participantCode as the condition/
// final rows that follow it. Every item here is unconditional now — the
// identifying phone-number/interview-consent questions this screen used to
// gate moved to the very end of the study instead (see QuestionnaireScreen).
export function PreSurveyScreen() {
  const participantId = useExperimentStore((s) => s.participantId);
  const completePreSurvey = useExperimentStore((s) => s.completePreSurvey);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const ready = allRequiredAnswered(preSurveyItems, answers);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: PreSurveyPayload = {
      kind: "presurvey",
      participantCode: participantId,
      timestamp: new Date().toISOString(),
      answers,
    };
    await submitSurveyRow(payload);
    completePreSurvey();
  };

  return (
    <FullScreenCard className="max-w-2xl">
      <h1 className="text-xl font-semibold">{preSurveyTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{preSurveyDescription}</p>

      <div className="mt-8">
        <SurveyForm
          items={preSurveyItems}
          answers={answers}
          onAnswerChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
          groups={preSurveyGroups}
        />
      </div>

      <Button className="mt-8 w-full" size="lg" disabled={!ready || submitting} onClick={handleSubmit}>
        {submitting ? "제출하는 중..." : "제출하고 계속하기"}
      </Button>
    </FullScreenCard>
  );
}
