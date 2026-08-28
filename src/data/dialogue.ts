import type { TravelStyleTag } from "@/types";

// The very first message of every condition (first and repeats — see
// store.ts's beginPlanningChat). Sent on its own, before the fixed
// scenario prompt appears in the input box below (see sendPendingPrompt) —
// deliberately so the participant sees the AI "arrive" first rather than
// the whole exchange appearing pre-filled at once.
export const initialGreeting =
  "안녕하세요, 여행 계획을 도와드리는 AI 여행 플래너입니다. 어떤 여행을 계획하고 계신가요?";

// The only spot that names both the country AND the city (see
// types/index.ts's DestinationMeta comment) — "베트남 다낭 여행", not just
// "다낭 여행"; every other destination-naming spot in the app uses the
// city alone (see store.ts/ItineraryPanel.tsx/itinerary.ts/
// TransitionScreen.tsx).
export function buildInitialPrompt(country: string, city: string): string {
  return `9월 24일부터 9월 27일까지 ${country} ${city} 여행을 가려고 해. 아직 아무것도 알아본 건 없어. 항공편, 숙소, 액티비티, 식당까지 전체적인 여행 계획을 짜줄래?`;
}

// components/workspace/AiWorkingPanel.tsx's text while lib/store.ts's
// `aiWorking` is true — see that store field's own comment for which
// label applies to which phase. COLLECTING covers every "site checklist"
// beat (flights/hotels, explore-collection, AI-led's own two checklists);
// PLANNING is specific to runFinalPlanGeneration's checklist, once there's
// nothing left to browse and the AI is actually assembling the itinerary.
export const aiWorkingLabelCollecting = "AI가 사이트를 탐색 중입니다.";
export const aiWorkingLabelPlanning = "AI가 여행 일정을 계획 중입니다.";
// AI-led only — shown (with AiWorkingPanel's spinner swapped for a static
// checkmark, see aiWorkingSpinning) in the brief gap between the candidate
// search finishing and runAiAutoplay actually starting to narrate it (see
// lib/store.ts's confirmStyleQuestion) — the search itself is done, but the
// catalog stays deliberately withheld a beat longer. Matches the
// exploration checklist's own last line word-for-word on purpose — same
// event, just echoed in the workspace instead of only in chat.
export const aiWorkingLabelSearchComplete = "액티비티와 식당 검색 완료";

// Human-led/mixed-led's version of this beat (AI-led has its own separate,
// near-identical one — see aiLedFlightsHotelsIntro below) — a short, purely
// narrative "AI is gathering flights/hotels" beat right after the
// participant's own scenario prompt, no user interaction, nothing
// selectable, and no real decision made yet (that only happens at the very
// end, once the AI knows what the participant actually wants to do — see
// finalPlan* messages below). Plain string, not a function — used to echo
// the just-confirmed companion answer here (see the now-removed
// companionPhrase/companionIntroPhrase), but the companion question moved
// to the start of the activity/restaurant stage instead (see
// companionQuestion below, lib/store.ts's beginActivityRestaurantStage) —
// nothing to echo yet at this point in the flow.
export const flightsHotelsCollectingIntro =
  "네, 알겠습니다.\n\n먼저 가능한 항공편과 숙소를 확인해두고, 액티비티와 식당을 정한 뒤 전체 일정과 동선을 고려해 최종 여행 계획을 구성할게요.\n\n우선 항공편과 숙소부터 찾아보겠습니다.";
export const flightsHotelsCollectingItems = [
  "hotely.com 사이트 탐색 중",
  "sky.com 사이트 탐색 중",
  "airplane.com 사이트 탐색 중",
  "항공편과 숙소 검색 완료",
];
// Folds what used to be two back-to-back bubbles (flights/hotels wrap-up,
// then a separate "now let's look at activities/restaurants" lead-in) into
// one — no participant action happens between them, so per the "같은 맥락
// = 하나의 말풍선" rule they're one continuous thought, not two arrivals.
// Shared by all three conditions now (see lib/store.ts's
// beginActivityRestaurantStage) — the start of the activity/restaurant
// stage, right after the flights/hotels checklist finishes. Also explains
// WHY flights/hotels aren't locked in yet (they're picked last, once
// activities/restaurants shape the itinerary the flight/hotel choice needs
// to fit around) — participants were reading a still-earlier version as
// "flights/hotels are already decided," which wasn't true until
// runFinalPlanGeneration actually locks them in. Followed by the companion
// question, then the style question (see companionQuestion/styleQuestion
// below) — both now common to every condition — before the candidate
// search itself begins (see explorationCollectionIntro below).
export const activityRestaurantStageIntro =
  "이제 액티비티와 식당을 살펴보며 일정을 구체화해볼게요.\n\n후보를 찾기 전에 이번 여행에 대해 간단히 알려주세요.";

