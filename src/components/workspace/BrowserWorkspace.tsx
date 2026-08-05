"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { AddressBar } from "@/components/workspace/AddressBar";
import { ActivitiesPanel } from "@/components/workspace/panels/ActivitiesPanel";
import { RestaurantsPanel } from "@/components/workspace/panels/RestaurantsPanel";
import { ItineraryPanel } from "@/components/workspace/panels/ItineraryPanel";
import { CardRegistryProvider } from "@/components/workspace/CardRegistryContext";
import { GhostCursor } from "@/components/workspace/GhostCursor";
import { ItemDetailDialog } from "@/components/cards/ItemDetailDialog";
import { LikeLimitDialog } from "@/components/workspace/LikeLimitDialog";
import { useExperimentStore } from "@/lib/store";

export function BrowserWorkspace() {
  const activeStage = useExperimentStore((s) => s.activeStage);
  const loadingStage = useExperimentStore((s) => s.loadingStage);
  const addressUrl = useExperimentStore((s) => s.addressUrl);
  const collectingActive = useExperimentStore((s) => s.collecting.active);
  const recordScrollSample = useExperimentStore((s) => s.recordScrollSample);

  const isLoadingActive = loadingStage !== null && loadingStage === activeStage;
  // Activities/Restaurants are a curated recommendation catalog, not a single
  // website — the address bar only makes sense while the AI is actually
  // driving a fictional search site (flights/hotel, idle, itinerary). The
  // stage-name tab row that used to sit above it was dropped entirely —
  // redundant with the Stepper's progress bar already at the top of the page.
  const showBrowserChrome = activeStage !== "activities" && activeStage !== "restaurants";

  const lastScrollRef = useRef<{ top: number; time: number } | null>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeStage !== "activities" && activeStage !== "restaurants") return;
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
    recordScrollSample(activeStage, (dy / dt) * 1000);
  };

  return (
    <CardRegistryProvider>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
        {showBrowserChrome && <AddressBar url={addressUrl} loading={isLoadingActive} />}

        <div className="min-h-0 flex-1 overflow-y-auto p-5" onScroll={handleScroll}>
          {/* Keyed remount (not AnimatePresence) so each stage change gets a
              fresh fade-in — AnimatePresence's exit-tracking got stuck under
              the frequent state updates earlier automation sequences produced. */}
          {/* This whole component only ever mounts when there's something
              real to show — PrototypeShell's showWorkspace gate means
              activeStage is always "activities"/"restaurants" (human-led, or
              mixed-led while still browsing) or "itinerary" here;
              "flights-hotel" and AI-led's activities/restaurants never reach
              this component at all. */}
          <motion.div
            key={activeStage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {activeStage === "activities" && <ActivitiesPanel loading={isLoadingActive} />}
            {activeStage === "restaurants" && <RestaurantsPanel loading={isLoadingActive} />}
            {activeStage === "itinerary" && <ItineraryPanel loading={isLoadingActive} />}
          </motion.div>
        </div>
      </div>

      {collectingActive && <GhostCursor />}
      <ItemDetailDialog />
      <LikeLimitDialog />
    </CardRegistryProvider>
  );
}
