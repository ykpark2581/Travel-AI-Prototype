// Flights/hotels are no longer a separate step the participant walks
// through first — the AI folds them into the final plan once explore
// wraps up (see lib/store.ts's runFinalPlanGeneration). "explore" covers
// both activities and restaurants, distinguished only by a tab within the
// same stage (see ExplorationStage below) — the old separate
// activities/restaurants StageIds are gone.
export type StageId = "explore" | "itinerary";

export interface StageMeta {
  id: StageId;
  index: number; // 0-based, matches stepper order
  label: string;
  shortLabel: string;
}

// Internal experiment condition — never surfaced to participants.
export type Condition = "human" | "mixed" | "ai";
export type DestinationId = "vietnam" | "bangkok" | "taiwan";

// The shared style vocabulary behind every condition's final selection —
// distinct from `tags` (which still drives the specific recommendation-
// reason logic in lib/recommendationReason.ts). Every condition is asked
// directly now, up to 2 tags (see StyleQuestionPayload below,
// data/dialogue.ts's styleQuestion) — but only AI-led's ranking actually
// uses the answer; mixed-led still infers its own tag from browsing
// behavior instead (see lib/browsingInference.ts), and human-led doesn't
// rank by tag at all.
export type TravelStyleTag = "자연/휴식" | "문화/역사" | "식당/미식" | "액티비티/체험" | "감성/사진 명소";

export interface Flight {
  id: string;
  airline: string;
  logoInitials: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  stops: number;
  price: number;
  cabin: string;
  // Day 4's 귀국 (return leg) uses these instead of departTime/arriveTime,
  // which are the outbound-only ICN→destination times (see
  // lib/itinerary.ts's 귀국 item). Optional since only the bundle's primary
  // `flight` needs them for the itinerary to render — the read-only
  // candidate list never shows a return leg at all.
  returnDepartTime?: string;
  returnArriveTime?: string;
}

export interface Hotel {
  id: string;
  name: string;
  area: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  amenities: string[];
  image: string;
}

export type ActivityCategory = "문화" | "음식" | "자연" | "쇼핑";

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  description: string;
  duration: string;
  price: number;
  rating: number;
  area: string;
  image: string;
  tags: string[];
  styleTags: TravelStyleTag[];
}

// Broad filter grouping — deliberately coarser than `cuisine` (which is
// near-unique per restaurant, e.g. "팟타이"), so the filter row has a small
// number of meaningful categories instead of one chip per dish.
export type RestaurantCategory = "현지음식" | "파인다이닝" | "카페&디저트" | "바&루프탑";

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  category: RestaurantCategory;
  description: string;
  // Symbol tier still drives budget-friendliness logic (see
  // lib/recommendationReason.ts, lib/detailSummary.ts) — priceFrom is what's
  // actually shown to participants, a realistic per-person starting price.
  priceRange: "₩" | "₩₩" | "₩₩₩" | "₩₩₩₩";
  priceFrom: number;
  rating: number;
  area: string;
  image: string;
  tags: string[];
  styleTags: TravelStyleTag[];
}

export interface DestinationMeta {
  id: DestinationId;
  // The destination as shown mid-flow (see dialogue.ts's
  // explorationCollectionIntro, ItineraryPanel.tsx, itinerary.ts,
  // TransitionScreen.tsx) — always the
  // actual city (다낭/방콕/타이베이), never the country, so every one of
  // those spots reads consistently regardless of which destination is
  // active. `name` below is kept distinct for the one place that DOES want
  // both (see dialogue.ts's buildInitialPrompt, the opening scenario
  // prompt — "베트남 다낭 여행", not just "다낭 여행").
  city: string;
  // A general-purpose display name — historically inconsistent about
  // whether it held the city or the country (bangkok's was already
  // "방콕", vietnam/taiwan's were "베트남"/"대만") until `city` above was
  // added to disambiguate; not read anywhere UI-facing any more (`city`
  // and `country` cover every current use), kept mainly for
  // ConditionSurveyScreen.tsx's backend `destination` field.
  name: string;
  // The actual country/region (베트남/태국/대만) — paired with `city`
  // above in buildInitialPrompt's "국가 + 도시" prompt; everywhere else
  // that only wants one of the two reads `city` alone.
  country: string;
  startDate: string;
  endDate: string;
  dayDates: string[];
  nights: number;
  days: number;
  travelers: number;
}