export const explorationCollectionChecklistItems = [
  "Tripy.com 사이트 탐색 중",
  "activity.com 사이트 탐색 중",
  "tour.com 사이트 탐색 중",
  "액티비티와 식당 검색 완료",
];

// Sent once the companion + style questions are both answered, right before
// explorationCollectionChecklistItems runs (see lib/store.ts's
// confirmStyleQuestion) — the AI's own acknowledgment that both answers are
// about to be put to use. Takes the city specifically (not meta.name — see
// types/index.ts's DestinationMeta.city comment for why those two diverge
// for vietnam/taiwan) — naming it here rather than in
// activityRestaurantStageIntro above, since the candidate search itself
// hasn't started until this message.
export function explorationCollectionIntro(city: string): string {
  return `알려주신 여행 정보와 스타일을 고려하여 ${city}의 액티비티와 식당 후보를 찾아볼게요.`;
}

// Sent once explorationCollectionChecklistItems finishes and the combined
// catalog is actually on screen — human-led/mixed-led's version (contrast
// with the old per-condition "found candidates in {city}" framing this
// replaces, which used to open mixedExplorationPrompt/humanExploreIntro
// themselves). AI-led uses its own copy instead (see
// aiLedExplorationCollectionComplete below) — its follow-up message names
// the style pick explicitly, so this one deliberately doesn't. Each
// condition's own mechanic-specific instruction follows immediately after
// as its own bubble (see mixedExplorationPrompt/humanExploreIntro below).
export const explorationCollectionComplete = "여행 조건에 맞는 다양한 액티비티와 식당 후보를 찾았어요.";

// Mixed-led only, sent right after explorationCollectionComplete above —
// free browsing, no required count, but each card gets an explicit
// 관심있음/관심없음 button pair (see mixedInterestedLabel/
// mixedNotInterestedLabel below) instead of a select action — that button
// pair is the *only* signal the AI uses afterward (see
// lib/browsingInference.ts), hover/detail time no longer feeds anything.
// Human-led's post-collection prompt is day-by-day instead — see
// humanExploreIntro/humanDaySelectionPrompt below. Plain string, not a
// function — no longer names the city or announces "found candidates"
// itself (explorationCollectionComplete above already covered both).
// Doesn't spell out either the "액티비티 완료" button in words (see the
// attached mixedExploreDone payload, components/chat/
// MixedExploreDoneMessage.tsx — it's already visible right under this
// message) or the tab-switching mechanics — 식당 starts disabled until that
// button is pressed (see components/workspace/ExplorePanel.tsx's own
// comment), so there's nothing to "freely switch" between yet at the point
// this message shows.
export const mixedExplorationPrompt =
  "직접 후보들을 둘러보고, '관심있음 👍🏻', '관심없음 👎🏻'을 표시하여 여행 스타일을 알려주세요. 이를 바탕으로 추천 일정을 구성해볼게요.";
// Shared by human-led (components/chat/DaySelectionMessage.tsx) and
// mixed-led (components/chat/MixedExploreDoneMessage.tsx) — both moved
// from one "move on" button to two in sequence, since the plain workspace
// tab click alone wasn't noticeable enough for participants to realize
// they should switch from 액티비티 to 식당 partway through. "액티비티
// 완료" (see lib/store.ts's confirmActivityStage) switches the workspace
// to the 식당 tab without finishing the stage; "식당 완료" is what
// actually advances (confirmDaySelection / finishMixedExploring).
export const activityStageConfirmLabel = "액티비티 완료";
export const restaurantStageConfirmLabel = "식당 완료";

