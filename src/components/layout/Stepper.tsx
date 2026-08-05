"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { stages } from "@/data/stages";
import { useExperimentStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Stepper() {
  const activeStage = useExperimentStore((s) => s.activeStage);
  const unlockedStages = useExperimentStore((s) => s.unlockedStages);

  return (
    <div className="flex w-full items-center justify-center gap-2 border-b bg-background/95 px-6 py-4 backdrop-blur">
      {stages.map((stage, i) => {
        const isUnlocked = unlockedStages.includes(stage.id);
        const isActive = stage.id === activeStage;

        return (
          <div key={stage.id} className="flex flex-1 items-center last:flex-none">
            <div className={cn("flex items-center gap-2.5 rounded-full px-3 py-1.5 text-sm font-medium", isActive && "bg-muted")}>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : isUnlocked
                      ? "border-primary/60 text-primary"
                      : "border-border text-muted-foreground"
                )}
              >
                {isUnlocked && !isActive ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden sm:inline", isActive ? "text-foreground" : "text-muted-foreground")}>
                {stage.label}
              </span>
            </div>

            {i < stages.length - 1 && (
              <div className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-border sm:mx-2">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: unlockedStages.includes(stages[i + 1].id) ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
