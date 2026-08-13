"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { consentContent } from "@/data/onboarding";
import { useExperimentStore } from "@/lib/store";

// consentContent's checkboxes now include one for name/contact-info
// collection (see data/onboarding.ts) — the copy itself promises that
// data gets collected for follow-up interview selection, but nothing in
// this flow actually collects a name or phone number yet (acceptConsent()
// still only auto-generates the anonymous participant code, see store.ts's
// ensureParticipantId/makeParticipantCode). Flagging this gap rather than
// silently building a collection form: where that name/contact step lives
// (its own field here vs. folded into the pre-survey vs. collected
// entirely outside the app) is a real design decision for the researcher,
// not something to guess at.
export function ConsentScreen() {
  const [checked, setChecked] = useState<boolean[]>(() => consentContent.checkboxes.map(() => false));
  const acceptConsent = useExperimentStore((s) => s.acceptConsent);

  const allChecked = checked.every(Boolean);

  return (
    <FullScreenCard className="max-w-2xl">
      <h1 className="text-xl font-semibold">{consentContent.title}</h1>

      <div className="mt-6 space-y-4">
        {consentContent.paragraphs.map((p) => (
          <div key={p.heading}>
            <p className="text-sm font-semibold text-foreground">{p.heading}</p>
            {p.body.map((line, i) => (
              <p key={i} className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {line}
              </p>
            ))}
            {/* Only the 문의처 paragraph sets this — see its own comment
                in data/onboarding.ts. */}
            {"email" in p && p.email && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                문의처{"　"}
                <a href={`mailto:${p.email}`} className="text-primary underline underline-offset-2">
                  {p.email}
                </a>
              </p>
            )}
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
