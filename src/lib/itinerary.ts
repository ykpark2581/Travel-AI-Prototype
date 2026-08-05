import { computePreferenceRank } from "@/lib/preferenceRank";
import type { Activity, DestinationBundle, Hotel, ItineraryDay, ItineraryItem, Restaurant } from "@/types";

// Exported so AI-led/Mixed-led's auto-selection (see lib/store.ts) picks
// exactly the items the itinerary will actually use — what participants see
// as "selected" in chat is exactly what shows up in the final plan. Also
// exported for human-led's like-gating (see AdvancePromptMessage.tsx) so
// the whole itinerary is always built purely from explicit picks, never
// silently backfilled by catalog order.
export const ACTIVITY_SLOTS = 5; // day2 오전/오후, day3 오전/오후, day4 오전
// day1 저녁, day2 점심/저녁, day3 점심/저녁 — kept equal to ACTIVITY_SLOTS so
// human-led asks for the same number of picks in both categories. Breakfast
// every day is a fixed hotel breakfast (no restaurant pick needed) rather
// than a 6th/7th/8th slot, and day4 (departure day) has no lunch/dinner.
export const RESTAURANT_SLOTS = 5;

function activityItem(activity: Activity): ItineraryItem {
  return { label: activity.name, detail: `${activity.duration} · ${activity.category}` };
}

function mealItem(mealLabel: string, restaurant: Restaurant): ItineraryItem {
  return { label: `${mealLabel} — ${restaurant.name}`, detail: `${restaurant.cuisine} · ${restaurant.area}` };
}

function hotelBreakfastItem(hotel: Hotel): ItineraryItem {
  return { label: "아침 — 호텔 조식", detail: hotel.name };
}

export function generateItinerary(
  bundle: DestinationBundle,
  likedActivityIds: string[],
  likedRestaurantIds: string[],
  selectedTags: { activities: string[]; restaurants: string[] }
): ItineraryDay[] {
  const { meta, flight, hotel, activities, restaurants } = bundle;

  // Rank the full catalog by explicit signal only — hearts, then confirmed
  // preference tags (see lib/preferenceRank.ts) — then take the top N per
  // stage. Degrades to catalog order when nothing was liked.
  const rankedActivityIds = computePreferenceRank(activities, likedActivityIds, selectedTags.activities);
  const rankedRestaurantIds = computePreferenceRank(restaurants, likedRestaurantIds, selectedTags.restaurants);

  const activityById = new Map(activities.map((a) => [a.id, a]));
  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));

  const a: Activity[] = rankedActivityIds.slice(0, ACTIVITY_SLOTS).map((id) => activityById.get(id)!);
  const r: Restaurant[] = rankedRestaurantIds.slice(0, RESTAURANT_SLOTS).map((id) => restaurantById.get(id)!);

  const [d1, d2, d3, d4] = meta.dayDates;

  return [
    {
      day: 1,
      date: d1,
      slots: [
        {
          period: "오전",
          items: [
            { label: `출국 — ${flight.from} → ${flight.to}`, detail: `${flight.airline} · ${flight.departTime} 출발` },
          ],
        },
        {
          period: "오후",
          items: [
            { label: `${meta.name} 도착`, detail: `${flight.arriveTime} 도착 · 비행시간 ${flight.duration}` },
            { label: `체크인 — ${hotel.name}`, detail: hotel.area },
          ],
        },
        { period: "저녁", items: [mealItem("저녁", r[0])] },
      ],
    },
    {
      day: 2,
      date: d2,
      slots: [
        { period: "오전", items: [hotelBreakfastItem(hotel), activityItem(a[0])] },
        { period: "오후", items: [mealItem("점심", r[1]), activityItem(a[1])] },
        { period: "저녁", items: [mealItem("저녁", r[2])] },
      ],
    },
    {
      day: 3,
      date: d3,
      slots: [
        { period: "오전", items: [hotelBreakfastItem(hotel), activityItem(a[2])] },
        { period: "오후", items: [mealItem("점심", r[3]), activityItem(a[3])] },
        { period: "저녁", items: [mealItem("저녁", r[4])] },
      ],
    },
    {
      day: 4,
      date: d4,
      slots: [
        { period: "오전", items: [hotelBreakfastItem(hotel), activityItem(a[4])] },
        {
          period: "오후",
          items: [
            { label: `체크아웃 — ${hotel.name}`, detail: "짐 보관 가능" },
            { label: `귀국 — ${flight.to} → ${flight.from}`, detail: "대한민국으로 귀국" },
          ],
        },
      ],
    },
  ];
}
