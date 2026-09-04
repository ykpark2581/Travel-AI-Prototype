import type { QuestionnaireItem } from "@/types";

// Shown once, right after consent — before pre-survey (see store.ts's phase
// "screening", between "consent" and "pre-survey" — ScreeningScreen.tsx).
// Gates access to the actual study against the selection/exclusion
// criteria consentContent already describes (data/onboarding.ts) — a
// participant who fails any item is routed to the "screening-failed"
// terminal phase (ScreeningFailedScreen.tsx) instead of pre-survey. Never
// submitted anywhere, passed or failed — the researcher was explicit that
// ineligible participants' answers don't need to be recorded, and this
// only ever decides which phase to advance to (see store.ts's
// submitScreening).
export const screeningTitle = "연구 참여 조건 스크리닝 설문";
export const screeningDescription =
  "본 설문은 연구의 참여 조건을 확인하기 위한 간단한 사전 설문입니다. 현재 상황에 맞게 솔직하게 응답해 주세요.";

export const screeningItems: QuestionnaireItem[] = [
  {
    id: "screening_prior_participation",
    type: "choice",
    question: "본실험에 참여한 경험이 있습니까?",
    options: ["예", "아니요"],
  },
  {
    id: "screening_age",
    type: "choice",
    question: "귀하의 연령대를 선택해 주세요.",
    options: ["20세 미만", "20대", "30대", "40대", "50대 이상"],
  },
  {
    id: "screening_pc",
    type: "choice",
    question: "본 연구에 참여할 때 인터넷에 연결된 PC(데스크톱 또는 노트북)를 이용할 수 있습니까?",
    options: ["예, 이용할 수 있습니다.", "아니요, 이용할 수 없습니다."],
  },
  {
    id: "screening_ai_experience",
    type: "choice",
    question: "ChatGPT, Gemini, Claude 등의 대화형 생성형 AI 서비스를 사용해 본 경험이 있습니까?",
    options: ["예, 사용해 본 경험이 있습니다.", "아니요, 사용해 본 경험이 없습니다."],
  },
];

// The answer(s) that count as a PASS for each screeningItems id — an item
// whose answer isn't in its set fails screening. Matched 1:1 against
// consentContent's 선정기준/제외기준 (data/onboarding.ts): no prior
// main-study participation, age 20s/30s/40s, internet-connected PC
// available, prior generative-AI usage experience.
export const screeningPassAnswers: Record<string, string[]> = {
  screening_prior_participation: ["아니요"],
  screening_age: ["20대", "30대", "40대"],
  screening_pc: ["예, 이용할 수 있습니다."],
  screening_ai_experience: ["예, 사용해 본 경험이 있습니다."],
};

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
  "참여 조건이 확인되었습니다. 실험에 앞서 평소 여행 계획 방식과 AI 사용 경험에 관한 사전설문을 진행해 주세요.";

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
    // Matches the study's actual recruitment range (see
    // data/onboarding.ts's consentContent section 2 — "만 20~49세 성인
    // 60명") — no 50대 option since nobody outside that range should ever
    // be answering this.
    options: ["20대", "30대", "40대"],
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
// destination names never appear in the copy itself. 10 items, index-aligned
// 1:1 with the form's Q1..Q10 fields (api/survey/route.ts posts
// conditionSurveyItems[i] to q${i+1} by plain array position, with no
// per-id lookup — a mismatched count here would silently shift every later
// answer into the wrong sheet column). This is the researcher's finalized
// wording/order, confirmed against a live pre-filled-link URL — earlier
// versions had 8 items (mc3 dropped, dv3/dv5 dropped) or an 11-item draft;
// mc3 is back (now asked of every condition, not just AI-led, per standard
// manipulation-check design — see surveyFormFields.ts's q3 comment), a
// second enjoyment item (dv6) replaces the old dv1 slot's entry ID
// (518947699 — same entry ID, retitled by the researcher to ask about
// complexity instead), and dv9 (overall satisfaction) was added last via a
// brand-new field (entry.266222582, see surveyFormFields.ts's q10) — ids
// below are this file's own, unrelated to the form's internal question ids.
export const conditionSurveyItems: QuestionnaireItem[] = [
  // Manipulation Check — one item per condition, asked of everyone
  { id: "mc1", type: "likert", question: "이번 여행 계획에서 여러 액티비티와 식당 후보를 내가 직접 살펴보았다." },
  {
    id: "mc2",
    type: "likert",
    question: "이번 여행 계획에서 어떤 액티비티와 식당을 일정에 포함할지 내가 직접 결정했다.",
  },
  { id: "mc3", type: "likert", question: "이번 여행 계획에서 일정에 포함할 액티비티와 식당을 AI가 선정했다." },

  // Dependent Variables (Complexity, Enjoyment, Serendipity, Preference Refinement, Perceived Control, Trust, Overall Satisfaction)
  { id: "dv1", type: "likert", question: "이번 여행 계획에서 액티비티와 식당 후보를 살펴보는 데 피로감을 느꼈다." },
  { id: "dv6", type: "likert", question: "이번 여행 계획에서 다양한 액티비티와 식당 후보를 살펴보는 과정이 즐거웠다." },
  {
    id: "dv2",
    type: "likert",
    question: "이번 여행 계획 방식은 예상하지 못했던 흥미로운 정보를 발견할 기회를 제공한다고 느꼈다.",
  },
  { id: "dv4", type: "likert", question: "다양한 선택지를 살펴보면서 내가 원하는 것을 더욱 분명히 할 수 있었다." },
  { id: "dv7", type: "likert", question: "이번 여행 계획 과정에서 내가 원하는 방향으로 계획에 영향을 줄 수 있다고 느꼈다." },
  { id: "dv8", type: "likert", question: "이번 여행 계획에서 AI가 구성한 최종 일정을 신뢰할 수 있다고 느꼈다." },
  { id: "dv9", type: "likert", question: "AI와 함께 여행 계획을 완성해 나가는 이 방식에 전반적으로 만족했다." },
];

