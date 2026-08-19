import { create } from "zustand";
import type {
  BrowsingSignals,
  ChatMessage,
  Condition,
  DayPlan,
  DestinationBundle,
  ExplorationStage,
  Interest,
  ItemSignals,
  ItineraryDay,
  StageBrowsingSignals,
  StageId,
  TravelStyleTag,
} from "@/types";
import { BASE_CONDITION_ORDER, CONDITION_DESTINATION, shuffleConditionOrder } from "@/data/conditions";
import { getDestinationBundle } from "@/data/destinations";
import * as dialogue from "@/data/dialogue";
import { generateItinerary, generateItineraryFromDayPlan, ACTIVITY_SLOTS, RESTAURANT_SLOTS } from "@/lib/itinerary";
import { computePreferenceRank } from "@/lib/preferenceRank";
import { inferStyleTagFromInterest } from "@/lib/browsingInference";
import { buildAiAutoplayCategories, type AiAutoplayCategory, type AiAutoplayStep } from "@/lib/aiAutoplay";
import {
  AUTOPLAY_BUBBLE_MS,
  AUTOPLAY_CURSOR_ENTER_MS,
  AUTOPLAY_CURSOR_EXIT_MS,
  AUTOPLAY_DETAIL_MS,
  AUTOPLAY_SKIM_MS,
  AUTOPLAY_STEP_GAP_MS,
  CHECKLIST_ITEM_MS,
  MIN_PROCESSING_MS,
  readingDelayMs,
  STAGE_SKELETON_MS,
} from "@/lib/constants";

type Phase = "consent" | "pre-survey" | "instructions" | "planning" | "condition-survey" | "transition" | "questionnaire";

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Short, human-typeable, and — unlike a real name — carries no personal
// information at all: purely random, no timestamp/device fingerprint baked
// in. Excludes 0/O/1/I so a researcher transcribing it by hand won't
// misread it. Only used for participantId (see ensureParticipantId) — chat
// message ids etc. still use makeId() above.
const PARTICIPANT_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeParticipantCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += PARTICIPANT_CODE_CHARS[Math.floor(Math.random() * PARTICIPANT_CODE_CHARS.length)];
  }
  return code;
}

function emptyDayPlan(): DayPlan {
  return {
    1: { activityIds: [], restaurantIds: [] },
    2: { activityIds: [], restaurantIds: [] },
    3: { activityIds: [], restaurantIds: [] },
    4: { activityIds: [], restaurantIds: [] },
  };
}

// Strips an item out of every day it might currently be assigned to —
// used whenever an item is un-liked (it can no longer sit in a day) and as
// the first step of assignToDay (an item can only occupy one day at a
// time, so re-assigning always clears any prior placement first).
function removeFromDayPlan(dayPlan: DayPlan, kind: "activity" | "restaurant", itemId: string): DayPlan {
  const key = kind === "activity" ? "activityIds" : "restaurantIds";
  const next: DayPlan = {};
  for (const [day, assignment] of Object.entries(dayPlan)) {
    next[Number(day)] = { ...assignment, [key]: assignment[key].filter((x) => x !== itemId) };
  }
  return next;
}

function emptyStageSignals(): StageBrowsingSignals {
  return { items: {}, searchQueries: [], filtersUsed: [], scrollSamplesPxPerSec: [] };
}

function emptyBrowsingSignals(): BrowsingSignals {
  return { activities: emptyStageSignals(), restaurants: emptyStageSignals() };
}

function nextInteractionOrder(stageSignals: StageBrowsingSignals): number {
  const orders = Object.values(stageSignals.items).map((s) => s.lastInteractionOrder);
  return (orders.length > 0 ? Math.max(...orders) : 0) + 1;
}

function patchItemSignals(
  stageSignals: StageBrowsingSignals,
  itemId: string,
  patch: (prev: ItemSignals) => ItemSignals
): StageBrowsingSignals {
  const prev: ItemSignals = stageSignals.items[itemId] ?? {
    hoverMs: 0,
    hoverSessions: 0,
    detailOpens: 0,
    detailMs: 0,
    lastInteractionOrder: 0,
  };
  return { ...stageSignals, items: { ...stageSignals.items, [itemId]: patch(prev) } };
}

interface ExperimentState {
  phase: Phase;
  // Generated once per participant (see ensureParticipantId) — a random
  // 8-character code (makeParticipantCode), never anything the participant
  // typed or anything derived from their identity. This is what links a
  // participant's 3 per-condition survey rows and final row together in
  // the sheet — sent as `participantCode` (see surveySubmission.ts), which
  // lands in the sheet's "ParticipantName" column; despite that column
  // name, the value is always this anonymous code, never a real name.
  participantId: string;
  // Rolled fresh per participant in acceptConsent(); BASE_CONDITION_ORDER is
  // only the safe default before that (see data/conditions.ts).
  conditionOrder: Condition[];
  conditionIndex: number;
  condition: Condition;
  destinationBundle: DestinationBundle;

  messages: ChatMessage[];
  isTyping: boolean;
  // Non-null once the AI's opening greeting has been sent and the fixed
  // scenario prompt is ready to go — ChatInput shows this value read-only
  // with only the send button enabled (see sendPendingPrompt). Every
  // condition (first and repeats) starts this way, never with exploration
  // already running, so it's always the participant's own explicit action
  // that kicks things off.
  pendingPrompt: string | null;
  activeStage: StageId | null;
  unlockedStages: StageId[];
  loadingStage: StageId | null;

  // Human-led: every item placed into any day (see dayPlan below /
  // toggleDayItem), kept flattened here too purely so ConditionSurveyScreen
  // has a simple, condition-agnostic "how many did you end up with" count.
  // Mixed-led/AI-led: the final ranked top-N set that actually made it into
  // the itinerary (set once exploration wraps up — see
  // finishMixedExploring/runAiLedFlow).
  likedActivityIds: string[];
  likedRestaurantIds: string[];
  // Mixed-led only — its one explicit signal, a 👍/👎 per card (see
  // types/index.ts's Interest, cards/ActivityCard.tsx/RestaurantCard.tsx).
  interestActivity: Record<string, Interest>;
  interestRestaurant: Record<string, Interest>;
  selectedActivityTags: string[];
  selectedRestaurantTags: string[];
  browsing: BrowsingSignals;
  // Human-led only — which day (1-4) is currently being selected for (see
  // toggleDayItem/confirmDaySelection) — the AI walks through days 1-4 in
  // chat one at a time (see components/chat/DaySelectionMessage.tsx)
  // instead of a separate free-browse-then-place step.
  humanDayIndex: number;
  // Human-led only — which day each selected item has been placed into (see
  // toggleDayItem). Unassigned items simply don't appear in the final plan.
  dayPlan: DayPlan;
  // AI-led only — the one thing every condition asks upfront ("동행자"),
  // purely narrative now (see confirmCompanion) — AI-led's actual style
  // signal comes from styleQuestion instead (see confirmStyleQuestion).
  // Empty until confirmCompanion runs.
  companion: string;

