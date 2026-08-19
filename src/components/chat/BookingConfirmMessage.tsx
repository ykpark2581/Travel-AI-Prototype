"use client";

import { Button } from "@/components/ui/button";
import { useExperimentStore } from "@/lib/store";
import { bookingConfirmLabel } from "@/data/dialogue";
import type { BookingConfirmPayload } from "@/types";

// Every condition — attached to the final "확인해 보세요!" plan message
// (see lib/store.ts's sendFinalPlanMessage). The itinerary workspace panel
// is pure display (see ItineraryPanel.tsx), so this is the only "move on"
// control at the very end of a condition — clicking it opens
// components/flow/ConditionCompleteDialog.tsx (see confirmFinalPlan).
export function BookingConfirmMessage({ payload }: { payload: BookingConfirmPayload }) {
  const confirmFinalPlan = useExperimentStore((s) => s.confirmFinalPlan);

  if (payload.confirmed) return null;

  return (
    <Button size="sm" onClick={() => confirmFinalPlan()}>
      {bookingConfirmLabel}
    </Button>
  );
}
