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
// checkmark, see aiWorkingSpinning) during the style question, once the
// candidate search has actually finished but the catalog itself is still
// deliberately withheld (see lib/store.ts's runAiLedFlow). Matches the
// exploration checklist's own last line word-for-word on purpose — same
// event, just echoed in the workspace instead of only in chat.
export const aiWorkingLabelSearchComplete = "액티비티와 식당 검색 완료";

// Hand-written per-option phrasing for the companion echo below — plugged
// into "네, {phrase} 여행으로 계획해볼게요." Keyed by companionOptions'
// exact strings; any option without an explicit entry (there isn't one
// today, but this stays safe if that list ever changes) falls back to a
// generic "{답변}에게 어울리는" in companionIntroPhrase rather than throwing
// or rendering "undefined".
const companionPhrase: Record<string, string> = {
  가족: "가족과 함께 즐기기 좋은",
  친구: "친구들과 함께 즐기기 좋은",
  부모님: "부모님과 함께 즐기기 좋은",
  연인: "연인과 함께 즐기기 좋은",
  혼자: "혼자서도 편하게 즐길 수 있는",
  "아직 정하지 않음": "누구와 함께하더라도 즐기기 좋은",
};

function companionIntroPhrase(companion: string): string {
  return companionPhrase[companion] ?? `${companion}에게 어울리는`;
}

// Human-led/mixed-led's version of this beat (AI-led has its own separate,
// near-identical one — see aiLedFlightsHotelsIntro below) opens with a
// short, purely narrative "AI is gathering flights/hotels" beat — no user
// interaction, nothing selectable, and no real decision made yet (that only
// happens at the very end, once the AI knows what the participant actually
// wants to do — see finalPlan* messages below). This exists purely so the
// experience reads as "AI already looked into flights/hotels" before ever
// mentioning them again.
// Takes the just-confirmed companion answer (see confirmCompanion) and
// echoes it back in the opening line via companionIntroPhrase above.
export function flightsHotelsCollectingIntro(companion: string): string {
  return `네, ${companionIntroPhrase(companion)} 여행으로 계획해볼게요.\n\n먼저 가능한 항공편과 숙소를 확인해두고, 액티비티와 식당을 정한 뒤 전체 일정과 동선을 고려해 최종 여행 계획을 구성할게요.\n\n우선 항공편과 숙소부터 찾아보겠습니다.`;
}
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
// Also explains WHY flights/hotels aren't locked in yet (they're picked
// last, once activities/restaurants shape the itinerary the flight/hotel
// choice needs to fit around) — participants were reading a still-earlier
// version as "flights/hotels are already decided," which wasn't true until
// runFinalPlanGeneration actually locks them in. Immediately followed by
// the explore-collection checklist (see lib/store.ts's startExploring) —
// shown ONLY in chat as its own standalone card (see components/chat/
// ChecklistCard.tsx), never visualized in the workspace itself (which just
// shows a generic "processing" panel the whole time — see AiWorkingPanel).
// One combined checklist pass now, not one per category — activities and
// restaurants are a single "explore" stage split only by an in-panel tab
// (see components/workspace/ExplorePanel.tsx), never their own separate
// steps. No city name here (unlike an even earlier version) — the checklist
// right after this already visually implies "searching various sites," and
// naming the city is now mixedExplorationPrompt's job instead, once there
// are actual results to report back with it.
export const flightsHotelsCollectingComplete =
  "항공편과 숙소 후보를 확인했습니다.이제 액티비티와 식당을 살펴보며 일정을 구체화해볼게요.\n\n먼저 여러 여행 사이트에서 액티비티와 식당 후보를 찾아보겠습니다.";

export const explorationCollectionChecklistItems = [
  "Tripy.com 사이트 탐색 중",
  "activity.com 사이트 탐색 중",
  "tour.com 사이트 탐색 중",
  "액티비티와 식당 검색 완료",
];

