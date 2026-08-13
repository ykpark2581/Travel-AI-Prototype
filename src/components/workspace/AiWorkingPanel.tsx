"use client";

import { motion } from "framer-motion";
import { Check, Compass } from "lucide-react";

// Shown in the workspace whenever there's no interactive catalog to
// display but the workspace column must still stay visible (see
// BrowserWorkspace.tsx). Takes an explicit `text` rather than hardcoding
// one line for everything — BrowserWorkspace distinguishes "genuinely idle,
// nothing started yet" (before the first checklist begins — e.g. still
// waiting on the companion question) from "AI actively processing" (any
// checklist in flight, see `aiWorking` in lib/store.ts), since showing
// "탐색 중" before anything has actually started reads as a lie.
// `spinning` (default true) swaps the rotating compass for a static
// checkmark — AI-led's style-question wait (see lib/store.ts's
// runAiLedFlow) reuses this panel to say the search is already done, so a
// still-spinning icon there would contradict its own "완료" text.
export function AiWorkingPanel({ text, spinning = true }: { text: string; spinning?: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
      <motion.div
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={spinning ? { duration: 1.4, repeat: Infinity, ease: "linear" } : undefined}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        {spinning ? <Compass className="h-5 w-5" /> : <Check className="h-5 w-5" />}
      </motion.div>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
