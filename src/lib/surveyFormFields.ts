// PILOT BRANCH — this Google Form is entirely separate from the main
// study's (different branch, different deployment, different sheet) so
// pilot responses never mix with real study data. Every entry ID below is
// still a placeholder ("REPLACE_entry_id") because the pilot form hasn't
// been built yet — see the bottom of this file for the exact field list to
// create, and docs/SURVEY_SETUP.md for how the "get a pre-filled link,
// fill every field with a distinguishable value, read the entry IDs back
// out of the URL" workflow works (same one used to wire up the main
// study's form, just repeated here for a fresh form).
//
// Forms' formResponse endpoint accepts anonymous POSTs by design (the same
// way the form's own HTML submits) — none of this is secret, it's just the
// form's public submission target and its field IDs (visible to anyone who
// opens the form's page source), so it's fine to commit directly rather
// than routing through env vars.
export const SURVEY_FORM_ACTION_URL = "REPLACE_pilot_form_action_url";

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
  participantName: "REPLACE_entry_id",
  timestamp: "REPLACE_entry_id",
  type: "REPLACE_entry_id",
  destination: "REPLACE_entry_id",
  q1: "REPLACE_entry_id",
  q2: "REPLACE_entry_id",
  q3: "REPLACE_entry_id",
  q4: "REPLACE_entry_id",
  q5: "REPLACE_entry_id",
  q6: "REPLACE_entry_id",
  q7: "REPLACE_entry_id",
  q8: "REPLACE_entry_id",
  q9: "REPLACE_entry_id",
  q10: "REPLACE_entry_id",
  finalSatisfaction: "REPLACE_entry_id",
  finalSatisfactionReason: "REPLACE_entry_id",
  finalImprovementFeedback: "REPLACE_entry_id",
  // Not in the pilot form — see comment above.
  block: "REPLACE_entry_id",
  conditionOrder: "REPLACE_entry_id",
  likedActivityCount: "REPLACE_entry_id",
  likedRestaurantCount: "REPLACE_entry_id",
  // Pre-survey's own 9 dedicated fields (see data/questionnaire.ts's
  // preSurveyItems, same order/ids) — NOT the Q1..Q10 fields above, which
  // stay reserved for conditionSurveyItems.
  preAge: "REPLACE_entry_id",
  preGender: "REPLACE_entry_id",
  preExploreBreadth: "REPLACE_entry_id",
  preExploreCompare: "REPLACE_entry_id",
  prePlanEarly: "REPLACE_entry_id",
  prePlanDetailed: "REPLACE_entry_id",
  preAiFreq: "REPLACE_entry_id",
  preAiTravelFreq: "REPLACE_entry_id",
  preAiTrust: "REPLACE_entry_id",
  // Reward step's phone question (see data/questionnaire.ts's
  // rewardSurveyItems) — posted from api/survey/route.ts's final-row
  // branch. PILOT BRANCH: no interview-consent field at all here — unlike
  // the main study, pilot participants are never asked about a follow-up
  // interview (see rewardSurveyItems' own comment for why).
  preContact: "REPLACE_entry_id",
  // PILOT BRANCH ONLY — index-aligned with data/questionnaire.ts's
  // pilotSurveyItems. The two "*Detail" fields back the follow-up textareas
  // that only show once "있었다" is picked (see QuestionnaireChoiceItem's
  // followUp) — they're optional answers, but still need their own real
  // field on the form (an empty answer just never gets posted, see
  // api/survey/route.ts's `set` helper).
  pilotConfusingItems: "REPLACE_entry_id",
  pilotConfusingItemsDetail: "REPLACE_entry_id",
  pilotConfusingSteps: "REPLACE_entry_id",
  pilotConfusingStepsDetail: "REPLACE_entry_id",
  pilotImprovementSuggestion: "REPLACE_entry_id",
  pilotDuration: "REPLACE_entry_id",
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
// Fields to create on the pilot Google Form (see docs/SURVEY_SETUP.md for
// the full main-study field reference this mirrors — same shape, new form,
// new entry IDs):
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
//
// Once built, use the form's own "⋮ → 사전 채우기 링크 받기" feature,
// fill EVERY question with its own distinguishable dummy value, hit "링크
// 받기", and send the resulting URL over — its querystring carries every
// field's entry ID at once, so all of the "REPLACE_entry_id" placeholders
// above (and the action URL itself) can be filled in from that one link.
// ---------------------------------------------------------------------
