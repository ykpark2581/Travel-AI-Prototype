"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { consentContent } from "@/data/onboarding";
import { useExperimentStore } from "@/lib/store";

export function ConsentScreen() {
  const [checked, setChecked] = useState([false, false]);
  const acceptConsent = useExperimentStore((s) => s.acceptConsent);

  const allChecked = checked.every(Boolean);

  return (
    <FullScreenCard className="max-w-2xl">
      <h1 className="text-xl font-semibold">{consentContent.title}</h1>

      <div className="mt-6 space-y-4">
        {consentContent.paragraphs.map((p) => (
          <div key={p.heading}>
            <p className="text-sm font-semibold text-foreground">{p.heading}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3 border-t pt-6">
        {consentContent.checkboxes.map((label, i) => (
          <label key={i} className="flex cursor-pointer items-start gap-3 text-sm">
            <Checkbox
              checked={checked[i]}
              onCheckedChange={(value) =>
                setChecked((prev) => prev.map((c, idx) => (idx === i ? value === true : c)))
              }
              className="mt-0.5"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <Button className="mt-8 w-full" size="lg" disabled={!allChecked} onClick={acceptConsent}>
        {consentContent.continueLabel}
      </Button>
    </FullScreenCard>
  );
}
