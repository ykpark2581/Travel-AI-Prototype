// Ranks the catalog for the final plan. Mixed-led drives this with its only
// explicit signal — 👍/👎 interest per card (see types/index.ts's Interest,
// cards/ActivityCard.tsx/RestaurantCard.tsx) — on top of the style tag
// inferred from that same signal (see lib/browsingInference.ts). AI-led
// passes no interest at all; it ranks purely by the style tag(s) the
// participant directly picked (see data/dialogue.ts's styleQuestion,
// lib/store.ts's confirmStyleQuestion). Human-led
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

// Mixed-led's version of the ranking above. The participant marks exactly
// 2 cards 관심있음 and 2 cards 관심없음 per stage (see lib/interestLimits.ts),
// and the final plan treats those marks as follows:
//   1. the 2 liked cards are GUARANTEED a slot, whatever their score — they
//      also bypass the per-category cap below (though they still count
//      toward it, so they can't be joined by a full set of same-category
//      AI picks);
//   2. the 2 disliked cards are removed from the candidate pool outright
//      (not just penalized);
//   3. every remaining slot is filled by the AI from the rest of the pool,
//      scored on the inferred style tag, rating, and proximity to the hotel
//      — plus how similar the card is to what the participant liked
//      (shares its category or a style tag: +SIMILAR_TO_LIKED_WEIGHT) or
//      disliked (−SIMILAR_TO_DISLIKED_PENALTY), so those slots really do
//      reflect the participant's taste, matching the "여행 스타일을 파악해"
//      promise in the chat prompt (data/dialogue.ts's mixedExplorationPrompt);
//   4. WHICH day/slot each pick lands in is the AI's call too — this
//      function only decides the set; lib/itinerary.ts lays it out.
// Returns the liked ids first, then the AI's picks in score order (a caller
// slicing to `slotCount` gets the final set).
const RATING_WEIGHT = 1.5; // per rating point above a 4.0 baseline
const NEARBY_WEIGHT = 1.5;
const SIMILAR_TO_LIKED_WEIGHT = 2;
const SIMILAR_TO_DISLIKED_PENALTY = 2;
const MAX_PER_CATEGORY = 3;

interface MixedScorableItem extends ScorableItem {
  rating: number;
  category: string;
  area?: string;
}

// Shares a category or at least one style tag with any of `others`.
function isSimilarToAny<T extends MixedScorableItem>(item: T, others: T[]): boolean {
  return others.some((o) => o.category === item.category || o.styleTags.some((t) => item.styleTags.includes(t)));
}

export function computeMixedPreferenceRank<T extends MixedScorableItem>(
  items: T[],
  selectedTags: string[],
  interest: Record<string, Interest> | undefined,
  slotCount: number,
  hotelArea?: string
): string[] {
  const likedItems = items.filter((i) => interest?.[i.id] === "interested");
  const dislikedItems = items.filter((i) => interest?.[i.id] === "not-interested");
  const pool = items.filter((i) => !interest?.[i.id]);

  const scoreOf = (item: T) => {
    const tagMatch = selectedTags.length > 0 && item.styleTags.some((t) => selectedTags.includes(t)) ? 1 : 0;
    const ratingScore = Math.max(0, item.rating - 4) * RATING_WEIGHT;
    const nearbyScore = hotelArea && item.area === hotelArea ? NEARBY_WEIGHT : 0;
    const likedScore = isSimilarToAny(item, likedItems) ? SIMILAR_TO_LIKED_WEIGHT : 0;
    const dislikedScore = isSimilarToAny(item, dislikedItems) ? -SIMILAR_TO_DISLIKED_PENALTY : 0;
    return TAG_WEIGHT * tagMatch + ratingScore + nearbyScore + likedScore + dislikedScore;
  };

  // Liked cards go in unconditionally (best-rated first if there were ever
  // more of them than slots), bypassing the category cap below.
  const guaranteed = [...likedItems].sort((x, y) => scoreOf(y) - scoreOf(x)).slice(0, slotCount);
  const categoryCounts = new Map<string, number>();
  for (const item of guaranteed) categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);

  const scored = pool.map((item) => ({ item, score: scoreOf(item) })).sort((a, b) => b.score - a.score);

  const ordered: T[] = [];
  const deferred: T[] = [];
  for (const { item } of scored) {
    const count = categoryCounts.get(item.category) ?? 0;
    if (guaranteed.length + ordered.length < slotCount && count >= MAX_PER_CATEGORY) {
      deferred.push(item);
      continue;
    }
    ordered.push(item);
    categoryCounts.set(item.category, count + 1);
  }
  return [...guaranteed, ...ordered, ...deferred].map((i) => i.id);
}
