"use client";

import { useRef } from "react";
import { useExperimentStore } from "@/lib/store";
import type { ExplorationStage } from "@/types";

const MIN_TRACKED_HOVER_MS = 250;

export function useHoverTracking(stage: ExplorationStage, itemId: string, enabled: boolean) {
  const hoverStartRef = useRef<number | null>(null);
  const recordHover = useExperimentStore((s) => s.recordHover);

  const onMouseEnter = () => {
    if (!enabled) return;
    hoverStartRef.current = performance.now();
  };

  const onMouseLeave = () => {
    if (!enabled || hoverStartRef.current === null) return;
    const duration = performance.now() - hoverStartRef.current;
    hoverStartRef.current = null;
    if (duration > MIN_TRACKED_HOVER_MS) recordHover(stage, itemId, duration);
  };

  return { onMouseEnter, onMouseLeave };
}
