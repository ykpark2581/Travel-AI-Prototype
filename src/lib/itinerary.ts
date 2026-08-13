import { computePreferenceRank } from "@/lib/preferenceRank";
import { getActivityRecommendationReason, getRestaurantRecommendationReason } from "@/lib/recommendationReason";
import type {
  Activity,
  Condition,
  DayPlan,
  DestinationBundle,
  ExplorationStage,
  Flight,
  Hotel,
  Interest,
  ItineraryDay,
  ItineraryItem,
  ItinerarySlot,
  Restaurant,
} from "@/types";

// How many of the ranked catalog Mixed-led/AI-led's auto-built plan actually
// uses — 2 activities + 2 restaurants (one 점심 pair, one 저녁 pair) for
// every one of the 4 days, matching the same "2개씩" requirement human-led's
// UI enforces (see generateItineraryFromDayPlan below). 4 days × 2 = 8.
export const ACTIVITY_SLOTS = 8;
export const RESTAURANT_SLOTS = 8;

function activityItem(activity: Activity, aiComment?: string): ItineraryItem {
  return {
    id: activity.id,
    label: activity.name,
    detail: `${activity.duration} · ${activity.category}`,
    image: activity.image,
    aiComment,
  };
}

function mealItem(mealLabel: string, restaurant: Restaurant, aiComment?: string): ItineraryItem {
  return {
    id: restaurant.id,
    label: `${mealLabel} — ${restaurant.name}`,
    detail: `${restaurant.cuisine} · ${restaurant.area}`,
    image: restaurant.image,
    aiComment,
  };
}

function hotelBreakfastItem(hotel: Hotel): ItineraryItem {
  return { label: "아침 — 호텔 조식", detail: hotel.name };
}

// Day 1's 오전 — the outbound flight + arrival, both genuinely morning
// events for every destination bundle (see each destination file's
// departTime/arriveTime), so they belong under 오전 rather than 오후.
// 체크인 rides along here too, right after arrival, since it happens before
// the day's first activity either way. No 조식 that morning — the
// participant hasn't reached the hotel yet when breakfast would happen.
function day1MorningItems(meta: DestinationBundle["meta"], flight: Flight, hotel: Hotel): ItineraryItem[] {
  return [
    { label: `출국 — ${flight.from} → ${flight.to}`, detail: `${flight.airline} · ${flight.departTime} 출발` },
    { label: `${meta.name} 도착`, detail: `${flight.arriveTime} 도착 · 비행시간 ${flight.duration}` },
    { label: `체크인 — ${hotel.name}`, detail: hotel.area, image: hotel.image },
  ];
}

// Day 4's 저녁 tail — checkout, then the return flight. `returnDepartTime`/
// `returnArriveTime` are the fictional-but-plausible return-leg times each
// destination bundle's primary `flight` carries (see types/index.ts's
// Flight interface) — without them this line used to show no time at all,
// reading as if the return flight was never actually looked up.
function day4EveningTailItems(flight: Flight, hotel: Hotel): ItineraryItem[] {
  return [
    { label: `체크아웃 — ${hotel.name}`, detail: "짐 보관 가능" },
    {
      label: `귀국 — ${flight.to} → ${flight.from}`,
      detail: `${flight.airline} · ${flight.returnDepartTime} 출발 · ${flight.returnArriveTime} 도착`,
    },
  ];
}

