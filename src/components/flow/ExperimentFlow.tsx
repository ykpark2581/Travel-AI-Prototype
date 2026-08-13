"use client";

import { useEffect } from "react";
import { useExperimentStore } from "@/lib/store";
import { ConsentScreen } from "@/components/flow/ConsentScreen";
import { PreSurveyScreen } from "@/components/flow/PreSurveyScreen";
import { IntroductionScreen } from "@/components/flow/IntroductionScreen";
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
  const jumpToQuestionnaire = useExperimentStore((s) => s.jumpToQuestionnaire);

  // Dev-only shortcut: ?preview=human|mixed|ai skips consent/instructions/
  // scenario and jumps straight into that condition's planning phase — for
  // reviewing a specific condition's behavior without walking the full flow.
  // ?preview=survey instead jumps straight to the final overall survey (see
  // jumpToQuestionnaire). Never linked from participant-facing UI.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("preview");
    if (phase !== "consent" || !requested) return;
    if (requested === "survey") jumpToQuestionnaire();
    else if (PREVIEWABLE_CONDITIONS.includes(requested as Condition)) jumpToCondition(requested as Condition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (phase) {
    case "consent":
      return <ConsentScreen />;
    case "pre-survey":
      return <PreSurveyScreen />;
    case "instructions":
      return <IntroductionScreen />;
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
