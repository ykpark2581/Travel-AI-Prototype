"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanionQuestionMessage } from "@/components/chat/CompanionQuestionMessage";
import { StyleQuestionMessage } from "@/components/chat/StyleQuestionMessage";
import { DaySelectionMessage } from "@/components/chat/DaySelectionMessage";
import { MixedExploreDoneMessage } from "@/components/chat/MixedExploreDoneMessage";
import { BookingConfirmMessage } from "@/components/chat/BookingConfirmMessage";
import { ChecklistCard } from "@/components/chat/ChecklistCard";
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

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  // Checklist messages ("hotely.com 사이트 탐색 중" etc.) are a distinct
  // "AI is processing" beat, not a normal reply — they render as their own
  // standalone card, never nested inside the usual bubble (see
  // ChecklistCard.tsx).
  if (message.checklist) {
    return <ChecklistCard payload={message.checklist} />;
  }

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
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground"
        )}
      >
        {renderMessageText(message.text)}
        {message.companionQuestion && <CompanionQuestionMessage payload={message.companionQuestion} />}
        {message.styleQuestion && <StyleQuestionMessage payload={message.styleQuestion} />}
        {message.daySelection && <DaySelectionMessage payload={message.daySelection} />}
        {message.mixedExploreDone && <MixedExploreDoneMessage payload={message.mixedExploreDone} />}
        {message.bookingConfirm && <BookingConfirmMessage payload={message.bookingConfirm} />}
      </div>
    </motion.div>
  );
}
