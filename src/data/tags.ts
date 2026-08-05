import type { TravelStyleTag } from "@/types";

// The shared style-preference vocabulary asked before both activities and
// restaurants, in Mixed-led and AI-led alike — see lib/store.ts's tag
// question and data/destinations/*.ts's per-item `styleTags`.
export const TRAVEL_STYLE_TAGS: TravelStyleTag[] = [
  "자연/휴식",
  "문화/역사",
  "식당/미식",
  "액티비티/체험",
  "감성/사진 명소",
];
