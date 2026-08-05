import type { Activity, ActivityCategory, Restaurant } from "@/types";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pick<T>(seed: string, pool: T[]): T {
  return pool[hashString(seed) % pool.length];
}

// Roughly parses a duration string like "2시간", "1시간 30분", "5시간", "1일"
// into hours, just to bucket activities as "short" or "long" for flavor text.
function parseDurationHours(duration: string): number {
  if (duration.includes("일")) return 24;
  const hourMatch = duration.match(/(\d+)\s*시간/);
  const minuteMatch = duration.match(/(\d+)\s*분/);
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  return hours + minutes / 60;
}

// Ranks candidates deterministically per item (not randomly re-rolled) and
// picks `count` without repeats, so the same item always shows the same
// bullets across renders while different items diverge from each other.
function pickUnique(seed: string, pool: string[], count: number): string[] {
  const unique = Array.from(new Set(pool));
  return unique
    .map((text, i) => ({ text, key: hashString(`${seed}:${i}:${text}`) }))
    .sort((a, b) => a.key - b.key)
    .slice(0, count)
    .map((r) => r.text);
}

// Builds a 3-4 bullet summary: grounded bullets (derived from the item's own
// attributes) come first, then any remaining slots are filled from a shared
// flavor pool — so every item gets a plausible, varied summary even when few
// attributes apply, without ever repeating a bullet within one summary.
function buildBullets(seed: string, grounded: string[], flavorPool: string[]): string[] {
  const target = 3 + (hashString(`${seed}:count`) % 2); // 3 or 4
  const dedupedGrounded = Array.from(new Set(grounded));
  const result = dedupedGrounded.slice(0, target);
  if (result.length < target) {
    const remaining = flavorPool.filter((b) => !result.includes(b));
    result.push(...pickUnique(`${seed}:flavor`, remaining, target - result.length));
  }
  return result;
}

const ACTIVITY_CATEGORY_INSIGHT: Record<ActivityCategory, string[]> = {
  자연: ["자연 경관과 탁 트인 풍경이 인상적이라는 평가가 많습니다.", "야외에서 여유롭게 힐링하기 좋은 곳으로 소개됩니다."],
  문화: ["역사와 현지 문화를 깊이 있게 체험할 수 있는 곳으로 소개됩니다.", "현지 전통을 가까이서 느낄 수 있는 대표 명소입니다."],
  음식: ["현지 음식 문화를 직접 체험할 수 있는 활동으로 소개됩니다.", "미식 여행객들에게 특히 인기가 많은 활동입니다."],
  쇼핑: ["다양한 상품과 활기찬 분위기가 매력적이라는 평가가 많습니다.", "현지 특산품을 둘러보기 좋은 곳으로 소개됩니다."],
};

const RATING_INSIGHT = ["전반적인 만족도가 매우 높은 대표 명소입니다.", "여행자들의 재방문 의사가 높은 곳으로 꼽힙니다."];

const ACTIVITY_AI_FLAVOR = [
  "사진 촬영 명소로 인기가 많습니다.",
  "저녁 시간 방문을 추천합니다.",
  "오전 이른 시간에 방문하면 한적하게 즐길 수 있다는 의견이 많습니다.",
  "현지인들도 즐겨 찾는 곳으로 알려져 있습니다.",
  "인생샷 명소로 SNS에서 자주 언급됩니다.",
];

export function getActivityAiSummary(activity: Activity): string[] {
  const seed = activity.id;
  const grounded: string[] = [pick(`${seed}:cat`, ACTIVITY_CATEGORY_INSIGHT[activity.category])];
  if (activity.rating >= 4.7) grounded.push(pick(`${seed}:rating`, RATING_INSIGHT));
  const hours = parseDurationHours(activity.duration);
  if (hours >= 3) grounded.push("여유롭게 즐기기 좋아 반나절 이상 시간을 두고 방문하는 것을 추천합니다.");
  else if (hours > 0 && hours <= 1) grounded.push("짧은 시간에 부담 없이 즐기기 좋은 활동입니다.");
  return buildBullets(seed, grounded, ACTIVITY_AI_FLAVOR);
}

const ACTIVITY_REVIEW_FLAVOR = [
  "가족 단위 여행객의 만족도가 높습니다.",
  "날씨가 좋은 날 방문하면 더 만족스럽다는 의견이 많습니다.",
  "사진이 예쁘게 나온다는 후기가 많습니다.",
];

export function getActivityReviewSummary(activity: Activity): string[] {
  const seed = `${activity.id}:review`;
  const grounded: string[] = [];
  if (activity.category === "자연" || activity.category === "문화") {
    grounded.push("경치가 아름답다는 의견이 많습니다.");
  }
  if (activity.rating >= 4.5) grounded.push("주말에는 대기 시간이 길 수 있습니다.");
  if (activity.price > 0) grounded.push("직원이 친절하다는 평가가 많습니다.");
  if (activity.price > 0 && activity.price <= 20000) grounded.push("가격 대비 만족도가 높다는 평가가 많습니다.");
  return buildBullets(seed, grounded, ACTIVITY_REVIEW_FLAVOR);
}

const RESTAURANT_AI_FLAVOR = [
  "저녁 시간대 방문을 추천하는 곳입니다.",
  "브런치로 방문하기 좋다는 의견이 많습니다.",
  "현지인들도 즐겨 찾는 곳으로 알려져 있습니다.",
  "사진 찍기 좋은 분위기로 자주 언급됩니다.",
  "여행 코스에 포함하기 좋은 위치로 소개됩니다.",
];

export function getRestaurantAiSummary(restaurant: Restaurant): string[] {
  const seed = restaurant.id;
  const grounded: string[] = [`${restaurant.cuisine} 식당으로 여러 여행 사이트에서 자주 소개됩니다.`];
  if (restaurant.rating >= 4.7) grounded.push(pick(`${seed}:rating`, RATING_INSIGHT.map((r) => r.replace("명소", "곳"))));
  if (restaurant.priceRange === "₩" || restaurant.priceRange === "₩₩") {
    grounded.push("합리적인 가격대로 부담 없이 즐길 수 있는 곳으로 소개됩니다.");
  } else {
    grounded.push("특별한 날 방문하기 좋은 고급스러운 분위기로 소개됩니다.");
  }
  return buildBullets(seed, grounded, RESTAURANT_AI_FLAVOR);
}

const RESTAURANT_REVIEW_FLAVOR = [
  "맛과 양 모두 만족스럽다는 의견이 많습니다.",
  "직원이 친절하다는 평가가 많습니다.",
  "재방문 의사가 높은 곳으로 언급됩니다.",
];

export function getRestaurantReviewSummary(restaurant: Restaurant): string[] {
  const seed = `${restaurant.id}:review`;
  const grounded: string[] = [];
  if (restaurant.rating >= 4.5) grounded.push("웨이팅이 있을 수 있어 여유 있게 방문하는 것이 좋습니다.");
  if (restaurant.tags.includes("#아기랑")) grounded.push("가족 단위 방문객의 만족도가 높습니다.");
  if (restaurant.tags.includes("#분위기좋은")) grounded.push("분위기가 좋다는 의견이 많습니다.");
  if (restaurant.priceRange === "₩") grounded.push("가성비가 좋다는 의견이 많습니다.");
  return buildBullets(seed, grounded, RESTAURANT_REVIEW_FLAVOR);
}
