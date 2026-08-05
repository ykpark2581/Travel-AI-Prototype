"use client";

import { useEffect } from "react";
import { useExperimentStore } from "@/lib/store";
import type { ExplorationStage } from "@/types";

const SEARCH_LOG_DEBOUNCE_MS = 600;
const MIN_SEARCH_LENGTH = 2;

export function useSearchQueryLogger(stage: ExplorationStage, query: string, enabled: boolean) {
  const recordSearchQuery = useExperimentStore((s) => s.recordSearchQuery);

  useEffect(() => {
    if (!enabled) return;
    const trimmed = query.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) return;
    const timeout = setTimeout(() => recordSearchQuery(stage, trimmed), SEARCH_LOG_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [stage, query, enabled, recordSearchQuery]);
}
