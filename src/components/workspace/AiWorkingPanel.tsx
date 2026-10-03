"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
// checkmark — AI-led's brief post-search hold (see lib/store.ts's
// confirmStyleQuestion) reuses this panel to say the search is already
// done, so a still-spinning icon there would contradict its own "완료"
// text.
// One site name at a time under the label, swapping every second and
// looping — conveys "the AI is going through sites" without a checklist
// line per site. Remounted (via `key` at the call site) whenever the site
// list changes so it always restarts from the first name.
function SiteTicker({ sites }: { sites: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (sites.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % sites.length), 1000);
    return () => clearInterval(id);
  }, [sites]);
  return (
    <div className="flex h-5 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={sites[index]}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-muted-foreground/80"
        >
          {sites[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function AiWorkingPanel({
  text,
  spinning = true,
  sites = [],
}: {
  text: string;
  spinning?: boolean;
  sites?: string[];
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
      <motion.div
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={spinning ? { duration: 1.4, repeat: Infinity, ease: "linear" } : undefined}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        {spinning ? <Compass className="h-5 w-5" /> : <Check className="h-5 w-5" />}
      </motion.div>
      <div className="space-y-1">
        <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
        {spinning && sites.length > 0 && <SiteTicker key={sites.join("|")} sites={sites} />}
      </div>
    </div>
  );
}
