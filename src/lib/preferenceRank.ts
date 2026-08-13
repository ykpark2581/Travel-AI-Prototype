// Ranks the catalog for the final plan. Mixed-led drives this with its only
// explicit signal — 👍/👎 interest per card (see types/index.ts's Interest,
// cards/ActivityCard.tsx/RestaurantCard.tsx) — on top of the style tag
// inferred from that same signal (see lib/browsingInference.ts). AI-led
// passes no interest at all; it ranks purely by the style tag(s) the
// participant directly picked (see data/dialogue.ts's
// aiLedStyleQuestionIntro, lib/store.ts's confirmStyleQuestion). Human-led
// never calls this — its plan comes straight from the participant's own
// Day 1-4 placement instead (see lib/itinerary.ts's
// generateItineraryFromDayPlan).

import type { Interest } from "@/types";

const INTERESTED_WEIGHT = 5;
const NOT_INTERESTED_PENALTY = -10;
const TAG_WEIGHT = 2;

interface ScorableItem {
  id: string;
  styleTags: string[];
}

export function computePreferenceRank<T extends ScorableItem>(
  items: T[],
  selectedTags: string[] = [],
  interest?: Record<string, Interest>
): string[] {
  const scored = items.map((item) => {
    const tagMatch = selectedTags.length > 0 && item.styleTags.some((t) => selectedTags.includes(t)) ? 1 : 0;
    const itemInterest = interest?.[item.id];
    const interestScore =
      itemInterest === "interested" ? INTERESTED_WEIGHT : itemInterest === "not-interested" ? NOT_INTERESTED_PENALTY : 0;
    return { id: item.id, score: interestScore + TAG_WEIGHT * tagMatch };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.id);
}
