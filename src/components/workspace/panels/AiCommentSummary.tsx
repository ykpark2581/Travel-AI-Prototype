"use client";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useExperimentStore } from "@/lib/store";
import * as dialogue from "@/data/dialogue";

// The final itinerary's mandatory wrap-up — one dedicated box at the very
// bottom of the whole plan. Each condition gets a fixed line (see
// dialogue.aiCommentSummary{Human,Mixed,Ai}): mixed-led/AI-led's own what
// the AI actually contributed (preference inference + routing, or ranking +
// full-plan construction); human-led's is a genuine routing/distance
// critique rather than praise for a placement the participant did
// themselves — their per-item cards already carry their own "why this is
// here" line for mixed-led/AI-led (see components/cards/ItineraryDayCard.tsx).
export function AiCommentSummary() {
  const condition = useExperimentStore((s) => s.condition);

  const summary =
    condition === "human"
      ? dialogue.aiCommentSummaryHuman
      : condition === "mixed"
        ? dialogue.aiCommentSummaryMixed
        : dialogue.aiCommentSummaryAi;

  return (
    <Card className="space-y-2 border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
        <Sparkles className="h-4 w-4" />
        {dialogue.aiCommentHeading}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
    </Card>
  );
}