  // True whenever the AI is in the middle of any "processing" beat —
  // flights/hotels checklist, explore checklist, final-plan checklist,
  // AI-led's merged checklist (see postChecklist) — regardless of
  // condition. Gates what BrowserWorkspace shows: the interactive catalog
  // only appears when this is false AND activeStage is "explore" (see
  // ExplorePanel); otherwise it's a generic AiWorkingPanel, with its own
  // text distinguishing "still idle, nothing started yet" (this flag false,
  // activeStage null) from "actively processing" (this flag true). The
  // checklist itself only ever appears in chat as its own standalone card
  // (see components/chat/ChecklistCard.tsx), never as a per-site visual in
  // the workspace.
  aiWorking: boolean;
  // What AiWorkingPanel actually says while `aiWorking` is true — kept as
  // its own field (not a hardcoded string in BrowserWorkspace) because the
  // honest description of "what the AI is doing" differs by phase even
  // though the boolean gating logic doesn't: site-browsing checklists (see
  // runFlightsHotelsCollection/startExploring/runAiLedFlow) read as
  // dialogue.aiWorkingLabelCollecting, but runFinalPlanGeneration's
  // checklist ("선택하신 장소 분석 중" etc.) isn't browsing anything
  // anymore — it's synthesizing the actual itinerary, so it gets
  // dialogue.aiWorkingLabelPlanning instead. Set together with
  // `aiWorking: true` at every call site.
  aiWorkingLabel: string;
  // Whether AiWorkingPanel's icon should spin (default true at every
  // existing call site) — false only for AI-led's style-question wait (see
  // runAiLedFlow), where aiWorking stays true to keep the catalog hidden
  // (see showingCatalog in BrowserWorkspace.tsx) but the search itself has
  // already finished, so a still-spinning icon would contradict the
  // "완료" label sitting right next to it.
  aiWorkingSpinning: boolean;

  // AI-led's watch-only browsing sequence (see lib/aiAutoplay.ts,
  // lib/store.ts's runAiAutoplay) — the participant sees the same
  // candidate catalog human-led/mixed-led get, but read-only: no tab
  // clicks, no card clicks, no select/interest buttons (see
  // components/workspace/ExplorePanel.tsx and the cards' own
  // condition === "ai" branches). These four fields are what actually
  // drives that catalog's read-only "the AI is browsing this, right now"
  // presentation instead of a participant-driven one.
  // Which item (if any) is currently highlighted/cursor-focused — null
  // during the skim beat (see autoplaySkimming) and once the whole
  // sequence finishes; only set during the per-item focus sweep.
  autoplayFocusedItemId: string | null;
  // The status text shown while autoplay runs — during the skim beat this
  // renders as the top status pill (see components/workspace/
  // ExplorePanel.tsx), during the per-item sweep it renders inside the
  // focused card's own cursor/speech-bubble instead (see
  // components/cards/AutoplayCursorBubble.tsx). Null when autoplay isn't
  // active.
  autoplayStatusText: string | null;
  // True only during each category's opening "scroll down, then back up"
  // skim beat (see lib/aiAutoplay.ts's AiAutoplayCategory.skimStatusText,
  // lib/store.ts's runAiAutoplay) — drives ExplorePanel's scroll-animation
  // effect and which of the two status-display modes above is showing.
  autoplaySkimming: boolean;
  // Which of the two catalogs ExplorePanel shows — shared by all three
  // conditions now (previously AI-led had its own separate aiAutoplayTab
  // field, human-led/mixed-led a local `tab` useState in ExplorePanel
  // itself). AI-led's runAiAutoplay writes to this directly (see
  // lib/aiAutoplay.ts's per-category `tab`) since the participant never
  // touches it there; human-led/mixed-led switch it via the workspace's
  // own tab buttons (see components/workspace/ExplorePanel.tsx) OR via
  // confirmActivityStage below, once the new "액티비티 완료" chat button
  // is clicked.
  exploreTab: ExplorationStage;
  // Mixed-led only — the 식당 tab starts genuinely disabled (not just
  // unclicked) until "액티비티 완료" is pressed (see confirmActivityStage
  // below, components/workspace/ExplorePanel.tsx's own disabling logic).
  // Once true, both tabs switch freely — this never goes back to false
  // within one condition run, unlike exploreTab which can move back and
  // forth. Human-led never reads this (both its tabs are always freely
  // switchable — only the 식당 tab's genuine lock is mixed-led-specific).
  mixedRestaurantTabUnlocked: boolean;
  // The detail dialog's own cursor visual (see components/cards/
  // ItemDetailDialog.tsx's condition === "ai" rendering) — "enter" briefly
  // right as an autoplay-opened dialog appears (a "clicked in here" beat),
  // "exit" briefly right before it closes (a "moving to close and
  // clicking" beat), null the rest of the time including whenever the
  // dialog was opened any other way (openDetail/openDetailReview never
  // touch this field).
  autoplayDialogCursor: "enter" | "exit" | null;

  activeDetailItemId: string | null;
  // True when the currently-open detail dialog was opened for review from
  // the final itinerary (see openDetailReview) rather than from an explore-
  // stage card (see openDetail) — suppresses the select/interest buttons
  // regardless of condition, since the final plan is read-only (see
  // ItemDetailDialog.tsx).
  detailReadOnly: boolean;

  itineraryDays: ItineraryDay[];
  // Controls components/flow/ConditionCompleteDialog.tsx — opened by
  // confirmFinalPlan (the final plan message's own chat button, see
  // types/index.ts's BookingConfirmPayload), closed by
  // proceedToConditionSurvey (the popup's own "평가하기" button).
  showConditionCompletePopup: boolean;

  acceptConsent: () => void;
  // Pre-survey's own "제출하기" (see PreSurveyScreen.tsx) — the survey row
  // itself is submitted by that screen (submitSurveyRow, kind:"presurvey"),
  // this just advances the phase once that's done, same division of labor
  // as ConditionSurveyScreen/completeConditionSurvey below.
  completePreSurvey: () => void;
  acknowledgeIntroduction: () => void;
  // Sends the fixed prompt currently sitting in ChatInput (see
  // pendingPrompt above) and kicks off exploration.
  sendPendingPrompt: () => void;

  confirmCompanion: (companion: string) => void;
  // AI-led only — the style question's own confirm action (see
  // components/chat/StyleQuestionMessage.tsx) — up to 2 TravelStyleTag
  // values, used to rank both catalogs before runAiAutoplay sweeps them.
  confirmStyleQuestion: (tags: TravelStyleTag[]) => void;
  // Human-led/mixed-led only — the day/explore prompt's own first-stage
  // "액티비티 완료" button (see components/chat/DaySelectionMessage.tsx /
  // MixedExploreDoneMessage.tsx). Switches exploreTab to "restaurants"
  // without finishing the day/exploration — see confirmDaySelection /
  // finishMixedExploring below for the second-stage "식당 완료" that
  // actually does that.
  confirmActivityStage: () => void;
  // Human-led/mixed-led — sets which of the two catalogs ExplorePanel
  // shows (see exploreTab above). Exposed as its own action so both a
  // manual workspace tab click and confirmActivityStage's forced switch go
  // through the same path.
  setExploreTab: (tab: ExplorationStage) => void;
  // Human-led only — a card's checkbox toggles it directly into whichever
  // day is currently active (see humanDayIndex); picking it while it's
  // already assigned to a different day just moves it.
  toggleDayItem: (kind: "activity" | "restaurant", id: string) => void;
  // Human-led only — the day prompt's own second-stage "식당 완료" button
  // (see components/chat/DaySelectionMessage.tsx). Advances to the next
  // day's prompt, or — after day 4 — runs the final plan directly.
  confirmDaySelection: (day: number) => void;
  // Mixed-led only — sets (or clears, if tapped again) a card's interest.
  setInterest: (stage: ExplorationStage, id: string, interest: Interest) => void;

