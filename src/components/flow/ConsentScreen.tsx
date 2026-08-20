"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { consentContent } from "@/data/onboarding";
import { useExperimentStore } from "@/lib/store";

// Turns a bare email address inside `text` into a clickable mailto link —
// e.g. consentContent's "연구자 박윤경 (ykpark@yonsei.ac.kr)" line (see
// data/onboarding.ts) — without needing a dedicated per-paragraph `email`
// field the way an earlier version of this content did.
function linkifyEmail(text: string) {
  return text.split(/([\w.+-]+@[\w-]+\.[\w.-]+)/g).map((part, i) =>
    /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(part) ? (
      <a key={i} href={`mailto:${part}`} className="text-primary underline underline-offset-2">
        {part}
      </a>
    ) : (
      part
    )
  );
}

export function ConsentScreen() {
  const [checked, setChecked] = useState<boolean[]>(() => consentContent.checkboxes.map(() => false));
  const acceptConsent = useExperimentStore((s) => s.acceptConsent);

  const allChecked = checked.every(Boolean);

  return (
    <FullScreenCard className="max-w-2xl">
      <h1 className="text-xl font-semibold">{consentContent.title}</h1>

      <div className="mt-6 space-y-4">
        {consentContent.paragraphs.map((p, idx) => (
          // heading is empty for the opening greeting (see
          // data/onboarding.ts) — no bold label line for that one.
          <div key={p.heading || `intro-${idx}`}>
            {p.heading && <p className="text-sm font-semibold text-foreground">{p.heading}</p>}
            {p.body.map((line, i) => (
              <p key={i} className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {linkifyEmail(line)}
              </p>
            ))}
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
