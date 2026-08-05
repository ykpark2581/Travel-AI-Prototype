"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExperimentStore } from "@/lib/store";
import { companionConfirmLabel } from "@/data/dialogue";
import type { CompanionQuestionPayload } from "@/types";

// AI-led's only upfront question — single-select (unlike the old multi-tag
// picker this replaced), asked once for the whole condition.
export function CompanionQuestionMessage({ payload }: { payload: CompanionQuestionPayload }) {
  const confirmCompanion = useExperimentStore((s) => s.confirmCompanion);
  const [selected, setSelected] = useState(payload.selected);

  if (payload.confirmed) {
    return (
      <div className="mt-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {payload.selected}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
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
