"use client";

import { useEffect } from "react";
import { useExperimentStore } from "@/lib/store";
import { ConsentScreen } from "@/components/flow/ConsentScreen";
import { IntroductionScreen } from "@/components/flow/IntroductionScreen";
import { PromptInputScreen } from "@/components/flow/PromptInputScreen";
import { TransitionScreen } from "@/components/flow/TransitionScreen";
import { ConditionSurveyScreen } from "@/components/flow/ConditionSurveyScreen";
import { QuestionnaireScreen } from "@/components/flow/QuestionnaireScreen";
import { PrototypeShell } from "@/components/layout/PrototypeShell";
import type { Condition } from "@/types";

const PREVIEWABLE_CONDITIONS: Condition[] = ["human", "mixed", "ai"];

export function ExperimentFlow() {
  const phase = useExperimentStore((s) => s.phase);
  const conditionIndex = useExperimentStore((s) => s.conditionIndex);
  const jumpToCondition = useExperimentStore((s) => s.jumpToCondition);

  // Dev-only shortcut: ?preview=human|mixed|ai skips consent/instructions/
  // scenario and jumps straight into that condition's planning phase — for
  // reviewing a specific condition's behavior without walking the full flow.
  // Never linked from participant-facing UI.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("preview");
    if (phase === "consent" && requested && PREVIEWABLE_CONDITIONS.includes(requested as Condition)) {
      jumpToCondition(requested as Condition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (phase) {
    case "consent":
      return <ConsentScreen />;
    case "instructions":
      return <IntroductionScreen />;
    case "prompt":
      return <PromptInputScreen key={conditionIndex} />;
    case "planning":
      return <PrototypeShell key={conditionIndex} />;
    case "condition-survey":
      return <ConditionSurveyScreen key={conditionIndex} />;
    case "transition":
      return <TransitionScreen />;
    case "questionnaire":
      return <QuestionnaireScreen />;
    default:
      return null;
  }
}
