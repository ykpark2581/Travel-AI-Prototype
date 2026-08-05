import { TRAVEL_STYLE_TAGS } from "@/data/tags";
import type { StageBrowsingSignals, TravelStyleTag } from "@/types";

// Mixed-led's "AI analyzes your browsing" moment (see lib/store.ts's
// runMixedAnalysis) needs a real, defensible answer — not flavor text — so
// this scores each style tag from the participant's actual signals:
// hearts count most (an explicit choice), hover/detail time on browsed
// items count for less (just attention, not commitment). The tag with the
// highest score wins; ties break toward catalog order for determinism.
const LIKE_WEIGHT = 3;
const HOVER_MS_WEIGHT = 1 / 4000; // ~4s of hover ≈ one point
const DETAIL_MS_WEIGHT = 1 / 3000; // ~3s in the detail view ≈ one point, slightly more attentive than a hover

interface StyleTaggedItem {
  id: string;
  styleTags: TravelStyleTag[];
}

// Returns the single best-supported style tag, or null if there's no signal
// at all to infer from (nothing liked or browsed — e.g. the participant let
// the timer run out without interacting).
export function inferStyleTagFromBrowsing<T extends StyleTaggedItem>(
  items: T[],
  likedIds: string[],
  signals: StageBrowsingSignals
): TravelStyleTag | null {
  const scores = new Map<TravelStyleTag, number>(TRAVEL_STYLE_TAGS.map((tag) => [tag, 0]));

  for (const item of items) {
    const itemSignal = signals.items[item.id];
    const liked = likedIds.includes(item.id);
    const attentionMs = (itemSignal?.hoverMs ?? 0) * HOVER_MS_WEIGHT + (itemSignal?.detailMs ?? 0) * DETAIL_MS_WEIGHT;
    if (!liked && attentionMs === 0) continue;
    const points = (liked ? LIKE_WEIGHT : 0) + attentionMs;
    for (const tag of item.styleTags) {
      scores.set(tag, (scores.get(tag) ?? 0) + points);
    }
  }

  let best: TravelStyleTag | null = null;
  let bestScore = 0;
  for (const tag of TRAVEL_STYLE_TAGS) {
    const score = scores.get(tag) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = tag;
    }
  }
  return best;
}
