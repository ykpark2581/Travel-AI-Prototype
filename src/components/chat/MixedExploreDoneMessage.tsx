"use client";

import { Button } from "@/components/ui/button";
import { useExperimentStore } from "@/lib/store";
import {
  activityStageConfirmLabel,
  mixedActivityStageHint,
  mixedRestaurantStageHint,
  restaurantStageConfirmLabel,
} from "@/data/dialogue";
import type { MixedExploreDonePayload } from "@/types";

// Mixed-led only — the free-browse prompt's own two-stage "move on" button,
// attached to that chat message (see lib/store.ts's confirmStyleQuestion). Lives
// here instead of the workspace so the explore panel stays browse/select
// only (see ExplorePanel.tsx's own comment) — every "move on" action across
// the whole flow lives in chat. Same two-stage shape as
// components/chat/DaySelectionMessage.tsx and for the same reason — see
// that component's own comment: `activityStageConfirmed` false shows
// "액티비티 완료" (see lib/store.ts's confirmActivityStage — switches the
// workspace to the 식당 tab, gated on ≥2 관심있음/관심없음 marks on
// activities); true shows "식당 완료" instead (gated on ≥1 mark on
// restaurants, see lib/store.ts's finishMixedExploring for what happens
// once it's ready).
export function MixedExploreDoneMessage({ payload }: { payload: MixedExploreDonePayload }) {
  const confirmActivityStage = useExperimentStore((s) => s.confirmActivityStage);
  const finishMixedExploring = useExperimentStore((s) => s.finishMixedExploring);
  const interestActivityCount = useExperimentStore((s) => Object.keys(s.interestActivity).length);
  const interestRestaurantCount = useExperimentStore((s) => Object.keys(s.interestRestaurant).length);

  if (payload.confirmed) return null;

  if (!payload.activityStageConfirmed) {
    const ready = interestActivityCount >= 2;
    return (
      <div className="space-y-1.5">
        <Button size="sm" disabled={!ready} onClick={() => confirmActivityStage()}>
          {activityStageConfirmLabel}
        </Button>
        {!ready && <p className="text-xs text-muted-foreground">{mixedActivityStageHint(interestActivityCount)}</p>}
      </div>
    );
  }

  const ready = interestRestaurantCount >= 1;
  return (
    <div className="mt-3 space-y-1.5">
      <Button size="sm" disabled={!ready} onClick={() => finishMixedExploring()}>
        {restaurantStageConfirmLabel}
      </Button>
      {!ready && <p className="text-xs text-muted-foreground">{mixedRestaurantStageHint}</p>}
    </div>
  );
}
