export const initialGreeting = "안녕하세요! 여행 계획을 도와드릴게요.";

export function buildInitialPrompt(destinationName: string): string {
  return `9월 24일 ~ 9월 27일 ${destinationName} 여행을 가려고 해. 아직 아무것도 알아보지 않은 상태야. 여행 계획을 좀 짜줘.`;
}

// Flights/hotels are result-only for every condition (never the experimental
// manipulation) — no browser workspace, no site-by-site browsing spectacle,
// just a chat-only checklist followed by the decided flight/hotel. Runs the
// same way every time a condition starts, first or not.
export const flightsHotelsIntro = "먼저 여행 날짜와 목적지에 맞는 항공편과 숙소를 수집하고 있습니다.";

export const flightsHotelsChecklistItems = [
  "여행 조건 분석 중",
  "항공편 검색 및 비교 중",
  "숙소 후보 분석 중",
  "최적 옵션 선정 완료",
];

export const flightsHotelsConfirmed = "항공편과 숙소 후보를 확인했습니다. 여행 조건에 적합한 옵션으로 설정했습니다.";

// Human-led AND Mixed-led both open a stage with this — a short lead-in
// right before the site-visiting collection animation (see
// lib/store.ts's startCollection / components/workspace/CollectingScreen).
export const activitiesCollectionIntro =
  "이제 액티비티를 선택할 차례입니다. 제가 먼저 여러 여행 사이트를 탐색하여 대표 액티비티를 수집해보겠습니다.";
export const restaurantsCollectionIntro =
  "이제 식당을 선택할 차례입니다. 제가 먼저 여러 여행 사이트를 탐색하여 대표 식당을 수집해보겠습니다.";

export const collectionSites = ["Tripadvisor", "Klook", "GetYourGuide", "Google Maps"];

// One bubble line per site visited during collection (collectionSites has 4
// entries, so this is index-aligned 1:1 — no cycling); the "complete" line
// then closes out the ladder once every site has been checked.
export const activityCollectionStatusTexts = [
  "대표 액티비티를 수집하는 중...",
  "평점이 높은 장소를 찾는 중...",
  "여러 여행 사이트를 비교하는 중...",
  "후보를 정리하는 중...",
];

export const restaurantCollectionStatusTexts = [
  "대표 식당을 수집하는 중...",
  "후기가 좋은 식당을 찾는 중...",
  "위치와 평점을 비교하는 중...",
  "후보를 정리하는 중...",
];

export const activityCollectionComplete = "대표 액티비티를 정리했어요.";
export const restaurantCollectionComplete = "대표 식당을 정리했어요.";

// Sent once collection finishes and the catalog is actually shown — the cue
// to start browsing and liking places. States the exact required count
// upfront (matches ACTIVITY_SLOTS/RESTAURANT_SLOTS — see lib/itinerary.ts)
// so the whole itinerary ends up built purely from explicit picks, with
// nothing silently backfilled by catalog order.
export function activitiesExplorationPrompt(requiredCount: number): string {
  return `먼저 후보를 살펴보시고, 일정에 포함하고 싶은 액티비티를 ${requiredCount}개 골라 좋아요를 눌러주세요. 선택하신 장소를 바탕으로 최종 일정을 구성해드릴게요.`;
}
export function restaurantsExplorationPrompt(requiredCount: number): string {
  return `먼저 후보를 살펴보시고, 일정에 포함하고 싶은 식당을 ${requiredCount}개 골라 좋아요를 눌러주세요. 선택하신 장소를 바탕으로 최종 일정을 구성해드릴게요.`;
}

// Mixed-led — same collection + "candidates appear" start as human-led, but
// frames browsing as feeding a later style analysis rather than being the
// final word itself (see mixedInferredStyleMessage below, sent once
// MIXED_ANALYSIS_TIME_SECONDS elapses).
export const mixedActivitiesExplorationPrompt =
  "먼저 후보를 살펴보시고, 관심 있는 액티비티에 좋아요를 눌러주세요. 탐색 과정과 선택 내용을 반영하여 여행 스타일에 맞는 일정을 추천해드릴게요.";
export const mixedRestaurantsExplorationPrompt =
  "먼저 후보를 살펴보시고, 관심 있는 식당에 좋아요를 눌러주세요. 탐색 과정과 선택 내용을 반영하여 여행 스타일에 맞는 일정을 추천해드릴게요.";

