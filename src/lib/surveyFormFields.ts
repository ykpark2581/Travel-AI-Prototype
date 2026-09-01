// PILOT BRANCH — this Google Form is entirely separate from the main
// study's (different branch, different deployment, different sheet) so
// pilot responses never mix with real study data. Built by duplicating the
// main study's form (see docs/SURVEY_SETUP.md) — confirmed live via a
// fresh pre-filled-link URL that every field SHARED with the main study
// (ParticipantName, timestamp, type, Q1..Q10, PreAge..PreAiTrust,
// Final_satisfaction*, PreContact) kept the exact same entry IDs the
// duplicate started with, so this file's values below are identical to
// main's for those — only the Pilot* fields (added fresh after
// duplicating) have new entry IDs of their own.
//
// Forms' formResponse endpoint accepts anonymous POSTs by design (the same
// way the form's own HTML submits) — none of this is secret, it's just the
// form's public submission target and its field IDs (visible to anyone who
// opens the form's page source), so it's fine to commit directly rather
// than routing through env vars.
export const SURVEY_FORM_ACTION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdq5ioPoExp_TDZA2T-F9IzUIDTmpLirttL7Vtvc62DvQFTpg/formResponse";

// Sheet column layout this maps to, once the pilot form exists:
//   ParticipantName | timestamp | type | Q1..Q10 | PreAge..PreAiTrust |
//   Final_satisfaction | Final_satisfaction_reason |
//   Final_improvement_feedback | PilotDuration | PilotConfusingItems |
//   PilotConfusingItemsDetail | PilotConfusingSteps |
//   PilotConfusingStepsDetail | PilotImprovementSuggestion | PreContact
//
// Despite the column name, ParticipantName never holds a real name — it's
// always the anonymous 8-character code store.ts's ensureParticipantId
// auto-generates (no participant-facing input for it at all), which is
// what links a participant's 3 condition rows + 1 pre-survey row + 1 final
// row together without identifying them.
//
// q1..q10 are index-aligned 1:1 with data/questionnaire.ts's
// conditionSurveyItems (mc1, mc2, mc3, dv1, dv6, dv2, dv4, dv7, dv8, dv9,
// in that order) — only filled on condition rows. finalSatisfaction/
// finalSatisfactionReason/finalImprovementFeedback are index-aligned with
// finalSurveyItems (fs1, fs2, fs3) — evaluating the three planning
// conditions themselves. The pilot* fields are index-aligned with
// data/questionnaire.ts's pilotSurveyItems instead — evaluating the
// PROTOTYPE/PROCEDURE, not the conditions — and don't exist on the main
// study's form at all. Both only fill on the final row.
//
// destination/block/conditionOrder/likedActivityCount/likedRestaurantCount
// (order-effect extras the main study's form optionally supports) are left
// out entirely here — add them the same "REPLACE_..." way if the pilot
// ever needs that analysis too; api/survey/route.ts already skips any
// field still at that placeholder rather than posting a bogus field name.
export const SURVEY_FORM_ENTRY_IDS = {
  participantName: "entry.1869276090",
  timestamp: "entry.1550281067",
  type: "entry.1787919474",
  // Not in the form — see comment above; safe to leave as a placeholder,
  // api/survey/route.ts skips it.
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
  q10: "entry.266222582",
  finalSatisfaction: "entry.442364441",
  finalSatisfactionReason: "entry.1371033330",
  finalImprovementFeedback: "entry.1580838968",
  // Not in the pilot form — see comment above.
  block: "REPLACE_entry_id",
  conditionOrder: "REPLACE_entry_id",
  likedActivityCount: "REPLACE_entry_id",
  likedRestaurantCount: "REPLACE_entry_id",
  // Pre-survey's own 9 dedicated fields (see data/questionnaire.ts's
  // preSurveyItems, same order/ids) — NOT the Q1..Q10 fields above, which
  // stay reserved for conditionSurveyItems.
  preAge: "entry.1648875806",
  preGender: "entry.1942451706",
  preExploreBreadth: "entry.1933158650",
  preExploreCompare: "entry.565548915",
  prePlanEarly: "entry.1167414279",
  prePlanDetailed: "entry.1789510013",
  preAiFreq: "entry.682289271",
  preAiTravelFreq: "entry.23303149",
  preAiTrust: "entry.1881472389",
  // Reward step's phone question (see data/questionnaire.ts's
  // rewardSurveyItems) — posted from api/survey/route.ts's final-row
  // branch. PILOT BRANCH: no interview-consent field at all here — unlike
  // the main study, pilot participants are never asked about a follow-up
  // interview (see rewardSurveyItems' own comment for why).
  preContact: "entry.1027892861",
  // PILOT BRANCH ONLY — index-aligned with data/questionnaire.ts's
  // pilotSurveyItems. The two "*Detail" fields back the follow-up textareas
  // that only show once "있었다." is picked (see QuestionnaireChoiceItem's
  // followUp) — they're optional answers, but still need their own real
  // field on the form (an empty answer just never gets posted, see
  // api/survey/route.ts's `set` helper). Confirmed live via a fresh
  // pre-filled-link URL, matched to pilotSurveyItems by which
  // distinguishable dummy value landed where, in on-screen order (duration
  // → confusing_items → its detail → confusing_steps → its detail →
  // improvement_suggestion).
  pilotDuration: "entry.7767788",
  pilotConfusingItems: "entry.1471723402",
  pilotConfusingItemsDetail: "entry.1091252102",
  pilotConfusingSteps: "entry.1701563343",
  pilotConfusingStepsDetail: "entry.891992750",
  pilotImprovementSuggestion: "entry.2103885115",
} as const;

