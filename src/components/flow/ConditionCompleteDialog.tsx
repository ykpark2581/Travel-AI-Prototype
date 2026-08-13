"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExperimentStore } from "@/lib/store";
import { conditionCompleteTitle, conditionCompleteDescription, evaluateButtonLabel } from "@/data/dialogue";

// Opened by the final plan message's own "확인했습니다" chat button (see
// lib/store.ts's confirmFinalPlan) — the one beat between "here's your
// itinerary" and the per-condition survey. Deliberately not dismissable any
// other way (no close button, backdrop/Escape ignored via the no-op
// onOpenChange below) — "평가하기" is the only way through, so the
// participant can't end up stuck with the popup half-dismissed and no
// button left to reopen it.
export function ConditionCompleteDialog() {
  const open = useExperimentStore((s) => s.showConditionCompletePopup);
  const conditionIndex = useExperimentStore((s) => s.conditionIndex);
  const proceedToConditionSurvey = useExperimentStore((s) => s.proceedToConditionSurvey);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{conditionCompleteTitle(conditionIndex + 1)}</DialogTitle>
          <DialogDescription>{conditionCompleteDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="w-full" onClick={() => proceedToConditionSurvey()}>
            {evaluateButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
