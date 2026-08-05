import { getActivityRecommendationReason, getRestaurantRecommendationReason, pick } from "@/lib/recommendationReason";
import type { Activity, Restaurant, TravelStyleTag } from "@/types";

// AI-led result cards need three distinct lines per item — this module is
// the source for the two that don't already exist elsewhere:
//   추천 이유 (recommendation reason)  ← reuses lib/recommendationReason.ts
//   스타일 적합성 (style fit)          ← built here, always tag-focused
//   일정상 배치 이유 (itinerary slot)  ← built here, mirrors lib/itinerary.ts's
//                                        actual slot order exactly, so the
//                                        note is never just flavor text

// Mirrors generateItinerary's a[0..4] assignment order (day2 오전/오후,
// day3 오전/오후, day4 오전) — index-aligned 1:1 with ACTIVITY_SLOTS.
const ACTIVITY_PLACEMENT_NOTES = [
  "2일차 오전 일정에 배치됩니다.",
  "2일차 오후 일정에 배치됩니다.",
  "3일차 오전 일정에 배치됩니다.",
  "3일차 오후 일정에 배치됩니다.",
  "4일차 오전 일정에 배치됩니다.",
];

// Mirrors generateItinerary's r[0..4] assignment order (day1 저녁, day2
// 점심/저녁, day3 점심/저녁) — index-aligned 1:1 with RESTAURANT_SLOTS.
// Breakfast every day is a fixed hotel breakfast, not a participant pick.
const RESTAURANT_PLACEMENT_NOTES = [
  "1일차 저녁 식사로 배치됩니다.",
  "2일차 점심 식사로 배치됩니다.",
  "2일차 저녁 식사로 배치됩니다.",
  "3일차 점심 식사로 배치됩니다.",
  "3일차 저녁 식사로 배치됩니다.",
];

// Only used when there's no direct tag match — picked deterministically per
// item (not just one static sentence) so candidates in the same list don't
// all read identically.
const STYLE_FIT_FALLBACK_REASONS = [
  "이동 동선과 가까워 일정 구성 효율성이 좋은 장소입니다.",
  "해당 지역에서 만족도가 높은 대표적인 체험으로 꼽힙니다.",
  "리뷰에서 현지 분위기에 대한 평가가 좋은 곳입니다.",
  "비슷한 여행자들에게 인기 있는 장소입니다.",
];

function styleFitNote(id: string, styleTags: TravelStyleTag[], selectedTags: string[]): string {
  const matched = styleTags.find((t) => selectedTags.includes(t));
  if (matched) return `"${matched}" 스타일을 선호하시는 여행자에게 적합한 장소입니다.`;
  return pick(`${id}:stylefit`, STYLE_FIT_FALLBACK_REASONS);
}

export interface StyleSelectionCopy {
  recommendationReason: string;
  styleFit: string;
  placementNote: string;
}

export function buildActivitySelectionCopy(
  activity: Activity,
  index: number,
  selectedTags: string[]
): StyleSelectionCopy {
  const matchedTags = activity.tags.filter((t) => selectedTags.includes(t));
  return {
    recommendationReason: getActivityRecommendationReason(activity, matchedTags),
    styleFit: styleFitNote(activity.id, activity.styleTags, selectedTags),
    placementNote: ACTIVITY_PLACEMENT_NOTES[index] ?? "여행 일정에 배치됩니다.",
  };
}

export function buildRestaurantSelectionCopy(
  restaurant: Restaurant,
  index: number,
  selectedTags: string[],
  hotelArea?: string
): StyleSelectionCopy {
  const matchedTags = restaurant.tags.filter((t) => selectedTags.includes(t));
  return {
    recommendationReason: getRestaurantRecommendationReason(restaurant, matchedTags, hotelArea),
    styleFit: styleFitNote(restaurant.id, restaurant.styleTags, selectedTags),
    placementNote: RESTAURANT_PLACEMENT_NOTES[index] ?? "여행 일정에 배치됩니다.",
  };
}
