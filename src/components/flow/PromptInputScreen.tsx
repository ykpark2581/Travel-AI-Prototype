"use client";

import { motion } from "framer-motion";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { promptPageContent, buildScenarioPoints } from "@/data/onboarding";
import { buildInitialPrompt } from "@/data/dialogue";
import { useExperimentStore } from "@/lib/store";

export function PromptInputScreen() {
  const destinationName = useExperimentStore((s) => s.destinationBundle.meta.name);
  const startPlanningWithPrompt = useExperimentStore((s) => s.startPlanningWithPrompt);
  const scenarioPoints = buildScenarioPoints(destinationName);

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-muted/30 px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-2xl text-center"
      >
        <h1 className="text-4xl font-semibold tracking-tight">{promptPageContent.title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{promptPageContent.subtitle}</p>

        <div className="mt-10 rounded-3xl border bg-background p-6 text-left shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{promptPageContent.scenarioHeading}</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {scenarioPoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          size="lg"
          className="mt-6 px-10"
          onClick={() => startPlanningWithPrompt(buildInitialPrompt(destinationName))}
        >
          {promptPageContent.continueLabel}
        </Button>
      </motion.div>
    </div>
  );
}
