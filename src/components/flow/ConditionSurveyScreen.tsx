"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { SurveyForm, allRequiredAnswered } from "@/components/flow/SurveyForm";
import { conditionSurveyItems } from "@/data/questionnaire";
import { useExperimentStore } from "@/lib/store";
import { submitSurveyRow, type ConditionSurveyPayload } from "@/lib/surveySubmission";

// Shown right after each of the three conditions ends (see store.ts's
// confirmBooking → "condition-survey" phase) — a short reflection on that
// specific experience while it's still fresh, before moving on to either
// the next condition or (after the third) the final overall survey.
export function ConditionSurveyScreen() {
  const participantId = useExperimentStore((s) => s.participantId);
  const conditionIndex = useExperimentStore((s) => s.conditionIndex);
  const condition = useExperimentStore((s) => s.condition);
  const destinationName = useExperimentStore((s) => s.destinationBundle.meta.name);
  const likedActivityCount = useExperimentStore((s) => s.likedActivityIds.length);
  const likedRestaurantCount = useExperimentStore((s) => s.likedRestaurantIds.length);
  const completeConditionSurvey = useExperimentStore((s) => s.completeConditionSurvey);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const block = conditionIndex + 1;
  const ready = allRequiredAnswered(conditionSurveyItems, answers);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: ConditionSurveyPayload = {
      kind: "condition",
      participantCode: participantId,
      timestamp: new Date().toISOString(),
      block,
      condition,
      destination: destinationName,
      likedActivityCount,
      likedRestaurantCount,
      answers,
    };
    await submitSurveyRow(payload);
    completeConditionSurvey();
  };

  return (
    <FullScreenCard className="max-w-2xl">
      <h1 className="text-xl font-semibold">방금 진행하신 여행 계획 과정에 대해 여쭤볼게요</h1>
      <p className="mt-2 text-sm text-muted-foreground">방금 경험을 떠올리며 답변해 주세요.</p>

      <div className="mt-8">
        <SurveyForm
          items={conditionSurveyItems}
          answers={answers}
          onAnswerChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
        />
      </div>

      <Button className="mt-8 w-full" size="lg" disabled={!ready || submitting} onClick={handleSubmit}>
        {submitting ? "제출하는 중..." : "제출하고 계속하기"}
      </Button>
    </FullScreenCard>
  );
}
