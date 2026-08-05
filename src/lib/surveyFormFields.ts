// Google Form used to collect survey responses — Forms' formResponse
// endpoint accepts anonymous POSTs by design (the same way the form's own
// HTML submits), so it sidesteps the Apps Script Web App deployment/
// unverified-app permission wall we hit trying a raw script webhook.
//
// None of this is secret — it's just the form's public submission target
// and its field IDs (visible to anyone who opens the form's page source),
// so it's fine to commit directly rather than routing through env vars.
//
// TODO: replace these once the form is built — see docs/SURVEY_SETUP.md
// for how to get the action URL and entry IDs from a "prefill link".
export const SURVEY_FORM_ACTION_URL = "REPLACE_WITH_FORM_RESPONSE_URL";

export const SURVEY_FORM_ENTRY_IDS = {
  pid: "REPLACE_entry_id",
  timestamp: "REPLACE_entry_id",
  block: "REPLACE_entry_id",
  condition: "REPLACE_entry_id",
  destination: "REPLACE_entry_id",
  conditionOrder: "REPLACE_entry_id",
  likedActivityCount: "REPLACE_entry_id",
  likedRestaurantCount: "REPLACE_entry_id",
  answersJson: "REPLACE_entry_id",
} as const;

export const SURVEY_FORM_CONFIGURED = !SURVEY_FORM_ACTION_URL.startsWith("REPLACE_");