export function humanActivityStageHint(activityCount: number): string {
  return `액티비티 ${activityCount}/2 선택하면 식당으로 넘어갈 수 있어요.`;
}
export function humanRestaurantStageHint(restaurantCount: number): string {
  return `식당 ${restaurantCount}/2 선택하면 다음으로 넘어갈 수 있어요.`;
}

// Mixed-led's activity stage requires ≥2 marks (see
// MixedExploreDoneMessage.tsx's own ready check) — a function like
// humanActivityStageHint above, not a fixed string, so the count can be
// shown as it climbs toward 2. Restaurant stage stays a flat ≥1 (see
// mixedRestaurantStageHint below) — only the activity minimum was raised.
export function mixedActivityStageHint(interestActivityCount: number): string {
  return `액티비티 ${interestActivityCount}/2에 '관심있음' 또는 '관심없음'을 표시하면 식당으로 넘어갈 수 있어요.`;
}
export const mixedRestaurantStageHint = "식당에 '관심있음' 또는 '관심없음'을 하나 이상 표시하면 다음으로 넘어갈 수 있어요.";

export const mixedInterestedLabel = "관심있음";
export const mixedNotInterestedLabel = "관심없음";

export const exploreActivitiesTabLabel = "액티비티";
export const exploreRestaurantsTabLabel = "식당";

// Human-led only — the very first day-1 prompt, sent right after
// explorationCollectionComplete above (see lib/store.ts's
// confirmStyleQuestion), replacing what used to be a bare
// humanDaySelectionPrompt(1) with no framing at all. Explains the mechanics
// that only need saying once (2 of each per day) before handing off into
// the actual day-1 kickoff — carries the same daySelection:{day:1} payload
// humanDaySelectionPrompt(1) used to (see components/chat/
// DaySelectionMessage.tsx), so this fully replaces that first call rather
// than preceding it as a second bubble. Days 2-4 go back to the plain,
// unexplained humanDaySelectionPrompt below — repeating "탭에서 자유롭게
// 전환할 수 있습니다" every day would just be noise by then. Plain string,
// not a function — no longer names the city itself
// (explorationCollectionComplete above already did), same as
// mixedExplorationPrompt above.
export const humanExploreIntro =
  "후보를 직접 둘러보고 여행 일정에 포함하고 싶은 액티비티와 식당을 2개씩 선택해 주세요.\n\n1일차 일정부터 시작할게요.";

// Human-led only, step 2 — instead of free-browsing then placing items
// afterward, the AI walks the participant through one day at a time (see
// lib/store.ts's confirmDaySelection): this exact prompt posts as its own
// chat message with the two-stage 액티비티 완료/식당 완료 buttons attached
// (see activityStageConfirmLabel/restaurantStageConfirmLabel above,
// components/chat/DaySelectionMessage.tsx) for days 2-4 in turn (day 1
// uses humanExploreIntro above instead). Selecting a card while a given day
// is active places it directly into that day (see lib/store.ts's
// toggleDayItem) — there's no separate placement step at all anymore.
export function humanDaySelectionPrompt(day: number): string {
  return `${day}일차에 진행하고 싶은 액티비티와 식당을 2개씩 선택해 주세요.`;
}

// Sent as the participant's own user-role message right when they press
// "선택 완료" for a day (see lib/store.ts's confirmDaySelection) — reports
// back exactly what got picked, so it reads like the participant
// themselves told the AI their choice rather than the button click just
// silently vanishing. Returns "" (caller skips sending anything) if
// nothing was picked that day at all.
export function humanDaySelectionSummary(activityNames: string[], restaurantNames: string[]): string {
  const lines: string[] = [];
  if (activityNames.length > 0) lines.push(`액티비티: ${activityNames.join(", ")}`);
  if (restaurantNames.length > 0) lines.push(`식당: ${restaurantNames.join(", ")}`);
  return lines.join("\n");
}

// Every condition asks this once, right at the start of the
// activity/restaurant stage — after flights/hotels, before the style
// question below (see lib/store.ts's beginActivityRestaurantStage) —
// purely narrative for all three now (AI-led used to imply a style from
// the answer, see the now-deleted lib/companionStyle.ts, but that's been
// replaced by an explicit style question instead — see styleQuestion
// below).
export const companionQuestion = "이번 여행은 누구와 함께 가시나요?";
export const companionOptions = ["가족", "친구", "부모님", "연인", "혼자", "아직 정하지 않음"];
export const companionConfirmLabel = "선택 완료";

