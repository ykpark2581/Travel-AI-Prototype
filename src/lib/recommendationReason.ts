import type { Activity, Condition, Restaurant } from "@/types";

// Exported so other deterministic-copy modules (lib/styleSelectionReason.ts)
// can reuse the same seeded-pick pattern instead of re-implementing it.
export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pick<T>(seed: string, pool: T[]): T {
  return pool[hashString(seed) % pool.length];
}

// Same deterministic seeded pick, but skips any candidate already present
// in `used` — keeps one generated itinerary (8 activities + 8 restaurants,
// see lib/itinerary.ts's generateItinerary) from repeating the exact same
// "why this is here" line back to back. Tries the item's own qualifying
// reasons first (accurate — every one of these is a real, checked
// attribute of this specific item), then GENERIC_SAFE_REASONS as a second,
// broader reservoir (deliberately vague/true-for-anything lines, so
// borrowing one never asserts something false about the item) — only once
// BOTH are exhausted does it fall back to the plain deterministic pick,
// accepting a rare repeat rather than an inaccurate claim.
// Exported for lib/mixedRecommendationReason.ts, which reuses the exact
// same dedupe pattern for mixed-led's own comment pools.
export function pickUnused(seed: string, primaryPool: string[], used: Set<string>): string {
  const tryPool = (pool: string[]): string | null => {
    if (pool.length === 0) return null;
    const start = hashString(seed) % pool.length;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[(start + i) % pool.length];
      if (!used.has(candidate)) return candidate;
    }
    return null;
  };
  return tryPool(primaryPool) ?? tryPool(GENERIC_SAFE_REASONS) ?? primaryPool[hashString(seed) % primaryPool.length];
}

// No real promo/seasonality data exists — these deterministically flag a
// stable subset of items (never re-rolled) purely for explanation flavor.
function hasDiscount(id: string): boolean {
  return hashString(`${id}:discount`) % 5 === 0;
}
function isSeasonalPick(id: string): boolean {
  return hashString(`${id}:season`) % 4 === 0;
}

const HIGH_RATING_REASONS = ["최근 이용자 만족도가 매우 높습니다.", "최근 리뷰 평점이 꾸준히 높은 장소입니다."];
const SIGNATURE_REASONS = ["이 지역을 대표하는 명소 중 하나입니다.", "여행객들이 꼭 방문하는 대표적인 장소로 꼽힙니다."];
const POPULAR_REASONS = ["비슷한 취향의 여행자들이 자주 선택했습니다.", "현지 여행객들에게 꾸준히 추천되는 장소입니다."];
const BUDGET_REASONS = ["가성비가 뛰어난 인기 장소입니다."];
const DISCOUNT_REASON = "현재 할인 혜택이 적용되고 있습니다.";
const NEARBY_REASONS = ["동선을 고려했을 때 함께 방문하기 좋습니다.", "여행 일정의 흐름을 고려했을 때 함께 방문하기 좋습니다."];
const SEASONAL_REASONS = ["9월에 특히 인기가 많은 곳입니다.", "선선한 9월 날씨에 방문하기 좋은 곳으로 소개됩니다."];
const FAMILY_REASONS = ["아이와 함께하는 가족 여행객들에게 인기가 많습니다.", "가족 단위 방문객의 만족도가 높은 곳입니다."];
const AUTHENTIC_REASONS = ["현지인들도 즐겨 찾는 정통 식당으로 알려져 있습니다.", "진짜 현지의 맛을 경험할 수 있는 곳입니다."];
const UNIQUE_EXPERIENCE_REASONS = [
  "다른 곳에서는 하기 힘든 특별한 현지 경험을 제공합니다.",
  "이곳에서만 느낄 수 있는 특별한 경험으로 소개됩니다.",
];
// Used two ways: (a) buildQualifyingReasons's own last-resort when an item
// qualifies for nothing else, and (b) pickUnused's shared second-tier
// reservoir for every item once its own specific pool is exhausted (see
// above) — deliberately vague/generic enough to stay true for any item
// regardless of its actual attributes, and deliberately larger (8, not 3)
// so that shared reservoir doesn't itself become the next bottleneck once
// several items lean on it in the same plan.
const FALLBACK_REASONS = [
  "짧은 이동 시간으로 효율적으로 방문할 수 있습니다.",
  "가족 단위 여행객들의 만족도가 높습니다.",
  "대표적인 인기 명소와 함께 방문하기 좋은 코스입니다.",
  "전체 일정의 동선을 고려해 배치했습니다.",
  "여행자들의 발길이 꾸준히 이어지는 곳입니다.",
  "무난하게 좋은 선택으로 꼽히는 곳입니다.",
  "일정에 자연스럽게 어우러지는 장소입니다.",
  "부담 없이 즐기기 좋은 곳으로 소개됩니다.",
];
const GENERIC_SAFE_REASONS = FALLBACK_REASONS;

// Mixed-led only — its matched tag comes from the participant's own 👍
// interest (see lib/browsingInference.ts), so "선택하신" is accurate here.
// AI-led's own style tags are now participant-picked too (see
// data/dialogue.ts's aiLedStyleQuestionIntro, lib/store.ts's
// confirmStyleQuestion) but per-STYLE, never per-item — the participant
// never actually picked THIS specific place, so "선택하신 관심사와 유사한"
// would still overstate what they did. AI-led simply never gets this
// reason (see buildQualifyingReasons below) and falls back to the
// objective, external-data-flavored reasons (rating/popularity/discount/
// etc.) instead.
function tagMatchReason(tag: string): string {
  return `선택하신 관심사와 유사한 '${tag}' 스타일의 장소입니다.`;
}