  // Mixed-led only — the free-browse prompt's own second-stage "식당 완료"
  // button in chat (see components/chat/MixedExploreDoneMessage.tsx) — the
  // workspace card grid is selection-only, it never carries this action
  // itself. Human-led never shows this button at all (see
  // confirmDaySelection instead).
  finishMixedExploring: () => void;

  recordHover: (stage: ExplorationStage, itemId: string, durationMs: number) => void;
  recordSearchQuery: (stage: ExplorationStage, query: string) => void;
  recordFilterUsed: (stage: ExplorationStage, value: string) => void;
  recordScrollSample: (stage: ExplorationStage, pxPerSecond: number) => void;

  openDetail: (id: string) => void;
  // Final itinerary only (see components/cards/ItineraryDayCard.tsx) —
  // opens the same detail dialog but marked read-only (see
  // detailReadOnly), and skips the browsing-signal bookkeeping openDetail
  // does (detailOpens/interaction order are explore-stage-only metrics;
  // clicking an already-finalized itinerary card isn't part of that).
  openDetailReview: (id: string) => void;
  closeDetail: () => void;
  recordDetailDuration: (stage: ExplorationStage, itemId: string, durationMs: number) => void;

  // The final plan message's own chat button (see
  // types/index.ts's BookingConfirmPayload) — opens
  // components/flow/ConditionCompleteDialog.tsx rather than proceeding
  // directly; the itinerary panel itself carries no "move on" action.
  confirmFinalPlan: () => void;
  // The condition-complete popup's own "평가하기" button — actually leaves
  // the planning phase for the per-condition survey.
  proceedToConditionSurvey: () => void;
  // Called once the per-condition survey (right after this condition ends)
  // has been submitted — decides whether the next screen is the transition
  // screen (more conditions left) or the final overall survey (last one).
  completeConditionSurvey: () => void;
  advanceToNextCondition: () => void;
  jumpToCondition: (condition: Condition) => void;
  // Dev-only, same spirit as jumpToCondition (see ExperimentFlow.tsx's
  // ?preview= handling) — skips straight to the final overall survey for
  // reviewing its content without walking all three conditions first.
  jumpToQuestionnaire: () => void;
}

