import type { QuestionnaireItem } from "@/types";

// Asked identically right after EACH of the three conditions (11 items
// total) — condition/destination names never appear in the copy itself.
export const conditionSurveyItems: QuestionnaireItem[] = [
  // Manipulation Check
  { id: "mc1", type: "likert", question: "이번 조건에서 나는 액티비티와 식당 후보를 직접 탐색하고 비교했다." },
  { id: "mc2", type: "likert", question: "이번 조건에서 AI는 나의 선호를 분석하고, 적합한 후보를 선정하는 데 관여했다." },
  { id: "mc3", type: "likert", question: "이번 조건에서 AI가 후보를 탐색하고 비교하여 적합한 결과를 제시했다." },

  // Dependent Variables (Perceived Enjoyment, Preference Refinement, Perceived Control, Trust, Cognitive Overload)
  { id: "dv1", type: "likert", question: "이 AI와 함께 다양한 여행 대안들을 둘러보는 탐색 과정 자체가 즐거웠다." },
  { id: "dv2", type: "likert", question: "예상치 못한 대안을 발견해서 즐거웠다." },
  { id: "dv3", type: "likert", question: "탐색 과정은 내가 원하는 것에 대한 생각을 정리하고 기준을 세우는 데 도움이 되었다." },
  { id: "dv4", type: "likert", question: "나는 이 서비스를 이용할 때 주도권을 쥐고 있다고 느낀다." },
  { id: "dv5", type: "likert", question: "이 AI가 제안을 하더라도, 최종적인 여행 계획에 대한 통제권은 나에게 있다고 느꼈다." },
  { id: "dv6", type: "likert", question: "나는 이 AI가 제공하는 여행 정보와 추천 결과를 신뢰하고 의지하고자 했다." },
  { id: "dv7", type: "likert", question: "이 AI가 제시한 일정(또는 정보)을 바탕으로 실제 여행 예약을 진행할 만큼 믿음이 간다." },
  { id: "dv8", type: "likert", question: "탐색 과정을 따라가는 것에 부담을 느꼈다." },
];

// Asked once, at the very end, after all three conditions — compares the
// three experiences the participant just went through by order only
// ("첫 번째/두 번째/세 번째"); condition/destination names never surface.
export const finalSurveyItems: QuestionnaireItem[] = [
  { id: "fs1", type: "text", question: "세 조건(첫 번째, 두 번째, 세 번째) 중 가장 만족스러웠던 인터랙션 유형은 무엇이었나요?" },
  { id: "fs2", type: "text", question: "그 이유는 무엇인가요?" },
];

export const likertScaleLabels: [string, string] = ["전혀 그렇지 않다", "매우 그렇다"];
export const likertScaleSize = 7;
