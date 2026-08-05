import type { TravelStyleTag } from "@/types";

// AI-led's only upfront question ("동행자") is deliberately minimal — it
// doesn't ask about style directly. This is the one place that turns that
// thin signal into something lib/preferenceRank.ts can actually use,
// analogous to Mixed-led's browsing-based inference (see
// lib/browsingInference.ts) but from a single fixed choice instead of
// observed behavior. Multiple tags per companion (matched with OR logic in
// computePreferenceRank) so the resulting catalog still has some variety.
const COMPANION_STYLE_MAP: Record<string, TravelStyleTag[]> = {
  가족: ["자연/휴식", "문화/역사"],
  친구: ["액티비티/체험", "식당/미식"],
  부모님: ["문화/역사", "자연/휴식"],
  연인: ["감성/사진 명소", "식당/미식"],
  혼자: ["감성/사진 명소", "액티비티/체험"],
};

const DEFAULT_STYLE_TAGS: TravelStyleTag[] = ["문화/역사", "식당/미식"];

export function styleTagsForCompanion(companion: string): TravelStyleTag[] {
  return COMPANION_STYLE_MAP[companion] ?? DEFAULT_STYLE_TAGS;
}
