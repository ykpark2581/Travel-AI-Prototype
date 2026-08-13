import type { ExplorationStage } from "@/types";

export interface AiAutoplayStep {
  tab: ExplorationStage;
  itemId: string;
  statusText: string;
  // Whether this step actually opens the item's detail dialog (see
  // lib/store.ts's runAiAutoplay) — exactly 2 per category, satisfying
  // "액티비티 2개, 식당도 2개씩은 열어서 탐색하는거 보여줘야됨" — the other
  // 2 per category are still highlighted/scrolled to (visibly "looked at")
  // but without the dialog opening, so the sequence doesn't read as 8
  // identical detail-dialog pops in a row.
  openDetail: boolean;
}

// One category's full beat — a skim first (see skimStatusText, played with
// no item singled out — see lib/store.ts's runAiAutoplay), then the
// per-item focus sweep (steps). Grouped like this (rather than one flat
// 8-step list) because the skim is a category-level beat, not a 9th "step"
// with an itemId of its own.
export interface AiAutoplayCategory {
  tab: ExplorationStage;
  skimStatusText: string;
  steps: AiAutoplayStep[];
}

// Cycled by index within each category's 4-item sweep — index 0/2 are the
// plain "still scanning candidates" beat, 1/3 are the "now actually
// opening this one" beat, so the phrasing naturally matches whichever kind
// of step it's paired with (see OPEN_DETAIL_AT below).
const ACTIVITY_STATUS_TEXT = [
  "인기 액티비티를 살펴보는 중입니다...",
  "후기와 평점을 자세히 비교하는 중입니다...",
  "여행 스타일에 맞는 액티비티를 확인하는 중입니다...",
  "상세 정보를 꼼꼼히 살펴보는 중입니다...",
];
const RESTAURANT_STATUS_TEXT = [
  "식당 후보를 살펴보는 중입니다...",
  "후기와 메뉴를 자세히 비교하는 중입니다...",
  "여행 스타일에 맞는 식당을 확인하는 중입니다...",
  "상세 정보를 꼼꼼히 살펴보는 중입니다...",
];
const OPEN_DETAIL_AT = [1, 3];

function buildCategorySteps(tab: ExplorationStage, rankedIds: string[], statusText: string[]): AiAutoplayStep[] {
  return rankedIds.slice(0, 4).map((itemId, i) => ({
    tab,
    itemId,
    statusText: statusText[i] ?? statusText[statusText.length - 1],
    openDetail: OPEN_DETAIL_AT.includes(i),
  }));
}

// AI-led's watch-only browsing sequence — instead of skipping straight
// from "candidates found" to a finished itinerary with zero visible
// participant-facing browsing (which made the experience feel abrupt and
// gave the manipulation-check questions nothing concrete to ask about —
// see data/questionnaire.ts's mc1/mc2), this sweeps the top 4 of each
// already-ranked category (see computePreferenceRank) — the SAME
// candidates the final itinerary draws from, not a random sample, so what
// the participant watches the AI look at stays coherent with what
// actually gets chosen — opening the detail dialog for 2 of the 4 in each
// category. Consumed by lib/store.ts's runAiAutoplay, which drives the
// actual timing/state changes; this module only decides the fixed
// sequence of steps.
export function buildAiAutoplayCategories(
  rankedActivityIds: string[],
  rankedRestaurantIds: string[]
): AiAutoplayCategory[] {
  return [
    {
      tab: "activities",
      skimStatusText: "액티비티 후보들을 전체적으로 둘러보는 중입니다...",
      steps: buildCategorySteps("activities", rankedActivityIds, ACTIVITY_STATUS_TEXT),
    },
    {
      tab: "restaurants",
      skimStatusText: "식당 후보들을 전체적으로 둘러보는 중입니다...",
      steps: buildCategorySteps("restaurants", rankedRestaurantIds, RESTAURANT_STATUS_TEXT),
    },
  ];
}

// Drives the "scroll down, then back up" skim beat (see
// components/workspace/ExplorePanel.tsx's effect that calls this) with a
// fixed, known duration rather than the browser's own `scrollTo({behavior:
// "smooth"})` — that has no guaranteed timing, so it could finish well
// before or after the AUTOPLAY_SKIM_MS window lib/store.ts's runAiAutoplay
// is already waiting out, drifting the visual scroll out of sync with the
// status text driving it. A plain rAF tween keeps both locked to the same
// clock. easeInOutQuad specifically so the scroll visibly starts/ends
// gently instead of snapping to a linear crawl.
export function animateScrollTop(el: HTMLElement, to: number, durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    const from = el.scrollTop;
    if (durationMs <= 0 || from === to) {
      el.scrollTop = to;
      resolve();
      return;
    }
    const start = performance.now();
    function step(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      el.scrollTop = from + (to - from) * eased;
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}
