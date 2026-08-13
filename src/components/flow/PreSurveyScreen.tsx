"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { SurveyForm, allRequiredAnswered } from "@/components/flow/SurveyForm";
import {
  interviewConsentYesLabel,
  preSurveyDescription,
  preSurveyGroups,
  preSurveyItems,
  preSurveyNotes,
  preSurveyTitle,
} from "@/data/questionnaire";
import { useExperimentStore } from "@/lib/store";
import { submitSurveyRow, type PreSurveyPayload } from "@/lib/surveySubmission";

// name/contact only render (and only count toward "required") once
// interview_consent is answered with interviewConsentYesLabel — everyone
// else never sees them at all, matching preSurveyItems' own comment on
// why they're conditional now instead of always-required.
const CONDITIONAL_IDS = ["name", "contact"];

// Shown once, right after consent and before instructions/the first
// condition (see store.ts's phase "pre-survey", between "consent" and
// "instructions" — ExperimentFlow.tsx). Submits as its own row in the SAME
// Google Form/sheet every other survey uses (see docs/SURVEY_SETUP.md and
// data/questionnaire.ts's preSurveyItems comment) rather than a separate
// form, tied to the same auto-generated participantCode as the condition/
// final rows that follow it.
export function PreSurveyScreen() {
  const participantId = useExperimentStore((s) => s.participantId);
  const completePreSurvey = useExperimentStore((s) => s.completePreSurvey);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const interviewOptedIn = answers.interview_consent === interviewConsentYesLabel;
  const visibleItems = preSurveyItems.filter((item) => interviewOptedIn || !CONDITIONAL_IDS.includes(item.id));

  const ready = allRequiredAnswered(visibleItems, answers);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Only ever submit answers for currently-visible items — if the
    // participant picked "예", typed a name, then changed their mind back
    // to "아니요", `answers.name` is still sitting in state at that point;
    // without this filter it would silently ride along in the payload
    // even though the UI (and the participant) now shows it retracted.
    const visibleIds = new Set(visibleItems.map((item) => item.id));
    const scopedAnswers = Object.fromEntries(Object.entries(answers).filter(([id]) => visibleIds.has(id)));
    const payload: PreSurveyPayload = {
      kind: "presurvey",
      participantCode: participantId,
      timestamp: new Date().toISOString(),
      answers: scopedAnswers,
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
          items={visibleItems}
          answers={answers}
          onAnswerChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
          groups={preSurveyGroups}
          notes={preSurveyNotes}
        />
      </div>

      <Button className="mt-8 w-full" size="lg" disabled={!ready || submitting} onClick={handleSubmit}>
        {submitting ? "제출하는 중..." : "제출하고 계속하기"}
      </Button>
    </FullScreenCard>
  );
}
