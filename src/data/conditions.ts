import type { Condition, DestinationId } from "@/types";

// The reference order — used as the safe, deterministic default before the
// real per-participant order is rolled (see shuffleConditionOrder below).
// Keeping this fixed avoids an SSR/client hydration mismatch: the store's
// initial state must render identically on the server and on first client
// paint, so the actual randomization happens later, inside acceptConsent()
// (a user-triggered action, guaranteed client-only, well after hydration).
export const BASE_CONDITION_ORDER: Condition[] = ["human", "mixed", "ai"];

// Rolled once per participant (see store.ts's acceptConsent) so which
// condition runs first/second/third varies across participants — only the
// first condition in the resulting order gets the flights/hotels flow.
export function shuffleConditionOrder(): Condition[] {
  const result = [...BASE_CONDITION_ORDER];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// The deterministic default (see BASE_CONDITION_ORDER above for the same
// pattern) — used for the SSR-safe initial state before the real
// per-participant mapping is rolled in acceptConsent() via
// shuffleConditionDestinationMap() below, and for the dev-only
// jumpToCondition preview shortcut (store.ts), which intentionally stays
// fixed/predictable since it bypasses consent-time randomization entirely.
export const CONDITION_DESTINATION: Record<Condition, DestinationId> = {
  human: "vietnam",
  mixed: "bangkok",
  ai: "taiwan",
};

const BASE_DESTINATION_ORDER: DestinationId[] = ["vietnam", "bangkok", "taiwan"];

// Rolled once per participant (see store.ts's acceptConsent), independently
// of shuffleConditionOrder above — pairs each condition with a destination
// so which city a participant sees for the human/mixed/ai-led condition
// varies across participants too (previously fixed: human→vietnam,
// mixed→bangkok, ai→taiwan for everyone), decoupling destination effects
// from condition order effects. Same Fisher–Yates pattern as
// shuffleConditionOrder, just zipped against BASE_CONDITION_ORDER (the
// fixed condition list, not the shuffled order) to build the mapping.
export function shuffleConditionDestinationMap(): Record<Condition, DestinationId> {
  const shuffled = [...BASE_DESTINATION_ORDER];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const map = {} as Record<Condition, DestinationId>;
  BASE_CONDITION_ORDER.forEach((condition, i) => {
    map[condition] = shuffled[i];
  });
  return map;
}
