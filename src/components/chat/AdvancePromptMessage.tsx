"use client";

import { useEffect, useState } from "react";
import { useExperimentStore } from "@/lib/store";
import { ACTIVITY_SLOTS, RESTAURANT_SLOTS } from "@/lib/itinerary";
import { explorationContinueButtonLabel, explorationNeedsLikeLabel } from "@/data/dialogue";
import type { AdvancePromptPayload } from "@/types";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Shown immediately once free browsing starts — a pill button that fills
// left-to-right over `durationMs`. It only becomes clickable once BOTH the
// fill completes AND the required number of items are liked on this stage
// (ACTIVITY_SLOTS/RESTAURANT_SLOTS — exactly enough to fill the itinerary
// from explicit picks alone, nothing backfilled by catalog order) — if time
// is up first, the label switches to a nudge with the exact remaining count
// instead of silently staying on a countdown that already hit zero. The
// label is rendered twice: once in normal flow (sizes the button, so multi-
// line hint text still fits) and once absolutely overlaid — each clipped to
// the filled/unfilled half so it stays legible against both the primary-
// colored fill and the muted track regardless of fill progress.
export function AdvancePromptMessage({ payload }: { payload: AdvancePromptPayload }) {
  const advanceFromExploration = useExperimentStore((s) => s.advanceFromExploration);
  const likedCount = useExperimentStore((s) =>
    payload.stage === "activities" ? s.likedActivityIds.length : s.likedRestaurantIds.length
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (payload.confirmed) return;
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [payload.confirmed]);

  if (payload.confirmed) return null;

  const requiredLikes = payload.stage === "activities" ? ACTIVITY_SLOTS : RESTAURANT_SLOTS;
  const remainingMs = payload.readyAt - now;
  const timeReady = remainingMs <= 0;
  const hasEnoughLikes = likedCount >= requiredLikes;
  const ready = timeReady && hasEnoughLikes;
  const elapsedMs = payload.durationMs - Math.max(0, remainingMs);
  const percent = Math.min(100, Math.max(0, (elapsedMs / payload.durationMs) * 100));

  const label = !timeReady
    ? `${explorationContinueButtonLabel} (${formatRemaining(remainingMs)})`
    : hasEnoughLikes
      ? explorationContinueButtonLabel
      : explorationNeedsLikeLabel(requiredLikes - likedCount);

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={!ready}
        onClick={() => advanceFromExploration(payload.stage)}
        className="relative block w-full max-w-[240px] overflow-hidden rounded-full text-sm font-medium disabled:cursor-default"
      >
        <span className="absolute inset-0 rounded-full bg-muted" />
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200 ease-linear"
          style={{ width: `${percent}%` }}
        />
        <span
          className="relative z-10 flex items-center justify-center px-4 py-2 text-center leading-snug text-foreground"
          style={{ clipPath: `inset(0 0 0 ${percent}%)` }}
        >
          {label}
        </span>
        <span
          className="absolute inset-0 z-10 flex items-center justify-center px-4 py-2 text-center leading-snug text-primary-foreground"
          style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
        >
          {label}
        </span>
      </button>
    </div>
  );
}
