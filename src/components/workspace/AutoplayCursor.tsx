"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MousePointer2 } from "lucide-react";
import { useExperimentStore } from "@/lib/store";
import { AUTOPLAY_SKIM_STAGE_MS, AUTOPLAY_SKIM_STAGE_PAUSE_MS, AUTOPLAY_SKIM_RETURN_MS } from "@/lib/constants";

// AI-led only — a single, continuously-mounted cursor for the whole
// explore-panel browsing sequence (mounted once in ExplorePanel.tsx,
// `position: fixed` so it survives scrolling and tab switches). Replaces
// the old per-card AutoplayCursorBubble, which only rendered while a card
// was actively focused (the per-item sweep) and left the skim beat and the
// brief gaps between cards with no visible pointer at all — "마우스가 클릭할
// 때에만 나옴" was exactly that gap. This instead just moves a single
// pointer between target positions (skim path, then each focused card in
// turn), gliding via Framer Motion's `animate` prop rather than
// unmounting/remounting, so it reads as one continuous browsing motion.
// Hidden only while the detail dialog is open (that has its own separate
// enter/exit cursor — see ItemDetailDialog.tsx) and during the brief
// autoplayFocusedItemId:null gaps between steps it simply holds its last
// position rather than jumping, which is what "always visible" actually
// calls for — there's nothing more specific to point at in that instant.
export function AutoplayCursor() {
  const condition = useExperimentStore((s) => s.condition);
  const autoplaySkimming = useExperimentStore((s) => s.autoplaySkimming);
  const autoplayFocusedItemId = useExperimentStore((s) => s.autoplayFocusedItemId);
  const autoplayStatusText = useExperimentStore((s) => s.autoplayStatusText);
  const activeDetailItemId = useExperimentStore((s) => s.activeDetailItemId);

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const skimRunId = useRef(0);

  // Per-item focus sweep — glide to the currently-focused card's on-screen
  // position. ExplorePanel.tsx's own effect kicks off a `scrollIntoView`
  // with `behavior: "smooth"` on the same autoplayFocusedItemId change,
  // which has no fixed duration or completion callback — a single
  // one-shot rAF measurement right after the change reads the card's rect
  // mid-scroll, landing the cursor wherever the card happened to be that
  // frame (reproducible by watching the cursor land far off-screen). This
  // instead keeps re-measuring on every frame for a bounded window
  // (comfortably longer than a "smooth" scrollIntoView ever takes in
  // practice) after the focus change, so the cursor visibly tracks the
  // card as it scrolls into place and lands correctly once it settles,
  // rather than needing to guess a single fixed delay. Stops re-measuring
  // after that window instead of running for the item's entire multi-
  // second dwell — nothing moves the card on its own after the scroll
  // settles, so there's nothing left to track.
  useEffect(() => {
    if (condition !== "ai" || !autoplayFocusedItemId) return;
    const TRACK_MS = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const el = document.getElementById(`explore-card-${autoplayFocusedItemId}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setPos({ x: rect.left + rect.width * 0.6, y: rect.top + rect.height * 0.4 });
      }
      if (now - start < TRACK_MS) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [condition, autoplayFocusedItemId]);

  // Skim beat — glides the cursor down over the visible panel in the same
  // 3-stage-then-back choreography as ExplorePanel's own scroll animation
  // (shared constants keep both timed together). This tracks the panel's
  // own bounding box, not raw scrollTop — it only needs to look like
  // "scanning down the page", not follow the scroll pixel-for-pixel.
  useEffect(() => {
    if (condition !== "ai" || !autoplaySkimming) return;
    const runId = ++skimRunId.current;
    const container = document.getElementById("explore-scroll-container");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = rect.left + rect.width * 0.55;
    let cancelled = false;
    (async () => {
      for (const frac of [0.22, 0.45, 0.68]) {
        if (cancelled || skimRunId.current !== runId) return;
        setPos({ x, y: rect.top + rect.height * frac });
        await new Promise((resolve) => setTimeout(resolve, AUTOPLAY_SKIM_STAGE_MS + AUTOPLAY_SKIM_STAGE_PAUSE_MS));
      }
      if (cancelled || skimRunId.current !== runId) return;
      setPos({ x, y: rect.top + rect.height * 0.22 });
      await new Promise((resolve) => setTimeout(resolve, AUTOPLAY_SKIM_RETURN_MS));
    })();
    return () => {
      cancelled = true;
    };
  }, [condition, autoplaySkimming]);

  if (condition !== "ai" || !pos || activeDetailItemId) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-40"
      initial={{ x: pos.x, y: pos.y }}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="flex flex-col items-start gap-1.5">
        <AnimatePresence mode="wait">
          {autoplayStatusText && (
            <motion.div
              key={autoplayStatusText}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg"
            >
              {autoplayStatusText}
            </motion.div>
          )}
        </AnimatePresence>
        <MousePointer2 className="h-6 w-6 -rotate-12 fill-foreground text-foreground drop-shadow-md" />
      </div>
    </motion.div>
  );
}
