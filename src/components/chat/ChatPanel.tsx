"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatInput } from "@/components/chat/ChatInput";
import { useExperimentStore } from "@/lib/store";

export function ChatPanel() {
  const messages = useExperimentStore((s) => s.messages);
  const isTyping = useExperimentStore((s) => s.isTyping);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">여행 플래너 AI</p>
          <p className="mt-0.5 text-xs text-muted-foreground">AI 어시스턴트 (시뮬레이션)</p>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <ChatInput />
    </div>
  );
}
