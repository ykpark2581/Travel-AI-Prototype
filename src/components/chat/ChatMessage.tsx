"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanionQuestionMessage } from "@/components/chat/CompanionQuestionMessage";
import { AdvancePromptMessage } from "@/components/chat/AdvancePromptMessage";
import { ChecklistMessage } from "@/components/chat/ChecklistMessage";
import { TripSummaryMessage } from "@/components/chat/TripSummaryMessage";
import { SelectionResultsMessage } from "@/components/chat/SelectionResultsMessage";
import type { ChatMessage as ChatMessageType } from "@/types";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

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
        {message.text}
        {message.companionQuestion && <CompanionQuestionMessage payload={message.companionQuestion} />}
        {message.advancePrompt && <AdvancePromptMessage payload={message.advancePrompt} />}
        {message.checklist && <ChecklistMessage payload={message.checklist} />}
        {message.tripSummary && <TripSummaryMessage />}
        {message.selectionResults && <SelectionResultsMessage payload={message.selectionResults} />}
      </div>
    </motion.div>
  );
}
