"use client";

import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { getDestinationBundle } from "@/data/destinations";
import { transitionButton, transitionDescription, transitionTitle } from "@/data/dialogue";
import { useExperimentStore } from "@/lib/store";

export function TransitionScreen() {
  const conditionIndex = useExperimentStore((s) => s.conditionIndex);
  const conditionOrder = useExperimentStore((s) => s.conditionOrder);
  const conditionDestinationMap = useExperimentStore((s) => s.conditionDestinationMap);
  const advanceToNextCondition = useExperimentStore((s) => s.advanceToNextCondition);

  const completedNumber = conditionIndex + 1;
  const nextCondition = conditionOrder[conditionIndex + 1];
  // Reads the participant's own rolled mapping (see store.ts's acceptConsent)
  // rather than the static CONDITION_DESTINATION default — which destination
  // comes next now varies per participant, not just which condition does.
  const nextCity = getDestinationBundle(conditionDestinationMap[nextCondition]).meta.city;

  return (
    <FullScreenCard>
      <h1 className="text-xl font-semibold">{transitionTitle(completedNumber)}</h1>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {transitionDescription(nextCity)}
      </p>
      <Button className="mt-8 w-full" size="lg" onClick={advanceToNextCondition}>
        {transitionButton}
      </Button>
    </FullScreenCard>
  );
}
