"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExperimentStore } from "@/lib/store";
import { likeLimitMessage } from "@/data/dialogue";

// Human-led only — shown when a 6th like is attempted on a stage that
// already has the required 5 (see ACTIVITY_SLOTS/RESTAURANT_SLOTS in
// lib/itinerary.ts, and the cap enforced in store.ts's
// toggleLikeActivity/toggleLikeRestaurant).
export function LikeLimitDialog() {
  const likeLimitWarning = useExperimentStore((s) => s.likeLimitWarning);
  const dismissLikeLimitWarning = useExperimentStore((s) => s.dismissLikeLimitWarning);

  const open = likeLimitWarning !== null;
  const label = likeLimitWarning === "activities" ? "액티비티" : "식당";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismissLikeLimitWarning()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>선택 개수 초과</DialogTitle>
          <DialogDescription>{likeLimitWarning && likeLimitMessage(label)}</DialogDescription>
        </DialogHeader>
        <Button className="mt-2 w-full" onClick={dismissLikeLimitWarning}>
          확인
        </Button>
      </DialogContent>
    </Dialog>
  );
}