// Every condition's second upfront question, asked right after the
// companion question confirms (see lib/store.ts's confirmCompanion) — the
// one piece of explicit preference every condition now asks for directly,
// before the candidate search itself even starts. Used to be AI-led only
// (replacing the old companion-implied style guess, see
// lib/companionStyle.ts, now deleted, with something the participant stated
// directly) — now asked of every condition for consistency (see
// lib/store.ts's confirmStyleQuestion for how each condition's ranking
// logic actually uses — or, for human-led/mixed-led, doesn't use — the
// answer). Up to 2, matching TravelStyleTag's own vocabulary (see
// types/index.ts) — the labels here use "·" instead of "/" purely for
// display readability as button text (see styleTagLabel below); the
// underlying TravelStyleTag values themselves are unchanged. Plain string,
// not a function — no city to interpolate any more (the candidate search
// hasn't started yet at this point — see explorationCollectionIntro above
// for where the city is actually named next).
export const styleQuestion = "이번 여행에서 원하는 스타일을 알려주세요. (최대 2개까지 선택 가능)";

// TravelStyleTag values, in the fixed order shown as chips (see
// components/chat/StyleQuestionMessage.tsx) — matches
// data/destinations/*.ts's own styleTags vocabulary exactly, so
// lib/preferenceRank.ts's tag-matching keeps working unchanged.
export const styleTagOptions: TravelStyleTag[] = [
  "자연/휴식",
  "문화/역사",
  "식당/미식",
  "액티비티/체험",
  "감성/사진 명소",
];

// Display-only relabeling for styleTagOptions' chips — "·" reads more
// naturally as a button label than "/", and "맛집" is more natural spoken
// Korean than "식당" for this one tag. Purely cosmetic: never touches the
// actual TravelStyleTag string that gets stored/matched against.
const STYLE_TAG_DISPLAY_LABELS: Record<TravelStyleTag, string> = {
  "자연/휴식": "자연·휴식",
  "문화/역사": "문화·역사",
  "식당/미식": "맛집·미식",
  "액티비티/체험": "액티비티·체험",
  "감성/사진 명소": "감성·사진 명소",
};
export function styleTagLabel(tag: TravelStyleTag): string {
  return STYLE_TAG_DISPLAY_LABELS[tag] ?? tag;
}

// AI-led has no participant action to wait on at any point, but a single
// 9-line checklist ("hotely.com 탐색 중" ... all the way through "최적의
// 여행 일정 구성 완료" back to back) read as an undifferentiated wall of
// "탐색 중" — nothing in it looked more important than anything else, so
// it stopped actually being read. Split into the same two beats human-led/
// mixed-led already have (flights/hotels, then activities/restaurants —
// see lib/store.ts's runAiLedFlightsHotels/confirmStyleQuestion), each with
// its own short intro line and its own short checklist that ends on that
// phase's own "완료" item, instead of one undifferentiated 9-item list.
// AI-led's own copy of flightsHotelsCollectingIntro above — plain string,
// not a function, for the same reason (no companion to echo yet).
export const aiLedFlightsHotelsIntro =
  "네, 알겠습니다.\n\n먼저 가능한 항공편과 숙소를 확인하고, 액티비티와 식당을 정한 뒤 전체 일정과 동선을 고려해 최종 여행 계획을 구성할게요.\n\n우선 항공편과 숙소부터 찾아보겠습니다.";
export const aiLedFlightsHotelsChecklistItems = [
  "hotely.com 사이트 탐색 중",
  "sky.com 사이트 탐색 중",
  "airplane.com 사이트 탐색 중",
  "항공편 및 숙소 검색 완료",
];

// AI-led's own copy of explorationCollectionComplete above — names the
// style pick explicitly ("선호하신 스타일을 고려하여"), unlike the
// human-led/mixed-led version, since AI-led's follow-up line
// (aiLedStyleQuestionConfirmedMessage below) is what actually announces
// it's about to compare candidates using that answer.
export const aiLedExplorationCollectionComplete =
  "여행 조건과 선호하신 스타일을 고려하여 다양한 액티비티와 식당 후보를 찾았어요.";

