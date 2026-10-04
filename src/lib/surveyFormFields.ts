// Google Form used to collect survey responses — Forms' formResponse
// endpoint accepts anonymous POSTs by design (the same way the form's own
// HTML submits), so it sidesteps the Apps Script Web App deployment/
// unverified-app permission wall we hit trying a raw script webhook.
//
// None of this is secret — it's just the form's public submission target
// and its field IDs (visible to anyone who opens the form's page source),
// so it's fine to commit directly rather than routing through env vars.
export const SURVEY_FORM_ACTION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfJL2hcucJ74eYjljTCWXX7kdNXC_rDlooXU64ShKMaLJgMuA/formResponse";

// Sheet column layout this maps to (see docs/SURVEY_SETUP.md):
//   ParticipantName | timestamp | type | destination | dv1..dv9, mcReview, mcChooser |
//   PreAge..PreAiTrust | Final_satisfaction | Final_satisfaction_reason |
//   Final_improvement_feedback | block | conditionOrder |
//   likedActivityCount | likedRestaurantCount
//
// Despite the column name, ParticipantName never holds a real name — it's
// always the anonymous 8-character code store.ts's ensureParticipantId
// auto-generates (no participant-facing input for it at all), which is
// what links a participant's 3 condition rows + 1 final row together
// without identifying them.
//
// Condition-row answers are keyed by data/questionnaire.ts's
// conditionSurveyItems ids (see api/survey/route.ts's
// CONDITION_ENTRY_KEYS) — only filled on condition rows. dv1/dv6/dv2/dv4/
// dv7/dv8/dv9 are the 7 Likert items; mcReview/mcChooser are the two
// multiple-choice manipulation checks asked last. The three older 7-point
// manipulation-check scale questions (entry.282647127/1228737351/
// 1978038477) may still exist on the form but are no longer written to.
// finalSatisfaction/finalSatisfactionReason/finalImprovementFeedback are
// index-aligned with finalSurveyItems (fs1, fs2, fs3) — only filled on the
// final row.
//
// mcReview/mcChooser are plain multiple-choice questions on the form —
// their option text must match data/questionnaire.ts exactly (Forms
// rejects a value that isn't one of the predefined options) and neither is
// marked required (every other row type leaves them blank).
//
// destination now has its own field on the form (entry.227310911, added
// once destination stopped being fixed per-condition — see
// data/conditions.ts's shuffleConditionDestinationMap — so which city a
// given condition row used is actually recorded). block/conditionOrder/
// likedActivityCount/likedRestaurantCount are still NOT in the current
// form, left as "REPLACE_..." placeholders; api/survey/route.ts skips any
// field still at that placeholder rather than posting a bogus field name,
// so those are safe to leave as-is or fill in later if the form gets them
// added.
export const SURVEY_FORM_ENTRY_IDS = {
  participantName: "entry.1869276090",
  timestamp: "entry.1550281067",
  type: "entry.1787919474",
  destination: "entry.227310911",
  dv1: "entry.518947699",
  dv6: "entry.1023376503",
  dv2: "entry.1750805791",
  dv4: "entry.413689287",
  dv7: "entry.1476911649",
  dv8: "entry.1524723363",
  dv9: "entry.266222582",
  mcReview: "entry.721049978",
  // 2nd manipulation check, reworded ("...어떤 방식으로 정해졌나요?") — a NEW
  // question on the form, so a new entry id.
  mcChooser: "entry.3817408",
  // The previous wording ("...최종적으로 고른 주체는 누구였나요?": 나/AI/잘
  // 모르겠다), kept on the form on purpose: a participant whose page was
  // loaded before the reword still sends those old option strings, which the
  // new question would reject (see api/survey/route.ts's mc_chooser
  // routing). Safe to delete once no old pages can still be open.
  mcChooserLegacy: "entry.1010717910",
  finalSatisfaction: "entry.442364441",
  finalSatisfactionReason: "entry.1371033330",
  // fs3 (아쉽거나 불편했던 점) — new field, confirmed via a fresh
  // pre-filled-link URL the researcher generated
  // (?entry.1580838968=test).
  finalImprovementFeedback: "entry.1580838968",
  // Not in the form at all — see comment above.
  block: "REPLACE_entry_id",
  conditionOrder: "REPLACE_entry_id",
  likedActivityCount: "REPLACE_entry_id",
  likedRestaurantCount: "REPLACE_entry_id",
  // Pre-survey's own 9 dedicated fields (see data/questionnaire.ts's
  // preSurveyItems, same order/ids), added to the form specifically for
  // this — NOT the Q1..Q8 fields above, which stay reserved for
  // conditionSurveyItems. Confirmed live via a fresh pre-filled-link URL
  // (each field filled with its own distinguishable test value, matched
  // back to data/questionnaire.ts's preSurveyItems by which value landed
  // where) — real values, not placeholders.
  preAge: "entry.1648875806",
  preGender: "entry.1942451706",
  preExploreBreadth: "entry.1933158650",
  preExploreCompare: "entry.565548915",
  prePlanEarly: "entry.1167414279",
  prePlanDetailed: "entry.1789510013",
  preAiFreq: "entry.682289271",
  preAiTravelFreq: "entry.23303149",
  preAiTrust: "entry.1881472389",
  // NOT written to any more: the phone number now goes to its own separate
  // Google Form (see REWARD_FORM_* below) so it never lands in the same
  // sheet as the survey responses. The main form's PreContact column
  // (entry.1027892861) is simply left empty for new responses.
  // Originally preSurveyItems' own name field (entry.1921088397) — since
  // this flow never collects a name at all any more, the researcher
  // repurposed that same live Google Form question into
  // rewardSurveyItems' interview_consent question instead (retitled
  // "이름을 입력해주세요." → "사후 인터뷰에 참여할 의향이 있으십니까?" on
  // the live Form — Forms keeps the entry ID stable across a retitle, same
  // as how q4/q8 above were repurposed) rather than adding a brand-new
  // question, so there's no separate "preName" key any more — this IS
  // that field now. If the question stayed a plain 단답형 (short answer) on
  // the live Form rather than being switched to 객관식 (multiple choice),
  // that's fine too — Forms only validates option text for actual
  // multiple-choice questions, and this app only ever posts
  // interviewConsentYesLabel/"아니요." here regardless of the live
  // question's rendered type.
  preInterviewConsent: "entry.1921088397",
} as const;

