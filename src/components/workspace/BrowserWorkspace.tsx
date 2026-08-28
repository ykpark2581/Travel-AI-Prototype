"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ExplorePanel } from "@/components/workspace/ExplorePanel";
import { ItineraryPanel } from "@/components/workspace/panels/ItineraryPanel";
import { AiWorkingPanel } from "@/components/workspace/AiWorkingPanel";
import { ItemDetailDialog } from "@/components/cards/ItemDetailDialog";
import { useExperimentStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BrowserWorkspace() {
  const activeStage = useExperimentStore((s) => s.activeStage);
  const loadingStage = useExperimentStore((s) => s.loadingStage);
  const aiWorking = useExperimentStore((s) => s.aiWorking);
  const aiWorkingLabel = useExperimentStore((s) => s.aiWorkingLabel);
  const aiWorkingSpinning = useExperimentStore((s) => s.aiWorkingSpinning);
  const condition = useExperimentStore((s) => s.condition);
  const recordScrollSample = useExperimentStore((s) => s.recordScrollSample);

  const isLoadingActive = loadingStage !== null && loadingStage === activeStage;
  // Human-led/mixed-led show the real catalog the instant their site
  // checklist finishes (see lib/store.ts's confirmStyleQuestion). AI-led
  // instead keeps `aiWorking` true a beat longer — the search itself is
  // done by then (see aiWorkingSpinning, which swaps the panel's spinner
  // for a static checkmark for exactly this stretch), but the catalog stays
  // hidden until runAiAutoplay actually has a ranked order to reveal and
  // starts narrating it — showing the raw, unranked list for even a moment
  // wouldn't be allowed in a watch-only condition.
  const showingCatalog = activeStage === "explore" && !aiWorking;
  // Genuinely idle (before any checklist has started — e.g. still waiting
  // on the companion question) shows nothing at all in the workspace,
  // rather than a working-panel claiming the AI is doing something it
  // isn't — see AiWorkingPanel.tsx, only ever shown while `aiWorking` is
  // actually true.

  // AI-led's catalog is watch-only — no clicks, no card actions (see
  // ExplorePanel.tsx's isAiAutoplay) — but nothing there stopped the
  // participant from scrolling the panel themselves with a wheel/trackpad,
  // which isn't "그냥 바라만 볼 수 있음" either. `overflow-y: hidden` blocks
  // user-driven scrolling (no scrollbar, no wheel/trackpad/keyboard
  // response) while leaving script-driven scrolling untouched — the
  // autoplay's own animateScrollTop/scrollIntoView calls (see
  // ExplorePanel.tsx) set `scrollTop` directly, which still works on an
  // overflow:hidden element regardless of user input being blocked.
  const blockManualScroll = condition === "ai" && showingCatalog;

  const lastScrollRef = useRef<{ top: number; time: number } | null>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // AI-led's own scroll-skim animation (see components/workspace/
    // ExplorePanel.tsx) drives this same container's scrollTop — recording
    // it here would misrepresent the AI's own scrolling as participant
    // browsing behavior, the same concern ItemDetailDialog.tsx's
    // recordDetailDuration guard already covers for autoplay-driven
    // detail-dialog opens.
    if (activeStage !== "explore" || condition === "ai") return;
    const now = performance.now();
    const top = e.currentTarget.scrollTop;
    const last = lastScrollRef.current;
    if (!last) {
      lastScrollRef.current = { top, time: now };
      return;
    }
    const dt = now - last.time;
    if (dt < 80) return; // throttle sampling
    const dy = Math.abs(top - last.top);
    lastScrollRef.current = { top, time: now };
    if (dy < 2) return;
    // The scroll sample doesn't distinguish which tab it happened on — that
    // was true before this merge too (both stages shared the same sampling
    // logic) — "activities" is just this call's fixed bucket now.
    recordScrollSample("activities", (dy / dt) * 1000);
  };

  return (
    <>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
        {/* @container: the card grids inside (ExplorePanel) size their
            columns off this column's own width, not the viewport's — chat
            always sits alongside it (see PrototypeShell), so it's
            frequently much narrower than the viewport itself. */}
        <div
          id="explore-scroll-container"
          className={cn(
            "@container min-h-0 flex-1 p-5",
            blockManualScroll ? "overflow-y-hidden" : "overflow-y-auto"
          )}
          onScroll={handleScroll}
        >
          {/* Keyed remount (not AnimatePresence) so each stage change gets a
              fresh fade-in — AnimatePresence's exit-tracking got stuck under
              the frequent state updates earlier automation sequences produced. */}
          <motion.div
            key={activeStage ?? "idle"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {showingCatalog ? (
              <ExplorePanel loading={isLoadingActive} />
            ) : activeStage === "itinerary" ? (
              <ItineraryPanel loading={isLoadingActive} />
            ) : aiWorking ? (
              <AiWorkingPanel text={aiWorkingLabel} spinning={aiWorkingSpinning} />
            ) : null}
          </motion.div>
        </div>
      </div>

      <ItemDetailDialog />
    </>
  );
}
