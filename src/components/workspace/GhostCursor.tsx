"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useExperimentStore } from "@/lib/store";
import { useCardRegistry } from "@/components/workspace/CardRegistryContext";
import { CursorSpeechBubble } from "@/components/workspace/CursorSpeechBubble";

const SCROLL_SETTLE_MS = 380;

// Deterministic pseudo-random in [0, 1), seeded from the target coordinates
// themselves — a pure function of render inputs (no refs/state needed), so
// it's stable while the cursor sits still but reshuffles on every new target.
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

// Drives the animated cursor dot during collection's site-visiting
// animation (see store.ts's startCollection) — the only place left that
// needs a simulated cursor, now that AI-led's old item-by-item browsing
// autoplay is chat-only result cards instead (see lib/store.ts's
// runAiLedFlow).
export function GhostCursor() {
  const active = useExperimentStore((s) => s.collecting.active);
  const currentSite = useExperimentStore((s) => s.collecting.currentSite);
  const statusText = useExperimentStore((s) => s.collecting.statusText);
  const cursorRect = useExperimentStore((s) => s.cursorRect);
  const setCursorRect = useExperimentStore((s) => s.setCursorRect);

  const { getElement } = useCardRegistry();

  useEffect(() => {
    if (!active || !currentSite) return;
    const el = getElement(currentSite);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const timeout = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setCursorRect({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      });
    }, SCROLL_SETTLE_MS);
    return () => clearTimeout(timeout);
  }, [active, currentSite, getElement, setCursorRect]);

  if (!active || !cursorRect) return null;

  // Fires a click-style ripple whenever the cursor lands on a new site tab.
  const pulseKey = `site-${currentSite ?? "none"}`;

  // Two independent springs (one per axis), each with a randomized-but-stable
  // stiffness/damping derived from the target itself — arriving at slightly
  // different rates on x vs y bows the path into a soft arc instead of a
  // dead-straight line, and the mild underdamping adds a tiny natural settle
  // rather than snapping to a stop.
  const seed = cursorRect.x * 0.013 + cursorRect.y * 0.029;
  const r1 = seededRandom(seed);
  const r2 = seededRandom(seed + 4.121);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <motion.div
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/40"
        animate={{ left: cursorRect.x, top: cursorRect.y, scale: [1, 1.08, 1] }}
        transition={{
          left: { type: "spring", stiffness: 90 + r1 * 70, damping: 13 + r1 * 7 },
          top: { type: "spring", stiffness: 90 + r2 * 70, damping: 13 + r2 * 7 },
          scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        key={pulseKey}
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary"
        style={{ left: cursorRect.x, top: cursorRect.y }}
        initial={{ opacity: 0.6, scale: 1 }}
        animate={{ opacity: 0, scale: 3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      {statusText && <CursorSpeechBubble text={statusText} anchor={cursorRect} />}
    </div>
  );
}