// The columns the form actually has — block/conditionOrder/
// likedActivityCount/likedRestaurantCount aren't among them (see comment
// above), so SURVEY_FORM_CONFIGURED doesn't require those.
const REQUIRED_ENTRY_KEYS = [
  "participantName",
  "timestamp",
  "type",
  "destination",
  "dv1",
  "dv6",
  "dv2",
  "dv4",
  "dv7",
  "dv8",
  "dv9",
  "mcReview",
  "mcChooser",
  "finalSatisfaction",
  "finalSatisfactionReason",
  "finalImprovementFeedback",
] as const;

export const SURVEY_FORM_CONFIGURED =
  !SURVEY_FORM_ACTION_URL.startsWith("REPLACE_") &&
  REQUIRED_ENTRY_KEYS.every((key) => !SURVEY_FORM_ENTRY_IDS[key].startsWith("REPLACE_"));

// Separate Google Form that holds ONLY the reward-payment contact info —
// participant code + phone number, nothing else — so the phone number never
// sits in the same response sheet as the survey answers (see
// api/survey/route.ts's "reward" branch, QuestionnaireScreen.tsx). The two
// sheets are linked only by the anonymous participant code. Field IDs read
// from the form's own public page ("참가자코드" / "휴대번호"); neither field
// is marked required on the form, so a row can never be rejected for a
// missing field.
export const REWARD_FORM_ACTION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdA5b7Vc8MCeqyZVfIfLcsYSl-JGLtyk-h5VC8SfAvCX-X_tw/formResponse";

export const REWARD_FORM_ENTRY_IDS = {
  participantCode: "entry.33632009",
  phone: "entry.390238049",
} as const;
