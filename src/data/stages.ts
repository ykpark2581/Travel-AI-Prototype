import type { StageMeta } from "@/types";

export const stages: StageMeta[] = [
  {
    id: "flights-hotel",
    index: 0,
    label: "항공 · 숙소",
    shortLabel: "항공 · 숙소",
    url: "trip-planner.ai/search/flights-hotels",
  },
  {
    id: "activities",
    index: 1,
    label: "액티비티",
    shortLabel: "액티비티",
    url: "trip-planner.ai/search/activities",
  },
  {
    id: "restaurants",
    index: 2,
    label: "식당",
    shortLabel: "식당",
    url: "trip-planner.ai/search/restaurants",
  },
  {
    id: "itinerary",
    index: 3,
    label: "최종 일정",
    shortLabel: "최종 일정",
    url: "trip-planner.ai/itinerary",
  },
];
