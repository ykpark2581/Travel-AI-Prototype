export type StageId = "flights-hotel" | "activities" | "restaurants" | "itinerary";

export interface StageMeta {
  id: StageId;
  index: number; // 0-based, matches stepper order
  label: string;
  shortLabel: string;
  url: string;
}

// Internal experiment condition — never surfaced to participants.
export type Condition = "human" | "mixed" | "ai";
export type DestinationId = "vietnam" | "bangkok" | "taiwan";

// The shared style vocabulary behind every condition's final selection —
// distinct from `tags` (which still drives the specific recommendation-
// reason logic in lib/recommendationReason.ts). How each condition arrives
// at a set of these differs: Mixed-led infers it from browsing behavior
// (see lib/browsingInference.ts), AI-led implies it from the companion-type
// answer (see lib/companionStyle.ts) — neither asks about it directly.
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
  name: string;
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

export type ExplorationStage = "activities" | "restaurants";

// Drives the ghost cursor during collection's site-visiting animation (see
// store.ts's startCollection / components/workspace/GhostCursor.tsx).
export interface CursorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// AI-led only, asked once (not per-stage) right after flights/hotels —
// "동행자" (who they're traveling with). Deliberately the only upfront
// question AI-led ever asks, and a light one at that: a single-select pick,
// mapped to an implied style via lib/companionStyle.ts.
export interface CompanionQuestionPayload {
  options: string[];
  selected: string;
  confirmed: boolean;
}

// Attached directly to the browse-prompt chat message so a "다음으로" button
// appears immediately — rendered as a progress-fill pill that becomes
// clickable once `readyAt` passes, rather than appearing out of nowhere
// after a hidden wait.
export interface AdvancePromptPayload {
  stage: ExplorationStage;
  confirmed: boolean;
  readyAt: number;
  durationMs: number;
}

// Attached to the flights/hotels "collecting" chat message — progressively
// revealed (see store.ts) rather than shown all at once, so the result-only
// flights/hotels summary still reads as the AI actually doing the work.
export interface ChecklistPayload {
  items: string[];
  revealedCount: number;
}

// AI-led only: renders the items the AI auto-selected for a stage as compact
// cards right in the chat — no browsable workspace catalog, no heart/like
// interaction. See lib/styleSelectionReason.ts for the per-card copy.
export interface SelectionResultsPayload {
  stage: ExplorationStage;
  itemIds: string[];
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  companionQuestion?: CompanionQuestionPayload;
  advancePrompt?: AdvancePromptPayload;
  selectionResults?: SelectionResultsPayload;
  checklist?: ChecklistPayload;
  // Renders the current destinationBundle's flight/hotel as a compact card
  // right in the chat — flights/hotels are result-only now, never shown in
  // the browser workspace.
  tripSummary?: boolean;
}

export interface QuestionnaireLikertItem {
  id: string;
  type: "likert";
  question: string;
}

export interface QuestionnaireTextItem {
  id: string;
  type: "text";
  question: string;
}

export type QuestionnaireItem = QuestionnaireLikertItem | QuestionnaireTextItem;

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