// Mixed-led only, sent once collection finishes and the combined catalog is
// actually shown — free browsing, no required count, but each card gets an
// explicit 관심있음/관심없음 button pair (see mixedInterestedLabel/
// mixedNotInterestedLabel below) instead of a select action — that button
// pair is the *only* signal the AI uses afterward (see
// lib/browsingInference.ts), hover/detail time no longer feeds anything.
// Human-led's post-collection prompt is day-by-day instead — see
// humanExploreIntro/humanDaySelectionPrompt below. One bubble, not two —
// the "here's what happens with your input" line used to be a separate
// follow-up message with nothing (no user action, no stage change) between
// it and this one, so it's folded in here instead (see the flights/hotels
// merge above for the same rule applied). Takes the city specifically (not
// meta.name — see types/index.ts's DestinationMeta.city comment for why
// those two diverge for vietnam/taiwan) — this is now the one message that
// reports back "found candidates in {city}," since
// flightsHotelsCollectingComplete no longer names it. Doesn't spell out
// either the "액티비티 완료" button in words (see the attached
// mixedExploreDone payload, components/chat/MixedExploreDoneMessage.tsx —
// it's already visible right under this message) or the tab-switching
// mechanics — 식당 starts disabled until that button is pressed (see
// components/workspace/ExplorePanel.tsx's own comment), so there's nothing
// to "freely switch" between yet at the point this message shows.
export function mixedExplorationPrompt(city: string): string {
  return `${city}에서 경험할 수 있는 액티비티와 식당 후보들을 찾았어요.\n\n직접 후보들을 둘러보고, '관심있음 👍🏻', '관심없음 👎🏻'을 표시하여 여행 스타일을 알려주세요. 이를 바탕으로 추천 일정을 구성해볼게요.`;
}
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

// Human-led only — the very first day-1 prompt, sent once right when the
// explore-collection checklist finishes (see lib/store.ts's
// startExploring), replacing what used to be a bare humanDaySelectionPrompt(1)
// with no framing at all. Explains the mechanics that only need saying
// once (tabs switch freely, 2 of each per day) before handing off into the
// actual day-1 kickoff — carries the same daySelection:{day:1} payload
// humanDaySelectionPrompt(1) used to (see components/chat/
// DaySelectionMessage.tsx), so this fully replaces that first call rather
// than preceding it as a second bubble. Days 2-4 go back to the plain,
// unexplained humanDaySelectionPrompt below — repeating "탭에서 자유롭게
// 전환할 수 있습니다" every day would just be noise by then.
// Function, not a plain string — needs the destination's city interpolated
// in (see types/index.ts's DestinationMeta.city comment for why that's
// `.city` specifically, not `.name`/`.country`), same as
// mixedExplorationPrompt above.
export function humanExploreIntro(city: string): string {
  return `${city}에서 경험할 수 있는 액티비티와 식당 후보들을 찾았어요.\n\n후보를 직접 둘러보고 여행 일정에 포함하고 싶은 액티비티와 식당을 2개씩 선택해 주세요.\n\n1일차 일정부터 시작할게요.`;
}

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

// Every condition asks this once, right after the scenario prompt (see
// lib/store.ts's beginExploration) — purely narrative for all three now
// (AI-led used to imply a style from the answer, see the now-deleted
// lib/companionStyle.ts, but that's been replaced by an explicit question
// instead — see aiLedStyleQuestionIntro above).
export const companionQuestion = "누구와 함께하는 여행인가요?";
export const companionOptions = ["가족", "친구", "부모님", "연인", "혼자", "아직 정하지 않음"];
export const companionConfirmLabel = "선택 완료";

// AI-led has no participant action to wait on at any point, but a single
// 9-line checklist ("hotely.com 탐색 중" ... all the way through "최적의
// 여행 일정 구성 완료" back to back) read as an undifferentiated wall of
// "탐색 중" — nothing in it looked more important than anything else, so
// it stopped actually being read. Split into the same two beats human-led/
// mixed-led already have (flights/hotels, then activities/restaurants —
// see lib/store.ts's runAiLedFlow), each with its own short intro line and
// its own short checklist that ends on that phase's own "완료" item,
// instead of one undifferentiated 9-item list.
// Same companion-echo as flightsHotelsCollectingIntro above (see its
// comment) — AI-led's own separate copy of this beat.
export function aiLedFlightsHotelsIntro(companion: string): string {
  return `네, ${companionIntroPhrase(companion)} 여행으로 계획해볼게요.\n\n먼저 가능한 항공편과 숙소를 확인하고, 액티비티와 식당을 정한 뒤 전체 일정과 동선을 고려해 최종 여행 계획을 구성할게요.\n\n우선 항공편과 숙소부터 찾아보겠습니다.`;
}
export const aiLedFlightsHotelsChecklistItems = [
  "hotely.com 사이트 탐색 중",
  "sky.com 사이트 탐색 중",
  "airplane.com 사이트 탐색 중",
  "항공편 및 숙소 검색 완료",
];

// Leads into the SAME explorationCollectionChecklistItems checklist human-
// led/mixed-led use (see lib/store.ts's runAiLedFlow) — the candidate-
// finding step itself is now presented identically across all three
// conditions; only what happens once the candidates are on screen differs
// (see aiLedAutoplayIntro below). Previously AI-led had its own separate,
// longer checklist here and skipped showing any catalog at all — meant an
// entirely human-invisible browsing phase (zero manipulation-check
// signal for mc1/mc2 — see data/questionnaire.ts) and read as unnatural
// ("항공/숙소는 후보를 보여주면서 액티비티/식당만 안 보여주는" — a
// destination with literally no activities/restaurants candidates ever
// shown felt like a missing step, not a deliberate design). Plain string,
// not a function — deliberately doesn't name the city yet, same as
// flightsHotelsCollectingComplete above (see that comment): naming it here
// is aiLedStyleQuestionIntro's job instead, once the catalog is actually on
// screen below this message.
export const aiLedExploreIntro =
  "항공편과 숙소 후보를 확인했습니다. 이제 액티비티와 식당을 살펴보며 일정을 구체화해볼게요.\n\n먼저 여러 여행 사이트에서 액티비티와 식당 후보를 찾아보겠습니다.";

