import { NextResponse } from "next/server";
import { SURVEY_FORM_ACTION_URL, SURVEY_FORM_CONFIGURED, SURVEY_FORM_ENTRY_IDS } from "@/lib/surveyFormFields";
import { conditionSurveyItems, finalSurveyItems, preSurveyItems } from "@/data/questionnaire";

// Thin server-side proxy to the Google Form collecting survey responses
// (see docs/SURVEY_SETUP.md). Posting from the server rather than the
// browser isn't strictly required for Forms (its formResponse endpoint is
// publicly postable), but keeping the same client → /api/survey → external
// target shape means surveySubmission.ts doesn't need to know anything
// about the form itself.
type SurveyPayload = {
  kind: "condition" | "final" | "presurvey";
  participantCode: string;
  timestamp: string;
  condition?: string; // condition rows only — becomes the sheet's `type` column
  destination?: string; // condition rows only
  block?: number; // condition rows only — extra, order-effect analysis
  conditionOrder?: string; // final row only — extra, order-effect analysis
  likedActivityCount?: number; // condition rows only — extra
  likedRestaurantCount?: number; // condition rows only — extra
  answers?: Record<string, string>;
};

export async function POST(request: Request) {
  if (!SURVEY_FORM_CONFIGURED) {
    console.error("[api/survey] Google Form not configured yet — see docs/SURVEY_SETUP.md");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
  }

  let payload: SurveyPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const params = new URLSearchParams();
  const set = (key: keyof typeof SURVEY_FORM_ENTRY_IDS, value: unknown) => {
    const entryId = SURVEY_FORM_ENTRY_IDS[key];
    // Leaving an extra/optional field as "REPLACE_..." (see
    // surveyFormFields.ts) means the researcher's form doesn't have it —
    // skip it rather than posting a bogus field name.
    if (entryId.startsWith("REPLACE_")) return;
    if (value === undefined || value === null || value === "") return;
    params.set(entryId, String(value));
  };

  // The Google Form field/sheet column is still called "ParticipantName"
  // (see surveyFormFields.ts), but the value sent here is always the
  // anonymous auto-generated participantCode — never a real name.
  set("participantName", payload.participantCode);
  set("timestamp", payload.timestamp);
  set("type", payload.kind === "condition" ? payload.condition : payload.kind);
  set("destination", payload.destination);
  set("block", payload.block);
  set("conditionOrder", payload.conditionOrder);
  set("likedActivityCount", payload.likedActivityCount);
  set("likedRestaurantCount", payload.likedRestaurantCount);

  const answers = payload.answers ?? {};
  if (payload.kind === "condition") {
    // Index-aligned with conditionSurveyItems (mc1, mc2, mc3, dv1, dv6,
    // dv2, dv4, dv7, dv8) — q1..q9 in that fixed order, one Google Form
    // field each instead of a
    // single JSON blob.
    conditionSurveyItems.forEach((item, i) => {
      set(`q${i + 1}` as keyof typeof SURVEY_FORM_ENTRY_IDS, answers[item.id]);
    });
  } else if (payload.kind === "presurvey") {
    // Own dedicated fields, not the Q1..Q8 the condition rows use (see
    // surveyFormFields.ts's preAge/etc comment) — each preSurveyItems id
    // maps 1:1 to its own field below, posted with the real answer text.
    const PRE_SURVEY_ENTRY_KEYS: Record<string, keyof typeof SURVEY_FORM_ENTRY_IDS> = {
      gender: "preGender",
      age: "preAge",
      explore_breadth: "preExploreBreadth",
      explore_compare: "preExploreCompare",
      plan_early: "prePlanEarly",
      plan_detailed: "prePlanDetailed",
      ai_freq: "preAiFreq",
      ai_travel_freq: "preAiTravelFreq",
      ai_trust: "preAiTrust",
    };
    preSurveyItems.forEach((item) => {
      const entryKey = PRE_SURVEY_ENTRY_KEYS[item.id];
      if (entryKey) set(entryKey, answers[item.id]);
    });
  } else {
    // finalSurveyItems is [fs1, fs2] → Final_satisfaction / _reason.
    // rewardSurveyItems (phone, interview_consent — see
    // QuestionnaireScreen.tsx's second step) rides along in this same final
    // row rather than a separate one, reusing the preContact/
    // preInterviewConsent fields originally reserved for pre-survey's own
    // now-removed contact/name questions (see data/questionnaire.ts's
    // preSurveyItems comment and surveyFormFields.ts's own comment on
    // preInterviewConsent for how that particular field got repurposed).
    const [fs1, fs2] = finalSurveyItems;
    set("finalSatisfaction", answers[fs1.id]);
    set("finalSatisfactionReason", answers[fs2.id]);
    set("preContact", answers.phone);
    set("preInterviewConsent", answers.interview_consent);
  }

  try {
    const res = await fetch(SURVEY_FORM_ACTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) {
      console.error("[api/survey] form responded with status", res.status);
      return NextResponse.json({ ok: false, error: "form_error" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/survey] form submission failed", err);
    return NextResponse.json({ ok: false, error: "network_error" }, { status: 502 });
  }
}