export const explorationContinueButtonLabel = "다음으로";
// Shown on the "다음으로" button once it has finished filling but the
// participant hasn't liked the required number of items yet on this stage
// (see ACTIVITY_SLOTS/RESTAURANT_SLOTS in lib/itinerary.ts — human-led
// requires liking exactly that many, so the whole itinerary is always built
// purely from explicit picks). Human-led only now — mixed-led's browsing
// window ends on its own timer, no button at all.
export function explorationNeedsLikeLabel(remaining: number): string {
  return `좋아요를 ${remaining}개 더 눌러주세요`;
}

// Mixed-led only — sent automatically once MIXED_ANALYSIS_TIME_SECONDS of
// browsing elapses (see lib/store.ts's runMixedAnalysis), based on a real
// inferred style tag (see lib/browsingInference.ts). Falls back to a
// generic line on the rare stage where nothing was liked/browsed enough to
// infer anything.
export function mixedInferredStyleMessage(styleTag: string): string {
  return `지금까지 살펴보신 장소와 선택 내용을 분석해보니, "${styleTag}" 유형에 관심이 높은 것으로 보입니다.`;
}
export const mixedInferredStyleFallback = "지금까지 살펴보신 장소와 선택 내용을 분석해보고 있습니다.";

// Sent right after the inferred-style message — the selection-results cards
// (see components/chat/SelectionResultsMessage.tsx) attach to this message.
export const mixedStyleConfirmedMessage =
  "선택하신 장소와 탐색 패턴을 분석해 여행 스타일을 파악했습니다. 이를 반영하여 일정을 구성했습니다.";
export const mixedCandidatesIntro = "해당 후보들을 중심으로 일정을 구성해드릴게요.";

// AI-led — chat-only from start to finish. The only upfront question is who
// they're traveling with (deliberately minimal — no style/preference
// question at all); see lib/companionStyle.ts for how that maps to an
// implied style.
export const companionQuestion =
  "본격적으로 일정을 준비하기 전에 한 가지만 여쭤볼게요. 이번 여행은 누구와 함께 가시나요?";
export const companionOptions = ["가족", "친구", "부모님", "연인", "혼자"];
export const companionConfirmLabel = "선택 완료";

export const aiLedCombinedIntro = "여행 정보를 바탕으로 AI가 적합한 액티비티와 식당을 찾아 일정을 구성해드릴게요.";

export const aiLedChecklistItems = ["여행 정보 수집 완료", "후보 비교 완료", "최적 후보 생성 완료"];

// Short lead-ins right before each category's result cards — the checklist
// runs once for both categories together (see lib/store.ts's runAiLedFlow),
// so these are what separates the two card blocks in chat.
export const aiLedActivitiesReady = "이런 액티비티들을 준비했어요.";
export const aiLedRestaurantsReady = "그리고 이런 식당들도 준비했어요.";

// Sent once the itinerary is actually built — AI-led and Mixed-led share
// this (both had the AI doing the picking, one from a companion-implied
// style, one from inferred browsing), human-led gets its own version below.
// Deliberately makes no claim about having "analyzed preferences/style" —
// just states what happened.
export const aiAssistedItineraryComplete =
  "추천 후보들을 조합하여 이동 동선과 여행 스타일을 고려한 일정을 구성했습니다.";

// Human-led only — sent right after the participant's own picks are used to
// build the itinerary.
export const humanItineraryComplete =
  "선택하신 액티비티와 식당을 반영하여 이동 동선과 여행 스타일을 고려한 일정을 구성했습니다. 확인해 보세요!";

// Human-led only — shown when a 6th like is attempted on a stage that
// already has the required 5 (see ACTIVITY_SLOTS/RESTAURANT_SLOTS).
export type ExplorationStageLabel = "액티비티" | "식당";
export function likeLimitMessage(stage: ExplorationStageLabel): string {
  return `${stage} 선택 최대 개수는 5개입니다.`;
}

export const transitionButton = "다음 유형 시작하기";

export function transitionTitle(completedNumber: number): string {
  // Only ever called with 1 or 2 (transition never shows after the last
  // condition) — "1이 완료" vs "2가 완료" need different subject particles.
  const particle = completedNumber === 2 ? "가" : "이";
  return `유형 ${completedNumber}${particle} 완료되었습니다.`;
}

export function transitionDescription(nextDestinationName: string): string {
  return `다음 유형에서는 새로운 여행지인 ${nextDestinationName}으로 여행을 계획하는 상황입니다.\n\n화면의 안내에 따라 진행해주세요.`;
}

export const bookingConfirmedMessage = "평가 페이지로 이동할게요.";
export const evaluateButtonLabel = "평가하기";
