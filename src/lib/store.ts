import { create } from "zustand";
import type {
  BrowsingSignals,
  ChatMessage,
  Condition,
  CursorRect,
  DestinationBundle,
  ExplorationStage,
  ItemSignals,
  ItineraryDay,
  StageBrowsingSignals,
  StageId,
} from "@/types";
import { BASE_CONDITION_ORDER, CONDITION_DESTINATION, shuffleConditionOrder } from "@/data/conditions";
import { getDestinationBundle } from "@/data/destinations";
import { stages } from "@/data/stages";
import * as dialogue from "@/data/dialogue";
import { generateItinerary, ACTIVITY_SLOTS, RESTAURANT_SLOTS } from "@/lib/itinerary";
import { computePreferenceRank } from "@/lib/preferenceRank";
import { inferStyleTagFromBrowsing } from "@/lib/browsingInference";
import { styleTagsForCompanion } from "@/lib/companionStyle";
import { buildCollectionPlan, type CollectionStep } from "@/lib/collectionSequence";
import {
  CHAT_REPLY_DELAY_MS_RANGE,
  COLLECTION_COMPLETE_HOLD_MS,
  EXPLORATION_TIME_SECONDS,
  MIXED_ANALYSIS_TIME_SECONDS,
  randomInRange,
  STAGE_SKELETON_MS,
  STAGE_TRANSITION_DELAY_MS,
} from "@/lib/constants";

type Phase = "consent" | "instructions" | "prompt" | "planning" | "condition-survey" | "transition" | "questionnaire";

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface CollectingState {
  active: boolean;
  stage: ExplorationStage | null;
  currentSite: string | null;
  statusText: string;
}

const emptyCollecting: CollectingState = { active: false, stage: null, currentSite: null, statusText: "" };

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
  // Generated once per participant (see ensureParticipantId) — links their
  // 4 survey submissions (3 per-condition + 1 final) together in the
  // spreadsheet without identifying them personally.
  participantId: string;
  // Rolled fresh per participant in acceptConsent(); BASE_CONDITION_ORDER is
  // only the safe default before that (see data/conditions.ts).
  conditionOrder: Condition[];
  conditionIndex: number;
  condition: Condition;
  destinationBundle: DestinationBundle;

  messages: ChatMessage[];
  isTyping: boolean;
  activeStage: StageId | null;
  unlockedStages: StageId[];
  loadingStage: StageId | null;
  addressUrl: string;

  likedActivityIds: string[];
  likedRestaurantIds: string[];
  selectedActivityTags: string[];
  selectedRestaurantTags: string[];
  browsing: BrowsingSignals;
  // Mixed-led only — true from the moment its browsing timer fires (AI
  // analysis begins) until the stage changes. Gates the workspace panel
  // (see PrototypeShell's showWorkspace) the same way condition === "ai"
  // does, but only for this window instead of the whole stage.
  mixedAnalysisActive: boolean;
  // AI-led only — the one thing it asks upfront ("동행자"), used to imply a
  // style via lib/companionStyle.ts. Empty until confirmCompanion runs.
  companion: string;

  // Human-led and Mixed-led only — the site-visiting animation that runs
  // right before a stage's catalog appears (see startCollection).
  collecting: CollectingState;
  cursorRect: CursorRect | null;
  setCursorRect: (rect: CursorRect | null) => void;

  // Human-led only — set when a 6th like is attempted on a stage that
  // already has the required 5 (see ACTIVITY_SLOTS/RESTAURANT_SLOTS);
  // cleared by dismissLikeLimitWarning once the popup is acknowledged.
  likeLimitWarning: ExplorationStage | null;
  dismissLikeLimitWarning: () => void;

  activeDetailItemId: string | null;

  itineraryDays: ItineraryDay[];
  bookingConfirmed: boolean;

  acceptConsent: () => void;
  acknowledgeIntroduction: () => void;
  startPlanningWithPrompt: (text: string) => void;

  confirmCompanion: (companion: string) => void;
  toggleLikeActivity: (id: string) => void;
  toggleLikeRestaurant: (id: string) => void;
  advanceFromExploration: (stage: ExplorationStage) => void;

  recordHover: (stage: ExplorationStage, itemId: string, durationMs: number) => void;
  recordSearchQuery: (stage: ExplorationStage, query: string) => void;
  recordFilterUsed: (stage: ExplorationStage, value: string) => void;
  recordScrollSample: (stage: ExplorationStage, pxPerSecond: number) => void;

  openDetail: (id: string) => void;
  closeDetail: () => void;
  recordDetailDuration: (stage: ExplorationStage, itemId: string, durationMs: number) => void;

  confirmBooking: () => void;
  // Called once the per-condition survey (right after this condition ends)
  // has been submitted — decides whether the next screen is the transition
  // screen (more conditions left) or the final overall survey (last one).
  completeConditionSurvey: () => void;
  advanceToNextCondition: () => void;
  jumpToCondition: (condition: Condition) => void;
}

