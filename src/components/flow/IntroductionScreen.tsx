"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FullScreenCard } from "@/components/flow/FullScreenCard";
import { introductionContent } from "@/data/onboarding";
import { useExperimentStore } from "@/lib/store";

export function IntroductionScreen() {
  const acknowledgeIntroduction = useExperimentStore((s) => s.acknowledgeIntroduction);

  return (
    <FullScreenCard>
      <h1 className="text-xl font-semibold">{introductionContent.title}</h1>

      <ul className="mt-6 space-y-3">
        {introductionContent.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {/* Deliberately a different visual treatment from the bullet list
          above (bordered callout, bold, centered) — a mindset instruction,
          not another fact about the study's structure, so it shouldn't
          blend in as a 4th bullet. */}
      <p className="mt-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-center text-sm font-bold text-foreground">
        {introductionContent.note}
      </p>

      <Button className="mt-8 w-full" size="lg" onClick={acknowledgeIntroduction}>
        {introductionContent.continueLabel}
      </Button>
    </FullScreenCard>
  );
}