// Sent right after aiLedExplorationCollectionComplete above (see
// lib/store.ts's confirmStyleQuestion) right before runAiAutoplay actually
// starts sweeping the (ranked using the earlier-picked style tags) catalog.
// AI-led only. Cards render read-only throughout, tabs switch on their
// own, a scroll skim + a cursor/speech-bubble pair narrate what the AI is
// doing (see components/workspace/ExplorePanel.tsx and
// components/cards/AutoplayCursorBubble.tsx).
export const aiLedStyleQuestionConfirmedMessage =
  "이제 수집한 후보들을 비교하여 일정에 적합한 액티비티와 식당을 선정할게요.";

// AI-led only — once runAiAutoplay finishes sweeping both catalogs, this
// short intro + checklist plays before the shared final-plan message (see
// lib/store.ts's confirmStyleQuestion). Starts straight at the
// flights/hotels comparison step — no "액티비티·식당 후보 선정" line the
// way human-led/mixed-led get (see finalPlanChecklistItems/
// mixedFinalPlanChecklistItems below) — since the autoplay the participant
// just watched already *was* that selection, not something left to
// (re-)summarize here.
export const aiLedFinalPlanIntro = "액티비티와 식당 선정이 완료되었습니다.";
export const aiLedFinalPlanChecklistItems = [
  "액티비티·식당과의 동선을 고려하여 항공편·숙소 최종 비교 중",
  "항공편과 숙소 최종 선택 완료",
  "최종 여행 일정 구성 완료",
];

// Step 3 for human-led — once the participant's own Day 1-4 placement
// wraps up, the AI folds flights/hotels into the final plan (see
// lib/store.ts's runFinalPlanGeneration). "선택하신 액티비티·식당 확인
// 중" is accurate here — human-led participants really did pick and place
// every item themselves, so this is a genuine confirmation step, not an
// analysis of a signal (contrast with mixed-led's "선호 패턴을 파악하여
// ~ 선정 중" below, which infers rather than confirms). AI-led has its own
// shorter version without this first line — see aiLedFinalPlanIntro/
// aiLedFinalPlanChecklistItems above.
export const finalPlanChecklistItems = [
  "선택하신 액티비티·식당 확인 중",
  "액티비티·식당과의 동선을 고려하여 항공편·숙소 최종 비교 중",
  "항공편과 숙소 최종 선택 완료",
  "최종 여행 일정 구성 완료",
];

// Mixed-led only (see lib/store.ts's runMixedFinalPlanGeneration, called
// from finishMixedExploring instead of the shared runFinalPlanGeneration
// above) — a short chat message makes the AI's next move explicit before
// the checklist starts, then the checklist's first line frames this as
// inferring/selecting from the 👍/👎 signal ("선호 패턴을 파악하여 ~ 선정
// 중"), not confirming a direct pick the way human-led's "선택하신
// 액티비티·식당 확인 중" does — mixed-led participants never picked a
// place directly, so that phrasing would misstate what happened here. The
// remaining 3 lines are shared verbatim with finalPlanChecklistItems/
// aiLedFinalPlanChecklistItems (same flights/hotels comparison + wrap-up
// beat every condition ends on).
export const mixedPreferenceAnalysisIntro =
  "관심을 보인 장소와 비슷한 후보들을 함께 비교하고, 이동 동선과 일정 구성을 고려해 최종 장소를 선정할게요.";
export const mixedFinalPlanChecklistItems = [
  "선호 패턴을 파악하여 액티비티·식당 후보 선정 중",
  "액티비티·식당과의 동선을 고려하여 항공편·숙소 최종 비교 중",
  "항공편과 숙소 최종 선택 완료",
  "최종 여행 일정 구성 완료",
];

// The last chat message before the trip summary card + Day 1-4 itinerary
// appear (see lib/store.ts's sendFinalPlanMessage), shared word-for-word
// by all three conditions now — each one's own checklist above already
// carries whatever per-condition nuance is needed, so this closing line
// doesn't have to. Per-condition nuance otherwise lives in the bottom
// AI-comment box (see aiCommentSummary* below), not this line.
export const finalPlanMessage =
  "액티비티와 식당, 항공편과 숙소를 고려하여 최종 여행 일정을 구성했습니다.\n\n확인해 보세요!";