export interface DestinationBundle {
  meta: DestinationMeta;
  flight: Flight;
  hotel: Hotel;
  // Extra options shown during the simulated flight/hotel search browsing —
  // always includes the entry matching `flight`/`hotel` above as the AI's
  // eventual pick.
  flightCandidates: Flight[];
  hotelCandidates: Hotel[];
  activities: Activity[];
  restaurants: Restaurant[];
}

export type ItineraryPeriod = "오전" | "오후" | "저녁";

export interface ItineraryItem {
  label: string;
  detail: string;
  // Only set for actual activity/restaurant picks (never the fixed
  // logistics items like 출국/체크인/조식/체크아웃) — see lib/itinerary.ts's
  // activityItem/mealItem. Lets components/cards/ItineraryDayCard.tsx open
  // the read-only detail dialog (see lib/store.ts's openDetailReview) for
  // just these items — flights/hotels stay non-interactive since there's no
  // Activity/Restaurant record (and no detail dialog content) for them.
  id?: string;
  // Only set for actual activity/restaurant picks (never the fixed
  // logistics items like 출국/체크인/조식/체크아웃) — see lib/itinerary.ts's
  // activityItem/mealItem. `aiComment` is the mandatory per-item "why this
  // is here" line the final itinerary must show for every condition (see
  // lib/recommendationReason.ts) — reasoning differs by condition (mixed/
  // AI-led: style-tag/rating-based; human-led: affirms their own day
  // placement) but every condition gets one.
  image?: string;
  aiComment?: string;
}

export interface ItinerarySlot {
  period: ItineraryPeriod;
  items: ItineraryItem[];
}

export interface ItineraryDay {
  day: number;
  date: string;
  slots: ItinerarySlot[];
}

export type ChatRole = "assistant" | "user";

// No longer a separate StageId (see StageId above) — now just which tab of
// the single "explore" stage is showing (see ExplorePanel.tsx), and which
// bucket of items/signals/interest a given id belongs to.
export type ExplorationStage = "activities" | "restaurants";

// Mixed-led's sole browsing signal (see lib/browsingInference.ts) — replaces
// the old passive hover/detail-time inference entirely. Explicit only: a
// 👍/👎 button on every card (see cards/ActivityCard.tsx,
// cards/RestaurantCard.tsx), never inferred from how long something was
// looked at.
export type Interest = "interested" | "not-interested";

// Human-led's day-placement step (see components/workspace/
// DayPlacementScreen.tsx) — after free-browsing the combined catalog with
// no count limit, liked items get dragged into one of the 4 trip days.
// Unassigned liked items are simply left out of the final itinerary, not
// auto-placed. Keyed 1-4, matching DestinationMeta.dayDates' index+1.
export interface DayAssignment {
  activityIds: string[];
  restaurantIds: string[];
}
export type DayPlan = Record<number, DayAssignment>;

// Every condition, asked once at the start of the activity/restaurant
// stage — after flights/hotels, before styleQuestion below (see
// lib/store.ts's beginActivityRestaurantStage) — "동행자" (who they're
// traveling with). A light question: a single-select pick, purely
// narrative — unlike before, the answer no longer implies a style tag (see
// StyleQuestionPayload, which replaced that inference with an explicit
// question instead).
export interface CompanionQuestionPayload {
  options: string[];
  selected: string;
  confirmed: boolean;
}

// Every condition's second upfront question, asked right after the
// companion question confirms (see lib/store.ts's confirmStyleQuestion) —
// used to be AI-led only, replacing the old companion-implied style guess
// (see lib/companionStyle.ts, now deleted) with an explicit question. Now
// asked of every condition, though only AI-led's ranking actually uses the
// answer: which TravelStyleTag(s) — up to 2 — should the AI weigh when it
// browses/selects on the participant's behalf (see lib/aiAutoplay.ts).
// Multi-select, unlike CompanionQuestionPayload above.
export interface StyleQuestionPayload {
  options: TravelStyleTag[];
  selected: TravelStyleTag[];
  confirmed: boolean;
}

// Attached to the flights/hotels "collecting" chat message — progressively
// revealed (see store.ts) rather than shown all at once, so the result-only
// flights/hotels summary still reads as the AI actually doing the work.
export interface ChecklistPayload {
  items: string[];
  revealedCount: number;
}

