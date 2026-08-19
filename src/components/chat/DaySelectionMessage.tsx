"use client";

import { Button } from "@/components/ui/button";
import { useExperimentStore } from "@/lib/store";
import {
  activityStageConfirmLabel,
  humanActivityStageHint,
  humanRestaurantStageHint,
  restaurantStageConfirmLabel,
} from "@/data/dialogue";
import type { DaySelectionPayload } from "@/types";

// Human-led only, step 2 — the AI walks through Day 1-4 one at a time in
// chat (see lib/store.ts's confirmDaySelection). Two stages, not one
// button: `activityStageConfirmed` false shows "액티비티 완료" (see
// lib/store.ts's confirmActivityStage — switches the workspace to the
// 식당 tab without finishing the day, gated on ≥2 activities that day);
// true shows "식당 완료" instead (gated on ≥2 restaurants), which is what
// actually advances to the next day's prompt or, after day 4, runs the
// final plan. Added because the plain workspace tab click alone wasn't
// noticeable enough — nothing in the flow was telling the participant
// "you're done with activities, go look at restaurants now."
export function DaySelectionMessage({ payload }: { payload: DaySelectionPayload }) {
  const confirmActivityStage = useExperimentStore((s) => s.confirmActivityStage);
  const confirmDaySelection = useExperimentStore((s) => s.confirmDaySelection);
  const dayAssignment = useExperimentStore((s) => s.dayPlan[payload.day]);

  if (payload.confirmed) {
    return null;
  }

  const activityCount = dayAssignment?.activityIds.length ?? 0;
  const restaurantCount = dayAssignment?.restaurantIds.length ?? 0;

  if (!payload.activityStageConfirmed) {
    const ready = activityCount >= 2;
    return (
      <div className="space-y-1.5">
        <Button size="sm" disabled={!ready} onClick={() => confirmActivityStage()}>
          {activityStageConfirmLabel}
        </Button>
        {!ready && <p className="text-xs text-muted-foreground">{humanActivityStageHint(activityCount)}</p>}
      </div>
    );
  }

  const ready = restaurantCount >= 2;
  return (
    <div className="mt-3 space-y-1.5">
      <Button size="sm" disabled={!ready} onClick={() => confirmDaySelection(payload.day)}>
        {restaurantStageConfirmLabel}
      </Button>
      {!ready && <p className="text-xs text-muted-foreground">{humanRestaurantStageHint(restaurantCount)}</p>}
    </div>
  );
}
