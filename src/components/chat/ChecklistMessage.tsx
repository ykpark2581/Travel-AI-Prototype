"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChecklistPayload } from "@/types";

export function ChecklistMessage({ payload }: { payload: ChecklistPayload }) {
  return (
    <div className="space-y-1.5">
      {payload.items.map((item, i) => {
        const done = i < payload.revealedCount;
        return (
          <div
            key={item}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              done ? "text-foreground" : "text-muted-foreground/50"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                done ? "border-primary bg-primary text-primary-foreground" : "border-current"
              )}
            >
              {done && <Check className="h-2.5 w-2.5" />}
            </span>
            {item}
          </div>
        );
      })}
    </div>
  );
}
