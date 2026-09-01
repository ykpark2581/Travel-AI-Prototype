"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { consentContent } from "@/data/onboarding";
import { useExperimentStore } from "@/lib/store";

// Turns a bare email address inside `text` into a clickable mailto link —
// e.g. consentContent.contactBox's "박윤경 (ykpark@yonsei.ac.kr)" line (see
// data/onboarding.ts) — without needing a dedicated per-field `email`
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

      {/* Former "8. 연구 문의" section — its own distinct callout box
          (same bordered/tinted treatment as IntroductionScreen's note),
          not just another numbered item in the list above, so contact info
          reads as a standing reference at the bottom of the page. */}
      <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
        <p className="text-muted-foreground">{consentContent.contactBox.intro}</p>
        <div className="mt-2 space-y-1">
          {consentContent.contactBox.lines.map((line, i) => (
            <p key={i}>
              {/* Empty label (see data/onboarding.ts's contactBox comment)
                  — a continuation line under the PREVIOUS line's label, so
                  it renders the value alone with no leading ": ". */}
              {line.label && (
                <>
                  <span className="font-medium text-foreground">{line.label}</span>
                  <span className="text-muted-foreground">: </span>
                </>
              )}
              {linkifyEmail(line.value)}
            </p>
          ))}
        </div>
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
