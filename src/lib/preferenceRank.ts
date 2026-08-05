// Ranks the catalog using only the participant's explicit signals — hearts
// (primary) and, for mixed-led, the style tags they confirmed in chat —
// never passive browsing behavior (hover time, scroll speed, detail-opens,
// search/filter usage, click order). Those behavioral signals are still
// recorded (see the `browsing` state in lib/store.ts) to support a realistic
// exploration experience, but they never reach this ranking — only what the
// participant explicitly liked (or the style they picked) shapes the plan.

const HEART_WEIGHT = 5;
const TAG_WEIGHT = 2;

interface ScorableItem {
  id: string;
  styleTags: string[];
}

export function computePreferenceRank<T extends ScorableItem>(
  items: T[],
  likedIds: string[],
  selectedTags: string[] = []
): string[] {
  const scored = items.map((item) => {
    const liked = likedIds.includes(item.id) ? 1 : 0;
    const tagMatch = selectedTags.length > 0 && item.styleTags.some((t) => selectedTags.includes(t)) ? 1 : 0;
    return { id: item.id, score: HEART_WEIGHT * liked + TAG_WEIGHT * tagMatch };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.id);
}
