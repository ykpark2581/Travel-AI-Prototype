import type { QuestionnaireItem } from "@/types";

// Shown once, before consent leads into instructions/the first condition
// (see store.ts's phase "pre-survey", between "consent" and "instructions"
// — PreSurveyScreen.tsx). Reuses the SAME Google Form/sheet as every other
// survey submission rather than a separate form (see docs/SURVEY_SETUP.md)
// — posted as its own row with type="presurvey" and destination/block/etc
// left blank, same shape as the final row.
//
// Each item posts to its own dedicated Google Form field (preGender..
// preAiTrust in surveyFormFields.ts, matched by id — see
// api/survey/route.ts's PRE_SURVEY_ENTRY_KEYS), not the Q1..Q8 fields
// conditionSurveyItems uses, so there's no positional-count constraint
// here the way there is below — this is the researcher's actual finalized
// wording (confirmed against a live pre-filled-link URL), not a draft.
export const preSurveyTitle = "사전 설문";
export const preSurveyDescription =
  "실험을 시작하기 전에 평소 여행 계획 방식과 AI 사용 경험에 대해 몇 가지 질문을 드립니다.";

// The exact option string for rewardSurveyItems' interview_consent below
// (exported rather than left as a literal only that item knows) so
// QuestionnaireScreen.tsx's "did they opt in?" check can never drift out of
// sync with the actual button label here.
export const interviewConsentYesLabel = "예, 참여할 의향이 있습니다.";

// Bare demographic/behavioral items only now — no identifying data at all
// (see store.ts's makeParticipantCode for how participants stay anonymous
// throughout). Phone number and post-interview consent used to live here,
// gated behind an opt-in choice (an earlier version of this file), but both
// moved to the very end of the study instead (see rewardSurveyItems below,
// shown from QuestionnaireScreen.tsx after the final satisfaction
// questions) — phone collection is now tied to the participation reward
// itself, not framed as an interview opt-in.
export const preSurveyItems: QuestionnaireItem[] = [
  {
    id: "gender",
    type: "choice",
    question: "귀하의 성별을 선택해주세요.",
    options: ["여성", "남성", "응답하고 싶지 않음"],
  },
  {
    id: "age",
    type: "choice",
    question: "귀하의 연령대를 선택해주세요.",
    options: ["20대", "30대", "40대", "50대 이상"],
  },
  {
    id: "explore_breadth",
    type: "likert",
    question: "나는 여행을 계획할 때 여러 출처에서 다양한 정보를 찾아보는 편이다.",
  },
  {
    id: "explore_compare",
    type: "likert",
    question: "나는 여행을 계획할 때 여러 선택지를 충분히 비교해보는 편이다.",
  },
  {
    id: "plan_early",
    type: "likert",
    question: "나는 여행을 떠나기 오래전부터 여행 계획을 세우는 편이다.",
  },
  {
    id: "plan_detailed",
    type: "likert",
    question: "나는 여행을 떠나기 전 여행 일정을 매우 구체적으로 계획하는 편이다.",
  },
  {
    id: "ai_freq",
    type: "choice",
    question: "평소 생성형 AI 서비스(ChatGPT, Gemini, Claude 등)를 얼마나 자주 사용하십니까?",
    // Must byte-match the live Google Form's option strings exactly (see
    // surveyFormFields.ts's preAiFreq) — a mismatched en-dash "–" vs plain
    // hyphen "-" here silently sinks the whole presurvey submission (Forms
    // rejects it, but still responds 200, so nothing in the code ever sees
    // the failure — confirmed by fetching the live form's own field data).
    options: ["전혀 사용하지 않음", "월 1회 미만", "월 1-3회", "주 1-2회", "주 3-5회", "거의 매일"],
  },
  {
    id: "ai_travel_freq",
    type: "choice",
    question: "평소 여행 정보를 찾거나 여행 계획을 세울 때 생성형 AI를 얼마나 자주 활용하십니까?",
    // Same byte-match requirement as ai_freq above (see preAiTravelFreq) —
    // the live form's options end in 음/함, not 는다/한다.
    options: ["전혀 활용하지 않음", "거의 활용하지 않음", "가끔 활용함", "자주 활용함", "매우 자주 활용함"],
  },
  {
    id: "ai_trust",
    type: "likert",
    question: "평소 생성형 AI가 제공하는 정보나 제안을 어느 정도 신뢰하는 편입니까?",
  },
];

