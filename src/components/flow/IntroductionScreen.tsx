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

      <p className="mt-6 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        {introductionContent.note}
      </p>

      <Button className="mt-8 w-full" size="lg" onClick={acknowledgeIntroduction}>
        {introductionContent.continueLabel}
      </Button>
    </FullScreenCard>
  );
}
