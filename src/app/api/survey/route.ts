import { NextResponse } from "next/server";
import { SURVEY_FORM_ACTION_URL, SURVEY_FORM_CONFIGURED, SURVEY_FORM_ENTRY_IDS } from "@/lib/surveyFormFields";

// Thin server-side proxy to the Google Form collecting survey responses
// (see docs/SURVEY_SETUP.md). Posting from the server rather than the
// browser isn't strictly required for Forms (its formResponse endpoint is
// publicly postable), but keeping the same client → /api/survey → external
// target shape as before means surveySubmission.ts didn't need to change
// at all when we switched from the Apps Script webhook to this.
type SurveyPayload = {
  pid: string;
  timestamp: string;
  block: number | "final";
  condition?: string;
  destination?: string;
  conditionOrder?: string;
  likedActivityCount?: number;
  likedRestaurantCount?: number;
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
    if (value === undefined || value === null || value === "") return;
    params.set(SURVEY_FORM_ENTRY_IDS[key], String(value));
  };
  set("pid", payload.pid);
  set("timestamp", payload.timestamp);
  set("block", payload.block);
  set("condition", payload.condition);
  set("destination", payload.destination);
  set("conditionOrder", payload.conditionOrder);
  set("likedActivityCount", payload.likedActivityCount);
  set("likedRestaurantCount", payload.likedRestaurantCount);
  set("answersJson", JSON.stringify(payload.answers ?? {}));

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