// Visual-only section dividers over preSurveyItems (see SurveyForm.tsx's
// `groups` prop) — question numbering itself stays one continuous
// sequence, these just insert a heading above each group's first item.
// "AI 사용 경험 및 인식" covers all 3 AI items (ai_freq/ai_travel_freq/
// ai_trust) rather than splitting further — same topic, no 4th group for
// ai_trust to belong to instead. "기본 정보" leads (gender/age, both
// anonymous/low-stakes) rather than trailing like an earlier version.
export const preSurveyGroups = [
  { label: "기본 정보", startId: "gender" },
  { label: "평소 여행 계획 방식", startId: "explore_breadth" },
  { label: "AI 사용 경험 및 인식", startId: "ai_freq" },
];

// Asked identically right after EACH of the three conditions — condition/
// destination names never appear in the copy itself. 9 items, index-aligned
// 1:1 with the form's Q1..Q9 fields (api/survey/route.ts posts
// conditionSurveyItems[i] to q${i+1} by plain array position, with no
// per-id lookup — a mismatched count here would silently shift every later
// answer into the wrong sheet column). This is the researcher's finalized
// wording/order, confirmed against a live pre-filled-link URL — earlier
// versions had 8 items (mc3 dropped, dv3/dv5 dropped) or an 11-item draft;
// mc3 is back (now asked of every condition, not just AI-led, per standard
// manipulation-check design — see surveyFormFields.ts's q3 comment) and a
// second enjoyment item (dv6) replaces the old dv1 slot's entry ID
// (518947699 — same entry ID, retitled by the researcher to ask about
// complexity instead; ids below are this file's own, unrelated to the
// form's internal question ids).
export const conditionSurveyItems: QuestionnaireItem[] = [
  // Manipulation Check — one item per condition, asked of everyone
  { id: "mc1", type: "likert", question: "이번 여행 계획에서 여러 액티비티와 식당 후보를 내가 직접 살펴보았다." },
  {
    id: "mc2",
    type: "likert",
    question: "이번 여행 계획에서 어떤 액티비티와 식당을 일정에 포함할지 내가 직접 결정했다.",
  },
  { id: "mc3", type: "likert", question: "이번 여행 계획에서 일정에 포함할 액티비티와 식당을 AI가 선정했다." },

  // Dependent Variables (Complexity, Enjoyment, Serendipity, Preference Refinement, Perceived Control, Trust)
  { id: "dv1", type: "likert", question: "이번 여행 계획 과정에서 여러 정보를 이해하고 판단하는 것이 복잡하게 느껴졌다." },
  { id: "dv6", type: "likert", question: "AI와 함께 다양한 여행 대안들을 둘러보는 탐색 과정이 즐거웠다" },
  {
    id: "dv2",
    type: "likert",
    question: "이번 여행 계획 방식은 예상하지 못했던 흥미로운 정보를 발견할 기회를 제공한다고 느꼈다.",
  },
  { id: "dv4", type: "likert", question: "다양한 선택지를 살펴보면서 내가 원하는 것을 더욱 분명히 할 수 있었다." },
  { id: "dv7", type: "likert", question: "이번 여행 계획 과정에서 내가 원하는 방향으로 계획에 영향을 줄 수 있다고 느꼈다." },
  { id: "dv8", type: "likert", question: "이번 여행 계획에서 AI가 제공한 정보와 추천을 신뢰할 수 있다고 느꼈다." },
];

