import type { Interest } from "@/types";

// Mixed-led only — how many cards a participant may mark 관심있음 (👍) and,
// separately, 관심없음 (👎) in EACH stage (activities, then restaurants).
// Both must be exactly this many before the stage's "완료" button unlocks
// (see components/chat/MixedExploreDoneMessage.tsx), and lib/store.ts's
// setInterest refuses to add one past it. Un-marking a card frees its slot.
export const MIXED_INTEREST_LIMIT = 2;

export function countInterests(map: Record<string, Interest>): { interested: number; notInterested: number } {
  let interested = 0;
  let notInterested = 0;
  for (const value of Object.values(map)) {
    if (value === "interested") interested += 1;
    else if (value === "not-interested") notInterested += 1;
  }
  return { interested, notInterested };
}

// True when marking `id` as `interest` would go over the limit — i.e. the
// slot for that mark is already full and `id` isn't already holding one of
// its slots. Tapping a card's CURRENT mark (which clears it) is never
// blocked, and neither is anything that stays within the limit.
export function isInterestBlocked(map: Record<string, Interest>, id: string, interest: Interest): boolean {
  if (map[id] === interest) return false;
  const { interested, notInterested } = countInterests(map);
  const used = interest === "interested" ? interested : notInterested;
  return used >= MIXED_INTEREST_LIMIT;
}
