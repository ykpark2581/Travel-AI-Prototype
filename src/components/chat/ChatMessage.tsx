"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanionQuestionMessage } from "@/components/chat/CompanionQuestionMessage";
import { StyleQuestionMessage } from "@/components/chat/StyleQuestionMessage";
import { DaySelectionMessage } from "@/components/chat/DaySelectionMessage";
import { MixedExploreDoneMessage } from "@/components/chat/MixedExploreDoneMessage";
import { BookingConfirmMessage } from "@/components/chat/BookingConfirmMessage";
import { ChecklistCard } from "@/components/chat/ChecklistCard";
import { TypewriterText } from "@/components/chat/TypewriterText";
import type { ChatMessage as ChatMessageType } from "@/types";

// Lightweight, safe-by-construction bold markup for AI message text —
// `**...**` segments render as <strong>. Only ever fed our own
// dialogue.ts strings (never participant input), so a full markdown parser
// or dangerouslySetInnerHTML would be overkill; a plain split/map keeps
// this a no-risk, single-purpose helper. `\n`s inside the surrounding text
// stay literal characters (no <br/> needed) since the message bubble
// itself is `whitespace-pre-line` (see the className below).
function renderMessageText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

export function ChatMessage({ message, isFirst = false }: { message: ChatMessageType; isFirst?: boolean }) {
  const isUser = message.role === "user";

  // Only AI replies type themselves out (see TypewriterText) — a user-role
  // bubble represents something the participant already said/picked, so it
  // appears immediately, same as any chat app's own outgoing messages. The
  // very first message (the AI's opening greeting, see ChatPanel's
  // `isFirst` prop) is exempted too and shows fully formed right away — the
  // participant lands on the screen with nothing else happening yet, so
  // there's no "still composing" beat before it to make typing it out read
  // as natural rather than a stray leftover animation. Starts true for
  // those plus empty-text AI bubbles (nothing to type) so any attached
  // interactive payload below shows right away instead of waiting on a
  // typing effect that never runs. Declared before the checklist
  // early-return below so this hook always runs in the same order
  // regardless of message kind (rules-of-hooks) — checklist messages just
  // never end up reading it.
  const [typingDone, setTypingDone] = useState(isUser || isFirst || !message.text);

  // Checklist messages ("hotely.com 사이트 탐색 중" etc.) are a distinct
  // "AI is processing" beat, not a normal reply — they render as their own
  // standalone card, never nested inside the usual bubble (see
  // ChecklistCard.tsx).
  if (message.checklist) {
    return <ChecklistCard payload={message.checklist} />;
  }

  // Each of these sub-components renders null once its own `confirmed` flag
  // flips (the pick's already echoed as a real user bubble by then — see
  // e.g. confirmCompanion in store.ts). Checked here too, not just inside
  // each sub-component, so the bubble WRAPPING it below (background,
  // padding) also disappears instead of lingering as an empty rounded box.
  const payload =
    message.companionQuestion && !message.companionQuestion.confirmed ? (
      <CompanionQuestionMessage payload={message.companionQuestion} />
    ) : message.styleQuestion && !message.styleQuestion.confirmed ? (
      <StyleQuestionMessage payload={message.styleQuestion} />
    ) : message.daySelection && !message.daySelection.confirmed ? (
      <DaySelectionMessage payload={message.daySelection} />
    ) : message.mixedExploreDone && !message.mixedExploreDone.confirmed ? (
      <MixedExploreDoneMessage payload={message.mixedExploreDone} />
    ) : message.bookingConfirm && !message.bookingConfirm.confirmed ? (
      <BookingConfirmMessage payload={message.bookingConfirm} />
    ) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex items-end gap-2", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      {/* max-w-[80%] moves to this wrapper (not the bubble itself) now that a
          message can render as two stacked bubbles — items-start/items-end
          keeps each bubble sized to its own content instead of stretching to
          fill the column, same "hugs its text" look the single bubble had
          before. */}
      <div className={cn("flex max-w-[80%] flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted text-foreground"
          )}
        >
          {isUser || isFirst ? (
            renderMessageText(message.text)
          ) : (
            <TypewriterText text={message.text} onDone={() => setTypingDone(true)} />
          )}
        </div>
        {/* Interactive payloads (question chips, day picker, etc.) wait for the
            text bubble above to finish typing, then appear as their OWN
            separate bubble rather than inside the same one — a chip grid or
            button popping into a bubble that's still mid-type read as the
            two fighting for the same space at once. */}
        {typingDone && payload && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm text-foreground"
          >
            {payload}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
