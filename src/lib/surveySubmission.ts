// Sends each survey submission (3 per-condition + 1 final, per participant)
// to our own /api/survey route, which forwards it server-side to a Google
// Sheets webhook (Apps Script Web App) — see docs/SURVEY_SETUP.md. Going
// through our own route avoids browser CORS entirely and lets us read a
// real success/failure status, unlike calling Apps Script directly from the
// client.
//
// Network calls in a remote/unmoderated study can fail transiently, and
// there's no researcher present to notice — so every submission gets a
// couple of quick retries, and anything that still fails is queued in
// localStorage and silently retried on the *next* submission in the same
// browser (which self-heals every case except the very last submission of
// the whole study failing with no further submission to piggyback on).

export interface ConditionSurveyPayload {
  type: "condition";
  pid: string;
  timestamp: string;
  block: number; // 1-indexed position among this participant's 3 conditions
  condition: string; // internal condition code — never shown to the participant, only for researcher analysis
  destination: string;
  likedActivityCount: number;
  likedRestaurantCount: number;
  answers: Record<string, string>;
}

export interface FinalSurveyPayload {
  type: "final";
  pid: string;
  timestamp: string;
  block: "final";
  conditionOrder: string; // e.g. "mixed-human-ai"
  answers: Record<string, string>;
}

export type SurveyPayload = ConditionSurveyPayload | FinalSurveyPayload;

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
