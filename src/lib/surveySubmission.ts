// Sends each survey submission (3 per-condition + 1 final, per participant)
// to our own /api/survey route, which forwards it server-side to a Google
// Form's response endpoint (see docs/SURVEY_SETUP.md). Going through our
// own route avoids browser CORS entirely and lets us read a real
// success/failure status, unlike posting to the form directly from the
// client.
//
// Network calls in a remote/unmoderated study can fail transiently, and
// there's no researcher present to notice — so every submission gets a
// couple of quick retries, and anything that still fails is queued in
// localStorage and silently retried on the *next* submission in the same
// browser (which self-heals every case except the very last submission of
// the whole study failing with no further submission to piggyback on).

// `kind` is this payload's own TS discriminant — distinct from the sheet's
// "type" column (see api/survey/route.ts), which holds the condition code
// ("human"/"mixed"/"ai") for condition rows and the literal "final" for the
// final row.
export interface ConditionSurveyPayload {
  kind: "condition";
  participantCode: string; // anonymous auto-generated code — see store.ts's participantId
  timestamp: string;
  condition: string; // internal condition code — never shown to the participant, becomes the sheet's `type` column
  destination: string;
  // Kept for order-effect analysis, appended after the columns actually
  // requested for the sheet (ParticipantName/timestamp/type/destination/
  // Q1../Final_satisfaction*/Final_improvement_feedback) — see
  // docs/SURVEY_SETUP.md.
  block: number; // 1-indexed position among this participant's 3 conditions
  likedActivityCount: number;
  likedRestaurantCount: number;
  // Keyed by data/questionnaire.ts's conditionSurveyItems ids (mc1..dv8) —
  // mapped to individual Q1..Q8 sheet columns by that array's fixed order
  // (see api/survey/route.ts), not sent as one JSON blob.
  answers: Record<string, string>;
}

export interface FinalSurveyPayload {
  kind: "final";
  participantCode: string; // anonymous auto-generated code — see store.ts's participantId
  timestamp: string;
  conditionOrder: string; // e.g. "mixed-human-ai" — order-effect analysis, appended column
  // Keyed by data/questionnaire.ts's finalSurveyItems ids (fs1/fs2/fs3,
  // mapped to Final_satisfaction/Final_satisfaction_reason/
  // Final_improvement_feedback) PLUS rewardSurveyItems ids
  // (phone/interview_consent, mapped to the preContact/
  // preInterviewConsent fields — see api/survey/route.ts) — both steps of
  // QuestionnaireScreen.tsx submit together as this one combined row.
  answers: Record<string, string>;
}

// Submitted once, before the first condition (see PreSurveyScreen.tsx) —
// its own row (type="presurvey" — no destination/block, same as the final
// row) in the SAME sheet as everything else rather than a separate form.
export interface PreSurveyPayload {
  kind: "presurvey";
  participantCode: string; // anonymous auto-generated code — see store.ts's participantId
  timestamp: string;
  // Keyed by data/questionnaire.ts's preSurveyItems ids — mapped to Q1..Q8
  // by that array's fixed order (see api/survey/route.ts), same pattern as
  // ConditionSurveyPayload's answers above.
  answers: Record<string, string>;
}

export type SurveyPayload = ConditionSurveyPayload | FinalSurveyPayload | PreSurveyPayload;

const QUEUE_KEY = "survey-submission-queue";
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postOnce(payload: SurveyPayload): Promise<boolean> {
  try {
    const res = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function postWithRetry(payload: SurveyPayload): Promise<boolean> {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    if (await postOnce(payload)) return true;
    if (attempt < RETRY_ATTEMPTS) await sleep(RETRY_DELAY_MS);
  }
  return false;
}

function readQueue(): SurveyPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: SurveyPayload[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // best-effort only — if storage is unavailable there's nothing more we can do
  }
}

function enqueue(payload: SurveyPayload) {
  writeQueue([...readQueue(), payload]);
}

// Best-effort resend of anything a previous submission couldn't deliver.
// Called before every new submission so failures self-heal on the next
// opportunity instead of piling up silently forever.
async function flushQueue() {
  const queue = readQueue();
  if (queue.length === 0) return;
  const stillFailing: SurveyPayload[] = [];
  for (const item of queue) {
    const ok = await postWithRetry(item);
    if (!ok) stillFailing.push(item);
  }
  writeQueue(stillFailing);
}

// Never throws and never blocks the participant on network trouble — always
// resolves, so the calling screen can move on regardless. Returns whether
// *this* submission made it through immediately (a false here doesn't mean
// data loss — it's now queued and will retry on the next submission).
export async function submitSurveyRow(payload: SurveyPayload): Promise<boolean> {
  await flushQueue();
  const ok = await postWithRetry(payload);
  if (!ok) enqueue(payload);
  return ok;
}
