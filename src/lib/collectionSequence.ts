import { MIN_BUBBLE_MS } from "@/lib/constants";

export interface CollectionStep {
  site: string;
  statusText: string;
  durationMs: number;
}

// One step per site, index-aligned 1:1 with the status text pool (both are
// exactly 4 entries — see data/dialogue.ts) — a fixed walk through each
// site with its own line, not shuffled or cycled.
export function buildCollectionPlan(sites: string[], statusTexts: string[]): CollectionStep[] {
  return sites.map((site, i) => ({
    site,
    statusText: statusTexts[i] ?? statusTexts[statusTexts.length - 1],
    durationMs: MIN_BUBBLE_MS + Math.random() * 500,
  }));
}