// AI-led only — replaces human-led's humanExploreIntro / mixed-led's
// mixedExplorationPrompt as the message right after the candidate catalog
// actually appears (see lib/store.ts's runAiLedFlow). Unlike before, this
// isn't the AI announcing it'll start browsing right away — it's a
// question first (see styleQuestion below): the one piece of explicit
// preference AI-led actually asks for, replacing the old companion-implied
// style guess (see lib/companionStyle.ts, now deleted) with something the
// participant stated directly. Up to 2, matching TravelStyleTag's own
// vocabulary (see types/index.ts) — the labels here use "·" instead of
// "/" purely for display readability as button text (see styleTagLabel
// below); the underlying TravelStyleTag values themselves are unchanged.
// Function, not a plain string — same reason as humanExploreIntro above
// (needs `.city` interpolated in, not left as a literal "${city}").
export function aiLedStyleQuestionIntro(city: string): string {
  return `${city}의 액티비티와 식당 후보를 찾았어요. 일정을 구성하기 전에, 이번 여행에서 원하는 스타일을 알려주세요. (최대 2개까지 선택 가능)`;
}

// TravelStyleTag values, in the fixed order shown as chips (see
// components/chat/StyleQuestionMessage.tsx) — matches
// data/destinations/*.ts's own styleTags vocabulary exactly, so
// lib/preferenceRank.ts's tag-matching keeps working unchanged.
export const aiLedStyleTagOptions: TravelStyleTag[] = [
  "자연/휴식",
  "문화/역사",
  "식당/미식",
  "액티비티/체험",
  "감성/사진 명소",
];

// Display-only relabeling for aiLedStyleTagOptions' chips — "·" reads more
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

// Sent once the style question above is confirmed (see lib/store.ts's
// confirmStyleQuestion) — the AI's own reply acknowledging the answer
// before runAiAutoplay actually starts sweeping the (now re-ranked using
// those tags) catalog. Cards render read-only throughout, tabs switch on
// their own, a scroll skim + a cursor/speech-bubble pair narrate what the
// AI is doing (see components/workspace/ExplorePanel.tsx and
// components/cards/AutoplayCursorBubble.tsx).
export const aiLedStyleQuestionConfirmedMessage =
  "알려주신 여행 스타일을 바탕으로 후보를 비교해 적합한 액티비티와 식당을 선정할게요.";

// AI-led only — once runAiAutoplay finishes sweeping both catalogs, this
// short intro + 3-item checklist plays before the shared final-plan
// message (see lib/store.ts's runAiLedFlow), mirroring the shape of
// human-led/mixed-led's own runFinalPlanGeneration beat below just with
// one less item — "선택하신 장소 분석 중" is skipped here since the
// autoplay the participant just watched already *was* that analysis, not
// a repeat of it.
export const aiLedFinalPlanIntro = "액티비티와 식당 선정이 완료되었습니다.";
export const aiLedFinalPlanChecklistItems = ["이동 동선 최적화 중", "항공편 선택 완료", "숙소 선택 완료"];

// Step 3 for human-led/mixed-led — once explore wraps up (human's placement
// step, mixed's own finish), the AI folds flights/hotels into the final
// plan for the first time (see lib/store.ts's runFinalPlanGeneration). A
// short checklist plays first, then the condition-appropriate closing line
// below, then the flight/hotel card + Day 1-4 itinerary appear together.
// AI-led has its own near-identical but shorter beat instead — see
// aiLedFinalPlanIntro/aiLedFinalPlanChecklistItems above.
export const finalPlanChecklistItems = [
  "선택하신 장소 분석 중",
  "이동 동선 최적화 중",
  "항공편 선택 완료",
  "숙소 선택 완료",
];

// Fixed for every condition — the last chat message before the trip
// summary card + Day 1-4 itinerary appear (see lib/store.ts's
// sendFinalPlanMessage). Deliberately the same words regardless of
// condition; per-condition nuance lives in the bottom AI-comment box
// instead (see aiCommentSummary* below), not in this closing line.
export const finalPlanMessage = "액티비티와 식당의 동선을 고려한 최종 여행 일정을 제안드립니다.\n\n확인해 보세요!";

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
