"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExperimentStore } from "@/lib/store";

// Never free-text — participants only ever interact via clicks (cards,
// buttons, chips) throughout this whole experience. The one exception is
// the fixed scenario prompt shown once per condition (see lib/store.ts's
// beginPlanningChat/sendPendingPrompt): it appears here, pre-filled and
// still read-only, with only the send button enabled, so starting each
// condition is always the participant's own explicit action rather than
// the AI just beginning on its own.
//
// The AI's opening question reads like it's waiting on an answer, but
// nothing about the pre-filled textbox or the send button said so —
// participants weren't sure whether they were even supposed to act, let
// alone that the box already held their message. Once the prompt appears:
// a highlighted input border, a pulsing send button, and a floating hint
// bubble above it all point at the one action available (see
// hasPendingPrompt below) — all three drop away the instant it's sent.
export function ChatInput() {
  const pendingPrompt = useExperimentStore((s) => s.pendingPrompt);
  const sendPendingPrompt = useExperimentStore((s) => s.sendPendingPrompt);

  const hasPendingPrompt = pendingPrompt !== null;

  return (
    <div className="relative flex items-end gap-2 border-t bg-background p-3">
      {/* Anchored to the whole row (not just the button) and pushed above
          its top edge — anchoring to the button wrapper instead used to let
          this float down over the textarea's own text once the textarea
          grew to 3 rows (its top rises above the button's, which stayed put
          via items-end), clipping part of the pre-filled prompt. */}
      <AnimatePresence>
        {hasPendingPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute -top-12 right-3 whitespace-nowrap rounded-md bg-foreground px-3.5 py-2 text-sm font-medium text-background shadow-md"
          >
            텍스트를 전송해 주세요
            <div className="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
      <Textarea
        value={pendingPrompt ?? ""}
        readOnly
        placeholder=""
        rows={hasPendingPrompt ? 3 : 1}
        disabled={!hasPendingPrompt}
        className={cn(
          "max-h-32 min-h-[44px] resize-none transition-shadow",
          hasPendingPrompt && "border-primary/60 ring-2 ring-primary/30"
        )}
      />
      <div className="shrink-0">
        <motion.div
          animate={hasPendingPrompt ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={hasPendingPrompt ? { duration: 1.1, repeat: 2, ease: "easeInOut" } : undefined}
        >
          <Button
            size="icon"
            disabled={!hasPendingPrompt}
            className={cn("rounded-full transition-shadow", hasPendingPrompt && "ring-4 ring-primary/30")}
            onClick={() => sendPendingPrompt()}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
