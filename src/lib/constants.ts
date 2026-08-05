// How long the "다음으로" progress-fill button takes to fill during
// Human-led's free-browse stages. Visible from the moment browsing starts.
// Once full, it still won't be clickable until enough items are liked on
// that stage — see ACTIVITY_SLOTS/RESTAURANT_SLOTS in lib/itinerary.ts.
export const EXPLORATION_TIME_SECONDS = 60;

// Mixed-led has no button at all — browsing simply ends on its own after
// this long, at which point the AI announces its inferred style and moves
// on automatically (see lib/store.ts's runMixedAnalysis).
export const MIXED_ANALYSIS_TIME_SECONDS = 180;

// Floor for how long any single collection-step speech-bubble line stays on
// screen before the next one replaces it (see lib/collectionSequence.ts) —
// long enough that participants can actually read each line.
export const MIN_BUBBLE_MS = 2000;

// How long the "대표 OO 수집 완료" line stays up before the catalog reveals.
export const COLLECTION_COMPLETE_HOLD_MS = 2000;

export const STAGE_SKELETON_MS = 800;
export const CHAT_REPLY_DELAY_MS_RANGE: [number, number] = [900, 1400];

// How long a completed stage's final message sits before auto-advancing to
// the next stage — gives participants a moment to actually read it.
export const STAGE_TRANSITION_DELAY_MS = 2500;

export function randomInRange([min, max]: [number, number]): number {
  return min + Math.random() * (max - min);
}
