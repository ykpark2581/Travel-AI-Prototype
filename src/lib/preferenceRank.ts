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

// Mixed-led's fuller version of the ranking above — same 👍/👎 interest +
// inferred-tag signal, but also weighs rating and (when hotelArea is given)
// proximity to the hotel, then thins out any one category once it's
// already claimed MAX_PER_CATEGORY of the slots actually being filled, so
// the final N doesn't just read as "everything marked 관심있음, in score
// order" — the AI is meant to visibly compare and select, not relay the
// 👍 list untouched (see lib/itinerary.ts's generateItinerary, gated on
// condition === "mixed" so AI-led keeps calling plain computePreferenceRank
// above, completely unaffected by any of this).
//
// Interest still dominates every other factor by a wide margin — an
// interested item's score floor (INTERESTED_WEIGHT) sits well above an
// uninterested item's ceiling from rating/nearby/tag alone — so this never
// invents a reason to drop a clearly-preferred pick just to prove AI
// involvement; the extra signals only ever decide close calls (ties among
// several interested items, or which non-interested items fill any
// remaining slots).
const RATING_WEIGHT = 1.5; // per rating point above a 4.0 baseline
const NEARBY_WEIGHT = 1.5;
const MAX_PER_CATEGORY = 3;

interface MixedScorableItem extends ScorableItem {
  rating: number;
  category: string;
  area?: string;
}

export function computeMixedPreferenceRank<T extends MixedScorableItem>(
  items: T[],
  selectedTags: string[],
  interest: Record<string, Interest> | undefined,
  slotCount: number,
  hotelArea?: string
): string[] {
  const scored = items
    .map((item) => {
      const tagMatch = selectedTags.length > 0 && item.styleTags.some((t) => selectedTags.includes(t)) ? 1 : 0;
      const itemInterest = interest?.[item.id];
      const interestScore =
        itemInterest === "interested"
          ? INTERESTED_WEIGHT
          : itemInterest === "not-interested"
            ? NOT_INTERESTED_PENALTY
            : 0;
      const ratingScore = Math.max(0, item.rating - 4) * RATING_WEIGHT;
      const nearbyScore = hotelArea && item.area === hotelArea ? NEARBY_WEIGHT : 0;
      return { item, score: interestScore + TAG_WEIGHT * tagMatch + ratingScore + nearbyScore };
    })
    .sort((a, b) => b.score - a.score);

  // Greedily fills the first `slotCount` positions respecting the
  // per-category cap, then appends whatever got deferred for that reason —
  // still in score order — after. A caller slicing to `slotCount` (see
  // lib/itinerary.ts) gets a diversified result; slicing to anything else
  // still gets a sensible full ranking, just without the cap applied past
  // the window it was computed for.
  const ordered: T[] = [];
  const deferred: T[] = [];
  const categoryCounts = new Map<string, number>();
  for (const { item } of scored) {
    const count = categoryCounts.get(item.category) ?? 0;
    if (ordered.length < slotCount && count >= MAX_PER_CATEGORY) {
      deferred.push(item);
      continue;
    }
    ordered.push(item);
    categoryCounts.set(item.category, count + 1);
  }
  ordered.push(...deferred);

  return ordered.map((i) => i.id);
}
