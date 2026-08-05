"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CursorRect } from "@/types";

// Floating speech bubble that follows the ghost cursor during collection's
// site-visiting animation, carrying the current status line.
export function CursorSpeechBubble({ text, anchor }: { text: string; anchor: CursorRect }) {
  return (
    <div className="absolute -translate-x-1/2" style={{ left: anchor.x, top: anchor.y - 28 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="-translate-y-full whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg"
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
