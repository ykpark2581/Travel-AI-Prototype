import { pickUnused } from "@/lib/recommendationReason";
import type { Activity, Restaurant } from "@/types";

// Mixed-led only (see lib/itinerary.ts's generateItinerary) — replaces
// getActivityRecommendationReason/getRestaurantRecommendationReason's
// comments for this one condition, so every card's "왜 여기 있는지" line
// honestly reflects the actual human/AI division of labor here: the
// participant only ever expressed interest via 👍/👎, never picked a place
// directly for the itinerary (see lib/preferenceRank.ts's
// computeMixedPreferenceRank, which does the actual selecting) — never
// "선택하신 장소입니다." either way. A liked item that made the cut gets
// one framing ("관심을 보인 장소 중..."); an item the participant never
// marked 관심있음 gets a different one explaining what about it matched
// their INFERRED preferences instead (the one style tag inferred from
// what was liked, its category, or its rating/atmosphere) — so the two
// cases read as genuinely different AI reasoning, not the same line with
// "관심을 보인" swapped in.

// Separate activity/restaurant pools (not one shared list) — both draw from
// the same `usedReasons` dedupe set as everything else in one itinerary
// (see lib/itinerary.ts), so a shared pool would let a heavily-liked
// activity set exhaust the phrasing before any liked restaurant ever got a
// turn, silently falling back to a neutral reason that drops the "관심을
// 보인" framing this whole file exists to preserve.
const ACTIVITY_INTERESTED_REASONS = [
  "관심을 보인 장소 중 일정과 이동 동선을 고려해 포함했어요.",
  "관심을 보인 장소 중 전체 일정과 가장 잘 어울려 포함했어요.",
  "관심을 보인 장소 중 방문 시간대와 동선이 자연스럽게 이어져 포함했어요.",
  "관심을 보인 장소 중 다른 일정과 균형 있게 어울려 포함했어요.",
];
const RESTAURANT_INTERESTED_REASONS = [
  "관심을 보인 곳 중 일정과 이동 동선을 고려해 포함했어요.",
  "관심을 보인 곳 중 전체 일정과 가장 잘 어울려 포함했어요.",
  "관심을 보인 곳 중 방문 시간대와 동선이 자연스럽게 이어져 포함했어요.",
  "관심을 보인 곳 중 다른 일정과 균형 있게 어울려 포함했어요.",
];

// Uses the one style tag inferred from what WAS marked 관심있음 (see
// lib/browsingInference.ts's inferStyleTagFromInterest) — the same signal
// computeMixedPreferenceRank ranks by, so this is an accurate "why" for an
// item that made the cut on that basis rather than direct interest.
function styleMatchReasons(tag: string): string[] {
  return [
    `관심을 보인 장소들과 유사한 '${tag}' 성향으로 판단해 추천했어요.`,
    `관심 표시를 바탕으로 '${tag}' 스타일에 대한 선호가 높은 것으로 판단해 선정했어요.`,
  ];
}

function categoryMatchReasons(categoryLabel: string): string[] {
  return [
    `관심을 보인 ${categoryLabel} 장소와 유사한 경험으로 추천했어요.`,
    `관심 표시를 바탕으로 ${categoryLabel} 경험에 대한 선호가 높은 것으로 판단해 선정했어요.`,
  ];
}

const ATMOSPHERE_REASONS = [
  "관심을 보인 장소들과 비슷한 분위기이면서 이동 동선이 좋아 포함했어요.",
  "관심을 보인 장소들과 결이 비슷하면서 일정에 자연스럽게 어우러져 포함했어요.",
];

const RATING_FIT_REASONS = [
  "관심을 보인 경험과 비슷한 스타일이면서 만족도가 높아 함께 골랐어요.",
  "관심을 보인 장소들과 어울리면서 평점이 높아 포함했어요.",
];

function buildNotInterestedReasons(opts: { matchedTag: string | null; categoryLabel: string; rating: number }): string[] {
  const reasons: string[] = [];
  if (opts.matchedTag) reasons.push(...styleMatchReasons(opts.matchedTag));
  reasons.push(...categoryMatchReasons(opts.categoryLabel));
  if (opts.rating >= 4.5) reasons.push(...RATING_FIT_REASONS);
  reasons.push(...ATMOSPHERE_REASONS);
  return reasons;
}

export function getMixedActivityRecommendationReason(
  activity: Activity,
  wasInterested: boolean,
  matchedTag: string | null,
  usedReasons: Set<string>
): string {
  const reasons = wasInterested
    ? ACTIVITY_INTERESTED_REASONS
    : buildNotInterestedReasons({ matchedTag, categoryLabel: activity.category, rating: activity.rating });
  const reason = pickUnused(`${activity.id}:mixed-final`, reasons, usedReasons);
  usedReasons.add(reason);
  return reason;
}

export function getMixedRestaurantRecommendationReason(
  restaurant: Restaurant,
  wasInterested: boolean,
  matchedTag: string | null,
  usedReasons: Set<string>
): string {
  // "로컬 음식" reads more naturally than the raw category label
  // ("현지음식") in a full sentence — every other category is fine as-is.
  const categoryLabel = restaurant.tags.includes("#현지음식") ? "로컬 음식" : restaurant.category;
  const reasons = wasInterested
    ? RESTAURANT_INTERESTED_REASONS
    : buildNotInterestedReasons({ matchedTag, categoryLabel, rating: restaurant.rating });
  const reason = pickUnused(`${restaurant.id}:mixed-final`, reasons, usedReasons);
  usedReasons.add(reason);
  return reason;
}