// Asked once, at the very end, after all three conditions — unlike every
// other participant-facing string in the app, condition names ARE named
// directly here rather than by order ("첫 번째/두 번째/세 번째"): by this
// point the participant has already finished all three, so naming them
// no longer risks biasing an experience still ahead of them.
// fs1's options must match the Google Form's Final_satisfaction multiple-
// choice question exactly, string-for-string (see docs/SURVEY_SETUP.md) —
// Forms rejects a submission whose value isn't one of the predefined
// options.
export const finalSurveyItems: QuestionnaireItem[] = [
  {
    id: "fs1",
    type: "choice",
    question: "다음 세 가지 인터랙션 유형 중 가장 만족스러웠던 유형은 무엇이었나요?",
    options: ["인간주도 유형", "인간+AI 혼합 유형", "AI주도 유형"],
  },
  { id: "fs2", type: "text", question: "그 이유는 무엇인가요?" },
];

// One-line reminder of what each fs1 option actually was, shown behind a
// "각 유형 설명 보기" toggle on the choice question itself (see
// SurveyForm.tsx) — by the final survey the participant hasn't seen the
// word "인간주도"/"AI주도" at all (those labels are never shown during
// planning, see CONDITION_DESTINATION/conditions.ts), so without this
// they'd be picking blind between three names alone. Keyed by the exact
// option string (must match fs1.options above verbatim, same reason
// docs/SURVEY_SETUP.md gives for the Google Form's own choice options).
export const conditionTypeDescriptions: Record<string, string> = {
  "인간주도 유형": "직접 액티비티와 식당 후보를 탐색하고 비교하여 선택한 방식",
  "인간+AI 혼합 유형": "직접 일부 후보를 선택하고, AI가 선호를 반영하여 추천 및 일정 구성을 보완한 방식",
  "AI주도 유형": "AI가 후보를 탐색하고 비교하여 항공, 숙소, 액티비티, 식당을 포함한 모든 여행 일정을 구성한 방식",
};

export const likertScaleLabels: [string, string] = ["전혀 그렇지 않다", "매우 그렇다"];
export const likertScaleSize = 7;

// Shown once, right after finalSurveyItems (same QuestionnaireScreen.tsx,
// a second step — "다음" moves from satisfaction to this, "제출" submits
// both together in one combined final row; see api/survey/route.ts, which
// posts phone/interview_consent through the preContact/preInterviewConsent
// fields originally reserved for pre-survey's own now-removed name/contact/
// interview_consent questions). Phone number is collected from EVERYONE
// (it's the reward, not an interview opt-in) — interview_consent is the
// only genuinely optional piece here.
export const rewardSurveyTitle = "보상 및 사후 인터뷰 안내";
export const rewardSurveyDescription = "본 실험을 완료한 참가자에게 2,000원 상당의 모바일 상품권을 지급합니다.";

export const rewardSurveyItems: QuestionnaireItem[] = [
  {
    id: "phone",
    type: "shortText",
    question: "모바일 상품권을 받으실 휴대전화 번호를 입력해 주세요. (필수)",
    placeholder: "예: 010-1234-5678",
  },
  {
    id: "interview_consent",
    type: "choice",
    question: "사후 인터뷰에 참여할 의향이 있으십니까?",
    // Renders under the question text, above the yes/no choices (see
    // types/index.ts's QuestionnaireChoiceItem/SurveyForm.tsx's
    // QuestionBlock) — this needs to be read BEFORE deciding, unlike
    // rewardSurveyNotes' phone-usage note below, which reads as reassurance
    // AFTER already typing the number.
    description:
      "사후 인터뷰는 약 20~30분간 온라인으로 진행됩니다. 참여 의향을 밝힌 참가자 중 일부를 인터뷰 대상자로 선정하여 별도로 연락드리며, 인터뷰 완료 시 5,000원 상당의 커피 상품권을 추가로 지급합니다.",
    options: [interviewConsentYesLabel, "아니요."],
  },
];

// See SurveyForm.tsx's `notes` prop — placed AFTER the phone question's own
// input (afterId, not beforeId) rather than in rewardSurveyDescription
// above, since it's specific to that one question (what happens to the
// number once typed), not the whole screen.
export const rewardSurveyNotes = [
  {
    afterId: "phone",
    text: "입력한 번호는 모바일 상품권 지급 목적으로만 사용하며, 지급 완료 후 즉시 폐기합니다. 단, 아래 문항에서 사후 인터뷰 참여 의향을 밝힌 경우에는 인터뷰 대상자 선정 및 일정 안내를 위해서도 사용합니다.",
  },
];