// Human-led only, step 2 — the day-by-day guided selection (see
// lib/store.ts's confirmDaySelection/toggleDayItem). One of these posts per
// day 1-4 in turn (see components/chat/DaySelectionMessage.tsx), now in
// two stages rather than one button: `activityStageConfirmed` false shows
// an "액티비티 완료" button (gated on that day's activity count, see
// lib/store.ts's confirmActivityStage) that switches the workspace to the
// 식당 tab without finishing the day; true shows "식당 완료" instead
// (gated on the restaurant count), which is what actually advances to the
// next day's prompt or, after day 4, runs the final plan. Added because
// the plain workspace tab switch alone wasn't noticeable enough — nothing
// in the flow was telling the participant "you're done with activities,
// go look at restaurants now."
export interface DaySelectionPayload {
  day: number;
  activityStageConfirmed: boolean;
  confirmed: boolean;
}

// Mixed-led only — attached to the free-browse prompt message (see
// lib/store.ts's confirmStyleQuestion). The workspace's card grid stays
// selection-only (see ActivityCard/RestaurantCard's 👍/👎), so the "move
// on" action itself lives here instead. Same two-stage shape as
// DaySelectionPayload above and for the same reason — see that type's own
// comment: `activityStageConfirmed` false shows "액티비티 완료" (switches
// to the 식당 tab), true shows "식당 완료" (calls finishMixedExploring).
export interface MixedExploreDonePayload {
  activityStageConfirmed: boolean;
  confirmed: boolean;
}

// Every condition — attached to the final "확인해 보세요!" plan message
// (see lib/store.ts's sendFinalPlanMessage). Same reasoning as
// MixedExploreDonePayload: the itinerary panel only displays the plan, it
// never carries the "move on" action — clicking this opens the condition-
// complete popup (see components/flow/ConditionCompleteDialog.tsx) rather
// than proceeding directly.
export interface BookingConfirmPayload {
  confirmed: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  companionQuestion?: CompanionQuestionPayload;
  styleQuestion?: StyleQuestionPayload;
  daySelection?: DaySelectionPayload;
  mixedExploreDone?: MixedExploreDonePayload;
  bookingConfirm?: BookingConfirmPayload;
  checklist?: ChecklistPayload;
}

// `description`, shared by every variant below, renders as a muted line
// directly under the question text and above its answer control (see
// SurveyForm.tsx's QuestionBlock) — for context a participant needs BEFORE
// answering (e.g. rewardSurveyItems' interview_consent explaining what the
// interview actually involves before asking yes/no). Distinct from
// SurveyForm's own `notes` prop, which places a line between two different
// items rather than inside one item's own block — use `description` for
// anything specific to that one question, `notes` for anything that isn't.
export interface QuestionnaireLikertItem {
  id: string;
  type: "likert";
  question: string;
  description?: string;
}

export interface QuestionnaireTextItem {
  id: string;
  type: "text";
  question: string;
  description?: string;
}

// A single-line free-text answer (name, phone number) — distinct from
// QuestionnaireTextItem above, which renders as a multi-line Textarea
// meant for a paragraph-length answer (currently only the final survey's
// fs2 "그 이유는 무엇인가요?"). preSurveyItems' name/contact (see
// data/questionnaire.ts) use this instead so they render as a normal
// one-line Input (see SurveyForm.tsx) rather than an oversized text box.
export interface QuestionnaireShortTextItem {
  id: string;
  type: "shortText";
  question: string;
  placeholder?: string;
  description?: string;
}

// Single-select — currently only the final survey's fs1 (see
// data/questionnaire.ts) uses this, matched against a Google Form
// multiple-choice question with the exact same option strings (see
// docs/SURVEY_SETUP.md), unlike the free-text answers everything else here
// sends.
export interface QuestionnaireChoiceItem {
  id: string;
  type: "choice";
  question: string;
  options: string[];
  description?: string;
}

export type QuestionnaireItem =
  | QuestionnaireLikertItem
  | QuestionnaireTextItem
  | QuestionnaireShortTextItem
  | QuestionnaireChoiceItem;

// Implicit browsing-behavior signals captured per item during free exploration
// (human/mixed conditions only). Human-led: recorded only to support a
// realistic exploration experience, never used for ranking. Mixed-led:
// hover/detail time also feeds lib/browsingInference.ts's inferred style
// tag — but even then, the itinerary itself is still ranked by
// lib/preferenceRank.ts using only explicit hearts + that inferred tag,
// never raw signal scores directly.
export interface ItemSignals {
  hoverMs: number;
  hoverSessions: number;
  detailOpens: number;
  detailMs: number;
  lastInteractionOrder: number;
}

export interface StageBrowsingSignals {
  items: Record<string, ItemSignals>;
  searchQueries: string[];
  filtersUsed: string[];
  scrollSamplesPxPerSec: number[];
}

export interface BrowsingSignals {
  activities: StageBrowsingSignals;
  restaurants: StageBrowsingSignals;
}