// Mixed-led/AI-led only — every activity/restaurant that makes the cut gets
// a mandatory "why this is here" line (see types/index.ts's
// ItineraryItem.aiComment): mixed-led explains via the style tag its own
// 👍 signal surfaced, AI-led via whatever the companion-implied tag/rating/
// price qualifies it for (see lib/recommendationReason.ts) — human-led never
// calls this, see generateItineraryFromDayPlan's own comment instead.
//
// Every day (1-4) follows the same 오전/오후/저녁 template — 오전 is 조식 on
// days 2-4, the outbound flight/arrival/체크인 on day 1 (see
// day1MorningItems) since there's no breakfast to have that morning — then
// one 점심 pair (1 activity + 1 restaurant) and one 저녁 pair every day,
// day 4's 저녁 additionally carrying checkout + the return flight (see
// day4EveningTailItems).
export function generateItinerary(
  bundle: DestinationBundle,
  selectedTags: { activities: string[]; restaurants: string[] },
  interest: Record<ExplorationStage, Record<string, Interest>> | undefined,
  condition: Condition
): ItineraryDay[] {
  const { meta, flight, hotel, activities, restaurants } = bundle;

  // Rank the full catalog by explicit signal only — interest (mixed-led)
  // and/or confirmed preference tags (see lib/preferenceRank.ts) — then take
  // the top N per stage. Degrades to catalog order when neither is present
  // (AI-led passes no interest at all, ranking purely by implied tag).
  const rankedActivityIds = computePreferenceRank(activities, selectedTags.activities, interest?.activities);
  const rankedRestaurantIds = computePreferenceRank(restaurants, selectedTags.restaurants, interest?.restaurants);

  const activityById = new Map(activities.map((a) => [a.id, a]));
  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));

  // a[0]/r[0] = day1 점심, a[1]/r[1] = day1 저녁, a[2]/r[2] = day2 점심, ...
  // a[6]/r[6] = day4 점심, a[7]/r[7] = day4 저녁.
  const a: Activity[] = rankedActivityIds.slice(0, ACTIVITY_SLOTS).map((id) => activityById.get(id)!);
  const r: Restaurant[] = rankedRestaurantIds.slice(0, RESTAURANT_SLOTS).map((id) => restaurantById.get(id)!);

  // Shared across every activityComment/restaurantComment call below so no
  // two items in this one itinerary ever get the exact same "why this is
  // here" line (see lib/recommendationReason.ts's pickUnused) — items are
  // commented in day/period order as the `slots` literal below is built, so
  // this also reads as "each new card avoids repeating what was just said."
  const usedReasons = new Set<string>();

  const activityComment = (activity: Activity) =>
    getActivityRecommendationReason(
      activity,
      activity.styleTags.filter((t) => selectedTags.activities.includes(t)),
      condition,
      usedReasons
    );
  const restaurantComment = (restaurant: Restaurant) =>
    getRestaurantRecommendationReason(
      restaurant,
      restaurant.styleTags.filter((t) => selectedTags.restaurants.includes(t)),
      condition,
      hotel.area,
      usedReasons
    );

  const [d1, d2, d3, d4] = meta.dayDates;

  return [
    {
      day: 1,
      date: d1,
      slots: [
        { period: "오전", items: day1MorningItems(meta, flight, hotel) },
        { period: "오후", items: [activityItem(a[0], activityComment(a[0])), mealItem("점심", r[0], restaurantComment(r[0]))] },
        { period: "저녁", items: [activityItem(a[1], activityComment(a[1])), mealItem("저녁", r[1], restaurantComment(r[1]))] },
      ],
    },
    {
      day: 2,
      date: d2,
      slots: [
        { period: "오전", items: [hotelBreakfastItem(hotel)] },
        { period: "오후", items: [activityItem(a[2], activityComment(a[2])), mealItem("점심", r[2], restaurantComment(r[2]))] },
        { period: "저녁", items: [activityItem(a[3], activityComment(a[3])), mealItem("저녁", r[3], restaurantComment(r[3]))] },
      ],
    },
    {
      day: 3,
      date: d3,
      slots: [
        { period: "오전", items: [hotelBreakfastItem(hotel)] },
        { period: "오후", items: [activityItem(a[4], activityComment(a[4])), mealItem("점심", r[4], restaurantComment(r[4]))] },
        { period: "저녁", items: [activityItem(a[5], activityComment(a[5])), mealItem("저녁", r[5], restaurantComment(r[5]))] },
      ],
    },
    {
      day: 4,
      date: d4,
      slots: [
        { period: "오전", items: [hotelBreakfastItem(hotel)] },
        { period: "오후", items: [activityItem(a[6], activityComment(a[6])), mealItem("점심", r[6], restaurantComment(r[6]))] },
        {
          period: "저녁",
          items: [
            activityItem(a[7], activityComment(a[7])),
            mealItem("저녁", r[7], restaurantComment(r[7])),
            ...day4EveningTailItems(flight, hotel),
          ],
        },
      ],
    },
  ];
}

// Human-led only, step 2 — builds the itinerary straight from the
// participant's own Day 1-4 placement (see lib/store.ts's toggleDayItem),
// instead of generateItinerary's fixed ranked-top-N template. The UI (see
// components/chat/DaySelectionMessage.tsx) requires at least 2 activities +
// 2 restaurants per day before "선택 완료" enables, so every day should
// normally have exactly that; `.slice(0, 2)` defensively caps it at 2 in
// case more ever end up assigned. The FIRST selected activity/restaurant
// for a day becomes its 점심 pair, the SECOND becomes its 저녁 pair — same
// 오전/오후/저녁 template every condition's plan now shares (see
// generateItinerary above), Day 1's 오전 again being the outbound flight/
// arrival/체크인 rather than 조식. No aiComment on any item — the
// participant picked and placed everything itself, so there's nothing for
// the AI to explain per item (see components/workspace/panels/
// AiCommentSummary.tsx for the one evaluative comment human-led does get,
// about the plan as a whole).
export function generateItineraryFromDayPlan(bundle: DestinationBundle, dayPlan: DayPlan): ItineraryDay[] {
  const { meta, flight, hotel, activities, restaurants } = bundle;
  const activityById = new Map(activities.map((a) => [a.id, a]));
  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));
  const dates = meta.dayDates;

  return [1, 2, 3, 4].map((dayNum, idx) => {
    const assignment = dayPlan[dayNum] ?? { activityIds: [], restaurantIds: [] };
    const dayActivities = assignment.activityIds
      .map((id) => activityById.get(id))
      .filter((a): a is Activity => !!a)
      .slice(0, 2);
    const dayRestaurants = assignment.restaurantIds
      .map((id) => restaurantById.get(id))
      .filter((r): r is Restaurant => !!r)
      .slice(0, 2);

    const lunch: ItineraryItem[] = [];
    if (dayActivities[0]) lunch.push(activityItem(dayActivities[0]));
    if (dayRestaurants[0]) lunch.push(mealItem("점심", dayRestaurants[0]));

    const dinner: ItineraryItem[] = [];
    if (dayActivities[1]) dinner.push(activityItem(dayActivities[1]));
    if (dayRestaurants[1]) dinner.push(mealItem("저녁", dayRestaurants[1]));
    if (dayNum === 4) dinner.push(...day4EveningTailItems(flight, hotel));

    const morning: ItineraryItem[] = dayNum === 1 ? day1MorningItems(meta, flight, hotel) : [hotelBreakfastItem(hotel)];

    const slots: ItinerarySlot[] = [{ period: "오전", items: morning }];
    if (lunch.length > 0) slots.push({ period: "오후", items: lunch });
    if (dinner.length > 0) slots.push({ period: "저녁", items: dinner });

    return { day: dayNum, date: dates[idx], slots };
  });
}
