"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExperimentStore } from "@/lib/store";
import { companionConfirmLabel } from "@/data/dialogue";
import type { CompanionQuestionPayload } from "@/types";

// Every condition's first upfront question — single-select, asked once at
// the start of the activity/restaurant stage, after flights/hotels (see
// lib/store.ts's beginActivityRestaurantStage). Once answered, the pick
// shows up as its own real user chat bubble (see confirmCompanion) rather
// than a pill here, so this renders nothing once confirmed — just hides
// its own buttons.
export function CompanionQuestionMessage({ payload }: { payload: CompanionQuestionPayload }) {
  const confirmCompanion = useExperimentStore((s) => s.confirmCompanion);
  const [selected, setSelected] = useState(payload.selected);

  if (payload.confirmed) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {payload.options.map((option) => {
          const isSelected = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      <Button size="sm" disabled={!selected} onClick={() => confirmCompanion(selected)}>
        {companionConfirmLabel}
      </Button>
    </div>
  );
}