// Every activity/restaurant that makes the final cut gets its own "why
// this is here" line right on its card for mixed-led/AI-led (see
// types/index.ts's ItineraryItem.aiComment, lib/recommendationReason.ts) —
// human-led gets none at all, since it picked and placed everything
// itself, nothing for the AI to explain per item. This is a SEPARATE,
// shorter wrap-up — one dedicated box at the very bottom of the whole plan
// (see components/workspace/panels/AiCommentSummary.tsx). Fixed per
// condition, not dynamically evaluated — human-led's used to praise the
// plan generically ("일차별로 고르게 배치되었다") which read as both an
// obvious non-observation and, worse, as the AI taking credit for a
// placement the participant did entirely themselves. Now it gives a
// genuinely AI-flavored piece of feedback (a routing/distance critique)
// that doesn't claim to have picked anything, while mixed-led/AI-led's own
// lines explicitly own what the AI actually did contribute (preference
// inference + route/timing optimization, or ranking + full-plan
// construction, respectively).
export const aiCommentHeading = "AI 코멘트";

export const aiCommentSummaryHuman =
  "일정을 검토한 결과, 일부 관광지와 식당은 서로 거리가 있어 이동 시간이 예상보다 길어질 수 있습니다.\n같은 지역의 장소를 연달아 방문하도록 순서를 조정하면 이동 부담을 줄이고 여행 시간을 더 효율적으로 활용할 수 있습니다.";
export const aiCommentSummaryMixed =
  "AI가 파악한 여행 선호를 바탕으로 액티비티와 식당을 구성하였습니다.\n또한, 항공편 시간과 숙소 위치를 함께 고려하여 이동 동선을 조정하고 전체 일정의 연결성을 높였습니다.";
export const aiCommentSummaryAi =
  "AI가 다양한 여행 정보를 분석하여 높은 만족도를 보이는 항공, 숙소, 액티비티, 식당 후보를 선정했습니다.\n할인 및 프로모션 정보, 사용자 평가, 이동 효율성을 함께 고려하여 전체 여행 일정을 구성했습니다.";

export const transitionButton = "다음 여행 계획 시작하기";

export function transitionTitle(completedNumber: number): string {
  // Only ever called with 1 or 2 (transition never shows after the last
  // condition) — "1이 완료" vs "2가 완료" need different subject particles.
  const particle = completedNumber === 2 ? "가" : "이";
  return `여행 계획 ${completedNumber}${particle} 완료되었습니다.`;
}

// Picks "로" after a vowel-ending syllable (no 받침) vs "으로" after a
// consonant-ending one — e.g. "타이베이" → "타이베이로", "다낭" →
// "다낭으로". Needed below because the destination is now always a city
// (다낭/방콕/타이베이, see transitionDescription's own comment) rather
// than the old meta.name mix, where every value happened to end in a
// consonant; 타이베이 doesn't, so the hardcoded "으로" that worked by
// coincidence before would read as a grammar mistake now
// ("타이베이으로"). Falls back to "으로" for anything outside the Hangul
// syllable block (shouldn't happen — every city name here is plain
// Korean — but a safe default beats an out-of-range index).
function withRo(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasBatchim = code < 0 || code > 11171 ? true : code % 28 !== 0;
  return `${word}${hasBatchim ? "으로" : "로"}`;
}

// Takes the city (see TransitionScreen.tsx), same as every other
// destination-naming spot outside buildInitialPrompt above.
export function transitionDescription(nextCity: string): string {
  return `다음은 새로운 여행지인 ${withRo(nextCity)} 여행을 계획하는 상황입니다.\n\n화면의 안내에 따라 진행해주세요.`;
}

// The final plan message's own "move on" action (see
// lib/store.ts's confirmFinalPlan) — clicking it opens
// components/flow/ConditionCompleteDialog.tsx rather than proceeding
// straight to the survey, so the participant gets one explicit beat
// acknowledging that this condition's task is done before being asked to
// evaluate it.
export const bookingConfirmLabel = "확인했습니다";

export function conditionCompleteTitle(completedNumber: number): string {
  return `${completedNumber}번째 여행 계획이 완료되었습니다.`;
}
export const conditionCompleteDescription = "경험하신 여행 계획 방식에 대한 간단한 평가를 진행합니다.";

export const evaluateButtonLabel = "평가하기";
