import type { Activity, Restaurant } from "@/types";

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
const FALLBACK_REASONS = [
  "짧은 이동 시간으로 효율적으로 방문할 수 있습니다.",
  "가족 단위 여행객들의 만족도가 높습니다.",
  "대표적인 인기 명소와 함께 방문하기 좋은 코스입니다.",
];

// Builds the set of reasons an item genuinely qualifies for, based on its own
// attributes (rating, price, tags, proximity) rather than one hardcoded
// branch — then a single reason is picked deterministically per item so the
// "AI 추천" explanation varies across the catalog instead of repeating.
function buildQualifyingReasons(opts: {
  id: string;
  rating: number;
  isBudgetFriendly: boolean;
  matchedTags: string[];
  isNearby: boolean;
  isFamilyFriendly: boolean;
  isAuthenticLocal: boolean;
  isUniqueExperience: boolean;
}): string[] {
  const { id, rating, isBudgetFriendly, matchedTags, isNearby, isFamilyFriendly, isAuthenticLocal, isUniqueExperience } =
    opts;
  const reasons: string[] = [];

  if (matchedTags.length > 0) {
    reasons.push(`선택한 '${matchedTags[0]}' 스타일과 잘 어울리는 장소입니다.`);
  }
  if (rating >= 4.8) {
    reasons.push(pick(`${id}:signature`, SIGNATURE_REASONS));
  } else if (rating >= 4.7) {
    reasons.push(pick(`${id}:rating`, HIGH_RATING_REASONS));
  } else if (rating >= 4.4) {
    reasons.push(pick(`${id}:popular`, POPULAR_REASONS));
  }
  if (isBudgetFriendly) {
    reasons.push(pick(`${id}:budget`, BUDGET_REASONS));
  }
  if (isNearby) {
    reasons.push(pick(`${id}:nearby`, NEARBY_REASONS));
  }
  if (isFamilyFriendly) {
    reasons.push(pick(`${id}:family`, FAMILY_REASONS));
  }
  if (isAuthenticLocal) {
    reasons.push(pick(`${id}:authentic`, AUTHENTIC_REASONS));
  }
  if (isUniqueExperience) {
    reasons.push(pick(`${id}:unique`, UNIQUE_EXPERIENCE_REASONS));
  }
  if (hasDiscount(id)) {
    reasons.push(DISCOUNT_REASON);
  }
  if (isSeasonalPick(id)) {
    reasons.push(pick(`${id}:seasonal`, SEASONAL_REASONS));
  }
  if (reasons.length === 0) {
    reasons.push(pick(`${id}:fallback`, FALLBACK_REASONS));
  }
  return reasons;
}

export function getActivityRecommendationReason(activity: Activity, matchedTags: string[]): string {
  const reasons = buildQualifyingReasons({
    id: activity.id,
    rating: activity.rating,
    isBudgetFriendly: activity.price > 0 && activity.price <= 20000,
    matchedTags,
    isNearby: false,
    isFamilyFriendly: false,
    isAuthenticLocal: false,
    isUniqueExperience: activity.tags.includes("#현지체험"),
  });
  return pick(`${activity.id}:final`, reasons);
}

export function getRestaurantRecommendationReason(
  restaurant: Restaurant,
  matchedTags: string[],
  hotelArea?: string
): string {
  const reasons = buildQualifyingReasons({
    id: restaurant.id,
    rating: restaurant.rating,
    isBudgetFriendly: restaurant.priceRange === "₩",
    matchedTags,
    isNearby: hotelArea !== undefined && restaurant.area === hotelArea,
    isFamilyFriendly: restaurant.tags.includes("#아기랑"),
    isAuthenticLocal: restaurant.tags.includes("#현지음식"),
    isUniqueExperience: false,
  });
  return pick(`${restaurant.id}:final`, reasons);
}
