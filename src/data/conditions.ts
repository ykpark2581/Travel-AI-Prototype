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

export const CONDITION_DESTINATION: Record<Condition, DestinationId> = {
  human: "vietnam",
  mixed: "bangkok",
  ai: "taiwan",
};