// Asked once, at the very end, after all three conditions — unlike every
// other participant-facing string in the app, condition names ARE named
// directly here rather than by order ("첫 번째/두 번째/세 번째"): by this
// point the participant has already finished all three, so naming them
// no longer risks biasing an experience still ahead of them.
// fs1's options must match the Google Form's Final_satisfaction multiple-
// choice question exactly, string-for-string (see docs/SURVEY_SETUP.md) —
// Forms rejects a submission whose value isn't one of the predefined
// options. fs3 (new) posts to its own dedicated field (see
// surveyFormFields.ts's finalImprovementFeedback), not the Final_satisfaction*
// pair fs1/fs2 use.
export const finalSurveyItems: QuestionnaireItem[] = [
  {
    id: "fs1",
    type: "choice",
    question: "세 가지 여행 계획 방식 중 가장 선호하는 방식은 무엇이었나요?",
    options: ["인간주도 유형", "인간+AI 혼합 유형", "AI주도 유형"],
  },
  { id: "fs2", type: "text", question: "위 방식을 가장 선호한 이유는 무엇인가요?" },
  {
    id: "fs3",
    type: "text",
    question: "세 가지 여행 계획 방식을 경험하면서 아쉽거나 불편했던 점이 있었다면 자유롭게 작성해 주세요.",
  },
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
export const rewardSurveyTitle = "보상 및 심층면담 안내";
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
    question: "심층면담에 참여할 의향이 있으십니까?",
    // Renders under the question text, above the yes/no choices (see
    // types/index.ts's QuestionnaireChoiceItem/SurveyForm.tsx's
    // QuestionBlock) — this needs to be read BEFORE deciding, unlike
    // rewardSurveyNotes' phone-usage note below, which reads as reassurance
    // AFTER already typing the number.
    description:
      "심층면담은 본실험과 다른 날에 약 20~30분간 비대면 전화로 진행됩니다. 참여 의향자 중 12명을 무작위로 선정하므로, 참여 의향을 밝히더라도 면담 참여가 확정되는 것은 아닙니다.",
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
    text: "입력한 휴대전화번호는 보상 지급 및 심층면담 관련 연락에만 이용하며, 이용 목적이 완료된 후 폐기합니다.",
  },
];
