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
//   ParticipantName | timestamp | type | destination | Q1..Q9 |
//   PreAge..PreAiTrust | Final_satisfaction | Final_satisfaction_reason |
//   block | conditionOrder | likedActivityCount | likedRestaurantCount
//
// Despite the column name, ParticipantName never holds a real name — it's
// always the anonymous 8-character code store.ts's ensureParticipantId
// auto-generates (no participant-facing input for it at all), which is
// what links a participant's 3 condition rows + 1 final row together
// without identifying them.
//
// q1..q9 are index-aligned 1:1 with data/questionnaire.ts's
// conditionSurveyItems (mc1, mc2, mc3, dv1, dv6, dv2, dv4, dv7, dv8, in
// that order) — only filled on condition rows. finalSatisfaction/
// finalSatisfactionReason are index-aligned with finalSurveyItems (fs1,
// fs2) — only filled on the final row.
//
// This is the researcher's finalized 9-item instrument, confirmed live via
// a fresh pre-filled-link URL. Earlier this went through an 11 → 8 item
// pass (mc3/dv3/dv5 dropped) and is now back up to 9: mc3 was re-added
// (asked of every condition now, not just AI-led — standard manipulation-
// check design) via a brand-new field (entry.1978038477), and a second
// enjoyment item (dv6) was added via another new field (entry.1023376503).
// entry.518947699 and entry.1476911649 kept their entry IDs from the
// earlier 8-item pass but were retitled by the researcher to ask about
// different constructs (dv1/complexity and dv7/perceived-control
// respectively) — same field, new question text, which Google Forms
// allows without changing the entry ID. The old q7/q8
// (entry.1171806374/entry.1074795925) are gone from the form entirely, not
// reused here.
//
// destination/block/conditionOrder/likedActivityCount/likedRestaurantCount
// are NOT in the current form. Left as "REPLACE_..." placeholders;
// api/survey/route.ts skips any field still at that placeholder rather
// than posting a bogus field name, so this is safe to leave as-is or fill
// in later if the form gets these fields added.
export const SURVEY_FORM_ENTRY_IDS = {
  participantName: "entry.1869276090",
  timestamp: "entry.1550281067",
  type: "entry.1787919474",
  destination: "REPLACE_entry_id",
  q1: "entry.282647127",
  q2: "entry.1228737351",
  q3: "entry.1978038477",
  q4: "entry.518947699",
  q5: "entry.1023376503",
  q6: "entry.1750805791",
  q7: "entry.413689287",
  q8: "entry.1476911649",
  q9: "entry.1524723363",
  finalSatisfaction: "entry.442364441",
  finalSatisfactionReason: "entry.1371033330",
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
  // Originally preSurveyItems' own contact — that pre-survey step no longer
  // exists (see data/questionnaire.ts's preSurveyItems comment). Reused by
  // QuestionnaireScreen.tsx's reward step instead (rewardSurveyItems' phone
  // question, posted from api/survey/route.ts's final-row branch) — same
  // live field, just fed from a different screen now.
  preContact: "entry.1027892861",
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

// The columns the form actually has — destination isn't among them (see
// comment above), so SURVEY_FORM_CONFIGURED doesn't require it either.
const REQUIRED_ENTRY_KEYS = [
  "participantName",
  "timestamp",
  "type",
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "finalSatisfaction",
  "finalSatisfactionReason",
] as const;

export const SURVEY_FORM_CONFIGURED =
  !SURVEY_FORM_ACTION_URL.startsWith("REPLACE_") &&
  REQUIRED_ENTRY_KEYS.every((key) => !SURVEY_FORM_ENTRY_IDS[key].startsWith("REPLACE_"));
