import { NextResponse } from "next/server";
import {
  REWARD_FORM_ACTION_URL,
  REWARD_FORM_ENTRY_IDS,
  SURVEY_FORM_ACTION_URL,
  SURVEY_FORM_CONFIGURED,
  SURVEY_FORM_ENTRY_IDS,
} from "@/lib/surveyFormFields";
import { conditionSurveyItems, finalSurveyItems, preSurveyItems } from "@/data/questionnaire";

// Thin server-side proxy to the Google Form collecting survey responses
// (see docs/SURVEY_SETUP.md). Posting from the server rather than the
// browser isn't strictly required for Forms (its formResponse endpoint is
// publicly postable), but keeping the same client → /api/survey → external
// target shape means surveySubmission.ts doesn't need to know anything
// about the form itself.
type SurveyPayload = {
  kind: "condition" | "final" | "presurvey" | "reward";
  participantCode: string;
  timestamp: string;
  condition?: string; // condition rows only — becomes the sheet's `type` column
  destination?: string; // condition rows only
  block?: number; // condition rows only — extra, order-effect analysis
  conditionOrder?: string; // final row only — extra, order-effect analysis
  likedActivityCount?: number; // condition rows only — extra
  likedRestaurantCount?: number; // condition rows only — extra
  answers?: Record<string, string>;
  phone?: string; // reward rows only — goes to the separate reward form
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

  // Phone number for reward payment: its own Google Form, holding only the
  // participant code + phone (see surveyFormFields.ts's REWARD_FORM_*) —
  // never mixed into the survey-response sheet below.
  if (payload.kind === "reward") {
    const rewardParams = new URLSearchParams();
    rewardParams.set(REWARD_FORM_ENTRY_IDS.participantCode, payload.participantCode);
    rewardParams.set(REWARD_FORM_ENTRY_IDS.phone, payload.phone ?? "");
    try {
      const res = await fetch(REWARD_FORM_ACTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: rewardParams.toString(),
      });
      if (!res.ok) {
        console.error("[api/survey] reward form responded with status", res.status);
        return NextResponse.json({ ok: false, error: "form_error" }, { status: 502 });
      }
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("[api/survey] reward form submission failed", err);
      return NextResponse.json({ ok: false, error: "network_error" }, { status: 502 });
    }
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
    // Keyed by item id, not position — conditionSurveyItems' order (the
    // manipulation checks come last) is the on-screen order only.
    const CONDITION_ENTRY_KEYS: Record<string, keyof typeof SURVEY_FORM_ENTRY_IDS> = {
      dv1: "dv1",
      dv6: "dv6",
      dv2: "dv2",
      dv4: "dv4",
      dv7: "dv7",
      dv8: "dv8",
      dv9: "dv9",
      mc_review: "mcReview",
      mc_chooser: "mcChooser",
    };
    conditionSurveyItems.forEach((item) => {
      const entryKey = CONDITION_ENTRY_KEYS[item.id];
      if (entryKey) set(entryKey, answers[item.id]);
    });
    // mc_review was reworded the same way (new question, new options). The
    // old wording's two answers go to the old question for the same reason
    // as mc_chooser below; "잘 모르겠다" exists on both, so it goes to the
    // new one.
    const review = answers.mc_review;
    if (
      review === "액티비티와 식당 후보의 정보를 직접 살펴보았다." ||
      review === "액티비티와 식당 후보의 정보를 직접 살펴보지 않았다."
    ) {
      params.delete(SURVEY_FORM_ENTRY_IDS.mcReview);
      set("mcReviewLegacy", review);
    }
    // mc_chooser was reworded into a new form question with new options. A
    // participant whose page was loaded before the change still sends the OLD
    // option text ("나" / "AI"), which the new question would reject — and a
    // rejected form post drops the entire row. Send those to the old
    // question instead (kept on the form for exactly this). "잘 모르겠다"
    // exists on both, so it just goes to the new one.
    const chooser = answers.mc_chooser;
    if (chooser === "나" || chooser === "AI") {
      params.delete(SURVEY_FORM_ENTRY_IDS.mcChooser);
      set("mcChooserLegacy", chooser);
    }
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
    // finalSurveyItems is [fs1, fs2, fs3] → Final_satisfaction /
    // _reason / _improvement_feedback.
    // interview_consent (rewardSurveyItems, QuestionnaireScreen.tsx's second
    // step) rides along in this same final row via the preInterviewConsent
    // field (see surveyFormFields.ts's comment on how that field got
    // repurposed). The phone number does NOT — it's a separate "reward"
    // submission to its own form (see the reward branch above).
    const [fs1, fs2, fs3] = finalSurveyItems;
    set("finalSatisfaction", answers[fs1.id]);
    set("finalSatisfactionReason", answers[fs2.id]);
    set("finalImprovementFeedback", answers[fs3.id]);
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