export const useExperimentStore = create<ExperimentState>((set, get) => {
  function sendAiMessage(text: string, after?: () => void, extra?: Partial<ChatMessage>, delayMs?: number) {
    set({ isTyping: true });
    const delay = delayMs ?? randomInRange(CHAT_REPLY_DELAY_MS_RANGE);
    setTimeout(() => {
      set((state) => ({
        messages: [...state.messages, { id: makeId(), role: "assistant", text, ...extra }],
        isTyping: false,
      }));
      after?.();
    }, delay);
  }

  function finalizeItinerary() {
    const { destinationBundle, likedActivityIds, likedRestaurantIds, selectedActivityTags, selectedRestaurantTags } =
      get();
    const days = generateItinerary(destinationBundle, likedActivityIds, likedRestaurantIds, {
      activities: selectedActivityTags,
      restaurants: selectedRestaurantTags,
    });
    set({ itineraryDays: days });
    enterStage("itinerary");
  }

  // Pure navigation only — updates which stage is active/unlocked and the
  // fake address bar. What (if anything) happens when a stage begins is
  // each condition's own concern (see beginExploration/runAiLedFlow), not
  // baked in here, so this is safe to call from anywhere that just needs to
  // move the stepper forward.
  function enterStage(stageId: StageId) {
    set((state) => ({
      unlockedStages: state.unlockedStages.includes(stageId)
        ? state.unlockedStages
        : [...state.unlockedStages, stageId],
      activeStage: stageId,
      addressUrl: stages.find((s) => s.id === stageId)?.url ?? state.addressUrl,
    }));
  }

  function collectionStatusPoolFor(stage: ExplorationStage): string[] {
    return stage === "activities" ? dialogue.activityCollectionStatusTexts : dialogue.restaurantCollectionStatusTexts;
  }

  function collectionCompleteTextFor(stage: ExplorationStage): string {
    return stage === "activities" ? dialogue.activityCollectionComplete : dialogue.restaurantCollectionComplete;
  }

  function runCollectionSteps(steps: CollectionStep[], index: number, stage: ExplorationStage, onDone: () => void) {
    if (index >= steps.length) {
      const completeText = collectionCompleteTextFor(stage);
      set((state) => ({ collecting: { ...state.collecting, currentSite: null, statusText: completeText } }));
      setTimeout(() => {
        set({ collecting: emptyCollecting });
        onDone();
      }, COLLECTION_COMPLETE_HOLD_MS);
      return;
    }
    const step = steps[index];
    set((state) => ({ collecting: { ...state.collecting, currentSite: step.site, statusText: step.statusText } }));
    setTimeout(() => runCollectionSteps(steps, index + 1, stage, onDone), step.durationMs);
  }

  function startCollection(stage: ExplorationStage, onDone: () => void) {
    const plan = buildCollectionPlan(dialogue.collectionSites, collectionStatusPoolFor(stage));
    set({ collecting: { active: true, stage, currentSite: null, statusText: "" } });
    runCollectionSteps(plan, 0, stage, onDone);
  }

  // Human-led and Mixed-led both open a stage the same way: a short chat
  // lead-in, then the site-visiting collection animation (see
  // startCollection/CollectingScreen), and only once that finishes does the
  // catalog + browsing prompt actually appear. What ends the browsing
  // window differs: human gets a manual progress-fill button (see
  // AdvancePromptMessage), mixed gets an automatic timer (see
  // runMixedAnalysis). AI-led never calls this — see runAiLedFlow instead.
  function startBrowsingStage(stage: ExplorationStage) {
    enterStage(stage);
    // Collecting starts active immediately (currentSite still null — the
    // compass just sits idle until the first site step runs) so the
    // workspace shows CollectingScreen from the very first frame, never a
    // flash of the real catalog before the site-visiting animation begins.
    set({ mixedAnalysisActive: false, collecting: { active: true, stage, currentSite: null, statusText: "" } });

    const introMessage = stage === "activities" ? dialogue.activitiesCollectionIntro : dialogue.restaurantsCollectionIntro;
    sendAiMessage(introMessage, () => {
      startCollection(stage, () => {
        set({ loadingStage: stage });
        setTimeout(() => set({ loadingStage: null }), STAGE_SKELETON_MS);

        const condition = get().condition;
        if (condition === "human") {
          const requiredCount = stage === "activities" ? ACTIVITY_SLOTS : RESTAURANT_SLOTS;
          const promptText =
            stage === "activities"
              ? dialogue.activitiesExplorationPrompt(requiredCount)
              : dialogue.restaurantsExplorationPrompt(requiredCount);
          const durationMs = EXPLORATION_TIME_SECONDS * 1000;
          sendAiMessage(promptText, undefined, {
            advancePrompt: { stage, confirmed: false, readyAt: Date.now() + durationMs, durationMs },
          });
        } else {
          const promptText =
            stage === "activities"
              ? dialogue.mixedActivitiesExplorationPrompt
              : dialogue.mixedRestaurantsExplorationPrompt;
          sendAiMessage(promptText, () => {
            setTimeout(() => runMixedAnalysis(stage), MIXED_ANALYSIS_TIME_SECONDS * 1000);
          });
        }
      });
    });
  }

  // Mixed-led only — fires automatically once the browsing window ends.
  // Infers a style tag from what was actually liked/hovered/opened (see
  // lib/browsingInference.ts), uses it to pick exactly what the itinerary
  // will use (same "what's shown is what's used" guarantee AI-led has),
  // then narrates the analysis and shows the picks as chat cards before
  // moving on. Guards against a stale timer firing after the participant
  // has already moved elsewhere (e.g. a dev-preview condition jump).
  function runMixedAnalysis(stage: ExplorationStage) {
    const state = get();
    if (state.condition !== "mixed" || state.activeStage !== stage) return;
    set({ mixedAnalysisActive: true });

    const { destinationBundle, likedActivityIds, likedRestaurantIds, browsing } = state;
    const isActivities = stage === "activities";

    let rankedIds: string[];
    let inferredTag: string | null;
    if (isActivities) {
      inferredTag = inferStyleTagFromBrowsing(destinationBundle.activities, likedActivityIds, browsing[stage]);
      const tagsForRanking = inferredTag ? [inferredTag] : [];
      rankedIds = computePreferenceRank(destinationBundle.activities, likedActivityIds, tagsForRanking).slice(
        0,
        ACTIVITY_SLOTS
      );
      set({ likedActivityIds: rankedIds, selectedActivityTags: tagsForRanking });
    } else {
      inferredTag = inferStyleTagFromBrowsing(destinationBundle.restaurants, likedRestaurantIds, browsing[stage]);
      const tagsForRanking = inferredTag ? [inferredTag] : [];
      rankedIds = computePreferenceRank(destinationBundle.restaurants, likedRestaurantIds, tagsForRanking).slice(
        0,
        RESTAURANT_SLOTS
      );
      set({ likedRestaurantIds: rankedIds, selectedRestaurantTags: tagsForRanking });
    }

    const inferredMessage = inferredTag
      ? dialogue.mixedInferredStyleMessage(inferredTag)
      : dialogue.mixedInferredStyleFallback;

    sendAiMessage(inferredMessage, () => {
      sendAiMessage(
        dialogue.mixedStyleConfirmedMessage,
        () => {
          sendAiMessage(dialogue.mixedCandidatesIntro, () => {
            if (isActivities) startBrowsingStage("restaurants");
            else sendAiMessage(dialogue.aiAssistedItineraryComplete, () => finalizeItinerary());
          });
        },
        { selectionResults: { stage, itemIds: rankedIds } }
      );
    });
  }

  // Shared by flights/hotels and AI-led's combined run — both are "AI
  // worked internally, here's the checklist" moments with no browsable
  // workspace behind them.
  function runChecklist(messageId: string, items: string[], index: number, onDone: () => void) {
    if (index >= items.length) {
      onDone();
      return;
    }
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.checklist ? { ...m, checklist: { ...m.checklist, revealedCount: index + 1 } } : m
      ),
    }));
    setTimeout(() => runChecklist(messageId, items, index + 1, onDone), 700);
  }

  // Posts the "" + checklist-payload message, then progressively reveals its
  // items before calling onDone — the same beat used for flights/hotels and
  // AI-led's combined run.
  function postChecklist(items: string[], onDone: () => void) {
    const checklistId = makeId();
    sendAiMessage(
      "",
      () => {
        setTimeout(() => runChecklist(checklistId, items, 0, onDone), 500);
      },
      { id: checklistId, checklist: { items, revealedCount: 0 } }
    );
  }

  // AI-led only, asked once (not per-stage) right after flights/hotels —
  // deliberately the only upfront question this condition ever asks (see
  // types/index.ts's CompanionQuestionPayload).
  function postCompanionQuestion() {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: makeId(),
          role: "assistant",
          text: dialogue.companionQuestion,
          companionQuestion: { options: [...dialogue.companionOptions], selected: "", confirmed: false },
        },
      ],
    }));
  }

  // AI-led only — chat-only from start to finish, no browsable workspace at
  // any point. Runs activities then restaurants back to back behind a
  // single combined intro + checklist (matching the "AI가 적합한 액티비티와
  // 식당을 찾아 일정을 구성해드릴게요" framing — one pass, not two separate
  // per-category cycles), ranking each by the style implied from the
  // companion answer (see lib/companionStyle.ts).
  function runAiLedFlow() {
    const impliedTags = styleTagsForCompanion(get().companion);
    enterStage("activities");

    sendAiMessage(dialogue.aiLedCombinedIntro, () => {
      postChecklist(dialogue.aiLedChecklistItems, () => {
        const { destinationBundle } = get();
        const rankedActivities = computePreferenceRank(destinationBundle.activities, [], impliedTags).slice(
          0,
          ACTIVITY_SLOTS
        );
        set({ likedActivityIds: rankedActivities, selectedActivityTags: impliedTags });

        sendAiMessage(
          dialogue.aiLedActivitiesReady,
          () => {
            enterStage("restaurants");
            const rankedRestaurants = computePreferenceRank(destinationBundle.restaurants, [], impliedTags).slice(
              0,
              RESTAURANT_SLOTS
            );
            set({ likedRestaurantIds: rankedRestaurants, selectedRestaurantTags: impliedTags });

            sendAiMessage(
              dialogue.aiLedRestaurantsReady,
              () => {
                sendAiMessage(dialogue.aiAssistedItineraryComplete, () => finalizeItinerary());
              },
              { selectionResults: { stage: "restaurants", itemIds: rankedRestaurants } }
            );
          },
          { selectionResults: { stage: "activities", itemIds: rankedActivities } }
        );
      });
    });
  }

  // Dispatches into each condition's own way of starting the
  // activities/restaurants portion, right after flights/hotels wraps up.
  function beginExploration() {
    if (get().condition === "ai") postCompanionQuestion();
    else startBrowsingStage("activities");
  }

  // Shared by both planning entry points below — resets every per-condition
  // piece of state (chat, likes, browsing signals, itinerary, etc.) before
  // the new condition's conversation starts.
  function resetPlanningState(text: string) {
    set({
      phase: "planning",
      messages: [
        { id: makeId(), role: "assistant", text: dialogue.initialGreeting },
        { id: makeId(), role: "user", text },
      ],
      isTyping: false,
      activeStage: null,
      unlockedStages: [],
      loadingStage: null,
      addressUrl: "",
      likedActivityIds: [],
      likedRestaurantIds: [],
      selectedActivityTags: [],
      selectedRestaurantTags: [],
      browsing: emptyBrowsingSignals(),
      mixedAnalysisActive: false,
      companion: "",
      collecting: emptyCollecting,
      cursorRect: null,
      likeLimitWarning: null,
      activeDetailItemId: null,
      itineraryDays: [],
      bookingConfirmed: false,
    });
  }

  // Flights/hotels are never the experimental manipulation and aren't shown
  // in the browser workspace at all — result-only, the same way for every
  // condition (first or repeat): a chat-only checklist, then the already-
  // decided flight/hotel as a compact card, before exploration begins.
  function startFlightsHotelsSummary(text: string) {
    resetPlanningState(text);
    sendAiMessage(
      dialogue.flightsHotelsIntro,
      () => {
        postChecklist(dialogue.flightsHotelsChecklistItems, () => {
          sendAiMessage(
            dialogue.flightsHotelsConfirmed,
            () => {
              set({ unlockedStages: ["flights-hotel"] });
              beginExploration();
            },
            { tripSummary: true }
          );
        });
      },
      undefined,
      2000
    );
  }

  // Generates the participant ID on first use rather than at module load —
  // same reasoning as conditionOrder below: must stay client-only to avoid
  // an SSR/hydration mismatch.
  function ensureParticipantId(): string {
    const existing = get().participantId;
    if (existing) return existing;
    const id = makeId();
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
    activeStage: null,
    unlockedStages: [],
    loadingStage: null,
    addressUrl: "",

    likedActivityIds: [],
    likedRestaurantIds: [],
    selectedActivityTags: [],
    selectedRestaurantTags: [],
    browsing: emptyBrowsingSignals(),
    mixedAnalysisActive: false,
    companion: "",

    collecting: emptyCollecting,
    cursorRect: null,
    setCursorRect: (rect) => set({ cursorRect: rect }),

    likeLimitWarning: null,
    dismissLikeLimitWarning: () => set({ likeLimitWarning: null }),

    activeDetailItemId: null,

    itineraryDays: [],
    bookingConfirmed: false,

    acceptConsent: () => {
      // Roll the per-participant condition order now — the first user-
      // triggered action, safely client-only (avoids an SSR/hydration
      // mismatch from randomizing at module-load time).
      ensureParticipantId();
      const conditionOrder = shuffleConditionOrder();
      const condition = conditionOrder[0];
      set({
        phase: "instructions",
        conditionOrder,
        condition,
        destinationBundle: getDestinationBundle(CONDITION_DESTINATION[condition]),
      });
    },
    acknowledgeIntroduction: () => set({ phase: "prompt" }),

    // Deliberately paced and sequential: the user's message sits alone for a
    // beat (with a visible typing indicator) before the AI's first reply
    // appears — participants can actually follow the conversation instead of
    // it seeming to start all at once. The workspace itself stays closed
    // through the whole flights/hotels summary and only opens once
    // exploration does (see startFlightsHotelsSummary/beginExploration).
    startPlanningWithPrompt: (text) => startFlightsHotelsSummary(text),

    confirmCompanion: (companion) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.companionQuestion && !m.companionQuestion.confirmed
            ? { ...m, companionQuestion: { ...m.companionQuestion, selected: companion, confirmed: true } }
            : m
        ),
        companion,
      }));
      runAiLedFlow();
    },

    // Human-led caps at exactly ACTIVITY_SLOTS/RESTAURANT_SLOTS so the whole
    // itinerary always comes from explicit picks with nothing backfilled —
    // trying to like a 6th shows a popup instead (see likeLimitWarning).
    // Mixed-led isn't capped here: its likes just feed the ranking that
    // eventually trims to the same slot count anyway (see runMixedAnalysis).
    toggleLikeActivity: (id) =>
      set((state) => {
        const liked = state.likedActivityIds.includes(id);
        if (!liked && state.condition === "human" && state.likedActivityIds.length >= ACTIVITY_SLOTS) {
          return { likeLimitWarning: "activities" };
        }
        return {
          likedActivityIds: liked
            ? state.likedActivityIds.filter((x) => x !== id)
            : [...state.likedActivityIds, id],
        };
      }),

    toggleLikeRestaurant: (id) =>
      set((state) => {
        const liked = state.likedRestaurantIds.includes(id);
        if (!liked && state.condition === "human" && state.likedRestaurantIds.length >= RESTAURANT_SLOTS) {
          return { likeLimitWarning: "restaurants" };
        }
        return {
          likedRestaurantIds: liked
            ? state.likedRestaurantIds.filter((x) => x !== id)
            : [...state.likedRestaurantIds, id],
        };
      }),

    // Human-led only now — mixed-led's browsing window ends on its own
    // timer (see runMixedAnalysis), no button involved.
    advanceFromExploration: (stage) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.advancePrompt?.stage === stage && !m.advancePrompt.confirmed
            ? { ...m, advancePrompt: { ...m.advancePrompt, confirmed: true } }
            : m
        ),
      }));
      if (stage === "activities") {
        setTimeout(() => startBrowsingStage("restaurants"), STAGE_TRANSITION_DELAY_MS);
      } else {
        sendAiMessage(dialogue.humanItineraryComplete, () => finalizeItinerary());
      }
    },

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
        return { activeDetailItemId: id, browsing: { ...state.browsing, [stage]: updated } };
      });
    },
    closeDetail: () => set({ activeDetailItemId: null }),

    recordDetailDuration: (stage, itemId, durationMs) =>
      set((state) => {
        const stageSignals = state.browsing[stage];
        const updated = patchItemSignals(stageSignals, itemId, (prev) => ({
          ...prev,
          detailMs: prev.detailMs + durationMs,
        }));
        return { browsing: { ...state.browsing, [stage]: updated } };
      }),

    // Every condition — including the last — goes through its own short
    // survey first (see completeConditionSurvey for what happens after).
    confirmBooking: () => {
      set({ bookingConfirmed: true });
      setTimeout(() => {
        set({ phase: "condition-survey", bookingConfirmed: false });
      }, 1500);
    },

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
      // The scenario/prompt screen is shown once, before the very first
      // condition — later conditions skip straight into planning with the
      // new destination's prompt instead of re-showing it.
      startFlightsHotelsSummary(dialogue.buildInitialPrompt(nextBundle.meta.name));
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
      get().startPlanningWithPrompt(dialogue.buildInitialPrompt(bundle.meta.name));
    },
  };
});
