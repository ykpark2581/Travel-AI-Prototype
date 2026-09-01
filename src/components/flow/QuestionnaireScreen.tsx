"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { SurveyForm, allRequiredAnswered } from "@/components/flow/SurveyForm";
import {
  finalSurveyItems,
  pilotSurveyDescription,
  pilotSurveyItems,
  pilotSurveyTitle,
  rewardSurveyDescription,
  rewardSurveyItems,
  rewardSurveyNotes,
  rewardSurveyTitle,
} from "@/data/questionnaire";
import { useExperimentStore } from "@/lib/store";
import { submitSurveyRow, type FinalSurveyPayload } from "@/lib/surveySubmission";

// Shown once, after all three conditions and their per-condition surveys
// are done — PILOT BRANCH: three steps in this one screen (main study has
// only two — see git history), still just one phase (see lib/store.ts's
// Phase type, still just "questionnaire"). Step 1 is a final comparative
// reflection across the three planning conditions (finalSurveyItems); step
// 2 is pilot-only usability feedback on the PROTOTYPE/PROCEDURE itself
// (pilotSurveyItems); "다음"/"다음" only advance local state, nothing is
// submitted yet. Step 3 is the reward step (rewardSurveyItems — phone
// number for the participation gift; no interview-consent question on this
// branch, unlike main), and "제출" submits all three steps' answers
// together as one combined final row (see api/survey/route.ts) — this is
// the last submission of the study, so there's no later submission to
// piggyback a retry on if it fails (see surveySubmission.ts) — the
// thank-you screen shows regardless, since there's nothing more the
// participant can usefully do either way.
export function QuestionnaireScreen() {
  const participantId = useExperimentStore((s) => s.participantId);
  const conditionOrder = useExperimentStore((s) => s.conditionOrder);

  const [step, setStep] = useState<"satisfaction" | "pilotFeedback" | "reward">("satisfaction");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const satisfactionReady = allRequiredAnswered(finalSurveyItems, answers);
  const pilotFeedbackReady = allRequiredAnswered(pilotSurveyItems, answers);
  const rewardReady = allRequiredAnswered(rewardSurveyItems, answers);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: FinalSurveyPayload = {
      kind: "final",
      participantCode: participantId,
      timestamp: new Date().toISOString(),
      conditionOrder: conditionOrder.join("-"),
      answers,
    };
    await submitSurveyRow(payload);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <FullScreenCard>
        <h1 className="text-xl font-semibold">참여해 주셔서 감사합니다!</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          모든 과업이 완료되었습니다. 입력해 주신 번호로 모바일 상품권을 보내드리겠습니다. 소중한 시간을 내어
          연구에 참여해 주셔서 진심으로 감사드립니다.
        </p>
      </FullScreenCard>
    );
  }

  if (step === "reward") {
    return (
      <FullScreenCard className="max-w-2xl">
        <h1 className="text-xl font-semibold">{rewardSurveyTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rewardSurveyDescription}</p>

        <div className="mt-8">
          <SurveyForm
            items={rewardSurveyItems}
            answers={answers}
            onAnswerChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
            notes={rewardSurveyNotes}
          />
        </div>

        <Button className="mt-8 w-full" size="lg" disabled={!rewardReady || submitting} onClick={handleSubmit}>
          {submitting ? "제출하는 중..." : "제출하기"}
        </Button>
      </FullScreenCard>
    );
  }

  if (step === "pilotFeedback") {
    return (
      <FullScreenCard className="max-w-2xl">
        <h1 className="text-xl font-semibold">{pilotSurveyTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{pilotSurveyDescription}</p>

        <div className="mt-8">
          <SurveyForm
            items={pilotSurveyItems}
            answers={answers}
            onAnswerChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
          />
        </div>

        <Button className="mt-8 w-full" size="lg" disabled={!pilotFeedbackReady} onClick={() => setStep("reward")}>
          다음
        </Button>
      </FullScreenCard>
    );
  }

  return (
    <FullScreenCard className="max-w-2xl">
      <h1 className="text-xl font-semibold">마지막 설문</h1>
      <p className="mt-2 text-sm text-muted-foreground">방금 경험한 세 가지 여행 계획 과정을 떠올리며 답변해 주세요.</p>

      <div className="mt-8">
        <SurveyForm
          items={finalSurveyItems}
          answers={answers}
          onAnswerChange={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
        />
      </div>

      <Button
        className="mt-8 w-full"
        size="lg"
        disabled={!satisfactionReady}
        onClick={() => setStep("pilotFeedback")}
      >
        다음
      </Button>
    </FullScreenCard>
  );
}