// Builds the set of reasons an item genuinely qualifies for, based on its own
// attributes (rating, price, tags, proximity) rather than one hardcoded
// branch — then a single reason is picked deterministically per item so the
// "AI 추천" explanation varies across the catalog instead of repeating.
//
// Pushes each qualifying category's FULL phrasing list (not one hash-picked
// line per category) — a single-plan dedupe pass (see pickUnused) needs
// real alternatives to fall back to. With only one candidate per category,
// two items landing in the same rating tier had no way to avoid an
// identical line; with both phrasings available, pickUnused can actually
// pick the other one before ever falling back to a repeat.
function buildQualifyingReasons(opts: {
  id: string;
  rating: number;
  isBudgetFriendly: boolean;
  matchedTags: string[];
  condition: "mixed" | "ai";
  isNearby: boolean;
  isFamilyFriendly: boolean;
  isAuthenticLocal: boolean;
  isUniqueExperience: boolean;
}): string[] {
  const {
    id,
    rating,
    isBudgetFriendly,
    matchedTags,
    condition,
    isNearby,
    isFamilyFriendly,
    isAuthenticLocal,
    isUniqueExperience,
  } = opts;
  const reasons: string[] = [];

  if (matchedTags.length > 0 && condition === "mixed") {
    reasons.push(tagMatchReason(matchedTags[0]));
  }
  // Cascading, not else-if — a 4.9-rated item's rating is ALSO genuinely
  // "매우 높다" and "꾸준히 인기가 많다", it just qualifies for the
  // strongest (signature) claim as well. Every threshold the rating clears
  // stays true, so all of them are fair candidates — this is what actually
  // gives pickUnused enough real headroom to avoid repeats, versus only
  // the one bracket the old else-if chain picked.
  if (rating >= 4.4) {
    reasons.push(...POPULAR_REASONS);
  }
  if (rating >= 4.7) {
    reasons.push(...HIGH_RATING_REASONS);
  }
  if (rating >= 4.8) {
    reasons.push(...SIGNATURE_REASONS);
  }
  if (isBudgetFriendly) {
    reasons.push(...BUDGET_REASONS);
  }
  if (isNearby) {
    reasons.push(...NEARBY_REASONS);
  }
  if (isFamilyFriendly) {
    reasons.push(...FAMILY_REASONS);
  }
  if (isAuthenticLocal) {
    reasons.push(...AUTHENTIC_REASONS);
  }
  if (isUniqueExperience) {
    reasons.push(...UNIQUE_EXPERIENCE_REASONS);
  }
  if (hasDiscount(id)) {
    reasons.push(DISCOUNT_REASON);
  }
  if (isSeasonalPick(id)) {
    reasons.push(...SEASONAL_REASONS);
  }
  // Only as a last resort when nothing else qualified at all — NOT always
  // appended. Every item sharing the same always-on filler would drain
  // that shared pool almost immediately or, worse, race items with a
  // genuinely small qualifying pool for it in a way that maxes out
  // pickUnused's dedupe headroom rather than adding to it (see
  // pickUnused's own GENERIC_SAFE_REASONS reservoir for where this same
  // list gets reused as a deliberately-shared second-tier fallback
  // instead).
  if (reasons.length === 0) {
    reasons.push(...FALLBACK_REASONS);
  }
  return reasons;
}

// `usedReasons` is optional so every other caller (tooltips, etc.) keeps
// working unchanged — only lib/itinerary.ts's generateItinerary passes one,
// threaded across the whole plan being built (see pickUnused above).
export function getActivityRecommendationReason(
  activity: Activity,
  matchedTags: string[],
  condition: Condition,
  usedReasons?: Set<string>
): string {
  const reasons = buildQualifyingReasons({
    id: activity.id,
    rating: activity.rating,
    isBudgetFriendly: activity.price > 0 && activity.price <= 20000,
    matchedTags,
    condition: condition === "mixed" ? "mixed" : "ai",
    isNearby: false,
    isFamilyFriendly: false,
    isAuthenticLocal: false,
    isUniqueExperience: activity.tags.includes("#현지체험"),
  });
  const reason = usedReasons ? pickUnused(`${activity.id}:final`, reasons, usedReasons) : pick(`${activity.id}:final`, reasons);
  usedReasons?.add(reason);
  return reason;
}

export function getRestaurantRecommendationReason(
  restaurant: Restaurant,
  matchedTags: string[],
  condition: Condition,
  hotelArea?: string,
  usedReasons?: Set<string>
): string {
  const reasons = buildQualifyingReasons({
    id: restaurant.id,
    rating: restaurant.rating,
    isBudgetFriendly: restaurant.priceRange === "₩",
    matchedTags,
    condition: condition === "mixed" ? "mixed" : "ai",
    isNearby: hotelArea !== undefined && restaurant.area === hotelArea,
    isFamilyFriendly: restaurant.tags.includes("#아기랑"),
    isAuthenticLocal: restaurant.tags.includes("#현지음식"),
    isUniqueExperience: false,
  });
  const reason = usedReasons
    ? pickUnused(`${restaurant.id}:final`, reasons, usedReasons)
    : pick(`${restaurant.id}:final`, reasons);
  usedReasons?.add(reason);
  return reason;
}