export const useExperimentStore = create<ExperimentState>((set, get) => {
  // `delayMs`, when omitted, is no longer the flat CHAT_REPLY_DELAY_MS_RANGE
  // for every message alike — it defaults to readingDelayMs() of whatever
  // message currently sits last in the transcript (the thing actually on
  // screen for the participant to read right now), so a short line and a
  // long multi-sentence one don't get the same pause before this new
  // message lands. A short/absent previous message (nothing to read, or
  // just a brief user-echo like a tag pick) naturally floors back to the
  // original fixed delay — see readingDelayMs. An explicit `delayMs` still
  // overrides this entirely for call sites that need a specific timing
  // (e.g. runChecklist's own per-item pacing doesn't go through here).
  function sendAiMessage(text: string, after?: () => void, extra?: Partial<ChatMessage>, delayMs?: number) {
    set({ isTyping: true });
    const previousText = get().messages.at(-1)?.text ?? "";
    const delay = delayMs ?? readingDelayMs(previousText);
    setTimeout(() => {
      set((state) => ({
        messages: [...state.messages, { id: makeId(), role: "assistant", text, ...extra }],
        isTyping: false,
      }));
      after?.();
    }, delay);
  }

  // Builds the actual Day 1-4 plan and enters the itinerary stage — the
  // last step of every condition. Human-led uses the participant's own
  // placement (see dayPlan/generateItineraryFromDayPlan) untouched; mixed-
  // led/AI-led both use the ranked-top-N template (see generateItinerary),
  // differing only in whether an interest map feeds the ranking (mixed) or
  // not (AI-led ranks purely by the companion-implied tag).
  function finalizeItinerary() {
    const state = get();
    const { condition, destinationBundle, dayPlan, selectedActivityTags, selectedRestaurantTags, interestActivity, interestRestaurant } =
      state;
    const days =
      condition === "human"
        ? generateItineraryFromDayPlan(destinationBundle, dayPlan)
        : generateItinerary(
            destinationBundle,
            { activities: selectedActivityTags, restaurants: selectedRestaurantTags },
            condition === "mixed" ? { activities: interestActivity, restaurants: interestRestaurant } : undefined,
            condition
          );
    set({ itineraryDays: days });
    enterStage("itinerary");
  }

  // Pure navigation only — updates which stage is active/unlocked. What (if
  // anything) happens when a stage begins is each condition's own concern
  // (see startExploring/runAiLedFlow), not baked in here, so this is safe to
  // call from anywhere that just needs to move the stepper forward.
  function enterStage(stageId: StageId) {
    set((state) => ({
      unlockedStages: state.unlockedStages.includes(stageId)
        ? state.unlockedStages
        : [...state.unlockedStages, stageId],
      activeStage: stageId,
    }));
  }

  // Human-led and Mixed-led both start exploration the same way: a site
  // checklist (see postChecklist) right away — no separate lead-in bubble
  // of its own, since runFlightsHotelsCollection's own closing line already
  // covers "here's what I'm about to look into next" (see the merged
  // dialogue.flightsHotelsCollectingComplete) and nothing requiring
  // participant action happens in between, so a second bubble here would
  // just be restating the same beat — shown only in chat as its own
  // standalone card (see components/chat/ChecklistCard.tsx), with the
  // workspace just showing a generic "processing" panel the whole time (see
  // `aiWorking` / BrowserWorkspace). Once that finishes, human-led gets the
  // first of its day-by-day prompts (see confirmDaySelection), mixed-led
  // gets its free-browse prompt with no time limit — it moves on via
  // ExplorePanel's own persistent bottom button whenever the participant is
  // ready (see finishMixedExploring). AI-led never calls this — see
  // runAiLedFlow instead.
  function startExploring() {
    enterStage("explore");
    set({ aiWorking: true, aiWorkingLabel: dialogue.aiWorkingLabelCollecting, aiWorkingSpinning: true });

    postChecklist(dialogue.explorationCollectionChecklistItems, () => {
      set({ aiWorking: false, loadingStage: "explore" });
      setTimeout(() => set({ loadingStage: null }), STAGE_SKELETON_MS);

      const state = get();
      const city = state.destinationBundle.meta.city;
      if (state.condition === "human") {
        set({ humanDayIndex: 1 });
        sendAiMessage(dialogue.humanExploreIntro(city), undefined, {
          daySelection: { day: 1, activityStageConfirmed: false, confirmed: false },
        });
      } else {
        sendAiMessage(dialogue.mixedExplorationPrompt(city), undefined, {
          mixedExploreDone: { activityStageConfirmed: false, confirmed: false },
        });
      }
    });
  }

  // Human-led and Mixed-led only, right after the scenario prompt is sent —
  // a short, purely narrative "AI already looked into flights/hotels" beat
  // with no user interaction and no real decision made yet (that only
  // happens in runFinalPlanGeneration, once the AI knows what the
  // participant actually wants to do). AI-led skips this entirely — its own
  // single combined checklist (see runAiLedFlow) already covers it.
  function runFlightsHotelsCollection(onDone: () => void) {
    // `aiWorking` flips only once flightsHotelsCollectingIntro has actually
    // landed in chat (inside this `after` callback), not the instant this
    // function is called — setting it any earlier showed the workspace's
    // "AI가 사이트를 탐색 중입니다." before the participant had even read
    // the message explaining that's what's about to happen.
    const companion = get().companion;
    sendAiMessage(dialogue.flightsHotelsCollectingIntro(companion), () => {
      set({ aiWorking: true, aiWorkingLabel: dialogue.aiWorkingLabelCollecting, aiWorkingSpinning: true });
      postChecklist(dialogue.flightsHotelsCollectingItems, () => {
        sendAiMessage(dialogue.flightsHotelsCollectingComplete, onDone);
      });
    });
  }

  // Mixed-led only — runs once the free-browse prompt's own "다음으로"
  // button is pressed in chat (exposed publicly as finishMixedExploring —
  // see components/chat/MixedExploreDoneMessage.tsx). Infers a style tag
  // from what was actually marked 관심있음 (see
  // lib/browsingInference.ts) and uses it, together with the raw interest
  // map itself, to rank each catalog — the same ranked-top-N set both
  // becomes likedActivityIds/likedRestaurantIds (for the survey's count —
  // see ConditionSurveyScreen) and feeds finalizeItinerary's template.
  function finishMixedExploring() {
    const state = get();
    if (state.condition !== "mixed") return;
    const { destinationBundle, interestActivity, interestRestaurant } = state;

    const inferredActivityTag = inferStyleTagFromInterest(destinationBundle.activities, interestActivity);
    const inferredRestaurantTag = inferStyleTagFromInterest(destinationBundle.restaurants, interestRestaurant);
    const activityTags = inferredActivityTag ? [inferredActivityTag] : [];
    const restaurantTags = inferredRestaurantTag ? [inferredRestaurantTag] : [];

    const rankedActivityIds = computePreferenceRank(destinationBundle.activities, activityTags, interestActivity).slice(
      0,
      ACTIVITY_SLOTS
    );
    const rankedRestaurantIds = computePreferenceRank(
      destinationBundle.restaurants,
      restaurantTags,
      interestRestaurant
    ).slice(0, RESTAURANT_SLOTS);

    set((s) => ({
      likedActivityIds: rankedActivityIds,
      likedRestaurantIds: rankedRestaurantIds,
      selectedActivityTags: activityTags,
      selectedRestaurantTags: restaurantTags,
      messages: s.messages.map((m) =>
        m.mixedExploreDone && !m.mixedExploreDone.confirmed
          ? { ...m, mixedExploreDone: { ...m.mixedExploreDone, confirmed: true } }
          : m
      ),
    }));

    runFinalPlanGeneration();
  }

  // Shared by every "AI worked internally, here's the checklist" moment —
  // flights/hotels, explore, final-plan, AI-led's merged one — none of
  // which have a browsable workspace behind them (see `aiWorking`).
  // `startedAt` anchors the MIN_PROCESSING_MS floor enforced below, timed
  // from when the checklist card first appeared, not from this call.
  function runChecklist(messageId: string, items: string[], index: number, startedAt: number, onDone: () => void) {
    if (index >= items.length) {
      const elapsed = Date.now() - startedAt;
      setTimeout(onDone, Math.max(0, MIN_PROCESSING_MS - elapsed));
      return;
    }
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.checklist ? { ...m, checklist: { ...m.checklist, revealedCount: index + 1 } } : m
      ),
    }));
    setTimeout(() => runChecklist(messageId, items, index + 1, startedAt, onDone), CHECKLIST_ITEM_MS);
  }

  // Posts the "" + checklist-payload message, then progressively reveals its
  // items before calling onDone — the whole card stays visible for at least
  // MIN_PROCESSING_MS from the moment it appears (see runChecklist), even
  // if the items themselves reveal faster than that. Its own appearance is
  // already paced off whatever message precedes it (see sendAiMessage's
  // default readingDelayMs behavior) — no explicit delay needed here.
  function postChecklist(items: string[], onDone: () => void) {
    const checklistId = makeId();
    sendAiMessage(
      "",
      () => {
        const startedAt = Date.now();
        setTimeout(() => runChecklist(checklistId, items, 0, startedAt, onDone), 500);
      },
      { id: checklistId, checklist: { items, revealedCount: 0 } }
    );
  }

  // Every condition, asked once right after the scenario prompt — before the
  // AI does anything else (flights/hotels included). Purely narrative for
  // all three now — nobody's ranking uses the answer (see confirmCompanion;
  // AI-led's own style signal comes from styleQuestion instead, asked
  // separately once the catalog is on screen — see confirmStyleQuestion).
  function postCompanionQuestion() {
    sendAiMessage(dialogue.companionQuestion, undefined, {
      companionQuestion: { options: [...dialogue.companionOptions], selected: "", confirmed: false },
    });
  }

  // The actual final message + itinerary reveal — shared by every
  // condition's ending, word-for-word the same regardless of condition
  // (see dialogue.finalPlanMessage) — no flight/hotel info attached here at
  // all anymore, that only ever shows inside the itinerary itself now (see
  // lib/itinerary.ts's check-in item). Any per-condition nuance lives in
  // the bottom AI-comment box instead (see components/workspace/panels/
  // AiCommentSummary.tsx), not this line. Carries its own "확인했습니다"
  // button (see confirmFinalPlan) — the itinerary panel itself never gets a
  // "move on" action, only the chat message does. Human-led/mixed-led reach
  // this via runFinalPlanGeneration below (their own checklist plays
  // first); AI-led calls this directly since its single combined checklist
  // (see runAiLedFlow) already covered the same ground.
  function sendFinalPlanMessage() {
    sendAiMessage(dialogue.finalPlanMessage, () => finalizeItinerary(), { bookingConfirm: { confirmed: false } });
  }

  // Human-led/mixed-led, step 3 — once exploration wraps up (human's day
  // placement, mixed's own analysis), the AI folds flights/hotels into the
  // final plan for the first time (see finalizeItinerary): a short
  // checklist, then the shared final message + Day 1-4 itinerary (see
  // sendFinalPlanMessage). AI-led never calls this — see runAiLedFlow
  // instead.
  function runFinalPlanGeneration() {
    // dialogue.aiWorkingLabelPlanning, not …Collecting — by this point
    // there's nothing left to browse (explore already wrapped up), the AI
    // is synthesizing the actual itinerary (see this checklist's own
    // items: "선택하신 장소 분석 중" etc.), so the workspace should say so
    // rather than still claiming to be searching sites.
    set({ aiWorking: true, aiWorkingLabel: dialogue.aiWorkingLabelPlanning, aiWorkingSpinning: true });
    postChecklist(dialogue.finalPlanChecklistItems, () => sendFinalPlanMessage());
  }

  // Drives one category's steps (see lib/aiAutoplay.ts's
  // AiAutoplayCategory.steps) — the focus-sweep half of runAiAutoplay,
  // called only after that category's skim beat has already played. Each
  // step highlights+scrolls to one card, updates the status line, and
  // holds the cursor/speech-bubble on that card for AUTOPLAY_BUBBLE_MS —
  // long enough to actually register as "the AI is looking at this one,"
  // not just flash by. Steps marked `openDetail` additionally open that
  // item's detail dialog in read-only mode (the exact same dialog/mode the
  // final itinerary's own review click uses, see openDetailReview) once
  // the bubble beat finishes, with its own two-part cursor visual: a brief
  // "clicked in" beat right as it opens (autoplayDialogCursor: "enter"),
  // then after the reading pause, a "moving to close and clicking" beat
  // (autoplayDialogCursor: "exit") right before it actually closes — see
  // components/cards/ItemDetailDialog.tsx's own condition === "ai"
  // rendering of these two phases. Recurses via setTimeout rather than a
  // single interval so each step's own duration (plain focus vs. a full
  // detail-dialog open) can differ.
  function runAiAutoplaySteps(steps: AiAutoplayStep[], onDone: () => void) {
    function playStep(i: number) {
      if (i >= steps.length) {
        set({ autoplayFocusedItemId: null, autoplayStatusText: null });
        onDone();
        return;
      }
      const step = steps[i];
      set({
        exploreTab: step.tab,
        autoplayFocusedItemId: step.itemId,
        autoplayStatusText: step.statusText,
      });
      setTimeout(() => {
        if (!step.openDetail) {
          playStep(i + 1);
          return;
        }
        set({ activeDetailItemId: step.itemId, detailReadOnly: true, autoplayDialogCursor: "enter" });
        setTimeout(() => set({ autoplayDialogCursor: null }), AUTOPLAY_CURSOR_ENTER_MS);
        setTimeout(
          () => {
            set({ autoplayDialogCursor: "exit" });
            setTimeout(() => {
              set({ activeDetailItemId: null, detailReadOnly: false, autoplayDialogCursor: null });
              setTimeout(() => playStep(i + 1), AUTOPLAY_STEP_GAP_MS);
            }, AUTOPLAY_CURSOR_EXIT_MS);
          },
          AUTOPLAY_DETAIL_MS - AUTOPLAY_CURSOR_EXIT_MS
        );
      }, AUTOPLAY_BUBBLE_MS);
    }
    playStep(0);
  }

  // Drives lib/aiAutoplay.ts's full category list — AI-led's watch-only
  // stand-in for human-led's own browsing/card clicks. Each category plays
  // a skim beat first (exploreTab switches, autoplaySkimming:true,
  // autoplayFocusedItemId stays null — see components/workspace/
  // ExplorePanel.tsx's scroll effect, which does the actual scrolling off
  // this flag), reads as "generally looking around this list" for
  // AUTOPLAY_SKIM_MS, THEN the per-item focus sweep (runAiAutoplaySteps)
  // singles out specific cards with a cursor+speech-bubble each (see
  // components/cards/AutoplayCursorBubble.tsx) — matching "탐색 시작하면
  // 5초정도는 둘러보는 느낌... 그런 다음에... 특정 아이템에 마우스 올리면
  // 말풍선으로."
  function runAiAutoplay(categories: AiAutoplayCategory[], onDone: () => void) {
    function playCategory(i: number) {
      if (i >= categories.length) {
        onDone();
        return;
      }
      const category = categories[i];
      set({
        exploreTab: category.tab,
        autoplaySkimming: true,
        autoplayFocusedItemId: null,
        autoplayStatusText: category.skimStatusText,
      });
      setTimeout(() => {
        set({ autoplaySkimming: false, autoplayStatusText: null });
        runAiAutoplaySteps(category.steps, () => playCategory(i + 1));
      }, AUTOPLAY_SKIM_MS);
    }
    playCategory(0);
  }

  // AI-led — flights/hotels collection is its own short intro+checklist
  // beat (see aiLedFlightsHotelsIntro/aiLedFlightsHotelsChecklistItems),
  // mirroring human-led/mixed-led's runFlightsHotelsCollection. From there
  // this now shows the SAME candidate catalog they get (see
  // explorationCollectionChecklistItems, shared rather than AI-led having
  // its own separate checklist) — the only real difference is who does the
  // choosing once it's on screen: human-led/mixed-led browse it
  // themselves, AI-led runs runAiAutoplay over it instead while the
  // catalog stays fully read-only for the participant (see
  // components/workspace/ExplorePanel.tsx's condition === "ai" branch).
  // Doesn't rank anything itself — that waits for confirmStyleQuestion
  // below, once the participant has actually picked the style tag(s) to
  // rank by, instead of the old companion-implied guess. Ends by posting
  // the style question (see aiLedStyleQuestionIntro) rather than jumping
  // straight into autoplay narration.
  function runAiLedFlow() {
    // enterStage("explore") and aiWorking:true both wait for
    // aiLedFlightsHotelsIntro to actually land in chat (inside this
    // `after` callback) instead of firing the instant this function is
    // called — previously they flipped immediately, so the workspace's
    // "AI가 사이트를 탐색 중입니다." appeared the moment the participant
    // clicked their companion answer, before the message explaining that
    // was even visible. Moving `enterStage` together with `aiWorking`
    // (not just the label) matters here specifically — unlike human-led/
    // mixed-led's runFlightsHotelsCollection, this condition has no other
    // gate keeping ExplorePanel's real catalog off-screen (see
    // BrowserWorkspace's `showingCatalog`), so leaving activeStage
    // "explore" set while aiWorking was still false would flash the
    // actual interactive catalog for a moment — flipping both at once
    // avoids that.
    const companion = get().companion;
    sendAiMessage(dialogue.aiLedFlightsHotelsIntro(companion), () => {
      enterStage("explore");
      set({ aiWorking: true, aiWorkingLabel: dialogue.aiWorkingLabelCollecting, aiWorkingSpinning: true });
      postChecklist(dialogue.aiLedFlightsHotelsChecklistItems, () => {
        sendAiMessage(dialogue.aiLedExploreIntro, () => {
          postChecklist(dialogue.explorationCollectionChecklistItems, () => {
            // Deliberately does NOT reveal the catalog yet (unlike
            // startExploring's own aiWorking:false + skeleton beat) —
            // AI-led is watch-only, so letting the participant see/scroll
            // the actual candidate grid themselves before they've even
            // picked a style (and before the AI has actually ranked
            // anything to browse in order) would look like "관찰만" being
            // broken for a few seconds. `aiWorking` stays true (workspace
            // keeps showing this panel — see BrowserWorkspace's
            // showingCatalog) with a static checkmark instead of the
            // spinner, since the search itself is genuinely done — only
            // the ranking/browsing is still pending. The real reveal + skim
            // happens once confirmStyleQuestion below actually has tags to
            // rank by and kicks off runAiAutoplay.
            set({
              aiWorking: true,
              aiWorkingLabel: dialogue.aiWorkingLabelSearchComplete,
              aiWorkingSpinning: false,
            });

            const city = get().destinationBundle.meta.city;
            sendAiMessage(dialogue.aiLedStyleQuestionIntro(city), undefined, {
              styleQuestion: { options: [...dialogue.aiLedStyleTagOptions], selected: [], confirmed: false },
            });
          });
        });
      });
    });
  }

  // AI-led only — the style-question's own confirm action (see
  // components/chat/StyleQuestionMessage.tsx), picking up where
  // runAiLedFlow above left off. Echoes the pick as a real user-role chat
  // bubble first (same pattern as confirmCompanion), then ranks both
  // catalogs by the tag(s) just chosen — the same shape
  // computePreferenceRank always takes, just fed participant-picked tags
  // instead of a companion-implied guess — before finally running the
  // autoplay sweep (see lib/aiAutoplay.ts's buildAiAutoplayCategories) and,
  // once that finishes, the shared final-plan beat.
  function confirmStyleQuestion(tags: TravelStyleTag[]) {
    set((state) => ({
      messages: [
        ...state.messages.map((m) =>
          m.styleQuestion && !m.styleQuestion.confirmed
            ? { ...m, styleQuestion: { ...m.styleQuestion, selected: tags, confirmed: true } }
            : m
        ),
        { id: makeId(), role: "user" as const, text: tags.map(dialogue.styleTagLabel).join(", ") },
      ],
    }));

    sendAiMessage(dialogue.aiLedStyleQuestionConfirmedMessage, () => {
      const { destinationBundle } = get();
      const rankedActivities = computePreferenceRank(destinationBundle.activities, tags).slice(0, ACTIVITY_SLOTS);
      const rankedRestaurants = computePreferenceRank(destinationBundle.restaurants, tags).slice(
        0,
        RESTAURANT_SLOTS
      );
      set({
        likedActivityIds: rankedActivities,
        likedRestaurantIds: rankedRestaurants,
        selectedActivityTags: tags,
        selectedRestaurantTags: tags,
      });

      // The catalog reveal that runAiLedFlow deliberately withheld — same
      // aiWorking:false + brief skeleton beat every other condition's
      // catalog reveal uses, just delayed until there's actually a ranked
      // order to show and the autoplay sweep is about to start narrating
      // it, instead of an unranked list sitting there waiting on the
      // style pick.
      set({ aiWorking: false, loadingStage: "explore", exploreTab: "activities" });
      setTimeout(() => {
        set({ loadingStage: null });
        const categories = buildAiAutoplayCategories(rankedActivities, rankedRestaurants);
        runAiAutoplay(categories, () => {
          sendAiMessage(dialogue.aiLedFinalPlanIntro, () => {
            set({ aiWorking: true, aiWorkingLabel: dialogue.aiWorkingLabelPlanning, aiWorkingSpinning: true });
            postChecklist(dialogue.aiLedFinalPlanChecklistItems, () => sendFinalPlanMessage());
          });
        });
      }, STAGE_SKELETON_MS);
    });
  }

  // Every condition asks the companion question first, right after the
  // participant's scenario prompt is sent (see postCompanionQuestion) — what
  // happens once it's answered is where conditions actually diverge (see
  // confirmCompanion below). Goes through the normal AI-message delay/typing-
  // indicator beat (see sendAiMessage) rather than appearing instantly, so
  // there's a beat to actually read the participant's own message that was
  // just sent before this question shows up.
  function beginExploration() {
    postCompanionQuestion();
  }

  // Shared by every planning entry point below — resets every per-condition
  // piece of state (chat, likes, browsing signals, itinerary, etc.) before
  // the new condition's conversation starts. Messages start empty — the
  // greeting and fixed prompt are added afterward by whoever calls this
  // (see beginPlanningChat/jumpIntoPlanning), not baked in here.
  function resetPlanningState() {
    set({
      phase: "planning",
      messages: [],
      isTyping: false,
      pendingPrompt: null,
      activeStage: null,
      unlockedStages: [],
      loadingStage: null,
      likedActivityIds: [],
      likedRestaurantIds: [],
      interestActivity: {},
      interestRestaurant: {},
      selectedActivityTags: [],
      selectedRestaurantTags: [],
      browsing: emptyBrowsingSignals(),
      humanDayIndex: 1,
      dayPlan: emptyDayPlan(),
      companion: "",
      aiWorking: false,
      aiWorkingLabel: dialogue.aiWorkingLabelCollecting,
      aiWorkingSpinning: true,
      autoplayFocusedItemId: null,
      autoplayStatusText: null,
      autoplaySkimming: false,
      exploreTab: "activities",
      mixedRestaurantTabUnlocked: false,
      autoplayDialogCursor: null,
      activeDetailItemId: null,
      detailReadOnly: false,
      itineraryDays: [],
      showConditionCompletePopup: false,
    });
  }

  // Starts a fresh condition's chat: resets state, sends the AI's opening
  // greeting, then — once that finishes typing — reveals the fixed
  // scenario prompt in ChatInput (see pendingPrompt/sendPendingPrompt).
  // Deliberately never starts exploration itself: the participant always
  // has to actually press send first, every condition, so it never feels
  // like the AI just started working on its own.
  function beginPlanningChat(text: string) {
    resetPlanningState();
    sendAiMessage(dialogue.initialGreeting, () => {
      set({ pendingPrompt: text });
    });
  }

  // Dev-only (?preview=human|mixed|ai — see ExperimentFlow) — skips the
  // greeting/pending-prompt beat entirely since it exists purely to jump
  // straight into a condition for review, not to rehearse the opening
  // exchange.
  function jumpIntoPlanning(text: string) {
    resetPlanningState();
    set((state) => ({
      messages: [
        ...state.messages,
        { id: makeId(), role: "assistant", text: dialogue.initialGreeting },
        { id: makeId(), role: "user", text },
      ],
    }));
    setTimeout(() => beginExploration(), 500);
  }

  // Turns the fixed prompt currently sitting in ChatInput (see
  // pendingPrompt) into a real sent message, then kicks off exploration —
  // the participant's own explicit action, every time.
  function sendPendingPrompt() {
    const text = get().pendingPrompt;
    if (!text) return;
    set((state) => ({
      pendingPrompt: null,
      messages: [...state.messages, { id: makeId(), role: "user", text }],
    }));
    beginExploration();
  }

  // Generates the participant ID on first use rather than at module load —
  // same reasoning as conditionOrder below: must stay client-only to avoid
  // an SSR/hydration mismatch.
  function ensureParticipantId(): string {
    const existing = get().participantId;
    if (existing) return existing;
    const id = makeParticipantCode();
    set({ participantId: id });
    return id;
  }

  return {
    phase: "consent",
    participantId: "",
    // Deterministic default (see BASE_CONDITION_ORDER) — replaced with a real
    // shuffle in acceptConsent(), the first client-only user action.
    conditionOrder: BASE_CONDITION_ORDER,
    conditionIndex: 0,
    condition: BASE_CONDITION_ORDER[0],
    destinationBundle: getDestinationBundle(CONDITION_DESTINATION[BASE_CONDITION_ORDER[0]]),

    messages: [],
    isTyping: false,
    pendingPrompt: null,
    activeStage: null,
    unlockedStages: [],
    loadingStage: null,

    likedActivityIds: [],
    likedRestaurantIds: [],
    interestActivity: {},
    interestRestaurant: {},
    selectedActivityTags: [],
    selectedRestaurantTags: [],
    browsing: emptyBrowsingSignals(),
    humanDayIndex: 1,
    dayPlan: emptyDayPlan(),
    companion: "",

    aiWorking: false,
    aiWorkingLabel: dialogue.aiWorkingLabelCollecting,
    aiWorkingSpinning: true,
    autoplayFocusedItemId: null,
    autoplayStatusText: null,
    autoplaySkimming: false,
    exploreTab: "activities",
    mixedRestaurantTabUnlocked: false,
    autoplayDialogCursor: null,

    activeDetailItemId: null,
    detailReadOnly: false,

    itineraryDays: [],
    showConditionCompletePopup: false,

    acceptConsent: () => {
      // Roll the per-participant condition order now — the first user-
      // triggered action, safely client-only (avoids an SSR/hydration
      // mismatch from randomizing at module-load time).
      ensureParticipantId();
      const conditionOrder = shuffleConditionOrder();
      const condition = conditionOrder[0];
      set({
        phase: "pre-survey",
        conditionOrder,
        condition,
        destinationBundle: getDestinationBundle(CONDITION_DESTINATION[condition]),
      });
    },
    completePreSurvey: () => set({ phase: "instructions" }),
    // Straight into the chat/workspace screen — see beginPlanningChat for
    // the greeting → fixed-prompt beat that plays out there before
    // anything actually starts.
    acknowledgeIntroduction: () => {
      const destinationName = get().destinationBundle.meta.name;
      beginPlanningChat(dialogue.buildInitialPrompt(destinationName));
    },

    sendPendingPrompt,

    // Marks the question message answered (hides its buttons) AND appends
    // the answer as its own real user-role message — so it reads exactly
    // like the participant typed and sent "가족", not like a pill tucked
    // inside the AI's own bubble. From here each condition goes its own
    // way: AI-led straight into its single combined checklist (see
    // runAiLedFlow); human-led/mixed-led into the narrative flights/hotels
    // collection beat first (see runFlightsHotelsCollection) — the answer
    // itself isn't used in either's ranking, it's asked purely so every
    // condition opens the same way.
    confirmCompanion: (companion) => {
      set((state) => ({
        messages: [
          ...state.messages.map((m) =>
            m.companionQuestion && !m.companionQuestion.confirmed
              ? { ...m, companionQuestion: { ...m.companionQuestion, selected: companion, confirmed: true } }
              : m
          ),
          { id: makeId(), role: "user" as const, text: companion },
        ],
        companion,
      }));
      if (get().condition === "ai") runAiLedFlow();
      else runFlightsHotelsCollection(() => startExploring());
    },

    confirmStyleQuestion,

    // Shared by human-led/mixed-led — switches which of the two catalogs
    // ExplorePanel shows. A plain setter; the two-stage 액티비티 완료/식당
    // 완료 buttons wrap this with their own gating (see confirmActivityStage
    // below and components/chat/DaySelectionMessage.tsx /
    // MixedExploreDoneMessage.tsx), but a manual workspace tab click calls
    // this directly too.
    setExploreTab: (tab) => set({ exploreTab: tab }),

    // Human-led/mixed-led — the first-stage "액티비티 완료" button (see
    // components/chat/DaySelectionMessage.tsx / MixedExploreDoneMessage.tsx
    // for the gating each applies before this is even clickable). Switches
    // to the 식당 tab and marks whichever pending message's
    // activityStageConfirmed true, without finishing the day/exploration —
    // that's the second stage's job (confirmDaySelection /
    // finishMixedExploring). Also permanently unlocks mixed-led's 식당 tab
    // (see mixedRestaurantTabUnlocked) — harmless to set for human-led too
    // since it never reads that field (both its tabs are already always
    // freely switchable).
    confirmActivityStage: () =>
      set((state) => ({
        exploreTab: "restaurants",
        mixedRestaurantTabUnlocked: true,
        messages: state.messages.map((m) => {
          if (m.daySelection && !m.daySelection.confirmed && !m.daySelection.activityStageConfirmed) {
            return { ...m, daySelection: { ...m.daySelection, activityStageConfirmed: true } };
          }
          if (m.mixedExploreDone && !m.mixedExploreDone.confirmed && !m.mixedExploreDone.activityStageConfirmed) {
            return { ...m, mixedExploreDone: { ...m.mixedExploreDone, activityStageConfirmed: true } };
          }
          return m;
        }),
      })),

    // Human-led only — a card's checkbox for the day currently active (see
    // humanDayIndex): if the item is already on that day, unchecking it
    // removes it; otherwise it's assigned there — clearing it out of
    // whatever OTHER day it may have been on first (an item can only occupy
    // one day at a time; picking it again while browsing a later day just
    // moves it — see ActivityCard/RestaurantCard's "N일차에 배정됨" badge,
    // which surfaces this before the participant clicks rather than letting
    // the move happen invisibly). Capped at 2 per day per kind (matches the
    // fixed 점심/저녁 pair every day's final itinerary uses — see
    // lib/itinerary.ts's generateItineraryFromDayPlan) — a 3rd click on an
    // already-full day is a no-op rather than silently getting dropped
    // later at itinerary-generation time. likedActivityIds/
    // likedRestaurantIds stay in sync as a flattened "assigned somewhere"
    // list purely for ConditionSurveyScreen's count.
    toggleDayItem: (kind, id) =>
      set((state) => {
        const day = state.humanDayIndex;
        const cleared = removeFromDayPlan(state.dayPlan, kind, id);
        if (kind === "activity") {
          const wasOnCurrentDay = (state.dayPlan[day]?.activityIds ?? []).includes(id);
          if (wasOnCurrentDay) {
            return { dayPlan: cleared, likedActivityIds: state.likedActivityIds.filter((x) => x !== id) };
          }
          const dayAssignment = cleared[day] ?? { activityIds: [], restaurantIds: [] };
          if (dayAssignment.activityIds.length >= 2) return {};
          return {
            dayPlan: { ...cleared, [day]: { ...dayAssignment, activityIds: [...dayAssignment.activityIds, id] } },
            likedActivityIds: state.likedActivityIds.includes(id)
              ? state.likedActivityIds
              : [...state.likedActivityIds, id],
          };
        }
        const wasOnCurrentDay = (state.dayPlan[day]?.restaurantIds ?? []).includes(id);
        if (wasOnCurrentDay) {
          return { dayPlan: cleared, likedRestaurantIds: state.likedRestaurantIds.filter((x) => x !== id) };
        }
        const dayAssignment = cleared[day] ?? { activityIds: [], restaurantIds: [] };
        if (dayAssignment.restaurantIds.length >= 2) return {};
        return {
          dayPlan: { ...cleared, [day]: { ...dayAssignment, restaurantIds: [...dayAssignment.restaurantIds, id] } },
          likedRestaurantIds: state.likedRestaurantIds.includes(id)
            ? state.likedRestaurantIds
            : [...state.likedRestaurantIds, id],
        };
      }),

    // Human-led only — the day prompt's "선택 완료" button. Confirms the
    // question message AND appends a user-role message reporting exactly
    // what got picked for that day (see dialogue.humanDaySelectionSummary)
    // — so it reads like the participant themselves told the AI what they
    // chose, the same way confirmCompanion's answer shows up as its own
    // bubble. Days 1-3 then advance to the next day's prompt; day 4 runs
    // the final plan directly (there's no separate placement step anymore
    // — selecting a card IS placing it, via toggleDayItem above).
    confirmDaySelection: (day) => {
      const state = get();
      const assignment = state.dayPlan[day];
      const activityNames = (assignment?.activityIds ?? [])
        .map((id) => state.destinationBundle.activities.find((a) => a.id === id)?.name)
        .filter((n): n is string => !!n);
      const restaurantNames = (assignment?.restaurantIds ?? [])
        .map((id) => state.destinationBundle.restaurants.find((r) => r.id === id)?.name)
        .filter((n): n is string => !!n);
      const summaryText = dialogue.humanDaySelectionSummary(activityNames, restaurantNames);

      set((s) => ({
        messages: [
          ...s.messages.map((m) =>
            m.daySelection?.day === day && !m.daySelection.confirmed
              ? { ...m, daySelection: { ...m.daySelection, confirmed: true } }
              : m
          ),
          ...(summaryText ? [{ id: makeId(), role: "user" as const, text: summaryText }] : []),
        ],
      }));

      if (day < 4) {
        const nextDay = day + 1;
        // exploreTab resets to "activities" here directly, right alongside
        // humanDayIndex — finishing a day on the 식당 tab (via
        // confirmActivityStage) would otherwise leave the new day's prompt
        // opening on restaurant cards instead of starting from 액티비티
        // like every day should.
        set({ humanDayIndex: nextDay, exploreTab: "activities" });
        sendAiMessage(dialogue.humanDaySelectionPrompt(nextDay), undefined, {
          daySelection: { day: nextDay, activityStageConfirmed: false, confirmed: false },
        });
      } else {
        runFinalPlanGeneration();
      }
    },

    // Mixed-led only — tapping the same interest again clears it (goes back
    // to "no opinion yet") rather than only ever being able to flip between
    // 👍/👎.
    setInterest: (stage, id, interest) =>
      set((state) => {
        if (stage === "activities") {
          const next = { ...state.interestActivity };
          if (next[id] === interest) delete next[id];
          else next[id] = interest;
          return { interestActivity: next };
        }
        const next = { ...state.interestRestaurant };
        if (next[id] === interest) delete next[id];
        else next[id] = interest;
        return { interestRestaurant: next };
      }),

    finishMixedExploring,

    recordHover: (stage, itemId, durationMs) =>
      set((state) => {
        const stageSignals = state.browsing[stage];
        const order = nextInteractionOrder(stageSignals);
        const updated = patchItemSignals(stageSignals, itemId, (prev) => ({
          ...prev,
          hoverMs: prev.hoverMs + durationMs,
          hoverSessions: prev.hoverSessions + 1,
          lastInteractionOrder: order,
        }));
        return { browsing: { ...state.browsing, [stage]: updated } };
      }),

    recordSearchQuery: (stage, query) =>
      set((state) => {
        const stageSignals = state.browsing[stage];
        if (!query.trim() || stageSignals.searchQueries.includes(query)) return {};
        return {
          browsing: {
            ...state.browsing,
            [stage]: { ...stageSignals, searchQueries: [...stageSignals.searchQueries, query].slice(-20) },
          },
        };
      }),

    recordFilterUsed: (stage, value) =>
      set((state) => {
        const stageSignals = state.browsing[stage];
        if (!value || stageSignals.filtersUsed.includes(value)) return {};
        return {
          browsing: {
            ...state.browsing,
            [stage]: { ...stageSignals, filtersUsed: [...stageSignals.filtersUsed, value] },
          },
        };
      }),

    recordScrollSample: (stage, pxPerSecond) =>
      set((state) => {
        const stageSignals = state.browsing[stage];
        return {
          browsing: {
            ...state.browsing,
            [stage]: {
              ...stageSignals,
              scrollSamplesPxPerSec: [...stageSignals.scrollSamplesPxPerSec, pxPerSecond].slice(-40),
            },
          },
        };
      }),

    openDetail: (id) => {
      const { destinationBundle } = get();
      const stage: ExplorationStage = destinationBundle.activities.some((a) => a.id === id)
        ? "activities"
        : "restaurants";
      set((state) => {
        const stageSignals = state.browsing[stage];
        const order = nextInteractionOrder(stageSignals);
        const updated = patchItemSignals(stageSignals, id, (prev) => ({
          ...prev,
          detailOpens: prev.detailOpens + 1,
          lastInteractionOrder: order,
        }));
        return { activeDetailItemId: id, detailReadOnly: false, browsing: { ...state.browsing, [stage]: updated } };
      });
    },
    openDetailReview: (id) => set({ activeDetailItemId: id, detailReadOnly: true }),
    closeDetail: () => set({ activeDetailItemId: null, detailReadOnly: false }),

    recordDetailDuration: (stage, itemId, durationMs) =>
      set((state) => {
        const stageSignals = state.browsing[stage];
        const updated = patchItemSignals(stageSignals, itemId, (prev) => ({
          ...prev,
          detailMs: prev.detailMs + durationMs,
        }));
        return { browsing: { ...state.browsing, [stage]: updated } };
      }),

    // The final plan message's own "확인했습니다" button — marks that
    // message confirmed (hides the button, same pattern as
    // confirmDaySelection) and opens the condition-complete popup (see
    // components/flow/ConditionCompleteDialog.tsx). Staying in "planning"
    // phase until the popup's own button is pressed, rather than jumping
    // phase immediately, keeps the itinerary itself visible behind the
    // popup instead of yanking it away.
    confirmFinalPlan: () =>
      set((state) => ({
        messages: state.messages.map((m) =>
          m.bookingConfirm && !m.bookingConfirm.confirmed ? { ...m, bookingConfirm: { confirmed: true } } : m
        ),
        showConditionCompletePopup: true,
      })),

    // Every condition — including the last — goes through its own short
    // survey first (see completeConditionSurvey for what happens after).
    proceedToConditionSurvey: () => set({ phase: "condition-survey", showConditionCompletePopup: false }),

    completeConditionSurvey: () => {
      const { conditionIndex, conditionOrder } = get();
      const isLast = conditionIndex === conditionOrder.length - 1;
      set({ phase: isLast ? "questionnaire" : "transition" });
    },

    advanceToNextCondition: () => {
      const { conditionIndex, conditionOrder } = get();
      const nextIndex = conditionIndex + 1;
      const nextCondition = conditionOrder[nextIndex];
      const nextBundle = getDestinationBundle(CONDITION_DESTINATION[nextCondition]);
      set({
        conditionIndex: nextIndex,
        condition: nextCondition,
        destinationBundle: nextBundle,
      });
      // Every condition — first and repeats alike — replays the same
      // greeting → fixed-prompt beat (see beginPlanningChat) rather than
      // skipping straight into exploration, so later conditions never feel
      // like the AI just started on its own either.
      beginPlanningChat(dialogue.buildInitialPrompt(nextBundle.meta.name));
    },

    // Dev-only shortcut (see ?preview=human|mixed|ai in ExperimentFlow) for
    // jumping straight into a condition without walking through consent,
    // instructions, and any prior conditions — never exposed to participants.
    jumpToCondition: (condition) => {
      ensureParticipantId();
      const index = get().conditionOrder.indexOf(condition);
      const bundle = getDestinationBundle(CONDITION_DESTINATION[condition]);
      set({
        conditionIndex: index,
        condition,
        destinationBundle: bundle,
      });
      jumpIntoPlanning(dialogue.buildInitialPrompt(bundle.meta.name));
    },

    jumpToQuestionnaire: () => {
      ensureParticipantId();
      set({ phase: "questionnaire" });
    },
  };
});
