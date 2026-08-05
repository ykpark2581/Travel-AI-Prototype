"use client";

import { Stepper } from "@/components/layout/Stepper";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { BrowserWorkspace } from "@/components/workspace/BrowserWorkspace";
import { useExperimentStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PrototypeShell() {
  const activeStage = useExperimentStore((s) => s.activeStage);
  const condition = useExperimentStore((s) => s.condition);
  const mixedAnalysisActive = useExperimentStore((s) => s.mixedAnalysisActive);

  // The browser workspace only mounts where there's actually something to
  // browse: Human/Mixed's activities/restaurants catalogs, and the final
  // itinerary for every condition. Flights/hotels are chat-only for
  // everyone (see store.ts's startFlightsHotelsSummary), and AI-led never
  // browses at all — its activities/restaurants results are chat cards too
  // (see runAiLedFlow). The chat panel takes the full layout on its own
  // whenever there's no workspace to show.
  //
  // Mixed-led shows the workspace during free browsing (same as human), but
  // hides it again once its analysis timer fires and the AI starts
  // narrating its inferred style in chat (see runMixedAnalysis) — mirrors
  // AI-led's chat-only result reveal for that window without needing a
  // separate stage.
  const showWorkspace =
    activeStage === "itinerary" ||
    ((activeStage === "activities" || activeStage === "restaurants") &&
      (condition === "human" || (condition === "mixed" && !mixedAnalysisActive)));

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-muted/30">
      <Stepper />
      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            "flex min-w-[320px] flex-col border-r bg-background",
            showWorkspace ? "w-full max-w-[480px] lg:w-[30%]" : "mx-auto w-full max-w-2xl"
          )}
        >
          <ChatPanel />
        </div>
        {showWorkspace && (
          <div className="flex flex-1 flex-col p-3">
            <BrowserWorkspace />
          </div>
        )}
      </div>
    </div>
  );
}
