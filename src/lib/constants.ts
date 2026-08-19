// No exploration time limit at all, for either condition — human-led picks
// day by day at its own pace (see lib/store.ts's confirmDaySelection) and
// mixed-led browses freely, moving on via its own persistent bottom button
// whenever it's ready (see components/workspace/ExplorePanel.tsx /
// lib/store.ts's finishMixedExploring). Nothing here schedules that.

export const STAGE_SKELETON_MS = 800;

// The floor under readingDelayMs below — also what sendAiMessage falls
// back to when there's no previous message to size a reading pause off of
// (the very first bubble of a condition). Originally this alone WAS the
// gap between every AI chat bubble and the next, a flat 3s regardless of
// message length; readingDelayMs replaced that per-message flat gap
// app-wide (see lib/store.ts's sendAiMessage), but the name/value stays
// here since it's still the universal minimum.
export const CHAT_REPLY_DELAY_MS_RANGE: [number, number] = [3000, 3000];

// How long to pause before the NEXT AI bubble, sized to how long `text`
// (whatever currently sits last in the transcript) takes to actually read —
// see lib/store.ts's sendAiMessage, which uses this as its default `delayMs`
// for every AI message app-wide, not just checklists. A one-line message and
// a 3-sentence intro (e.g. flightsHotelsCollectingIntro/
// aiLedFlightsHotelsIntro, "네, ~ 계획해볼게요... 우선 항공편과 숙소부터
// 찾아보겠습니다.") used to get the identical flat pause before whatever
// came next — long intros were consistently getting swallowed by "사이트
// 탐색 중" (or the next chat bubble) popping up right as the participant was
// still reading them. ~12 Korean characters/second is a comfortable,
// unhurried reading pace (not scanning speed). Never shorter than
// CHAT_REPLY_DELAY_MS_RANGE (so short messages/user-echoed answers aren't
// sped up), capped so one very long message can't stall the flow
// indefinitely.
const READING_CHARS_PER_SEC = 12;
const READING_DELAY_MS_MAX = 9000;
export function readingDelayMs(text: string): number {
  const chars = text.replace(/\s+/g, "").length;
  const estimated = (chars / READING_CHARS_PER_SEC) * 1000;
  return Math.min(READING_DELAY_MS_MAX, Math.max(CHAT_REPLY_DELAY_MS_RANGE[0], estimated));
}

// How long each checklist item holds before the next one reveals (see
// lib/store.ts's runChecklist) — 2s per line ("hotely.com 사이트 탐색
// 중" etc.). Was 5s, but AI-led's flow used to run all 9 lines back to
// back in one checklist (now split into two shorter ones — see
// dialogue.aiLedFlightsHotelsChecklistItems/explorationCollectionChecklistItems,
// the latter now shared with human-led/mixed-led — see lib/store.ts's
// runAiLedFlow), which stretched that condition's wait alone to ~45s; 2s
// keeps every step still individually readable without the cumulative
// wait feeling endless.
export const CHECKLIST_ITEM_MS = 2000;

// Extra floor under the whole checklist card's visible time (see
// postChecklist) — mostly redundant now that every item alone takes
// CHECKLIST_ITEM_MS, but still guards a very short (1-item) checklist from
// disappearing too fast.
export const MIN_PROCESSING_MS = 5000;

export function randomInRange([min, max]: [number, number]): number {
  return min + Math.random() * (max - min);
}

// AI-led's watch-only browsing sequence (see lib/aiAutoplay.ts's
// buildAiAutoplayCategories, lib/store.ts's runAiAutoplay). Each category
// (activities, then restaurants) plays out in two beats:
//
//   1. A skim — the panel scrolls down in three discrete stages (not one
//      continuous sweep — see components/workspace/ExplorePanel.tsx's
//      scroll effect), pausing at each, then back up to the top in one
//      motion. Reads as "generally looking around this list" before any
//      one card gets singled out.
//   2. A focus sweep — each card gets AUTOPLAY_BUBBLE_MS with its
//      cursor/speech-bubble visible (see components/workspace/
//      AutoplayCursor.tsx) before moving on or, for the steps that
//      call for it, opening the detail dialog — which itself gets its own
//      brief "cursor clicks in" beat (AUTOPLAY_CURSOR_ENTER_MS), a reading
//      pause, then a "cursor moves to close and clicks" beat
//      (AUTOPLAY_CURSOR_EXIT_MS) before actually closing. AUTOPLAY_STEP_GAP_MS
//      is the brief pause after closing before the next step starts.
//
// All of these were originally much faster (a single continuous scroll,
// ~1300/2200/400 focus/detail/gap) but read as rushed — both the skim and
// the bubble blew past too quickly to actually register as "the AI is
// looking at this."
export const AUTOPLAY_SKIM_STAGE_MS = 900; // each of the 3 downward scroll stages
export const AUTOPLAY_SKIM_STAGE_PAUSE_MS = 500; // pause after each downward stage
export const AUTOPLAY_SKIM_RETURN_MS = 1200; // single scroll back up to the top
export const AUTOPLAY_SKIM_MS =
  AUTOPLAY_SKIM_STAGE_MS * 3 + AUTOPLAY_SKIM_STAGE_PAUSE_MS * 3 + AUTOPLAY_SKIM_RETURN_MS;

export const AUTOPLAY_BUBBLE_MS = 5000;
export const AUTOPLAY_CURSOR_ENTER_MS = 900;
export const AUTOPLAY_CURSOR_EXIT_MS = 900;
export const AUTOPLAY_DETAIL_MS = 3600;
export const AUTOPLAY_STEP_GAP_MS = 600;
