import { useExperimentStore } from "@/lib/store";
import { isInterestBlocked } from "@/lib/interestLimits";
import type { ExplorationStage } from "@/types";

// For a card/dialog's own 👍/👎 buttons: whether pressing each one would be
// refused right now because its slots in this stage are already full.
export function useInterestBlocked(stage: ExplorationStage, id: string) {
  const map = useExperimentStore((s) => (stage === "activities" ? s.interestActivity : s.interestRestaurant));
  return {
    interestedBlocked: isInterestBlocked(map, id, "interested"),
    notInterestedBlocked: isInterestBlocked(map, id, "not-interested"),
  };
}