// The columns the pilot form needs before submissions can go through.
// destination/block/conditionOrder/likedActivityCount/likedRestaurantCount
// are deliberately NOT required (see comment above) — everything else,
// including the pilot-only fields, is.
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
  "q10",
  "finalSatisfaction",
  "finalSatisfactionReason",
  "finalImprovementFeedback",
  "preAge",
  "preGender",
  "preExploreBreadth",
  "preExploreCompare",
  "prePlanEarly",
  "prePlanDetailed",
  "preAiFreq",
  "preAiTravelFreq",
  "preAiTrust",
  "preContact",
  "pilotConfusingItems",
  "pilotConfusingItemsDetail",
  "pilotConfusingSteps",
  "pilotConfusingStepsDetail",
  "pilotImprovementSuggestion",
  "pilotDuration",
] as const;

export const SURVEY_FORM_CONFIGURED =
  !SURVEY_FORM_ACTION_URL.startsWith("REPLACE_") &&
  REQUIRED_ENTRY_KEYS.every((key) => !SURVEY_FORM_ENTRY_IDS[key].startsWith("REPLACE_"));

// ---------------------------------------------------------------------
// The pilot form is built now (see SURVEY_FORM_ACTION_URL/entry IDs above,
// confirmed live). Kept below as a field reference for anyone rebuilding
// or auditing the form later (see docs/SURVEY_SETUP.md for the full
// write-up):
//
//   ParticipantName, timestamp, type            (short answer)
//   Q1..Q10                                     (short answer or 1-7 scale)
//   PreGender, PreAge, PreExploreBreadth,
//   PreExploreCompare, PrePlanEarly, PrePlanDetailed,
//   PreAiFreq, PreAiTravelFreq, PreAiTrust       (matching preSurveyItems)
//   Final_satisfaction                          (객관식 — 인간주도 유형 /
//                                                 인간+AI 혼합 유형 /
//                                                 AI주도 유형, see
//                                                 data/questionnaire.ts's
//                                                 finalSurveyItems fs1
//                                                 options — exact strings)
//   Final_satisfaction_reason,
//   Final_improvement_feedback                  (short answer / paragraph)
//   PilotDuration                               (객관식 — 20분 미만 /
//                                                 20분 이상 30분 미만 /
//                                                 30분 이상 40분 미만 /
//                                                 40분 이상 50분 미만 /
//                                                 50분 이상 / 기억이 나지
//                                                 않음, see
//                                                 data/questionnaire.ts's
//                                                 pilotSurveyItems.pilot_duration
//                                                 options — exact strings,
//                                                 no "~")
//   PilotConfusingItems                         (객관식 — 있었다. / 없었다.
//                                                 — periods included)
//   PilotConfusingItemsDetail                   (paragraph, optional)
//   PilotConfusingSteps                         (객관식 — 있었다. / 없었다.
//                                                 — periods included)
//   PilotConfusingStepsDetail                   (paragraph, optional)
//   PilotImprovementSuggestion                  (paragraph, optional)
//   PreContact                                  (short answer, 필수)
//
// Order above matches pilotSurveyItems' actual on-screen order (duration
// first, then confusing-items/-steps, improvement-suggestion last) — the
// sheet COLUMN order doesn't have to match this, but the form's own
// question order might as well, since that's what the participant sees.
// ---------------------------------------------------------------------
