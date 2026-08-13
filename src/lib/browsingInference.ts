import { TRAVEL_STYLE_TAGS } from "@/data/tags";
import type { Interest, TravelStyleTag } from "@/types";

// Mixed-led's only browsing signal — a 👍/👎 button on every card (see
// cards/ActivityCard.tsx, cards/RestaurantCard.tsx). Hover/detail-view time
// is still recorded for realism (see lib/store.ts's recordHover/
// recordDetailDuration) but no longer feeds this inference at all —
// "관심있음"/"관심없음" is the sole signal.

interface StyleTaggedItem {
  id: string;
  styleTags: TravelStyleTag[];
}

// Returns the single best-supported style tag, or null if nothing has been
// marked "interested" yet to infer from.
export function inferStyleTagFromInterest<T extends StyleTaggedItem>(
  items: T[],
  interest: Record<string, Interest>
): TravelStyleTag | null {
  const scores = new Map<TravelStyleTag, number>(TRAVEL_STYLE_TAGS.map((tag) => [tag, 0]));

  for (const item of items) {
    if (interest[item.id] !== "interested") continue;
    for (const tag of item.styleTags) {
      scores.set(tag, (scores.get(tag) ?? 0) + 1);
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
